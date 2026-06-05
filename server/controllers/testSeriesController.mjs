import TestSeries from "../models/TestSeries.mjs";
import { formatBulkError, normalizeBulkItems } from "../utils/bulk.mjs";

// ─── CREATE ──────────────────────────────────────────────────────────────────
export const createTestSeries = async (req, res) => {
  try {
    const body = req.body;
    if (body.tests?.length) {
      body.totalTests = body.tests.length;
      body.tests = body.tests.map((t, idx) => ({
        ...t,
        totalQuestions: t.questions?.length || t.totalQuestions || 0,
        isFree: idx < (body.freeTestsCount || 1) ? true : (t.isFree || false),
        order: t.order ?? idx,
      }));
    }
    const series = await TestSeries.create(body);
    res.status(201).json({ success: true, data: series });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── BULK CREATE ─────────────────────────────────────────────────────────────
export const bulkCreateTestSeries = async (req, res) => {
  try {
    const items = normalizeBulkItems(req.body);
    if (!items || items.length === 0)
      return res.status(400).json({ success: false, message: "No items provided" });

    const normalized = items.map(item => ({
      ...item,
      totalTests: item.tests?.length || item.totalTests || 0,
      tests: (item.tests || []).map((t, idx) => ({
        ...t,
        totalQuestions: t.questions?.length || t.totalQuestions || 0,
        isFree: idx < (item.freeTestsCount || 1) ? true : (t.isFree || false),
        order: t.order ?? idx,
      })),
    }));

    const series = await TestSeries.insertMany(normalized, { ordered: false });
    res.status(201).json({ success: true, totalInserted: series.length, totalReceived: items.length, data: series });
  } catch (error) {
    const inserted = error?.insertedDocs || [];
    const formatted = formatBulkError(error);
    if (inserted.length > 0)
      return res.status(201).json({ success: true, message: "Partially succeeded", totalInserted: inserted.length, errors: formatted, data: inserted });
    res.status(500).json({ success: false, message: formatted.message || "Bulk import failed", errors: formatted });
  }
};

// ─── GET ALL (list — no questions) ───────────────────────────────────────────
export const getAllTestSeries = async (req, res) => {
  try {
    const { subject, category, isPaid, search, includeDrafts, includeQuestions } = req.query;
    const filter = includeDrafts === "true" ? {} : { isPublished: true };

    if (subject)   filter.subject  = new RegExp(subject, "i");
    if (category)  filter.category = new RegExp(category, "i");
    if (isPaid !== undefined) filter.isPaid = isPaid === "true";
    if (search)    filter.$or = [
      { title:    new RegExp(search, "i") },
      { bookName: new RegExp(search, "i") },
      { author:   new RegExp(search, "i") },
    ];

    const query = TestSeries.find(filter).sort({ createdAt: -1 });
    if (includeQuestions !== "true") query.select("-tests.questions");
    const series = await query;

    res.status(200).json({ success: true, total: series.length, data: series });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET SERIES DETAIL (tests list — no questions) ───────────────────────────
export const getTestSeriesById = async (req, res) => {
  try {
    const query = TestSeries.findById(req.params.id);
    if (req.query.includeQuestions !== "true") query.select("-tests.questions");
    const series = await query;
    if (!series) return res.status(404).json({ success: false, message: "Test series not found" });
    res.status(200).json({ success: true, data: series });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET SINGLE TEST WITH QUESTIONS (for player) ─────────────────────────────
export const getTestById = async (req, res) => {
  try {
    const series = await TestSeries.findById(req.params.seriesId);
    if (!series) return res.status(404).json({ success: false, message: "Test series not found" });

    const test = series.tests.id(req.params.testId);
    if (!test) return res.status(404).json({ success: false, message: "Test not found" });

    // Free series → serve all tests
    if (!series.isPaid) return res.status(200).json({ success: true, data: test });

    // Free test inside paid series → serve
    if (test.isFree) return res.status(200).json({ success: true, data: test });

    // Paid test — block (extend with payment/auth verification here)
    return res.status(403).json({ success: false, message: "This test requires a paid subscription", requiresPurchase: true, seriesId: series._id, price: series.discountedPrice || series.price });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── UPDATE ──────────────────────────────────────────────────────────────────
export const updateTestSeries = async (req, res) => {
  try {
    const body = req.body;
    if (body.tests?.length) {
      body.totalTests = body.tests.length;
      body.tests = body.tests.map((t, idx) => ({
        ...t,
        totalQuestions: t.questions?.length || t.totalQuestions || 0,
        order: t.order ?? idx,
      }));
    }
    const updated = await TestSeries.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ success: false, message: "Test series not found" });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── DELETE ──────────────────────────────────────────────────────────────────
export const deleteTestSeries = async (req, res) => {
  try {
    const deleted = await TestSeries.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Test series not found" });
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
