import express from "express";
import { authMiddleware } from "../middleware/auth.mjs";
import { saveProgress, completeProgress, getRecentProgress, getStatusBatch, getHistory } from "../controllers/progressController.mjs";

const router = express.Router();

router.use(authMiddleware);

router.post("/save",         saveProgress);
router.post("/complete",     completeProgress);
router.get("/recent",        getRecentProgress);
router.post("/status-batch", getStatusBatch);
router.get("/history",       getHistory);

export default router;
