import express from "express";
import { authMiddleware } from "../middleware/auth.mjs";
import {
  startTracking,
  endTracking,
  getActivityHistory,
  getUserStats,
  getDashboardAnalytics,
} from "../controllers/trackingController.mjs";

const router = express.Router();

// All tracking routes require authentication
router.use(authMiddleware);

// Tracking endpoints
router.post("/start", startTracking);
router.post("/end/:trackingId", endTracking);
router.get("/history", getActivityHistory);
router.get("/stats", getUserStats);
router.get("/analytics", getDashboardAnalytics);

export default router;
