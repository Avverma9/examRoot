import PYQPaper from "../models/PYQPaper.mjs";
import { formatBulkError, normalizeBulkItems } from "../utils/bulk.mjs";

// ─── CREATE ──────────────────────────────────────────────────────────────────
export const createPYQPaper = async (req, res) => {
  try {
    const body = req.body;
    if (body.questions?.length) body.totalQuestions = body.questions.length;
    const paper = await PYQPaper.create(body);
    res.status(201).json({ success: true, data: paper });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── BULK CREATE ─────────────────────────────────────────────────────────────
export const bulkCreatePYQPapers = async (req, res) => {
  try {
    const items = normalizeBulkItems(req.body);
    if (!items || items.length === 0)
      return res.status(400).json({ success: false, message: "No items provided" });

    const normalized = items.map(i => ({ ...i, totalQuestions: i.questions?.length || i.totalQuestions || 0 }));
    const papers = await PYQPaper.insertMany(normalized, { ordered: false });

    res.status(201).json({ success: true, totalInserted: papers.length, totalReceived: items.length, data: papers });
  } catch (error) {
    const inserted = error?.insertedDocs || [];
    const formatted = formatBulkError(error);
    if (inserted.length > 0)
      return res.status(201).json({ success: true, message: "Partially succeeded", totalInserted: inserted.length, errors: formatted, data: inserted });
    res.status(500).json({ success: false, message: formatted.message || "Bulk import failed", errors: formatted });
  }
};

// ─── GET ALL (list — no questions) ───────────────────────────────────────────
export const getAllPYQPapers = async (req, res) => {
  try {
    const { examName, year, subject, category, search } = req.query;
    const filter = { isPublished: true };

    if (examName) filter.examName = new RegExp(examName, "i");
    if (subject)  filter.subject  = new RegExp(subject, "i");
    if (category) filter.category = new RegExp(category, "i");
    if (year)     filter.year     = Number(year);
    if (search)   filter.$or = [
      { examName:   new RegExp(search, "i") },
      { paperTitle: new RegExp(search, "i") },
      { subject:    new RegExp(search, "i") },
    ];

    const papers = await PYQPaper.find(filter).select("-questions").sort({ year: -1, createdAt: -1 });
    res.status(200).json({ success: true, total: papers.length, data: papers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET DISTINCT EXAM NAMES (for filter dropdown) ───────────────────────────
export const getExamNames = async (req, res) => {
  try {
    const exams = await PYQPaper.distinct("examName", { isPublished: true });
    res.status(200).json({ success: true, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET YEARS FOR AN EXAM ────────────────────────────────────────────────────
export const getYearsByExam = async (req, res) => {
  try {
    const years = await PYQPaper.distinct("year", { examName: new RegExp(req.params.examName, "i"), isPublished: true });
    res.status(200).json({ success: true, data: years.sort((a, b) => b - a) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET SINGLE (with questions for player) ───────────────────────────────────
export const getPYQPaperById = async (req, res) => {
  try {
    const paper = await PYQPaper.findById(req.params.id);
    if (!paper) return res.status(404).json({ success: false, message: "PYQ paper not found" });
    res.status(200).json({ success: true, data: paper });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── UPDATE ──────────────────────────────────────────────────────────────────
export const updatePYQPaper = async (req, res) => {
  try {
    const body = req.body;
    if (body.questions?.length) body.totalQuestions = body.questions.length;
    const updated = await PYQPaper.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ success: false, message: "PYQ paper not found" });
    res.status(200).json({ success: true, message: "Updated successfully", data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── DELETE ──────────────────────────────────────────────────────────────────
export const deletePYQPaper = async (req, res) => {
  try {
    const deleted = await PYQPaper.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "PYQ paper not found" });
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
