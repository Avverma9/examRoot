import Tracking from "../models/Tracking.mjs";
import User from "../models/User.mjs";
import mongoose from "mongoose";

const activityTypeFor = (resourceType, phase) => (
  resourceType === "video" ? "video_watch" : `${resourceType}_${phase}`
);

const userObjectId = (userId) => new mongoose.Types.ObjectId(String(userId));

// ── Save in-progress session (called when user leaves mid-way) ────────────────
// POST /api/progress/save
export const saveProgress = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      resourceId,
      resourceType,
      resourceTitle,
      currentQuestion,
      totalQuestions,
      answeredCount,
      metadata,
    } = req.body;

    console.log('📥 Save progress request:', { userId, resourceId, resourceType, currentQuestion });

    if (!resourceId || !resourceType) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ success: false, message: "resourceId and resourceType are required" });
    }

    // Upsert: one in_progress record per user per resource
    const doc = await Tracking.findOneAndUpdate(
      { userId, resourceId, status: "in_progress" },
      {
        userId,
        resourceId,
        resourceType,
        resourceTitle: resourceTitle || "",
        activityType: activityTypeFor(resourceType, "start"),
        startTime: new Date(),
        status: "in_progress",
        totalQuestions: totalQuestions || 0,
        metadata: {
          currentQuestion: currentQuestion || 0,
          answeredCount: answeredCount || 0,
          timeLeft: metadata?.timeLeft || 0,
          totalTime: metadata?.totalTime || 0,
          answers: metadata?.answers || [],
          accuracy: metadata?.accuracy || 0,
          ...metadata,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log('✅ Progress saved:', doc._id);
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    console.error("❌ saveProgress error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to save progress" });
  }
};

// ── Mark a session as completed / abandoned ───────────────────────────────────
// POST /api/progress/complete
export const completeProgress = async (req, res) => {
  try {
    const userId = req.userId;
    const { resourceId, resourceType, status = "completed", score, accuracy, totalQuestions, correctAnswers } = req.body;

    if (!resourceId || !resourceType) {
      return res.status(400).json({ success: false, message: "resourceId and resourceType are required" });
    }

    // A user can submit immediately without ever pressing Save & Exit. In that
    // case there is no in_progress row to update, so create the completed
    // attempt instead of silently losing it.
    let doc = await Tracking.findOneAndUpdate(
      { userId, resourceId, status: "in_progress" },
      {
        status,
        endTime: new Date(),
        score: score ?? null,
        accuracy: accuracy ?? null,
        totalQuestions: totalQuestions ?? null,
        correctAnswers: correctAnswers ?? null,
        metadata: {},
        activityType: resourceType ? activityTypeFor(resourceType, "end") : undefined,
      },
      { returnDocument: "after" }
    );

    if (!doc) {
      doc = await Tracking.create({
        userId,
        resourceId: String(resourceId),
        resourceType,
        resourceTitle: req.body.resourceTitle || "",
        activityType: activityTypeFor(resourceType, "end"),
        startTime: new Date(),
        endTime: new Date(),
        status,
        score: score ?? null,
        accuracy: accuracy ?? null,
        totalQuestions: totalQuestions ?? null,
        correctAnswers: correctAnswers ?? null,
        metadata: {},
      });
    }

    // ── Update User stats live ─────────────────────────────────────────────
    if (status === "completed" && doc) {
      if (doc.resourceType === "mock_test" || doc.resourceType === "test_series") {
        // Rolling average accuracy across all completed mock tests
        const stats = await Tracking.aggregate([
          {
            $match: {
              userId: doc.userId,
              resourceType: { $in: ["mock_test", "test_series"] },
              status: "completed",
            },
          },
          {
            $group: {
              _id: null,
              totalTests:  { $sum: 1 },
              avgAccuracy: { $avg: "$accuracy" },
            },
          },
        ]);
        await User.findByIdAndUpdate(userId, {
          totalMockTestsTaken: stats[0]?.totalTests ?? 1,
          accuracy: Math.round((stats[0]?.avgAccuracy ?? 0) * 10) / 10,
        });
      } else if (doc.resourceType === "practice_set") {
        await User.findByIdAndUpdate(userId, { $inc: { totalPracticeSetsTaken: 1 } });
      }
    }

    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    console.error("completeProgress error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to complete progress" });
  }
};

// ── Get recent in-progress sessions (for home screen "Continue" section) ──────
// GET /api/progress/recent
export const getRecentProgress = async (req, res) => {
  try {
    const userId = req.userId;
    const userIdObject = userObjectId(userId);
    console.log('📋 Fetching recent progress for user:', userId);

    // Get UNIQUE in_progress records (one per resourceId, latest first)
    const inProgress = await Tracking.aggregate([
      {
        $match: {
          userId: userIdObject,
          status: "in_progress"
        }
      },
      {
        $sort: { updatedAt: -1 }
      },
      {
        $group: {
          _id: "$resourceId",
          doc: { $first: "$$ROOT" }
        }
      },
      {
        $replaceRoot: { newRoot: "$doc" }
      },
      {
        $sort: { updatedAt: -1 }
      },
      {
        $limit: 5
      }
    ]);

    console.log('✅ Found', inProgress.length, 'unique in-progress items');
    res.status(200).json({ success: true, data: inProgress });
  } catch (error) {
    console.error("❌ getRecentProgress error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch recent progress" });
  }
};

// ── Batch status lookup for a list of resourceIds (e.g. all tests in a series) ─
// POST /api/progress/status-batch  { resourceIds: string[] }
export const getStatusBatch = async (req, res) => {
  try {
    const userId = req.userId;
    const userIdObject = userObjectId(userId);
    const { resourceIds } = req.body;

    if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
      return res.status(400).json({ success: false, message: "resourceIds array is required" });
    }
    const ids = resourceIds.map(String);

    // Latest record per resourceId + completed-attempt counts, in parallel
    const [latestDocs, attemptCounts, globalCounts] = await Promise.all([
      Tracking.aggregate([
        { $match: { userId: userIdObject, resourceId: { $in: ids } } },
        { $sort: { updatedAt: -1 } },
        {
          $group: {
            _id: "$resourceId",
            status:         { $first: "$status" },
            totalQuestions: { $first: "$totalQuestions" },
            metadata:       { $first: "$metadata" },
            accuracy:       { $first: "$accuracy" },
          },
        },
      ]),
      Tracking.aggregate([
        { $match: { userId: userIdObject, resourceId: { $in: ids }, status: { $in: ["completed", "in_progress"] } } },
        {
          $group: {
            _id: "$resourceId",
            attemptCount: { $sum: 1 },
            bestAccuracy: { $max: "$accuracy" },
            bestScore:    { $max: "$score" },
          },
        },
      ]),
      // Attempt count across ALL users — powers the "1.4k Attempts" social-proof badge
      Tracking.aggregate([
        { $match: { resourceId: { $in: ids }, status: "completed" } },
        { $group: { _id: "$resourceId", count: { $sum: 1 } } },
      ]),
    ]);

    const attemptsById = {};
    for (const a of attemptCounts) attemptsById[a._id] = a;
    const globalById = {};
    for (const g of globalCounts) globalById[g._id] = g.count;

    const result = {};
    for (const d of latestDocs) {
      const attempts = attemptsById[d._id];
      const attemptCount = attempts?.attemptCount || 0;
      const globalAttempts = globalById[d._id] || 0;

      if (d.status === "completed") {
        result[d._id] = { status: "completed", percent: 100, accuracy: d.accuracy ?? null, attemptCount, globalAttempts };
      } else if (d.status === "in_progress") {
        const total    = d.totalQuestions || d.metadata?.totalQuestions || 0;
        const answered = d.metadata?.answeredCount || 0;
        const percent  = total > 0 ? Math.min(100, Math.round((answered / total) * 100)) : 0;
        result[d._id] = { status: "in_progress", percent, accuracy: null, attemptCount, globalAttempts, metadata: d.metadata || {} };
      }
      // "abandoned" or anything else → treat as not started (omit from result)
    }

    // Resource may have completed attempts but its latest doc got skipped above
    // (e.g. all attempts abandoned afterwards) — still surface the attempt count
    for (const a of attemptCounts) {
      if (!result[a._id]) {
        result[a._id] = { status: "completed", percent: 100, accuracy: a.bestAccuracy ?? null, attemptCount: a.attemptCount, globalAttempts: globalById[a._id] || 0 };
      }
    }

    // Not-started resources still need their global attempt count surfaced
    for (const id of ids) {
      if (!result[id] && globalById[id]) {
        result[id] = { status: "not_started", percent: 0, accuracy: null, attemptCount: 0, globalAttempts: globalById[id] };
      }
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("❌ getStatusBatch error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch status batch" });
  }
};

// ── Completed-attempt history for the current user (Home screen "History") ────
// GET /api/progress/history?limit=20&resourceType=mock_test
export const getHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);
    const filter = { userId, status: "completed" };
    if (req.query.resourceType) filter.resourceType = req.query.resourceType;

    const history = await Tracking.find(filter)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .select("resourceId resourceType resourceTitle score accuracy totalQuestions correctAnswers updatedAt");

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    console.error("❌ getHistory error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch history" });
  }
};
