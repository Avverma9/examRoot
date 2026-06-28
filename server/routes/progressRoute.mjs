import express from "express";
import { authMiddleware } from "../middleware/auth.mjs";
import { saveProgress, completeProgress, getRecentProgress } from "../controllers/progressController.mjs";

const router = express.Router();

router.use(authMiddleware);

router.post("/save",     saveProgress);
router.post("/complete", completeProgress);
router.get("/recent",    getRecentProgress);

export default router;
