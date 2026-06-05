import express from "express";
import {
  createTestSeries,
  bulkCreateTestSeries,
  getAllTestSeries,
  getTestSeriesById,
  getTestById,
  updateTestSeries,
  deleteTestSeries,
} from "../controllers/testSeriesController.mjs";

const router = express.Router();

router.post("/", createTestSeries);
router.post("/bulk", bulkCreateTestSeries);
router.get("/", getAllTestSeries);
router.get("/:id", getTestSeriesById);
router.get("/:seriesId/test/:testId", getTestById);
router.put("/:id", updateTestSeries);
router.delete("/:id", deleteTestSeries);

export default router;
