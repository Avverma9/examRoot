import Tracking from "../models/Tracking.mjs";
import User from "../models/User.mjs";

// ── Save in-progress session (called when user leaves mid-way) ────────────────
// POST /api/progress/save
export const saveProgress = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      resourceId,
      resourceType,   // mock_test | practice_set | test_series
      resourceTitle,
      currentQuestion,
      totalQuestions,
      answeredCount,
      metadata,       // { answers, timeLeft, etc. }
    } = req.body;

    if (!resourceId || !resourceType) {
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
        activityType: `${resourceType}_start`,
        startTime: new Date(),
        status: "in_progress",
        totalQuestions: totalQuestions || 0,
        metadata: {
          currentQuestion: currentQuestion || 0,
          answeredCount: answeredCount || 0,
          ...metadata,
        },
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    console.error("saveProgress error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to save progress" });
  }
};

// ── Mark a session as completed / abandoned ───────────────────────────────────
// POST /api/progress/complete
export const completeProgress = async (req, res) => {
  try {
    const userId = req.userId;
    const { resourceId, resourceType, status = "completed", score, accuracy, totalQuestions, correctAnswers } = req.body;

    if (!resourceId) {
      return res.status(400).json({ success: false, message: "resourceId is required" });
    }

    const doc = await Tracking.findOneAndUpdate(
      { userId, resourceId, status: "in_progress" },
      {
        status,
        endTime: new Date(),
        score: score ?? null,
        accuracy: accuracy ?? null,
        totalQuestions: totalQuestions ?? null,
        correctAnswers: correctAnswers ?? null,
        metadata: {},
        activityType: resourceType ? `${resourceType}_end` : undefined,
      },
      { new: true }
    );

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

    // Latest in_progress records (one per resource type, max 5)
    const inProgress = await Tracking.find({ userId, status: "in_progress" })
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();

    res.status(200).json({ success: true, data: inProgress });
  } catch (error) {
    console.error("getRecentProgress error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch recent progress" });
  }
};
