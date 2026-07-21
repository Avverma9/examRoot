import mongoose from "mongoose";

const appUpdateSchema = new mongoose.Schema(
  {
    version: {
      type: String,
      required: true,
      trim: true,
    },
    versionCode: {
      type: Number,
      required: true,
    },
    downloadLink: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isMandatory: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      default: "",
    },
    changelogHindi: {
      type: String,
      default: "",
    },
    changelogEnglish: {
      type: String,
      default: "",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Track which users have already dismissed this update
    dismissedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    // Track which users have installed this version
    installedBy: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      installedAt: { type: Date, default: Date.now },
    }],
  },
  { timestamps: true }
);

export default mongoose.model("AppUpdate", appUpdateSchema);
