import mongoose from "mongoose";
import Tracking from "../models/Tracking.mjs";
import User from "../models/User.mjs";

// Start tracking activity
export const startTracking = async (req, res) => {
  try {
    const userId = req.userId;
    const { resourceId, resourceType, resourceTitle, metadata } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!resourceId || !resourceType) {
      return res.status(400).json({
        success: false,
        message: "resourceId and resourceType are required",
      });
    }

    const validResourceTypes = ["mock_test", "practice_set", "video", "test_series"];
    if (!validResourceTypes.includes(resourceType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid resourceType. Must be one of: ${validResourceTypes.join(", ")}`,
      });
    }

    const tracking = await Tracking.create({
      userId,
      activityType: `${resourceType}_start`,
      resourceId,
      resourceType,
      resourceTitle: resourceTitle || "",
      startTime: new Date(),
      status: "in_progress",
      metadata: metadata || {},
    });

    res.status(201).json({
      success: true,
      message: "Tracking started",
      data: tracking,
    });
  } catch (error) {
    console.error("Error in startTracking:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to start tracking",
    });
  }
};

// End tracking activity
export const endTracking = async (req, res) => {
  try {
    const userId = req.userId;
    const { trackingId } = req.params;
    const { score, totalQuestions, correctAnswers, accuracy, status } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!trackingId) {
      return res.status(400).json({ success: false, message: "trackingId is required" });
    }

    const tracking = await Tracking.findById(trackingId);

    if (!tracking) {
      return res.status(404).json({ success: false, message: "Tracking record not found" });
    }

    if (tracking.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Calculate duration in minutes
    const endTime = new Date();
    const durationInMinutes = Math.round((endTime - tracking.startTime) / (1000 * 60));

    // Update tracking
    tracking.endTime = endTime;
    tracking.durationInMinutes = durationInMinutes;
    tracking.status = status || "completed";
    tracking.activityType = `${tracking.resourceType}_end`;

    if (score !== undefined) tracking.score = score;
    if (totalQuestions !== undefined) tracking.totalQuestions = totalQuestions;
    if (correctAnswers !== undefined) tracking.correctAnswers = correctAnswers;
    if (accuracy !== undefined) tracking.accuracy = accuracy;

    await tracking.save();

    // Update user stats if test/practice completed
    if (tracking.status === "completed") {
      if (tracking.resourceType === "mock_test" || tracking.resourceType === "test_series") {
        // Recalculate accuracy as average of ALL completed mock tests
        const stats = await Tracking.aggregate([
          {
            $match: {
              userId: tracking.userId,
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

        const totalTests  = stats[0]?.totalTests  ?? 1;
        const avgAccuracy = Math.round((stats[0]?.avgAccuracy ?? 0) * 10) / 10;

        await User.findByIdAndUpdate(userId, {
          totalMockTestsTaken: totalTests,
          accuracy: avgAccuracy,
        });
      } else if (tracking.resourceType === "practice_set") {
        await User.findByIdAndUpdate(userId, { $inc: { totalPracticeSetsTaken: 1 } });
      }
    }

    res.status(200).json({
      success: true,
      message: "Tracking ended successfully",
      data: tracking,
    });
  } catch (error) {
    console.error("Error in endTracking:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to end tracking",
    });
  }
};

// Get user's activity history
export const getActivityHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const { resourceType, limit = 10, skip = 0 } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const query = { userId };

    if (resourceType) {
      query.resourceType = resourceType;
    }

    const activities = await Tracking.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Tracking.countDocuments(query);

    res.status(200).json({
      success: true,
      data: activities,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
  } catch (error) {
    console.error("Error in getActivityHistory:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch activity history",
    });
  }
};

// Get user statistics
export const getUserStats = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Get tracking statistics
    const mockTestStats = await Tracking.aggregate([
      {
        $match: {
          userId: user._id,
          resourceType: "mock_test",
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalTests: { $sum: 1 },
          avgAccuracy: { $avg: "$accuracy" },
          avgScore: { $avg: "$score" },
          totalTimeSpent: { $sum: "$durationInMinutes" },
        },
      },
    ]);

    const practiceStats = await Tracking.aggregate([
      {
        $match: {
          userId: user._id,
          resourceType: "practice_set",
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalSets: { $sum: 1 },
          avgAccuracy: { $avg: "$accuracy" },
          totalTimeSpent: { $sum: "$durationInMinutes" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        user: {
          name: user.name,
          email: user.email,
          totalMockTestsTaken: user.totalMockTestsTaken,
          totalPracticeSetsTaken: user.totalPracticeSetsTaken,
          overallAccuracy: user.accuracy,
        },
        mockTestStats: mockTestStats[0] || {
          totalTests: 0,
          avgAccuracy: 0,
          avgScore: 0,
          totalTimeSpent: 0,
        },
        practiceStats: practiceStats[0] || {
          totalSets: 0,
          avgAccuracy: 0,
          totalTimeSpent: 0,
        },
      },
    });
  } catch (error) {
    console.error("Error in getUserStats:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch user stats",
    });
  }
};

// Get dashboard analytics
export const getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.userId;
    const { days = 30 } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const analytics = await Tracking.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            resourceType: "$resourceType",
          },
          count: { $sum: 1 },
          timeSpent: { $sum: "$durationInMinutes" },
          avgAccuracy: { $avg: "$accuracy" },
        },
      },
      {
        $sort: { "_id.date": 1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: analytics,
      period: `${days} days`,
    });
  } catch (error) {
    console.error("Error in getDashboardAnalytics:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch analytics",
    });
  }
};
