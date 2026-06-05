import mongoose from "mongoose";

const trackingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    activityType: {
      type: String,
      required: true,
      enum: ["mock_test_start", "mock_test_end", "practice_set_start", "practice_set_end", "video_watch", "test_series_start", "test_series_end"],
    },
    resourceId: {
      type: String,
      required: true,
    },
    resourceType: {
      type: String,
      enum: ["mock_test", "practice_set", "video", "test_series"],
    },
    resourceTitle: {
      type: String,
      default: "",
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      default: null,
    },
    durationInMinutes: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      default: null,
    },
    totalQuestions: {
      type: Number,
      default: null,
    },
    correctAnswers: {
      type: Number,
      default: null,
    },
    accuracy: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ["in_progress", "completed", "abandoned"],
      default: "in_progress",
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model("Tracking", trackingSchema);
