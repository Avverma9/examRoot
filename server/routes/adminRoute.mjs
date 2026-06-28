import express from "express";
import {
  getAdminStats,
  getDailyActivity,
  getTopContent,
  getUserGrowth,
} from "../controllers/adminAnalyticsController.mjs";

const router = express.Router();

// Panel runs locally, no token auth needed.
// If you want to protect later, add authMiddleware + admin role check here.

router.get("/stats",        getAdminStats);
router.get("/activity",     getDailyActivity);
router.get("/top-content",  getTopContent);
router.get("/user-growth",  getUserGrowth);

export default router;
