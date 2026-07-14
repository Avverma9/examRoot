import express from "express";
import {
  getAdminStats,
  getDailyActivity,
  getTopContent,
  getUserGrowth,
} from "../controllers/adminAnalyticsController.mjs";
import { generateQuestionsFromImage } from "../controllers/adminAnalyticsController.mjs";
import {
  getAppActivityOverview,
  getCurrentAppSessions,
  getAppActivitySessions,
} from "../controllers/appActivityController.mjs";

const router = express.Router();

// Panel runs locally, no token auth needed.
// If you want to protect later, add authMiddleware + admin role check here.

router.get("/stats",        getAdminStats);
router.get("/activity",     getDailyActivity);
router.get("/top-content",  getTopContent);
router.get("/user-growth",  getUserGrowth);
router.post("/generate-questions", generateQuestionsFromImage);
router.get("/activity-log/overview", getAppActivityOverview);
router.get("/activity-log/current", getCurrentAppSessions);
router.get("/activity-log/sessions", getAppActivitySessions);

export default router;
