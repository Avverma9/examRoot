import mongoose from "mongoose";

// Tracks every Cashfree order attempt — used for idempotency + audit trail
const transactionSchema = new mongoose.Schema(
  {
    orderId:       { type: String, required: true, unique: true }, // Cashfree order_id (CF_<timestamp>_<userId>)
    userId:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    seriesId:      { type: mongoose.Schema.Types.ObjectId, ref: "TestSeries", required: true },
    amount:        { type: Number, required: true },
    currency:      { type: String, default: "INR" },

    // Lifecycle: CREATED → PAID | FAILED | EXPIRED
    status: {
      type: String,
      enum: ["CREATED", "PAID", "FAILED", "EXPIRED"],
      default: "CREATED",
    },

    // Raw Cashfree webhook payload (stored for debugging / disputes)
    webhookPayload: { type: mongoose.Schema.Types.Mixed, default: null },

    // Cashfree internal payment_id (cf_payment_id from webhook)
    cfPaymentId:   { type: String, default: "" },

    // Subscription that was created after successful payment
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);
