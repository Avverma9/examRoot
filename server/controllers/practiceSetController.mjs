import PracticeSet from "../models/PracticeSet.mjs";
import { formatBulkError, normalizeBulkItems } from "../utils/bulk.mjs";

// ─── CREATE ──────────────────────────────────────────────────────────────────
export const createPracticeSet = async (req, res) => {
  try {
    const body = req.body;
    if (body.questions?.length) body.totalQuestions = body.questions.length;

    const practice = await PracticeSet.create(body);
    res.status(201).json({ success: true, data: practice });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── BULK CREATE ─────────────────────────────────────────────────────────────
export const bulkCreatePracticeSets = async (req, res) => {
  try {
    const items = normalizeBulkItems(req.body);
    if (!items || items.length === 0)
      return res.status(400).json({ success: false, message: "No items provided" });

    // Auto-set totalQuestions
    const normalized = items.map(i => ({ ...i, totalQuestions: i.questions?.length || i.totalQuestions || 0 }));
    const practiceSets = await PracticeSet.insertMany(normalized, { ordered: false });

    res.status(201).json({ success: true, totalInserted: practiceSets.length, totalReceived: items.length, data: practiceSets });
  } catch (error) {
    const inserted = error?.insertedDocs || [];
    const formatted = formatBulkError(error);
    if (inserted.length > 0)
      return res.status(201).json({ success: true, message: "Partially succeeded", totalInserted: inserted.length, errors: formatted, data: inserted });
    res.status(500).json({ success: false, message: formatted.message || "Bulk import failed", errors: formatted });
  }
};

// ─── GET ALL (with filters) ───────────────────────────────────────────────────
export const getAllPracticeSets = async (req, res) => {
  try {
    const { subject, level, search, topic } = req.query;
    const filter = { isPublished: true };

    if (subject) filter.subject = new RegExp(subject, "i");
    if (topic)   filter.topic   = new RegExp(topic, "i");
    if (level && ["easy", "medium", "hard"].includes(level)) filter.level = level;
    if (search)  filter.$or = [{ title: new RegExp(search, "i") }, { subject: new RegExp(search, "i") }, { topic: new RegExp(search, "i") }];

    const sets = await PracticeSet.find(filter).select("-questions").sort({ createdAt: -1 });
    res.status(200).json({ success: true, total: sets.length, data: sets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET SINGLE (with questions for player) ───────────────────────────────────
export const getPracticeSetById = async (req, res) => {
  try {
    const set = await PracticeSet.findById(req.params.id);
    if (!set) return res.status(404).json({ success: false, message: "Practice set not found" });
    res.status(200).json({ success: true, data: set });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── UPDATE ──────────────────────────────────────────────────────────────────
export const updatePracticeSet = async (req, res) => {
  try {
    const body = req.body;
    if (body.questions?.length) body.totalQuestions = body.questions.length;

    const updated = await PracticeSet.findByIdAndUpdate(req.params.id, body, { returnDocument: "after", runValidators: true });
    if (!updated) return res.status(404).json({ success: false, message: "Practice set not found" });
    res.status(200).json({ success: true, message: "Updated successfully", data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── DELETE ──────────────────────────────────────────────────────────────────
export const deletePracticeSet = async (req, res) => {
  try {
    const deleted = await PracticeSet.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Practice set not found" });
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
