import express from "express";
import {
  createPracticeSet,
  bulkCreatePracticeSets,
  getAllPracticeSets,
  updatePracticeSet,
  deletePracticeSet,
} from "../controllers/practiceSetController.mjs";

const router = express.Router();

router.post("/", createPracticeSet);
router.post("/bulk", bulkCreatePracticeSets);
router.get("/", getAllPracticeSets);
router.put("/:id", updatePracticeSet);
router.delete("/:id", deletePracticeSet);

export default router;
