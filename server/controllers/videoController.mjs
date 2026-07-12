import Video from "../models/Video.mjs";
import { formatBulkError, normalizeBulkItems } from "../utils/bulk.mjs";

// ─── CREATE ──────────────────────────────────────────────────────────────────
export const createVideo = async (req, res) => {
  try {
    const video = await Video.create(req.body);
    res.status(201).json({ success: true, message: "Video created successfully", data: video });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── BULK CREATE ─────────────────────────────────────────────────────────────
export const bulkCreateVideos = async (req, res) => {
  try {
    const items = normalizeBulkItems(req.body);
    if (!items || items.length === 0)
      return res.status(400).json({ success: false, message: "No items provided" });

    const videos = await Video.insertMany(items, { ordered: false });
    res.status(201).json({ success: true, totalInserted: videos.length, totalReceived: items.length, data: videos });
  } catch (error) {
    const inserted = error?.insertedDocs || [];
    const formatted = formatBulkError(error);
    if (inserted.length > 0)
      return res.status(201).json({ success: true, message: "Partially succeeded", totalInserted: inserted.length, errors: formatted, data: inserted });
    res.status(500).json({ success: false, message: formatted.message || "Bulk import failed", errors: formatted });
  }
};

// ─── GET ALL (with filters + search) ─────────────────────────────────────────
export const getAllVideos = async (req, res) => {
  try {
    const { category, subject, search, isPremium } = req.query;
    const filter = { isPublished: true };

    if (category)  filter.category  = new RegExp(category, "i");
    if (subject)   filter.subject   = new RegExp(subject, "i");
    if (isPremium !== undefined) filter.isPremium = isPremium === "true";
    if (search)    filter.$or = [{ videoTitle: new RegExp(search, "i") }, { description: new RegExp(search, "i") }, { instructor: new RegExp(search, "i") }];

    const videos = await Video.find(filter).sort({ order: 1, createdAt: -1 });
    res.status(200).json({ success: true, total: videos.length, data: videos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET SINGLE ───────────────────────────────────────────────────────────────
export const getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ success: false, message: "Video not found" });
    res.status(200).json({ success: true, data: video });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── INCREMENT VIEW COUNT ─────────────────────────────────────────────────────
export const incrementView = async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { returnDocument: "after" });
    if (!video) return res.status(404).json({ success: false, message: "Video not found" });
    res.status(200).json({ success: true, views: video.views });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── UPDATE ──────────────────────────────────────────────────────────────────
export const updateVideo = async (req, res) => {
  try {
    const updated = await Video.findByIdAndUpdate(req.params.id, req.body, { returnDocument: "after", runValidators: true });
    if (!updated) return res.status(404).json({ success: false, message: "Video not found" });
    res.status(200).json({ success: true, message: "Video updated successfully", data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── DELETE ──────────────────────────────────────────────────────────────────
export const deleteVideo = async (req, res) => {
  try {
    const deleted = await Video.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Video not found" });
    res.status(200).json({ success: true, message: "Video deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
