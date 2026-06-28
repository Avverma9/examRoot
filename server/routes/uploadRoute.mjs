import express from "express";
import { authMiddleware } from "../middleware/auth.mjs";
import { getUploadPresignedUrl, deleteUpload } from "../controllers/uploadController.mjs";

const router = express.Router();

// Presign — mobile app users must be logged in.
// Panel runs internally so it can also call without token (optionalAuth could be used).
// For now we protect both with authMiddleware; panel can add admin token later.
router.post("/presign", getUploadPresignedUrl);   // get presigned PUT URL (public for panel)
router.delete("/",      authMiddleware, deleteUpload);  // delete requires auth

export default router;
