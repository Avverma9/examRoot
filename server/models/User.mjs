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
    streak: {
      type: Number,
      default: 0,
    },
    preferredLanguage: {
      type: String,
      default: "en",
      enum: ["en", "hi"],
    },
    // ─── Google OAuth ───────────────────────────────────────────────────────
    googleId: {
      type: String,
      default: "",
    },
    // ─── Subscriptions ─────────────────────────────────────────────────────────
    subscriptions: [
      {
        seriesId:  { type: mongoose.Schema.Types.ObjectId, ref: "TestSeries", required: true },
        orderId:   { type: String, required: true },   // Cashfree order_id
        startDate: { type: Date, required: true },
        endDate:   { type: Date, required: true },      // startDate + 30 days
        isActive:  { type: Boolean, default: true },
        amount:    { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
