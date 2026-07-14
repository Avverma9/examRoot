import express from "express";
import { authMiddleware } from "../middleware/auth.mjs";
import {
  startTracking,
  endTracking,
  getActivityHistory,
  getUserStats,
  getDashboardAnalytics,
} from "../controllers/trackingController.mjs";
import {
  startAppSession,
  heartbeatAppSession,
  endAppSession,
} from "../controllers/appActivityController.mjs";

const router = express.Router();

// All tracking routes require authentication
router.use(authMiddleware);

// Tracking endpoints
router.post("/start", startTracking);
router.post("/end/:trackingId", endTracking);
router.get("/history", getActivityHistory);
router.get("/stats", getUserStats);
router.get("/analytics", getDashboardAnalytics);

// App foreground session tracking
router.post("/app/start", startAppSession);
router.post("/app/heartbeat", heartbeatAppSession);
router.post("/app/end", endAppSession);

export default router;
