import Banner from "../models/Banner.mjs";
import { v4 as uuidv4 } from "uuid";
import { getPresignedUploadUrl, deleteFromR2, keyFromUrl } from "../utils/r2.mjs";

// ─── GET ALL BANNERS (sorted by order) ───────────────────────────────────────
export const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ order: 1 });
    res.status(200).json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET ALL BANNERS (for admin — includes inactive) ────────────────────────
export const getAllBannersAdmin = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1 });
    res.status(200).json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── CREATE BANNER ────────────────────────────────────────────────────────────
export const createBanner = async (req, res) => {
  try {
    const { title, subtitle, imageUrl, color, order, isActive, link } = req.body;

    if (!title || !imageUrl) {
      return res.status(400).json({ success: false, message: "title and imageUrl are required" });
    }

    const banner = await Banner.create({
      title,
      subtitle,
      imageUrl,
      color: color || "#FF6B6B",
      order: order ?? 0,
      isActive: isActive !== false,
      link: link || "",
    });

    res.status(201).json({ success: true, data: banner });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── UPDATE BANNER ────────────────────────────────────────────────────────────
export const updateBanner = async (req, res) => {
  try {
    const { title, subtitle, imageUrl, color, order, isActive, link } = req.body;

    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      {
        title,
        subtitle,
        imageUrl,
        color,
        order,
        isActive,
        link,
      },
      { new: true, runValidators: true }
    );

    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    res.status(200).json({ success: true, data: banner });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── DELETE BANNER ────────────────────────────────────────────────────────────
export const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);

    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    // Delete image from R2 if exists
    if (banner.imageUrl) {
      const key = keyFromUrl(banner.imageUrl);
      if (key) {
        await deleteFromR2(key);
      }
    }

    res.status(200).json({ success: true, message: "Banner deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── REORDER BANNERS ──────────────────────────────────────────────────────────
// POST /api/banners/admin/reorder
// Body: { banners: [{ id, order }, ...] }
export const reorderBanners = async (req, res) => {
  try {
    const { banners } = req.body;

    if (!Array.isArray(banners) || banners.length === 0) {
      return res.status(400).json({ success: false, message: "banners array is required" });
    }

    // Update order for each banner
    const updatePromises = banners.map(({ id, order }) =>
      Banner.findByIdAndUpdate(id, { order }, { new: true })
    );

    await Promise.all(updatePromises);

    // Return updated list
    const updated = await Banner.find().sort({ order: 1 });

    res.status(200).json({ success: true, message: "Banners reordered", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET PRESIGNED URL FOR BANNER IMAGE UPLOAD ────────────────────────────────
// POST /api/banners/presign
export const getBannerPresignedUrl = async (req, res) => {
  try {
    const { filename, contentType } = req.body;

    if (!filename || !contentType) {
      return res.status(400).json({
        success: false,
        message: "filename and contentType are required",
      });
    }

    const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimes.includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid contentType. Allowed: ${allowedMimes.join(", ")}`,
      });
    }

    // Build unique key for banner image
    const ext = filename.split(".").pop().toLowerCase();
    const safeExt = ext.replace(/[^a-z0-9]/g, "");
    const key = `banners/${uuidv4()}.${safeExt}`;

    const { uploadUrl, publicUrl } = await getPresignedUploadUrl(key, contentType);

    return res.status(200).json({
      success: true,
      uploadUrl,
      publicUrl,
      key,
    });
  } catch (error) {
    console.error("getBannerPresignedUrl error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to generate upload URL" });
  }
};
