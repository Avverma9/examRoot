import MockTest from "../models/MockTest.mjs";
import { formatBulkError, normalizeBulkItems } from "../utils/bulk.mjs";

// ─── CREATE ──────────────────────────────────────────────────────────────────
export const createMockTest = async (req, res) => {
  try {
    const body = req.body;
    if (body.questions?.length) body.totalQuestions = body.questions.length;

    const mockTest = await MockTest.create(body);
    res.status(201).json({ success: true, data: mockTest });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── BULK CREATE ─────────────────────────────────────────────────────────────
export const bulkCreateMockTests = async (req, res) => {
  try {
    const items = normalizeBulkItems(req.body);
    if (!items || items.length === 0)
      return res.status(400).json({ success: false, message: "No items provided" });

    const normalized = items.map(i => ({ ...i, totalQuestions: i.questions?.length || i.totalQuestions || 0 }));
    const tests = await MockTest.insertMany(normalized, { ordered: false });

    res.status(201).json({ success: true, totalInserted: tests.length, totalReceived: items.length, data: tests });
  } catch (error) {
    const inserted = error?.insertedDocs || [];
    const formatted = formatBulkError(error);
    if (inserted.length > 0)
      return res.status(201).json({ success: true, message: "Partially succeeded", totalInserted: inserted.length, errors: formatted, data: inserted });
    res.status(500).json({ success: false, message: formatted.message || "Bulk import failed", errors: formatted });
  }
};

// ─── GET ALL (list — no questions for performance) ────────────────────────────
export const getAllMockTests = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { isPublished: true };

    if (category) filter.category = new RegExp(category, "i");
    if (search)   filter.$or = [{ title: new RegExp(search, "i") }, { category: new RegExp(search, "i") }];

    const tests = await MockTest.find(filter).select("-questions").sort({ createdAt: -1 });
    res.status(200).json({ success: true, total: tests.length, data: tests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET SINGLE (with questions for player) ───────────────────────────────────
export const getMockTestById = async (req, res) => {
  try {
    const test = await MockTest.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: "Mock test not found" });
    res.status(200).json({ success: true, data: test });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── UPDATE ──────────────────────────────────────────────────────────────────
export const updateMockTest = async (req, res) => {
  try {
    const body = req.body;
    if (body.questions?.length) body.totalQuestions = body.questions.length;

    const updated = await MockTest.findByIdAndUpdate(req.params.id, body, { returnDocument: "after", runValidators: true });
    if (!updated) return res.status(404).json({ success: false, message: "Mock test not found" });
    res.status(200).json({ success: true, message: "Updated successfully", data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── DELETE ──────────────────────────────────────────────────────────────────
export const deleteMockTest = async (req, res) => {
  try {
    const deleted = await MockTest.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Mock test not found" });
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
