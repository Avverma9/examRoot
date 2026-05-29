import Video from "../models/Video.mjs";
import { formatBulkError, normalizeBulkItems } from "../utils/bulk.mjs";


// Create Single Video
export const createVideo = async (req, res) => {
  try {
    const video = await Video.create(req.body);

    res.status(201).json({
      success: true,
      message: "Video created successfully",
      data: video,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Bulk Insert Videos
export const bulkCreateVideos = async (req, res) => {
  try {
    const items = normalizeBulkItems(req.body);
    if (!items) {
      return res.status(400).json({
        success: false,
        message: "Invalid payload. Send an array, or { items: [...] } / { data: [...] }",
      });
    }

    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No items provided for bulk import",
      });
    }

    const videos = await Video.insertMany(items, { ordered: false });

    res.status(201).json({
      success: true,
      message: "Bulk videos added successfully",
      totalInserted: videos.length,
      totalReceived: items.length,
      data: videos,
    });
  } catch (error) {
    const inserted = error?.insertedDocs || [];
    const formatted = formatBulkError(error);

    if (inserted.length > 0) {
      return res.status(201).json({
        success: true,
        message: "Bulk import partially succeeded",
        totalInserted: inserted.length,
        totalFailed:
          (formatted?.validationErrors?.length || 0) + (formatted?.bulkWriteErrors?.length || 0),
        errors: formatted,
        data: inserted,
      });
    }

    res.status(error?.name === "ValidationError" ? 400 : 500).json({
      success: false,
      message: formatted.message || "Bulk import failed",
      errors: formatted,
    });
  }
};


// Get All Videos
export const getAllVideos = async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: videos.length,
      data: videos,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Get Single Video
export const getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    res.status(200).json({
      success: true,
      data: video,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Update Video
export const updateVideo = async (req, res) => {
  try {
    const updatedVideo = await Video.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Video updated successfully",
      data: updatedVideo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Delete Video
export const deleteVideo = async (req, res) => {
  try {
    await Video.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
