import crypto from "crypto";
import { Cashfree, CFEnvironment } from "cashfree-pg";
import User from "../models/User.mjs";
import TestSeries from "../models/TestSeries.mjs";
import Transaction from "../models/Transaction.mjs";

// ─── Init Cashfree SDK (instance-based API in cashfree-pg v4+) ───────────────
const cashfree = new Cashfree({
  XClientId:     process.env.CASHFREE_APP_ID,
  XClientSecret: process.env.CASHFREE_SECRET_KEY,
  XEnvironment:
    process.env.NODE_ENV === "production"
      ? CFEnvironment.PRODUCTION
      : CFEnvironment.SANDBOX,
});

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Returns true if user has an active (non-expired) subscription for a series */
export const hasActiveSubscription = (user, seriesId) => {
  const now = new Date();
  return (user.subscriptions || []).some(
    (sub) =>
      String(sub.seriesId) === String(seriesId) &&
      sub.isActive &&
      sub.endDate > now
  );
};

/** Expire any subscriptions whose endDate has passed */
const expireOldSubscriptions = async (user) => {
  const now = new Date();
  let changed = false;
  for (const sub of user.subscriptions) {
    if (sub.isActive && sub.endDate <= now) {
      sub.isActive = false;
      changed = true;
    }
  }
  if (changed) await user.save();
};

// ─── CREATE ORDER ─────────────────────────────────────────────────────────────
// POST /api/payment/create-order
// Body: { seriesId }
// Auth: required (authMiddleware sets req.userId)
export const createOrder = async (req, res) => {
  try {
    const userId   = req.userId;
    const { seriesId } = req.body;

    if (!seriesId) return res.status(400).json({ success: false, message: "seriesId is required" });

    const [user, series] = await Promise.all([
      User.findById(userId),
      TestSeries.findById(seriesId),
    ]);

    if (!user)   return res.status(404).json({ success: false, message: "User not found" });
    if (!series) return res.status(404).json({ success: false, message: "Test series not found" });
    if (!series.isPaid) return res.status(400).json({ success: false, message: "This series is free — no payment needed" });

    // Expire old subs first
    await expireOldSubscriptions(user);

    // Already subscribed?
    if (hasActiveSubscription(user, seriesId)) {
      return res.status(400).json({ success: false, message: "You already have an active subscription for this series" });
    }

    if (!user.phone) {
      return res.status(400).json({ success: false, message: "Phone number required. Please update your profile first." });
    }

    const amount   = series.discountedPrice > 0 && series.discountedPrice < series.price
      ? series.discountedPrice
      : series.price;

    // Unique order ID: CF_<ms>_<shortUserId>
    const orderId  = `CF_${Date.now()}_${String(userId).slice(-6)}`;

    // Save transaction as CREATED (idempotent — prevents double order creation)
    await Transaction.create({ orderId, userId, seriesId, amount });

    const orderPayload = {
      order_id:     orderId,
      order_amount: amount,
      order_currency: "INR",
      order_note:   `Subscription: ${series.title}`,
      customer_details: {
        customer_id:    String(userId),
        customer_name:  user.name || "Student",
        customer_email: user.email,
        customer_phone: user.phone,
      },
      order_meta: {
        // Return URL after payment (deep-link back to mobile app)
        return_url: `${process.env.APP_RETURN_URL || "examroot://payment"}?order_id={order_id}&status={order_status}`,
        notify_url: `${process.env.SERVER_URL || "http://localhost:3000"}/api/payment/webhook`,
      },
    };

    const response = await cashfree.PGCreateOrder("2023-08-01", orderPayload);
    const cfOrder  = response.data;

    res.status(200).json({
      success: true,
      orderId,
      paymentSessionId: cfOrder.payment_session_id,
      orderAmount: amount,
      seriesTitle: series.title,
    });
  } catch (error) {
    console.error("createOrder error:", error?.response?.data || error.message);
    res.status(500).json({ success: false, message: error?.response?.data?.message || error.message });
  }
};

// ─── VERIFY ORDER (client-side polling after redirect) ────────────────────────
// GET /api/payment/verify/:orderId
// Auth: required
export const verifyOrder = async (req, res) => {
  try {
    const userId  = req.userId;
    const { orderId } = req.params;

    const txn = await Transaction.findOne({ orderId, userId });
    if (!txn) return res.status(404).json({ success: false, message: "Transaction not found" });

    // Already processed by webhook?
    if (txn.status === "PAID") {
      return res.status(200).json({ success: true, status: "PAID", message: "Payment successful" });
    }

    // Query Cashfree for latest order status
    const response = await cashfree.PGFetchOrder("2023-08-01", orderId);
    const cfOrder  = response.data;
    const cfStatus = cfOrder.order_status; // PAID | ACTIVE | EXPIRED | ...

    if (cfStatus === "PAID") {
      // Activate subscription (webhook may have beaten us — check first)
      const user = await User.findById(userId);
      await expireOldSubscriptions(user);

      if (!hasActiveSubscription(user, txn.seriesId)) {
        const startDate = new Date();
        const endDate   = new Date(startDate);
        endDate.setDate(endDate.getDate() + 30); // 30-day subscription

        user.subscriptions.push({
          seriesId: txn.seriesId,
          orderId,
          startDate,
          endDate,
          isActive: true,
          amount: txn.amount,
        });
        await user.save();
      }

      txn.status = "PAID";
      await txn.save();

      return res.status(200).json({ success: true, status: "PAID", message: "Payment successful. Subscription activated." });
    }

    res.status(200).json({ success: true, status: cfStatus, message: "Payment pending or failed" });
  } catch (error) {
    console.error("verifyOrder error:", error?.response?.data || error.message);
    res.status(500).json({ success: false, message: error?.response?.data?.message || error.message });
  }
};

// ─── WEBHOOK (Cashfree → Server, no auth) ─────────────────────────────────────
// POST /api/payment/webhook
// Must use raw body — registered in index.mjs BEFORE express.json()
export const cashfreeWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-webhook-signature"];
    const timestamp = req.headers["x-webhook-timestamp"];
    const rawBody   = req.rawBody; // set by express raw middleware

    // ── 1. Verify signature (HMAC-SHA256) ─────────────────────────────────
    if (!signature || !timestamp || !rawBody) {
      return res.status(400).json({ success: false, message: "Missing webhook headers" });
    }

    const expectedSig = crypto
      .createHmac("sha256", process.env.CASHFREE_SECRET_KEY)
      .update(timestamp + rawBody)
      .digest("base64");

    if (expectedSig !== signature) {
      console.warn("Webhook signature mismatch");
      return res.status(401).json({ success: false, message: "Invalid signature" });
    }
    // ── 2. Parse payload ──────────────────────────────────────────────────
    const payload = JSON.parse(rawBody);
    const eventType = payload?.type; // e.g. "PAYMENT_SUCCESS_WEBHOOK"
    const orderData = payload?.data?.order;
    const paymentData = payload?.data?.payment;

    if (!orderData || !paymentData) {
      return res.status(200).json({ success: true, message: "Ignored: no order data" });
    }

    const orderId     = orderData.order_id;
    const orderStatus = orderData.order_status;  // PAID
    const cfPaymentId = paymentData.cf_payment_id;

    // ── 3. Idempotency — find existing transaction ─────────────────────────
    const txn = await Transaction.findOne({ orderId });
    if (!txn) {
      // Unknown order — log and acknowledge
      console.warn("Webhook received for unknown order:", orderId);
      return res.status(200).json({ success: true, message: "Unknown order, ignored" });
    }

    if (txn.status === "PAID") {
      // Already processed — idempotent response
      return res.status(200).json({ success: true, message: "Already processed" });
    }

    // Store raw payload for audit
    txn.webhookPayload = payload;
    txn.cfPaymentId    = String(cfPaymentId || "");

    // ── 4. Activate subscription on PAID ──────────────────────────────────
    if (orderStatus === "PAID") {
      const user = await User.findById(txn.userId);
      if (user) {
        await expireOldSubscriptions(user);

        // Guard: don't create duplicate active sub
        if (!hasActiveSubscription(user, txn.seriesId)) {
          const startDate = new Date();
          const endDate   = new Date(startDate);
          endDate.setDate(endDate.getDate() + 30);

          const sub = {
            seriesId: txn.seriesId,
            orderId,
            startDate,
            endDate,
            isActive: true,
            amount: txn.amount,
          };

          user.subscriptions.push(sub);
          await user.save();

          // Store subscriptionId reference
          txn.subscriptionId = user.subscriptions[user.subscriptions.length - 1]._id;
        }
      }
      txn.status = "PAID";
    } else {
      txn.status = "FAILED";
    }

    await txn.save();

    // Always return 200 to Cashfree (otherwise they retry)
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error.message);
    // Still 200 — don't trigger Cashfree retries for server errors
    res.status(200).json({ success: true });
  }
};

// ─── GET MY SUBSCRIPTIONS ─────────────────────────────────────────────────────
// GET /api/payment/subscriptions
// Auth: required
export const getMySubscriptions = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate("subscriptions.seriesId", "title bookName subject category coverImage");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    await expireOldSubscriptions(user);

    const now = new Date();
    const subs = user.subscriptions.map((sub) => ({
      _id:        sub._id,
      seriesId:   sub.seriesId,
      orderId:    sub.orderId,
      startDate:  sub.startDate,
      endDate:    sub.endDate,
      isActive:   sub.isActive && sub.endDate > now,
      daysLeft:   sub.isActive ? Math.max(0, Math.ceil((sub.endDate - now) / (1000 * 60 * 60 * 24))) : 0,
      amount:     sub.amount,
    }));

    res.status(200).json({ success: true, data: subs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
