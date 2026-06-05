import express from "express";
import {
  createMockTest,
  bulkCreateMockTests,
  getAllMockTests,
  getMockTestById,
  updateMockTest,
  deleteMockTest,
} from "../controllers/mockTestController.mjs";

const router = express.Router();

router.post("/", createMockTest);
router.post("/bulk", bulkCreateMockTests);
router.get("/", getAllMockTests);
router.get("/:id", getMockTestById);
router.put("/:id", updateMockTest);
router.delete("/:id", deleteMockTest);

export default router;
