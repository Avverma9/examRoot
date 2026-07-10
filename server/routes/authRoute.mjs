import express from "express";
import { authMiddleware } from "../middleware/auth.mjs";
import {
  requestOTP,
  verifyOTPAndLogin,
  resendOTP,
  googleLogin,
  loginWithEmailPassword,
  updatePassword,
  getCurrentUser,
  updateUserProfile,
  requestDataDeletionOTP,
  reviewPersonalData,
  deletePersonalData,
} from "../controllers/authController.mjs";

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.post("/request-otp", requestOTP);
router.post("/verify-otp",  verifyOTPAndLogin);
router.post("/resend-otp",  resendOTP);
router.post("/google",      googleLogin);       // Google OAuth
router.post("/login",       loginWithEmailPassword);
router.post("/data-request-otp", requestDataDeletionOTP);
router.post("/data-review", reviewPersonalData);
router.post("/data-delete", deletePersonalData);

// ── Protected ─────────────────────────────────────────────────────────────────
router.get("/me",           authMiddleware, getCurrentUser);
router.put("/profile",      authMiddleware, updateUserProfile);
router.put("/password",     authMiddleware, updatePassword);

export default router;
