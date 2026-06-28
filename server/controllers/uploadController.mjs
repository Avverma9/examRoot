import { v4 as uuidv4 } from "uuid";
import { getPresignedUploadUrl, deleteFromR2, keyFromUrl } from "../utils/r2.mjs";

/**
 * Allowed upload types with their folder and accepted MIME types.
 * type param comes from the client request.
 */
const UPLOAD_CONFIG = {
  banner:           { folder: "banners",            mimes: ["image/jpeg", "image/png", "image/webp", "image/gif"] },
  thumbnail:        { folder: "thumbnails",         mimes: ["image/jpeg", "image/png", "image/webp"] },
  video:            { folder: "videos",             mimes: ["video/mp4", "video/webm", "video/quicktime"] },
  profile:          { folder: "profiles",           mimes: ["image/jpeg", "image/png", "image/webp"] },
  "series-cover":   { folder: "series-covers",      mimes: ["image/jpeg", "image/png", "image/webp"] },
};

// ── POST /api/upload/presign ──────────────────────────────────────────────────
// Body: { type, filename, contentType }
// Returns: { uploadUrl, publicUrl, key }
export const getUploadPresignedUrl = async (req, res) => {
  try {
    const { type, filename, contentType } = req.body;

    if (!type || !filename || !contentType) {
      return res.status(400).json({
        success: false,
        message: "type, filename, and contentType are required",
      });
    }

    const config = UPLOAD_CONFIG[type];
    if (!config) {
      return res.status(400).json({
        success: false,
        message: `Invalid type. Allowed: ${Object.keys(UPLOAD_CONFIG).join(", ")}`,
      });
    }

    if (!config.mimes.includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid contentType for ${type}. Allowed: ${config.mimes.join(", ")}`,
      });
    }

    // Build a unique key: folder/uuid-originalname
    const ext       = filename.split(".").pop().toLowerCase();
    const safeExt   = ext.replace(/[^a-z0-9]/g, "");
    const key       = `${config.folder}/${uuidv4()}.${safeExt}`;

    const { uploadUrl, publicUrl } = await getPresignedUploadUrl(key, contentType);

    return res.status(200).json({
      success:   true,
      uploadUrl,   // PUT this URL directly from client with the file binary
      publicUrl,   // save this in DB after upload
      key,
    });
  } catch (error) {
    console.error("getUploadPresignedUrl error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to generate upload URL" });
  }
};

// ── DELETE /api/upload  ───────────────────────────────────────────────────────
// Body: { url } — public URL of the file to delete
export const deleteUpload = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, message: "url is required" });

    const key = keyFromUrl(url);
    if (!key) return res.status(400).json({ success: false, message: "URL does not belong to this bucket" });

    await deleteFromR2(key);
    res.status(200).json({ success: true, message: "File deleted" });
  } catch (error) {
    console.error("deleteUpload error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to delete file" });
  }
};
