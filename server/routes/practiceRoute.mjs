import express from "express";
import {
  createPracticeSet,
  bulkCreatePracticeSets,
  getAllPracticeSets,
  getPracticeSetById,
  updatePracticeSet,
  deletePracticeSet,
} from "../controllers/practiceSetController.mjs";

const router = express.Router();

router.post("/", createPracticeSet);
router.post("/bulk", bulkCreatePracticeSets);
router.get("/", getAllPracticeSets);
router.get("/:id", getPracticeSetById);
router.put("/:id", updatePracticeSet);
router.delete("/:id", deletePracticeSet);

export default router;
