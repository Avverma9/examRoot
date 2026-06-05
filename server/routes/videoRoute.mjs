import express from "express";
import {
  createVideo,
  bulkCreateVideos,
  getAllVideos,
  getVideoById,
  incrementView,
  updateVideo,
  deleteVideo,
} from "../controllers/videoController.mjs";

const router = express.Router();

router.post("/", createVideo);
router.post("/bulk", bulkCreateVideos);
router.get("/", getAllVideos);
router.get("/:id", getVideoById);
router.patch("/:id/view", incrementView);
router.put("/:id", updateVideo);
router.delete("/:id", deleteVideo);

export default router;
