import AppUpdate from "../models/AppUpdate.mjs";
import User from "../models/User.mjs";

// ─── GET CURRENT UPDATE (for mobile app) ─────────────────────────────────────
// GET /api/app-update/current?currentVersionCode=5&platform=android
export const getCurrentUpdate = async (req, res) => {
  try {
    const userId = req.userId; // from authMiddleware (optional)
    const { currentVersionCode, platform } = req.query;

    // Get the most recent update marked as "isActive"
    const update = await AppUpdate.findOne({ isActive: true })
      .sort({ versionCode: -1 })
      .select("-dismissedBy -installedBy")
      .lean();

    if (!update) {
      return res.status(200).json({ 
        success: true, 
        data: null,
        updateAvailable: false 
      });
    }

    const userVersionCode = parseInt(currentVersionCode) || 0;
    const updateAvailable = update.versionCode > userVersionCode;

    // Check if user has already dismissed this update
    const hasDismissed = userId 
      ? await AppUpdate.exists({ _id: update._id, dismissedBy: userId })
      : false;

    // Update user's app version info if logged in
    if (userId && currentVersionCode) {
      await User.findByIdAndUpdate(userId, {
        installedVersionCode: userVersionCode,
        installedAppVersion: req.query.currentVersion || update.version,
        'deviceInfo.platform': platform,
        lastAppUpdate: new Date(),
      });
    }

    res.status(200).json({
      success: true,
      updateAvailable,
      data: (updateAvailable && !hasDismissed) ? update : null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── DISMISS UPDATE (user clicked "Later" or installed) ──────────────────────
// POST /api/app-update/dismiss
// Body: { updateId }
export const dismissUpdate = async (req, res) => {
  try {
    const userId = req.userId;
    const { updateId, installed } = req.body;

    if (!updateId) {
      return res.status(400).json({ success: false, message: "updateId is required" });
    }

    const updateData = { $addToSet: { dismissedBy: userId } };
    
    // If user actually installed the update, track it
    if (installed) {
      updateData.$addToSet = {
        ...updateData.$addToSet,
        installedBy: { userId, installedAt: new Date() }
      };
    }

    await AppUpdate.findByIdAndUpdate(updateId, updateData, { new: true });

    res.status(200).json({ success: true, message: "Update dismissed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ADMIN: GET ALL UPDATES ───────────────────────────────────────────────────
// GET /api/app-update/admin/all
export const getAllUpdates = async (req, res) => {
  try {
    const updates = await AppUpdate.find()
      .populate("updatedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: updates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ADMIN: CREATE UPDATE ─────────────────────────────────────────────────────
// POST /api/app-update/admin
// Body: { version, versionCode, downloadLink, description, changelogHindi, changelogEnglish, isActive, isMandatory }
export const createUpdate = async (req, res) => {
  try {
    const { version, versionCode, downloadLink, description, changelogHindi, changelogEnglish, isActive, isMandatory } = req.body;

    if (!version || !versionCode || !downloadLink) {
      return res.status(400).json({
        success: false,
        message: "version, versionCode and downloadLink are required",
      });
    }

    // Mark all previous updates as inactive
    if (isActive) {
      await AppUpdate.updateMany({}, { isActive: false });
    }

    const update = await AppUpdate.create({
      version,
      versionCode,
      downloadLink,
      description: description || "",
      changelogHindi: changelogHindi || "",
      changelogEnglish: changelogEnglish || "",
      isActive: isActive !== false,
      isMandatory: isMandatory || false,
      updatedBy: null, // Panel doesn't have user auth, set null
    });

    res.status(201).json({ success: true, data: update });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── ADMIN: UPDATE (mark as active or update link) ───────────────────────────
// PUT /api/app-update/admin/:id
export const updateAppUpdate = async (req, res) => {
  try {
    const { version, versionCode, downloadLink, description, changelogHindi, changelogEnglish, isActive, isMandatory } = req.body;

    // If marking as active, mark all others as inactive
    if (isActive) {
      await AppUpdate.updateMany({ _id: { $ne: req.params.id } }, { isActive: false });
    }

    const update = await AppUpdate.findByIdAndUpdate(
      req.params.id,
      { version, versionCode, downloadLink, description, changelogHindi, changelogEnglish, isActive, isMandatory },
      { new: true, runValidators: true }
    );

    if (!update) {
      return res.status(404).json({ success: false, message: "Update not found" });
    }

    res.status(200).json({ success: true, data: update });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── ADMIN: DELETE UPDATE ─────────────────────────────────────────────────────
// DELETE /api/app-update/admin/:id
export const deleteUpdate = async (req, res) => {
  try {
    const deleted = await AppUpdate.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Update not found" });
    }

    res.status(200).json({ success: true, message: "Update deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ADMIN: PUSH UPDATE (mark as active and clear dismissed list) ────────────
// POST /api/app-update/admin/:id/push
export const pushUpdate = async (req, res) => {
  try {
    // Mark all others as inactive
    await AppUpdate.updateMany({ _id: { $ne: req.params.id } }, { isActive: false });

    // Mark this as active and clear dismissed list (everyone will see it again)
    const update = await AppUpdate.findByIdAndUpdate(
      req.params.id,
      { 
        isActive: true, 
        dismissedBy: [], // Clear dismissed list so everyone sees it
      },
      { new: true }
    );

    if (!update) {
      return res.status(404).json({ success: false, message: "Update not found" });
    }

    res.status(200).json({
      success: true,
      message: "Update pushed to all users",
      data: update,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET USERS BY VERSION (Admin Panel) ──────────────────────────────────────
// GET /api/app-update/admin/users-by-version
export const getUsersByVersion = async (req, res) => {
  try {
    const users = await User.find({
      installedVersionCode: { $exists: true, $ne: null }
    })
    .select('name email phone installedAppVersion installedVersionCode lastAppUpdate deviceInfo createdAt')
    .sort({ lastAppUpdate: -1 })
    .lean();

    // Group users by version
    const versionGroups = users.reduce((acc, user) => {
      const version = user.installedAppVersion || 'Unknown';
      if (!acc[version]) {
        acc[version] = {
          version,
          versionCode: user.installedVersionCode,
          users: [],
          count: 0
        };
      }
      acc[version].users.push(user);
      acc[version].count++;
      return acc;
    }, {});

    const versionStats = Object.values(versionGroups).sort((a, b) => 
      (b.versionCode || 0) - (a.versionCode || 0)
    );

    res.status(200).json({
      success: true,
      data: {
        totalUsers: users.length,
        versionStats,
        allUsers: users
      }
    });
  } catch (error) {
    console.error("getUsersByVersion error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET UPDATE STATISTICS (Admin Panel) ─────────────────────────────────────
// GET /api/app-update/admin/:id/stats
export const getUpdateStats = async (req, res) => {
  try {
    const update = await AppUpdate.findById(req.params.id)
      .populate('installedBy.userId', 'name email phone')
      .populate('dismissedBy', 'name email phone');

    if (!update) {
      return res.status(404).json({ success: false, message: "Update not found" });
    }

    const totalUsers = await User.countDocuments({ installedVersionCode: { $exists: true } });
    const usersOnThisVersion = await User.countDocuments({ 
      installedVersionCode: update.versionCode 
    });

    res.status(200).json({
      success: true,
      data: {
        update: {
          version: update.version,
          versionCode: update.versionCode,
          createdAt: update.createdAt,
        },
        totalUsers,
        usersOnThisVersion,
        installedCount: update.installedBy?.length || 0,
        dismissedCount: update.dismissedBy?.length || 0,
        installedUsers: update.installedBy || [],
        dismissedUsers: update.dismissedBy || [],
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
