import express from "express";
import { optionalAuth } from "../middleware/auth.mjs";
import {
  createTestSeries,
  bulkCreateTestSeries,
  getAllTestSeries,
  getTestSeriesById,
  getTestById,
  updateTestSeries,
  deleteTestSeries,
  generateMockTest,
  generatePracticeSet,
  getTestsMeta,
  getThumnailPresignedUrl,
  saveSeriesThumbnail,
  deleteSeriesThumbnail,
} from "../controllers/testSeriesController.mjs";

const router = express.Router();

router.post("/", createTestSeries);
router.post("/bulk", bulkCreateTestSeries);
router.get("/", getAllTestSeries);
router.get("/:id", getTestSeriesById);
router.get("/:id/tests-meta", getTestsMeta);

// optionalAuth: sets req.userId if token present — used for subscription check
router.get("/:seriesId/test/:testId", optionalAuth, getTestById);

router.put("/:id", updateTestSeries);
router.delete("/:id", deleteTestSeries);

// ─── Generate routes ──────────────────────────────────────────────────────────
router.post("/:id/generate-mock", generateMockTest);
router.post("/:id/generate-practice", generatePracticeSet);

// ─── Thumbnail routes ─────────────────────────────────────────────────────────
router.post("/:id/thumbnail-presign", getThumnailPresignedUrl);
router.put("/:id/thumbnail", saveSeriesThumbnail);
router.delete("/:id/thumbnail", deleteSeriesThumbnail);

export default router;
