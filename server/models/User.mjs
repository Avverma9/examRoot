import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      default: "",
      trim: true,
    },
    phone: {
      type: String,
      default: "",
    },
    profileImage: {
      type: String,
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    totalMockTestsTaken: {
      type: Number,
      default: 0,
    },
    totalPracticeSetsTaken: {
      type: Number,
      default: 0,
    },
    accuracy: {
      type: Number,
      default: 0,
    },
    preferredLanguage: {
      type: String,
      default: "en",
      enum: ["en", "hi"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
