import express from "express";
import { authMiddleware } from "../middleware/auth.mjs";
import {
  createOrder,
  verifyOrder,
  cashfreeWebhook,
  getMySubscriptions,
} from "../controllers/paymentController.mjs";

const router = express.Router();

// ── Webhook must come BEFORE express.json() body parsing
// rawBody is set in index.mjs for this route prefix
router.post("/webhook", cashfreeWebhook);

// ── Protected routes (JWT required)
router.post("/create-order",    authMiddleware, createOrder);
router.get("/verify/:orderId",  authMiddleware, verifyOrder);
router.get("/subscriptions",    authMiddleware, getMySubscriptions);

export default router;
