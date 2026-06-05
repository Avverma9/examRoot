import express from "express";
import { authMiddleware } from "../middleware/auth.mjs";
import {
  requestOTP,
  verifyOTPAndLogin,
  getCurrentUser,
  updateUserProfile,
} from "../controllers/authController.mjs";

const router = express.Router();

// Public routes
router.post("/request-otp", requestOTP);
router.post("/verify-otp", verifyOTPAndLogin);

// Protected routes
router.get("/me", authMiddleware, getCurrentUser);
router.put("/profile", authMiddleware, updateUserProfile);

export default router;
