import mongoose from "mongoose";
import User from "../models/User.mjs";
import Tracking from "../models/Tracking.mjs";
import Video from "../models/Video.mjs";
import MockTest from "../models/MockTest.mjs";
import PracticeSet from "../models/PracticeSet.mjs";

// ── GET /api/admin/stats  (summary card numbers) ──────────────────────────────
export const getAdminStats = async (req, res) => {
  try {
    const now       = new Date();
    const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7     = new Date(today); last7.setDate(today.getDate() - 6);
    const last30    = new Date(today); last30.setDate(today.getDate() - 29);

    const [
      totalUsers,
      activeToday,
      activeLast7,
      testsAttempted,
      practiceAttempted,
      videosWatched,
      totalVideoViews,
      avgAccuracyResult,
    ] = await Promise.all([
      // total registered users
      User.countDocuments(),

      // users active today (any completed tracking)
      Tracking.distinct("userId", { updatedAt: { $gte: today }, status: "completed" })
        .then((arr) => arr.length),

      // users active last 7 days
      Tracking.distinct("userId", { updatedAt: { $gte: last7 }, status: "completed" })
        .then((arr) => arr.length),

      // total mock/series tests attempted (completed)
      Tracking.countDocuments({
        resourceType: { $in: ["mock_test", "test_series"] },
        status: "completed",
      }),

      // total practice sets completed
      Tracking.countDocuments({
        resourceType: "practice_set",
        status: "completed",
      }),

      // total video watches (tracking records)
      Tracking.countDocuments({ resourceType: "video", status: "completed" }),

      // sum of all video view counts
      Video.aggregate([{ $group: { _id: null, total: { $sum: "$views" } } }])
        .then((r) => r[0]?.total ?? 0),

      // platform average accuracy across all completed tests
      Tracking.aggregate([
        {
          $match: {
            resourceType: { $in: ["mock_test", "test_series"] },
            status: "completed",
            accuracy: { $ne: null },
          },
        },
        { $group: { _id: null, avg: { $avg: "$accuracy" } } },
      ]).then((r) => r[0]?.avg ?? 0),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeToday,
        activeLast7,
        testsAttempted,
        practiceAttempted,
        videosWatched,
        totalVideoViews,
        avgAccuracy: Math.round(avgAccuracyResult * 10) / 10,
      },
    });
  } catch (err) {
    console.error("getAdminStats error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/admin/activity?days=30  (daily activity chart data) ──────────────
export const getDailyActivity = async (req, res) => {
  try {
    const days      = Math.min(parseInt(req.query.days) || 30, 90);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const raw = await Tracking.aggregate([
      {
        $match: {
          status: "completed",
          updatedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
            type: "$resourceType",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    // Build a complete date range so chart has no gaps
    const dateMap = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dateMap[key] = { date: key, mock_test: 0, practice_set: 0, video: 0, test_series: 0, total: 0 };
    }

    raw.forEach(({ _id, count }) => {
      if (dateMap[_id.date]) {
        dateMap[_id.date][_id.type] = (dateMap[_id.date][_id.type] || 0) + count;
        dateMap[_id.date].total     += count;
      }
    });

    res.status(200).json({ success: true, data: Object.values(dateMap) });
  } catch (err) {
    console.error("getDailyActivity error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/admin/top-content  (most viewed/attempted content) ───────────────
export const getTopContent = async (req, res) => {
  try {
    const [topVideos, topTests, topPractice] = await Promise.all([
      // Top videos by view count
      Video.find({ isPublished: true })
        .sort({ views: -1 })
        .limit(5)
        .select("videoTitle category views"),

      // Top mock tests by attempts in Tracking
      Tracking.aggregate([
        { $match: { resourceType: { $in: ["mock_test", "test_series"] }, status: "completed" } },
        { $group: { _id: "$resourceId", title: { $first: "$resourceTitle" }, attempts: { $sum: 1 }, avgAccuracy: { $avg: "$accuracy" } } },
        { $sort: { attempts: -1 } },
        { $limit: 5 },
      ]),

      // Top practice sets by completions
      Tracking.aggregate([
        { $match: { resourceType: "practice_set", status: "completed" } },
        { $group: { _id: "$resourceId", title: { $first: "$resourceTitle" }, completions: { $sum: 1 } } },
        { $sort: { completions: -1 } },
        { $limit: 5 },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: { topVideos, topTests, topPractice },
    });
  } catch (err) {
    console.error("getTopContent error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/admin/user-growth?days=30  (new user registrations per day) ──────
export const getUserGrowth = async (req, res) => {
  try {
    const days      = Math.min(parseInt(req.query.days) || 30, 90);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const raw = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          newUsers: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill gaps
    const dateMap = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dateMap[key] = { date: key, newUsers: 0 };
    }
    raw.forEach(({ _id, newUsers }) => {
      if (dateMap[_id]) dateMap[_id].newUsers = newUsers;
    });

    res.status(200).json({ success: true, data: Object.values(dateMap) });
  } catch (err) {
    console.error("getUserGrowth error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
