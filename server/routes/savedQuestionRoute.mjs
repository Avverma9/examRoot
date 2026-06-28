import express from "express";
import { authMiddleware } from "../middleware/auth.mjs";
import {
  toggleSavedQuestion,
  getSavedQuestions,
  getSavedStatus,
  deleteSavedQuestion,
} from "../controllers/savedQuestionController.mjs";

const router = express.Router();

router.use(authMiddleware);

router.post("/toggle",          toggleSavedQuestion);
router.get("/",                 getSavedQuestions);
router.get("/status/:resourceId", getSavedStatus);
router.delete("/:id",           deleteSavedQuestion);

export default router;
