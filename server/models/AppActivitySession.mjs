import mongoose from "mongoose";

const appActivitySessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      required: true,
      index: true,
    },
    deviceLabel: {
      type: String,
      default: "",
    },
    platform: {
      type: String,
      default: "",
    },
    osVersion: {
      type: String,
      default: "",
    },
    appVersion: {
      type: String,
      default: "",
    },
    buildVersion: {
      type: String,
      default: "",
    },
    locale: {
      type: String,
      default: "",
    },
    timeZone: {
      type: String,
      default: "",
    },
    ipAddress: {
      type: String,
      default: "",
    },
    lastIpAddress: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
    firstSeenAt: {
      type: Date,
      required: true,
      index: true,
    },
    lastSeenAt: {
      type: Date,
      required: true,
      index: true,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    heartbeatCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    endReason: {
      type: String,
      default: "",
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

// Ensure uniqueness per user+sessionId instead of global uniqueness on sessionId
appActivitySessionSchema.index({ userId: 1, sessionId: 1 }, { unique: true, background: true });
appActivitySessionSchema.index({ userId: 1, deviceId: 1, lastSeenAt: -1 });
appActivitySessionSchema.index({ isActive: 1, lastSeenAt: -1 });
appActivitySessionSchema.index({ firstSeenAt: -1 });

export default mongoose.model("AppActivitySession", appActivitySessionSchema);
