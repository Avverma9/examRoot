import jwt from "jsonwebtoken";
import User from "../models/User.mjs";
import OTP from "../models/OTP.mjs";
import { sendOTPEmail, sendWelcomeEmail } from "../utils/email.mjs";
import { sendSMSOTP } from "../utils/sms.mjs";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[6-9]\d{9}$/; // Indian 10-digit mobile

const makeJWT = (user) =>
  jwt.sign(
    { userId: user._id, email: user.email, name: user.name },
    process.env.JWT_SECRET || "your-secret-key-change-in-production",
    { expiresIn: "30d" }
  );

const safeUserPayload = (user) => ({
  _id:          user._id,
  email:        user.email,
  name:         user.name,
  phone:        user.phone,
  isVerified:   user.isVerified,
  testsTaken:   user.totalMockTestsTaken,
  accuracy:     user.accuracy,
  streak:       user.streak,
  profileImage: user.profileImage || null,
});

// ─── REQUEST OTP ──────────────────────────────────────────────────────────────
// POST /api/auth/request-otp
// Body: { email } OR { phone }  (one of them required)
export const requestOTP = async (req, res) => {
  try {
    const { email, phone } = req.body;

    // ── Validate input ─────────────────────────────────────────────────────
    if (!email && !phone) {
      return res.status(400).json({ success: false, message: "Email or phone number is required" });
    }
    if (email && !emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }
    if (phone && !phoneRegex.test(phone)) {
      return res.status(400).json({ success: false, message: "Invalid phone number. Enter 10-digit Indian mobile number." });
    }

    const isEmailFlow = !!email;
    const identifier  = isEmailFlow ? email.toLowerCase() : phone;

    // ── Check if user exists ───────────────────────────────────────────────
    const existingUser = isEmailFlow
      ? await User.findOne({ email: identifier })
      : await User.findOne({ phone: identifier });

    const requiresName = !existingUser;

    const otp       = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    if (isEmailFlow) {
      // ── Email OTP — stored in our DB ─────────────────────────────────────
      await OTP.deleteMany({ email: identifier });
      await OTP.create({ email: identifier, otp, expiresAt });
      await sendOTPEmail(identifier, otp);

      return res.status(200).json({
        success: true,
        message: "OTP sent to your email",
        channel: "email",
        requiresName,
        email: identifier,
      });
    } else {
      // ── Phone OTP — Fast2SMS manages it, we still store OTP in DB ────────
      // We generate the OTP ourselves so email & SMS use same 6-digit code
      // Fast2SMS delivers it via SMS using our OTP template
      await OTP.deleteMany({ phone: identifier });
      await OTP.create({ phone: identifier, otp, expiresAt });
      await sendSMSOTP(identifier, otp);

      return res.status(200).json({
        success: true,
        message: "OTP sent to your mobile number",
        channel: "phone",
        requiresName,
        phone: identifier,
      });
    }
  } catch (error) {
    console.error("requestOTP error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to send OTP" });
  }
};

// ─── VERIFY OTP & LOGIN ───────────────────────────────────────────────────────
// POST /api/auth/verify-otp
// Body: { email, otp, name? }  OR  { phone, otp, name? }
export const verifyOTPAndLogin = async (req, res) => {
  try {
    const { email, phone, otp, name } = req.body;

    if (!otp) return res.status(400).json({ success: false, message: "OTP is required" });
    if (!email && !phone) return res.status(400).json({ success: false, message: "Email or phone is required" });

    const isEmailFlow = !!email;
    const identifier  = isEmailFlow ? email.toLowerCase() : phone;

    // ── Find OTP record in DB (both flows store in DB) ─────────────────────
    const otpRecord = isEmailFlow
      ? await OTP.findOne({ email: identifier })
      : await OTP.findOne({ phone: identifier });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "OTP not found or already expired. Request a new OTP." });
    }

    // ── Attempt tracking ───────────────────────────────────────────────────
    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      if (otpRecord.attempts >= otpRecord.maxAttempts) {
        await OTP.deleteOne({ _id: otpRecord._id });
        return res.status(400).json({ success: false, message: "Maximum attempts exceeded. Request a new OTP." });
      }
      await otpRecord.save();
      const remaining = otpRecord.maxAttempts - otpRecord.attempts;
      return res.status(400).json({ success: false, message: `Invalid OTP. ${remaining} attempt(s) left.` });
    }

    // ── Expiry check ───────────────────────────────────────────────────────
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, message: "OTP expired. Request a new OTP." });
    }

    // ── OTP correct — delete it ────────────────────────────────────────────
    await OTP.deleteOne({ _id: otpRecord._id });

    // ── Find or create user ────────────────────────────────────────────────
    let user = isEmailFlow
      ? await User.findOne({ email: identifier })
      : await User.findOne({ phone: identifier });

    if (!user) {
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: "Name is required for new users" });
      }
      const createData = {
        name:       name.trim(),
        isVerified: true,
        lastLogin:  new Date(),
      };
      if (isEmailFlow) createData.email = identifier;
      else             createData.phone = identifier;

      user = await User.create(createData);

      // Send welcome email if we have an email address
      if (user.email) {
        try { await sendWelcomeEmail(user.email, user.name); } catch (_) {}
      }
    } else {
      user.isVerified = true;
      user.lastLogin  = new Date();
      await user.save();
    }

    const token = makeJWT(user);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: safeUserPayload(user),
    });
  } catch (error) {
    console.error("verifyOTPAndLogin error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to verify OTP" });
  }
};

// ─── RESEND OTP ───────────────────────────────────────────────────────────────
// POST /api/auth/resend-otp
// Body: { email } OR { phone }
export const resendOTP = async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ success: false, message: "Email or phone is required" });
    }

    const isEmailFlow = !!email;
    const identifier  = isEmailFlow ? email.toLowerCase() : phone;

    if (isEmailFlow) {
      // ── Email: generate fresh OTP and resend ──────────────────────────────
      const existing = await OTP.findOne({ email: identifier });
      if (!existing) {
        return res.status(404).json({ success: false, message: "No active OTP session. Please request a new OTP." });
      }
      // Refresh OTP and reset attempts
      const otp       = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      existing.otp       = otp;
      existing.expiresAt = expiresAt;
      existing.attempts  = 0;
      await existing.save();
      await sendOTPEmail(identifier, otp);

      return res.status(200).json({ success: true, message: "OTP resent to your email", channel: "email" });
    } else {
      // ── Phone: generate fresh OTP and resend via Fast2SMS Quick SMS ───────
      const existing = await OTP.findOne({ phone: identifier });
      if (!existing) {
        return res.status(404).json({ success: false, message: "No active OTP session. Please request a new OTP." });
      }
      const otp       = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      existing.otp       = otp;
      existing.expiresAt = expiresAt;
      existing.attempts  = 0;
      await existing.save();
      await sendSMSOTP(identifier, otp);

      return res.status(200).json({ success: true, message: "OTP resent to your mobile", channel: "phone" });
    }
  } catch (error) {
    console.error("resendOTP error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to resend OTP" });
  }
};

// ─── GET CURRENT USER ─────────────────────────────────────────────────────────
// GET /api/auth/me   (requires auth)
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-__v");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({
      success: true,
      user: {
        ...safeUserPayload(user),
        profileImage:      user.profileImage,
        lastLogin:         user.lastLogin,
        preferredLanguage: user.preferredLanguage,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch user" });
  }
};

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────
// PUT /api/auth/profile   (requires auth)
export const updateUserProfile = async (req, res) => {
  try {
    const { name, phone, profileImage, preferredLanguage } = req.body;
    const update = {};
    if (name)              update.name              = name.trim();
    if (phone)             update.phone             = phone;
    if (profileImage)      update.profileImage      = profileImage;
    if (preferredLanguage) update.preferredLanguage = preferredLanguage;

    const user = await User.findByIdAndUpdate(req.userId, update, { new: true }).select("-__v");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({
      success: true,
      message: "Profile updated",
      user: {
        _id:               user._id,
        email:             user.email,
        name:              user.name,
        phone:             user.phone,
        profileImage:      user.profileImage,
        preferredLanguage: user.preferredLanguage,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to update profile" });
  }
};

// ─── GOOGLE OAuth LOGIN ───────────────────────────────────────────────────────
// POST /api/auth/google
// Body: { idToken } — Google ID token from expo-auth-session
export const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ success: false, message: "idToken is required" });

    // Verify Google ID token by calling Google's tokeninfo endpoint
    const googleRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );
    const googleData = await googleRes.json();

    if (!googleRes.ok || googleData.error) {
      console.error("Google token verification failed:", googleData);
      return res.status(401).json({ success: false, message: "Invalid Google token" });
    }

    // Validate audience — must match our web OR Android Google Client ID
    const webClientId     = process.env.GOOGLE_CLIENT_ID;
    const androidClientId = process.env.GOOGLE_ANDROID_CLIENT_ID;
    const validAudiences  = [webClientId, androidClientId].filter(Boolean);

    console.log("Token aud    :", googleData.aud);
    console.log("Valid auds   :", validAudiences);

    if (validAudiences.length > 0 && !validAudiences.includes(googleData.aud)) {
      console.error("Audience mismatch — token aud:", googleData.aud);
      return res.status(401).json({ success: false, message: "Token audience mismatch" });
    }

    const { email, name, picture, sub: googleId } = googleData;

    if (!email) return res.status(400).json({ success: false, message: "Email not found in Google token" });

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      user = await User.create({
        email:        email.toLowerCase(),
        name:         name || email.split("@")[0],
        profileImage: picture || "",
        googleId,
        isVerified:   true,
        lastLogin:    new Date(),
      });
      // Welcome email (non-blocking)
      try { await sendWelcomeEmail(user.email, user.name); } catch (_) {}
    } else {
      // Update profile image and last login
      user.lastLogin    = new Date();
      user.isVerified   = true;
      if (picture && !user.profileImage) user.profileImage = picture;
      if (!user.googleId) user.googleId = googleId;
      await user.save();
    }

    const token = makeJWT(user);

    res.status(200).json({
      success: true,
      message: "Google login successful",
      token,
      user: safeUserPayload(user),
    });
  } catch (error) {
    console.error("googleLogin error:", error);
    res.status(500).json({ success: false, message: error.message || "Google login failed" });
  }
};
