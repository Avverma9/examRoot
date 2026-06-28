import SavedQuestion from "../models/SavedQuestion.mjs";

// ── Toggle save/unsave a question ─────────────────────────────────────────────
// POST /api/saved-questions/toggle
export const toggleSavedQuestion = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      sourceType,
      resourceId,
      resourceTitle,
      questionIndex,
      question,
      questionHi,
      options,
      optionsHi,
      correctAnswer,
      correctAnswerHi,
      explanation,
      explanationHi,
    } = req.body;

    if (!sourceType || !resourceId || questionIndex === undefined || !question || !options) {
      return res.status(400).json({
        success: false,
        message: "sourceType, resourceId, questionIndex, question and options are required",
      });
    }

    // Check if already saved
    const existing = await SavedQuestion.findOne({ userId, resourceId, questionIndex });

    if (existing) {
      // Already saved → unsave (delete)
      await SavedQuestion.deleteOne({ _id: existing._id });
      return res.status(200).json({ success: true, saved: false, message: "Question unsaved" });
    }

    // Not saved → save
    await SavedQuestion.create({
      userId,
      sourceType,
      resourceId,
      resourceTitle: resourceTitle || "",
      questionIndex,
      question,
      questionHi: questionHi || "",
      options,
      optionsHi: optionsHi || [],
      correctAnswer: correctAnswer || "",
      correctAnswerHi: correctAnswerHi || "",
      explanation: explanation || "",
      explanationHi: explanationHi || "",
    });

    return res.status(201).json({ success: true, saved: true, message: "Question saved" });
  } catch (error) {
    // Duplicate key = already exists (race condition) → treat as saved
    if (error.code === 11000) {
      return res.status(200).json({ success: true, saved: true, message: "Already saved" });
    }
    console.error("toggleSavedQuestion error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to toggle saved question" });
  }
};

// ── Get all saved questions for user ─────────────────────────────────────────
// GET /api/saved-questions
export const getSavedQuestions = async (req, res) => {
  try {
    const userId = req.userId;
    const { sourceType, resourceId, limit = 100, skip = 0 } = req.query;

    const query = { userId };
    if (sourceType) query.sourceType = sourceType;
    if (resourceId) query.resourceId = resourceId;

    const questions = await SavedQuestion.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await SavedQuestion.countDocuments({ userId });

    res.status(200).json({ success: true, data: questions, total });
  } catch (error) {
    console.error("getSavedQuestions error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch saved questions" });
  }
};

// ── Check which questions from a resource are saved ──────────────────────────
// GET /api/saved-questions/status/:resourceId
export const getSavedStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const { resourceId } = req.params;

    const saved = await SavedQuestion.find({ userId, resourceId }, { questionIndex: 1 });
    // Return array of saved question indices for this resource
    const savedIndices = saved.map((s) => s.questionIndex);

    res.status(200).json({ success: true, savedIndices });
  } catch (error) {
    console.error("getSavedStatus error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch saved status" });
  }
};

// ── Delete a saved question ───────────────────────────────────────────────────
// DELETE /api/saved-questions/:id
export const deleteSavedQuestion = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const doc = await SavedQuestion.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });
    if (doc.userId.toString() !== userId)
      return res.status(403).json({ success: false, message: "Unauthorized" });

    await SavedQuestion.deleteOne({ _id: id });
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (error) {
    console.error("deleteSavedQuestion error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to delete" });
  }
};
