import express from "express";
import { optionalAuth, authMiddleware } from "../middleware/auth.mjs";
import {
  getCurrentUpdate,
  dismissUpdate,
  getAllUpdates,
  createUpdate,
  updateAppUpdate,
  deleteUpdate,
  pushUpdate,
  getUsersByVersion,
  getUpdateStats,
} from "../controllers/appUpdateController.mjs";

const router = express.Router();

// ── Mobile routes (optionalAuth - works with or without token) ───────────────
router.get("/current", optionalAuth, getCurrentUpdate);
router.post("/dismiss", authMiddleware, dismissUpdate);

// ── Admin routes (panel) ─────────────────────────────────────────────────────
router.get("/admin/all", getAllUpdates);
router.get("/admin/users-by-version", getUsersByVersion);
router.get("/admin/:id/stats", getUpdateStats);
router.post("/admin", createUpdate);
router.put("/admin/:id", updateAppUpdate);
router.delete("/admin/:id", deleteUpdate);
router.post("/admin/:id/push", pushUpdate);

export default router;
