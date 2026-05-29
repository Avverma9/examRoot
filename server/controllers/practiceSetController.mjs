import PracticeSet from "../models/PracticeSet.mjs";
import { formatBulkError, normalizeBulkItems } from "../utils/bulk.mjs";


// Create Practice Set
export const createPracticeSet = async (req, res) => {
  try {
    const practice = await PracticeSet.create(req.body);

    res.status(201).json({
      success: true,
      data: practice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Bulk Insert Practice Sets
export const bulkCreatePracticeSets = async (req, res) => {
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

    const practiceSets = await PracticeSet.insertMany(items, { ordered: false });

    res.status(201).json({
      success: true,
      totalInserted: practiceSets.length,
      totalReceived: items.length,
      data: practiceSets,
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


// Get All Practice Sets
export const getAllPracticeSets = async (req, res) => {
  try {
    const sets = await PracticeSet.find();

    res.status(200).json({
      success: true,
      data: sets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Practice Set
export const updatePracticeSet = async (req, res) => {
  try {
    const updated = await PracticeSet.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({
      success: true,
      message: "Practice set updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Practice Set
export const deletePracticeSet = async (req, res) => {
  try {
    await PracticeSet.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: "Practice set deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
