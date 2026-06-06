import jwt from "jsonwebtoken";
import User from "../models/User.mjs";
import OTP from "../models/OTP.mjs";
import { sendOTPEmail, sendWelcomeEmail } from "../utils/email.mjs";

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Request OTP
export const requestOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any previous OTP for this email
    await OTP.deleteMany({ email });

    // Save new OTP
    await OTP.create({
      email,
      otp,
      expiresAt,
    });

    // Send OTP email
    await sendOTPEmail(email, otp);

    // Determine if user needs to provide name
    const requiresName = !existingUser;

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      requiresName,
      email,
    });
  } catch (error) {
    console.error("Error in requestOTP:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send OTP",
    });
  }
};

// Verify OTP and Login
export const verifyOTPAndLogin = async (req, res) => {
  try {
    const { email, otp, name } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    // Find and verify OTP
    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "OTP not found or expired" });
    }

    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      if (otpRecord.attempts >= otpRecord.maxAttempts) {
        await OTP.deleteOne({ _id: otpRecord._id });
        return res.status(400).json({
          success: false,
          message: "Maximum OTP attempts exceeded. Request new OTP.",
        });
      }
      await otpRecord.save();
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Check if OTP expired
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, message: "OTP expired. Request new OTP." });
    }

    // Delete OTP after successful verification
    await OTP.deleteOne({ _id: otpRecord._id });

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      // New user - name is required
      if (!name || name.trim() === "") {
        return res.status(400).json({ success: false, message: "Name is required for new users" });
      }

      user = await User.create({
        email,
        name: name.trim(),
        isVerified: true,
        lastLogin: new Date(),
      });

      // Send welcome email
      try {
        await sendWelcomeEmail(email, name);
      } catch (emailError) {
        console.error("Welcome email failed, but user created:", emailError);
      }
    } else {
      // Existing user - update last login
      user.isVerified = true;
      user.lastLogin = new Date();
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        name: user.name,
      },
      process.env.JWT_SECRET || "your-secret-key-change-in-production",
      { expiresIn: "30d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
        testsTaken: user.totalMockTestsTaken,
        accuracy: user.accuracy,
        streak: user.streak,
      },
    });
  } catch (error) {
    console.error("Error in verifyOTPAndLogin:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to verify OTP",
    });
  }
};

// Get current user profile
export const getCurrentUser = async (req, res) => {
  try {
    // Middleware should extract userId from JWT
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(userId).select("-__v");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
        testsTaken: user.totalMockTestsTaken,
        accuracy: user.accuracy,
        streak: user.streak,
        lastLogin: user.lastLogin,
        preferredLanguage: user.preferredLanguage,
      },
    });
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch user",
    });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, phone, profileImage, preferredLanguage } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (phone) updateData.phone = phone;
    if (profileImage) updateData.profileImage = profileImage;
    if (preferredLanguage) updateData.preferredLanguage = preferredLanguage;

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select("-__v");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        profileImage: user.profileImage,
        preferredLanguage: user.preferredLanguage,
      },
    });
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update profile",
    });
  }
};
