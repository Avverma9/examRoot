import MockTest from "../models/MockTest.mjs";
import { formatBulkError, normalizeBulkItems } from "../utils/bulk.mjs";


// Create Mock Test
export const createMockTest = async (req, res) => {
  try {
    const mockTest = await MockTest.create(req.body);

    res.status(201).json({
      success: true,
      data: mockTest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Bulk Insert Mock Tests
export const bulkCreateMockTests = async (req, res) => {
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

    const tests = await MockTest.insertMany(items, { ordered: false });

    res.status(201).json({
      success: true,
      totalInserted: tests.length,
      totalReceived: items.length,
      data: tests,
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


// Get All Mock Tests
export const getAllMockTests = async (req, res) => {
  try {
    const tests = await MockTest.find();

    res.status(200).json({
      success: true,
      data: tests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Mock Test
export const updateMockTest = async (req, res) => {
  try {
    const updated = await MockTest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({
      success: true,
      message: "Mock test updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Mock Test
export const deleteMockTest = async (req, res) => {
  try {
    await MockTest.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: "Mock test deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
