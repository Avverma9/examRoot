import jwt from "jsonwebtoken";
import User from "../models/User.mjs";
import OTP from "../models/OTP.mjs";
import Tracking from "../models/Tracking.mjs";
import { sendOTPEmail, sendWelcomeEmail } from "../utils/email.mjs";
import { sendSMSOTP } from "../utils/sms.mjs";

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[6-9]\d{9}$/; // Indian 10-digit mobile
const normalizeEmail = (value) => value.trim().toLowerCase();
const findUserByIdentifier = async ({ email, phone }) => {
  if (email) {
    const normalizedEmail = normalizeEmail(email);
    return User.findOne({
      email: normalizedEmail,
    });
  }

  if (phone) {
    return User.findOne({ phone });
  }

  return null;
};

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

// â”€â”€â”€ REQUEST OTP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POST /api/auth/request-otp
// Body: { email } OR { phone }  (one of them required)
export const requestOTP = async (req, res) => {
  try {
    const { email, phone } = req.body;

    // â”€â”€ Validate input â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    const identifier  = isEmailFlow ? normalizeEmail(email) : phone;

    // â”€â”€ Check if user exists â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const existingUser = isEmailFlow
      ? await User.findOne({ email: identifier })
      : await User.findOne({ phone: identifier });

    const requiresName = !existingUser;

    const otp       = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    if (isEmailFlow) {
      // â”€â”€ Email OTP â€” stored in our DB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      await OTP.deleteMany({ email: identifier });
      await OTP.create({ email: identifier, otp, expiresAt });
      try {
        await sendOTPEmail(identifier, otp);
      } catch (mailErr) {
        await OTP.deleteMany({ email: identifier });
        throw mailErr;
      }

      return res.status(200).json({
        success: true,
        message: "OTP sent to your email",
        channel: "email",
        requiresName,
        email: identifier,
      });
    } else {
      // â”€â”€ Phone OTP â€” Fast2SMS manages it, we still store OTP in DB â”€â”€â”€â”€â”€â”€â”€â”€
      // We generate the OTP ourselves so email & SMS use same 6-digit code
      // Fast2SMS delivers it via SMS using our OTP template
      await OTP.deleteMany({ phone: identifier });
      await OTP.create({ phone: identifier, otp, expiresAt });
      try {
        await sendSMSOTP(identifier, otp);
      } catch (smsErr) {
        await OTP.deleteMany({ phone: identifier });
        throw smsErr;
      }

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

// â”€â”€â”€ VERIFY OTP & LOGIN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POST /api/auth/verify-otp
// Body: { email, otp, name? }  OR  { phone, otp, name? }
export const verifyOTPAndLogin = async (req, res) => {
  try {
    const { email, phone, otp, name } = req.body;

    if (!otp) return res.status(400).json({ success: false, message: "OTP is required" });
    if (!email && !phone) return res.status(400).json({ success: false, message: "Email or phone is required" });

    const isEmailFlow = !!email;
    const identifier  = isEmailFlow ? normalizeEmail(email) : phone;

    // â”€â”€ Find OTP record in DB (both flows store in DB) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const otpRecord = isEmailFlow
      ? await OTP.findOne({ email: identifier })
      : await OTP.findOne({ phone: identifier });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "OTP not found or already expired. Request a new OTP." });
    }

    // â”€â”€ Attempt tracking â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

    // â”€â”€ Expiry check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, message: "OTP expired. Request a new OTP." });
    }

    // â”€â”€ OTP correct â€” delete it â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await OTP.deleteOne({ _id: otpRecord._id });

    // â”€â”€ Find or create user â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    let user = await findUserByIdentifier({ email, phone });

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

      try {
        user = await User.create(createData);
      } catch (createError) {
        // Another request may have created the same email/phone in parallel.
        if (createError?.code === 11000) {
          user = await findUserByIdentifier({ email, phone });
        } else {
          throw createError;
        }
      }

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

// â”€â”€â”€ RESEND OTP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      // â”€â”€ Email: generate fresh OTP and resend â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      try {
        await sendOTPEmail(identifier, otp);
      } catch (mailErr) {
        await OTP.deleteMany({ email: identifier });
        throw mailErr;
      }

      return res.status(200).json({ success: true, message: "OTP resent to your email", channel: "email" });
    } else {
      // â”€â”€ Phone: generate fresh OTP and resend via Fast2SMS Quick SMS â”€â”€â”€â”€â”€â”€â”€
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
      try {
        await sendSMSOTP(identifier, otp);
      } catch (smsErr) {
        await OTP.deleteMany({ phone: identifier });
        throw smsErr;
      }

      return res.status(200).json({ success: true, message: "OTP resent to your mobile", channel: "phone" });
    }
  } catch (error) {
    console.error("resendOTP error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to resend OTP" });
  }
};

// â”€â”€â”€ GET CURRENT USER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /api/auth/me   (requires auth)
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-__v");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // â”€â”€ Live stats from Tracking collection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const [mockStats, practiceStats, streakData] = await Promise.all([

      // Count completed mock tests + average accuracy
      Tracking.aggregate([
        {
          $match: {
            userId: user._id,
            resourceType: { $in: ["mock_test", "test_series"] },
            status: "completed",
          },
        },
        {
          $group: {
            _id: null,
            testsTaken:  { $sum: 1 },
            avgAccuracy: { $avg: "$accuracy" },
          },
        },
      ]),

      // Count completed practice sets
      Tracking.aggregate([
        {
          $match: {
            userId: user._id,
            resourceType: "practice_set",
            status: "completed",
          },
        },
        {
          $group: { _id: null, setsTaken: { $sum: 1 } },
        },
      ]),

      // Streak: count how many consecutive days (up to today) user completed at least one activity
      Tracking.aggregate([
        {
          $match: {
            userId: user._id,
            status: "completed",
          },
        },
        {
          // Get unique activity dates (IST date string)
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" },
            },
          },
        },
        { $sort: { _id: -1 } }, // most recent first
      ]),
    ]);

    // Calculate streak from sorted unique activity dates
    const streak = (() => {
      if (!streakData.length) return 0;

      const today     = new Date();
      today.setHours(0, 0, 0, 0);
      const msPerDay  = 24 * 60 * 60 * 1000;

      const dates = streakData.map((d) => {
        const [y, m, day] = d._id.split("-").map(Number);
        return new Date(y, m - 1, day).getTime();
      });

      let count    = 0;
      let expected = today.getTime();

      for (const ts of dates) {
        if (ts === expected) {
          count++;
          expected -= msPerDay;
        } else if (ts === expected + msPerDay) {
          // Allow "today not yet done but yesterday was" â€” still streak
          expected = ts - msPerDay;
          count++;
        } else {
          break;
        }
      }
      return count;
    })();

    const testsTaken  = mockStats[0]?.testsTaken  ?? 0;
    const setsTaken   = practiceStats[0]?.setsTaken ?? 0;
    const rawAccuracy = mockStats[0]?.avgAccuracy  ?? 0;
    const accuracy    = Math.round(rawAccuracy * 10) / 10; // 1 decimal place

    // Keep User doc in sync (for profile screen cached reads)
    await User.findByIdAndUpdate(req.userId, {
      totalMockTestsTaken:    testsTaken,
      totalPracticeSetsTaken: setsTaken,
      accuracy,
      streak,
    });

    res.status(200).json({
      success: true,
      user: {
        _id:               user._id,
        email:             user.email,
        name:              user.name,
        phone:             user.phone,
        isVerified:        user.isVerified,
        profileImage:      user.profileImage || null,
        lastLogin:         user.lastLogin,
        preferredLanguage: user.preferredLanguage,
        // â”€â”€ Live computed stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        testsTaken,
        accuracy,
        streak,
        practiceSetsTaken: setsTaken,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch user" });
  }
};

// â”€â”€â”€ UPDATE PROFILE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ GOOGLE OAuth LOGIN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POST /api/auth/google
// Body: { idToken } â€” Google ID token from expo-auth-session
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

    // Validate audience â€” must match our web OR Android Google Client ID
    const webClientId     = process.env.GOOGLE_CLIENT_ID;
    const androidClientId = process.env.GOOGLE_ANDROID_CLIENT_ID;
    const validAudiences  = [webClientId, androidClientId].filter(Boolean);

    console.log("Token aud    :", googleData.aud);
    console.log("Valid auds   :", validAudiences);

    if (validAudiences.length > 0 && !validAudiences.includes(googleData.aud)) {
      console.error("Audience mismatch â€” token aud:", googleData.aud);
      return res.status(401).json({ success: false, message: "Token audience mismatch" });
    }

    const { email, name, picture, sub: googleId } = googleData;

    if (!email) return res.status(400).json({ success: false, message: "Email not found in Google token" });

    // Find or create user
    const normalizedEmail = normalizeEmail(email);
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      user = await User.create({
        email:        normalizedEmail,
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

