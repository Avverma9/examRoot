import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    // Either email or phone — one will be set
    email: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: null,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB auto-deletes after expiry
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
  },
  { timestamps: true }
);

// Partial indexes so both email and phone can coexist but remain unique per channel
otpSchema.index({ email: 1 }, { unique: true, sparse: true });
otpSchema.index({ phone: 1 }, { unique: true, sparse: true });

export default mongoose.model("OTP", otpSchema);
