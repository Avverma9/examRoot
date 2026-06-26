import express from "express";
import { authMiddleware } from "../middleware/auth.mjs";
import {
  requestOTP,
  verifyOTPAndLogin,
  resendOTP,
  googleLogin,
  getCurrentUser,
  updateUserProfile,
} from "../controllers/authController.mjs";

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.post("/request-otp", requestOTP);
router.post("/verify-otp",  verifyOTPAndLogin);
router.post("/resend-otp",  resendOTP);
router.post("/google",      googleLogin);       // Google OAuth

// ── Protected ─────────────────────────────────────────────────────────────────
router.get("/me",           authMiddleware, getCurrentUser);
router.put("/profile",      authMiddleware, updateUserProfile);

export default router;
