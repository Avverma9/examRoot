import mongoose from "mongoose";
import TestSeries from "../models/TestSeries.mjs";
import SeriesTest from "../models/SeriesTest.mjs";
import SeriesQuestion from "../models/SeriesQuestion.mjs";
import MockTest from "../models/MockTest.mjs";
import PracticeSet from "../models/PracticeSet.mjs";
import User from "../models/User.mjs";
import { formatBulkError, normalizeBulkItems } from "../utils/bulk.mjs";
import { hasActiveSubscription } from "./paymentController.mjs";
import { v4 as uuidv4 } from "uuid";
import { getPresignedUploadUrl, deleteFromR2, keyFromUrl } from "../utils/r2.mjs";

const toObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (typeof value === "string" && mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return null;
};

const sanitizeQuestion = (question = {}) => ({
  question: String(question.question || "").trim(),
  questionHi: String(question.questionHi || ""),
  options: Array.isArray(question.options) ? question.options.map((o) => String(o || "")) : [],
  optionsHi: Array.isArray(question.optionsHi) ? question.optionsHi.map((o) => String(o || "")) : [],
  correctAnswer: String(question.correctAnswer || ""),
  correctAnswerHi: String(question.correctAnswerHi || ""),
  explanation: String(question.explanation || ""),
  explanationHi: String(question.explanationHi || ""),
});

const toBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  if (typeof value === "number") return value !== 0;
  if (value === null || value === undefined) return fallback;
  return Boolean(value);
};

const sanitizeSeriesBody = (body = {}) => {
  const payload = { ...body };
  delete payload.tests;
  delete payload._id;
  return payload;
};

const normalizeIncomingTests = (tests = [], freeTestsCount = 1) =>
  tests.map((test, index) => ({
    ...test,
    _id: toObjectId(test?._id) || new mongoose.Types.ObjectId(),
    group: typeof test?.group === "string" ? test.group.trim() : "",
    title: String(test?.title || "").trim(),
    description: String(test?.description || ""),
    duration: Number(test?.duration) || 0,
    isFree: index < (freeTestsCount || 1) ? true : toBoolean(test?.isFree, false),
    isPublished: Object.prototype.hasOwnProperty.call(test || {}, "isPublished") ? toBoolean(test.isPublished, true) : true,
    order: Object.prototype.hasOwnProperty.call(test || {}, "order") ? Number(test.order) || 0 : index,
    hasQuestionsInPayload: Object.prototype.hasOwnProperty.call(test || {}, "questions"),
    questions: Array.isArray(test?.questions) ? test.questions.map((q) => sanitizeQuestion(q)) : [],
  }));

const groupQuestionsByTestId = (questions = []) => {
  const map = new Map();
  for (const item of questions) {
    const key = String(item.testId);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  for (const [key, values] of map.entries()) {
    values.sort((a, b) => (a.order || 0) - (b.order || 0));
    map.set(
      key,
      values.map((q) => ({
        question: q.question,
        questionHi: q.questionHi || "",
        options: q.options || [],
        optionsHi: q.optionsHi || [],
        correctAnswer: q.correctAnswer,
        correctAnswerHi: q.correctAnswerHi || "",
        explanation: q.explanation || "",
        explanationHi: q.explanationHi || "",
      }))
    );
  }
  return map;
};

const fetchSeriesTests = async (seriesId) => {
  const tests = await SeriesTest.find({ seriesId }).sort({ order: 1, createdAt: 1 }).lean();
  return tests.map((test, index) => ({
    _id: test._id,
    group: test.group || "",
    title: test.title,
    description: test.description || "",
    duration: test.duration,
    totalQuestions: Number(test.totalQuestions) || 0,
    isFree: toBoolean(test.isFree, false),
    isPublished: toBoolean(test.isPublished, true),
    order: Object.prototype.hasOwnProperty.call(test, "order") ? test.order : index,
  }));
};

const fetchSeriesTestsWithQuestions = async (seriesId) => {
  const tests = await fetchSeriesTests(seriesId);
  if (!tests.length) return [];

  const testIds = tests.map((t) => t._id);
  const questions = await SeriesQuestion.find({ seriesId, testId: { $in: testIds } })
    .sort({ testId: 1, order: 1 })
    .lean();

  const byTest = groupQuestionsByTestId(questions);

  return tests.map((test) => {
    const key = String(test._id);
    const list = byTest.get(key) || [];
    return {
      ...test,
      totalQuestions: list.length || test.totalQuestions || 0,
      questions: list,
    };
  });
};

const replaceSeriesTestsWithQuestions = async ({ seriesId, tests, freeTestsCount, existingQuestionMap = new Map() }) => {
  const normalized = normalizeIncomingTests(tests, freeTestsCount);

  const testDocs = [];
  const questionDocs = [];

  normalized.forEach((test, index) => {
    const questions = test.hasQuestionsInPayload
      ? test.questions
      : (existingQuestionMap.get(String(test._id)) || []);

    testDocs.push({
      _id: test._id,
      seriesId,
      group: test.group,
      title: test.title,
      description: test.description,
      duration: test.duration,
      totalQuestions: questions.length,
      isFree: test.isFree,
      isPublished: test.isPublished,
      order: test.order ?? index,
    });

    questions.forEach((q, qIndex) => {
      questionDocs.push({
        seriesId,
        testId: test._id,
        order: qIndex,
        ...sanitizeQuestion(q),
      });
    });
  });

  await SeriesQuestion.deleteMany({ seriesId });
  await SeriesTest.deleteMany({ seriesId });

  if (testDocs.length) await SeriesTest.insertMany(testDocs, { ordered: true });
  if (questionDocs.length) await SeriesQuestion.insertMany(questionDocs, { ordered: true });

  return testDocs;
};

const ensureSeriesShape = async (series, includeQuestions = false) => {
  if (!series) return series;

  const tests = includeQuestions
    ? await fetchSeriesTestsWithQuestions(series._id)
    : await fetchSeriesTests(series._id);

  return {
    ...series,
    tests,
    totalTests: tests.length,
  };
};

// ─── CREATE ──────────────────────────────────────────────────────────────────
export const createTestSeries = async (req, res) => {
  try {
    const body = req.body || {};
    const incomingTests = Array.isArray(body.tests) ? body.tests : [];

    const series = await TestSeries.create({
      ...sanitizeSeriesBody(body),
      totalTests: incomingTests.length,
    });

    if (incomingTests.length) {
      await replaceSeriesTestsWithQuestions({
        seriesId: series._id,
        tests: incomingTests,
        freeTestsCount: body.freeTestsCount,
      });
    }

    const reloadedSeries = await TestSeries.findById(series._id).lean();
    const fullSeries = await ensureSeriesShape(reloadedSeries, false);
    res.status(201).json({ success: true, data: fullSeries });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── BULK CREATE ─────────────────────────────────────────────────────────────
export const bulkCreateTestSeries = async (req, res) => {
  try {
    const items = normalizeBulkItems(req.body);
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "No items provided" });
    }

    const inserted = [];
    for (const item of items) {
      const tests = Array.isArray(item.tests) ? item.tests : [];
      const series = await TestSeries.create({
        ...sanitizeSeriesBody(item),
        totalTests: tests.length,
      });

      if (tests.length) {
        await replaceSeriesTestsWithQuestions({
          seriesId: series._id,
          tests,
          freeTestsCount: item.freeTestsCount,
        });
      }
      inserted.push(series);
    }

    res.status(201).json({
      success: true,
      totalInserted: inserted.length,
      totalReceived: items.length,
      data: inserted,
    });
  } catch (error) {
    const formatted = formatBulkError(error);
    res.status(500).json({ success: false, message: formatted.message || "Bulk import failed", errors: formatted });
  }
};

// ─── GET ALL (list — no questions) ───────────────────────────────────────────
export const getAllTestSeries = async (req, res) => {
  try {
    const { subject, category, isPaid, search, includeDrafts, mode, page = 1, limit = 20 } = req.query;
    const filter = includeDrafts === "true" ? {} : { isPublished: true };

    if (subject) filter.subject = new RegExp(subject, "i");
    if (category) filter.category = new RegExp(category, "i");
    if (isPaid !== undefined) filter.isPaid = isPaid === "true";
    if (search) {
      filter.$or = [
        { title: new RegExp(search, "i") },
        { bookName: new RegExp(search, "i") },
        { author: new RegExp(search, "i") },
      ];
    }

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (safePage - 1) * safeLimit;

    let projection = "-tests";
    if (mode === "summary") {
      projection = "title bookName subject category language isPaid price discountedPrice totalTests isPublished freeTestsCount createdAt updatedAt";
    }

    const [series, total] = await Promise.all([
      TestSeries.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).select(projection).lean(),
      TestSeries.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: safePage,
      limit: safeLimit,
      pages: Math.ceil(total / safeLimit),
      data: series,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET SERIES DETAIL (tests list — optional questions) ─────────────────────
export const getTestSeriesById = async (req, res) => {
  try {
    const series = await TestSeries.findById(req.params.id).lean();
    if (!series) return res.status(404).json({ success: false, message: "Test series not found" });

    const includeQuestions = req.query.includeQuestions === "true";
    const data = await ensureSeriesShape(series, includeQuestions);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET SINGLE TEST WITH QUESTIONS (for player) ─────────────────────────────
export const getTestById = async (req, res) => {
  try {
    const seriesId = toObjectId(req.params.seriesId);
    const testId = toObjectId(req.params.testId);
    if (!seriesId || !testId) {
      return res.status(400).json({ success: false, message: "Invalid series or test id" });
    }

    const series = await TestSeries.findById(seriesId)
      .select("isPaid discountedPrice price _id freeTestsCount")
      .lean();

    if (!series) return res.status(404).json({ success: false, message: "Test series not found" });

    let test = await SeriesTest.findOne({ _id: testId, seriesId }).lean();
    let questions = await SeriesQuestion.find({ seriesId, testId }).sort({ order: 1 }).lean();
    if (!test) return res.status(404).json({ success: false, message: "Test not found" });

    if (!series.isPaid || test.isFree) {
      return res.status(200).json({
        success: true,
        data: {
          ...test,
          questions: questions.map((q) => sanitizeQuestion(q)),
          totalQuestions: questions.length || test.totalQuestions || 0,
        },
      });
    }

    const userId = req.userId;
    if (userId) {
      const user = await User.findById(userId).select("subscriptions").lean();
      if (user && hasActiveSubscription(user, series._id)) {
        return res.status(200).json({
          success: true,
          data: {
            ...test,
            questions: questions.map((q) => sanitizeQuestion(q)),
            totalQuestions: questions.length || test.totalQuestions || 0,
          },
        });
      }
    }

    return res.status(403).json({
      success: false,
      message: "This test requires a paid subscription",
      requiresPurchase: true,
      seriesId: series._id,
      price: series.discountedPrice > 0 && series.discountedPrice < series.price
        ? series.discountedPrice
        : series.price,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/test-series/test/:testId
// Resolve a SeriesTest by its own id. Progress records only store resourceId,
// so Resume cannot reliably know the parent series id.
export const getStandaloneTestById = async (req, res) => {
  try {
    const testId = toObjectId(req.params.testId);
    if (!testId) return res.status(400).json({ success: false, message: "Invalid test id" });

    const test = await SeriesTest.findById(testId).lean();
    if (!test) return res.status(404).json({ success: false, message: "Test not found" });

    const series = await TestSeries.findById(test.seriesId)
      .select("isPaid discountedPrice price _id freeTestsCount")
      .lean();
    if (!series) return res.status(404).json({ success: false, message: "Test series not found" });

    if (series.isPaid && !test.isFree) {
      const user = req.userId
        ? await User.findById(req.userId).select("subscriptions").lean()
        : null;
      if (!user || !hasActiveSubscription(user, series._id)) {
        return res.status(403).json({ success: false, message: "This test requires a paid subscription", requiresPurchase: true });
      }
    }

    const questions = await SeriesQuestion.find({ seriesId: test.seriesId, testId })
      .sort({ order: 1 })
      .lean();
    return res.status(200).json({
      success: true,
      data: {
        ...test,
        questions: questions.map((q) => sanitizeQuestion(q)),
        totalQuestions: questions.length || test.totalQuestions || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch test" });
  }
};

// ─── UPDATE ──────────────────────────────────────────────────────────────────
// STRICT SAFETY RULE: this endpoint updates series-level metadata ONLY.
// It must NEVER touch SeriesTest/SeriesQuestion. Tests are exclusively
// managed via the dedicated endpoints below (addSeriesTests, updateSeriesTestMeta,
// updateSeriesTestQuestions, deleteSeriesTest). Any `tests` field in the
// request body is intentionally ignored (sanitizeSeriesBody strips it) so a
// buggy/legacy caller can never trigger a full delete-and-reinsert of every
// test/question in the series just to edit a title or price.
export const updateTestSeries = async (req, res) => {
  try {
    const body = req.body || {};
    const updateBody = sanitizeSeriesBody(body);

    const series = await TestSeries.findById(req.params.id).select("_id").lean();
    if (!series) return res.status(404).json({ success: false, message: "Test series not found" });

    const updated = await TestSeries.findByIdAndUpdate(req.params.id, updateBody, {
      returnDocument: "after",
      runValidators: true,
    }).lean();

    const shaped = await ensureSeriesShape(updated, false);
    res.status(200).json({ success: true, data: shaped });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── ADD TESTS TO EXISTING SERIES (safe append — never touches existing tests) ─
// POST /api/test-series/:id/tests/bulk
// Body: { tests: [...] }
export const addSeriesTests = async (req, res) => {
  try {
    const seriesId = toObjectId(req.params.id);
    if (!seriesId) return res.status(400).json({ success: false, message: "Invalid series id" });

    const body = req.body || {};
    const incomingTests = Array.isArray(body.tests) ? body.tests : [];
    if (!incomingTests.length) {
      return res.status(400).json({ success: false, message: "tests must be a non-empty array" });
    }

    const series = await TestSeries.findById(seriesId).select("freeTestsCount").lean();
    if (!series) return res.status(404).json({ success: false, message: "Test series not found" });

    const existingCount = await SeriesTest.countDocuments({ seriesId });
    const normalized = normalizeIncomingTests(incomingTests, 0);

    const testDocs = [];
    const questionDocs = [];

    normalized.forEach((test, index) => {
      const order = existingCount + index;
      testDocs.push({
        _id: test._id,
        seriesId,
        group: test.group,
        title: test.title,
        description: test.description,
        duration: test.duration,
        totalQuestions: test.questions.length,
        isFree: test.isFree,
        isPublished: test.isPublished,
        order,
      });

      test.questions.forEach((q, qIndex) => {
        questionDocs.push({
          seriesId,
          testId: test._id,
          order: qIndex,
          ...sanitizeQuestion(q),
        });
      });
    });

    if (testDocs.length) await SeriesTest.insertMany(testDocs, { ordered: true });
    if (questionDocs.length) await SeriesQuestion.insertMany(questionDocs, { ordered: true });

    const totalTests = await SeriesTest.countDocuments({ seriesId });
    await TestSeries.findByIdAndUpdate(seriesId, { totalTests });

    res.status(201).json({
      success: true,
      message: `Added ${testDocs.length} test(s) with ${questionDocs.length} question(s)`,
      data: { addedTests: testDocs.length, addedQuestions: questionDocs.length, totalTests },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── UPDATE SINGLE TEST META (fast path, no questions payload needed) ──────
export const updateSeriesTestMeta = async (req, res) => {
  try {
    const { id, testId } = req.params;
    const body = req.body || {};

    const allowedFields = ["group", "title", "description", "duration", "isFree", "isPublished", "order"];
    const set = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        let value = body[field];
        if (field === "group" || field === "title" || field === "description") {
          value = typeof value === "string" ? value.trim() : "";
        }
        if (field === "duration" || field === "order") {
          value = Number(value) || 0;
        }
        if (field === "isFree" || field === "isPublished") {
          value = !!value;
        }
        set[field] = value;
      }
    }

    if (!Object.keys(set).length) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }

    const seriesObjectId = toObjectId(id);
    const testObjectId = toObjectId(testId);
    if (!seriesObjectId || !testObjectId) {
      return res.status(400).json({ success: false, message: "Invalid series/test id" });
    }

    const updatedTest = await SeriesTest.findOneAndUpdate(
      { _id: testObjectId, seriesId: seriesObjectId },
      { $set: set },
      { returnDocument: "after", runValidators: true }
    ).lean();

    if (!updatedTest) {
      return res.status(404).json({ success: false, message: "Test series/test not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Test updated successfully",
      data: updatedTest,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ─── UPDATE SINGLE TEST QUESTIONS (fast path — touches only this test) ─────
// PATCH /api/test-series/:id/tests/:testId/questions
// Body: { questions: [...] }
// Replaces the question list for exactly this one test. Never touches any
// other test or question in the series.
export const updateSeriesTestQuestions = async (req, res) => {
  try {
    const seriesId = toObjectId(req.params.id);
    const testId = toObjectId(req.params.testId);
    if (!seriesId || !testId) {
      return res.status(400).json({ success: false, message: "Invalid series/test id" });
    }

    const body = req.body || {};
    if (!Array.isArray(body.questions)) {
      return res.status(400).json({ success: false, message: "questions must be an array" });
    }

    const test = await SeriesTest.findOne({ _id: testId, seriesId });
    if (!test) {
      return res.status(404).json({ success: false, message: "Test not found" });
    }

    const questionDocs = body.questions.map((q, index) => ({
      seriesId,
      testId,
      order: index,
      ...sanitizeQuestion(q),
    }));

    await SeriesQuestion.deleteMany({ seriesId, testId });
    if (questionDocs.length) await SeriesQuestion.insertMany(questionDocs, { ordered: true });

    test.totalQuestions = questionDocs.length;
    await test.save();

    return res.status(200).json({
      success: true,
      message: "Questions updated successfully",
      data: { totalQuestions: questionDocs.length },
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ─── DELETE SINGLE TEST ─────────────────────────────────────────────────────
export const deleteSeriesTest = async (req, res) => {
  try {
    const seriesId = toObjectId(req.params.seriesId);
    const testId = toObjectId(req.params.testId);

    if (!seriesId || !testId) {
      return res.status(400).json({ success: false, message: "Invalid series/test id" });
    }

    const deleted = await SeriesTest.findOneAndDelete({ _id: testId, seriesId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Test not found" });
    }

    await SeriesQuestion.deleteMany({ seriesId, testId });
    const totalTests = await SeriesTest.countDocuments({ seriesId });
    await TestSeries.findByIdAndUpdate(
      seriesId,
      {
        totalTests,
      },
      { returnDocument: "after" }
    );

    return res.status(200).json({ success: true, message: "Test deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── DELETE SERIES ───────────────────────────────────────────────────────────
export const deleteTestSeries = async (req, res) => {
  try {
    const seriesId = toObjectId(req.params.id);
    if (!seriesId) return res.status(400).json({ success: false, message: "Invalid series id" });

    const deleted = await TestSeries.findByIdAndDelete(seriesId);
    if (!deleted) return res.status(404).json({ success: false, message: "Test series not found" });

    await Promise.all([
      SeriesTest.deleteMany({ seriesId }),
      SeriesQuestion.deleteMany({ seriesId }),
    ]);

    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── HELPER: shuffle array (Fisher-Yates) ────────────────────────────────────
const shuffleArray = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ─── GET TESTS META (for generate modal — no questions) ──────────────────────
// GET /api/test-series/:id/tests-meta
export const getTestsMeta = async (req, res) => {
  try {
    const series = await TestSeries.findById(req.params.id).select(
      "title subject category language totalTests"
    ).lean();

    if (!series) return res.status(404).json({ success: false, message: "Test series not found" });

    const tests = await fetchSeriesTests(req.params.id);

    res.status(200).json({
      success: true,
      data: {
        ...series,
        tests,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GENERATE MOCK TEST FROM TEST SERIES ─────────────────────────────────────
// POST /api/test-series/:id/generate-mock
// Body: { title, description, category, duration, testIds[], maxQuestions, shuffle }
export const generateMockTest = async (req, res) => {
  try {
    const series = await TestSeries.findById(req.params.id).select("category").lean();
    if (!series) return res.status(404).json({ success: false, message: "Test series not found" });

    const {
      title,
      description = "",
      category,
      duration,
      testIds,
      maxQuestions,
      shuffle = true,
    } = req.body;

    if (!title) return res.status(400).json({ success: false, message: "title is required" });
    if (!duration) return res.status(400).json({ success: false, message: "duration is required" });

    const selectedTests = await SeriesTest.find(
      testIds?.length
        ? { seriesId: req.params.id, _id: { $in: testIds.map((id) => toObjectId(id)).filter(Boolean) } }
        : { seriesId: req.params.id }
    ).lean();

    let allQuestions = [];

    if (selectedTests.length) {
      const selectedTestIds = selectedTests.map((t) => t._id);
      const docs = await SeriesQuestion.find({ seriesId: req.params.id, testId: { $in: selectedTestIds } })
        .sort({ testId: 1, order: 1 })
        .lean();
      allQuestions = docs.map((q) => sanitizeQuestion(q));
    }

    if (!allQuestions.length) {
      return res.status(400).json({ success: false, message: "Selected tests have no questions" });
    }

    if (shuffle) allQuestions = shuffleArray(allQuestions);
    if (maxQuestions && maxQuestions > 0) allQuestions = allQuestions.slice(0, maxQuestions);

    const mockTest = await MockTest.create({
      title,
      description,
      category: category || series.category,
      duration,
      questions: allQuestions,
      totalQuestions: allQuestions.length,
      isPublished: true,
    });

    res.status(201).json({
      success: true,
      message: `Mock test created with ${allQuestions.length} questions`,
      data: mockTest,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GENERATE PRACTICE SET FROM TEST SERIES ──────────────────────────────────
// POST /api/test-series/:id/generate-practice
// Body: { title, description, subject, topic, level, testIds[], maxQuestions, shuffle, language, tags[] }
export const generatePracticeSet = async (req, res) => {
  try {
    const series = await TestSeries.findById(req.params.id).select("subject language").lean();
    if (!series) return res.status(404).json({ success: false, message: "Test series not found" });

    const {
      title,
      description = "",
      subject,
      topic = "",
      level = "medium",
      testIds,
      maxQuestions,
      shuffle = false,
      language,
      tags = [],
    } = req.body;

    if (!title) return res.status(400).json({ success: false, message: "title is required" });

    const selectedTests = await SeriesTest.find(
      testIds?.length
        ? { seriesId: req.params.id, _id: { $in: testIds.map((id) => toObjectId(id)).filter(Boolean) } }
        : { seriesId: req.params.id }
    ).lean();

    let allQuestions = [];

    if (selectedTests.length) {
      const selectedTestIds = selectedTests.map((t) => t._id);
      const docs = await SeriesQuestion.find({ seriesId: req.params.id, testId: { $in: selectedTestIds } })
        .sort({ testId: 1, order: 1 })
        .lean();
      allQuestions = docs.map((q) => sanitizeQuestion(q));
    }

    if (!allQuestions.length) {
      return res.status(400).json({ success: false, message: "Selected tests have no questions" });
    }

    if (shuffle) allQuestions = shuffleArray(allQuestions);
    if (maxQuestions && maxQuestions > 0) allQuestions = allQuestions.slice(0, maxQuestions);

    const practiceSet = await PracticeSet.create({
      title,
      description,
      subject: subject || series.subject,
      topic,
      level,
      questions: allQuestions,
      totalQuestions: allQuestions.length,
      isPublished: true,
      language: language || series.language || "English",
      tags,
    });

    res.status(201).json({
      success: true,
      message: `Practice set created with ${allQuestions.length} questions`,
      data: practiceSet,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PRESIGNED URL FOR THUMBNAIL UPLOAD ───────────────────────────────────────
// POST /api/test-series/:id/thumbnail-presign
// Body: { filename, contentType }
// Returns: { uploadUrl, publicUrl, key }
export const getThumnailPresignedUrl = async (req, res) => {
  try {
    const { filename, contentType } = req.body;

    if (!filename || !contentType) {
      return res.status(400).json({
        success: false,
        message: "filename and contentType are required",
      });
    }

    const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimes.includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid contentType. Allowed: ${allowedMimes.join(", ")}`,
      });
    }

    const series = await TestSeries.findById(req.params.id);
    if (!series) {
      return res.status(404).json({ success: false, message: "Test series not found" });
    }

    const ext = filename.split(".").pop().toLowerCase();
    const safeExt = ext.replace(/[^a-z0-9]/g, "");
    const key = `test-series-thumbnails/${uuidv4()}.${safeExt}`;

    const { uploadUrl, publicUrl } = await getPresignedUploadUrl(key, contentType);

    return res.status(200).json({
      success: true,
      uploadUrl,
      publicUrl,
      key,
    });
  } catch (error) {
    console.error("getThumnailPresignedUrl error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to generate upload URL" });
  }
};

// ─── SAVE THUMBNAIL URL ────────────────────────────────────────────────────────
// PUT /api/test-series/:id/thumbnail
// Body: { thumbnailUrl }
// Saves the R2 public URL to the database
export const saveSeriesThumbnail = async (req, res) => {
  try {
    const { thumbnailUrl } = req.body;

    if (!thumbnailUrl) {
      return res.status(400).json({ success: false, message: "thumbnailUrl is required" });
    }

    const series = await TestSeries.findByIdAndUpdate(
      req.params.id,
      { thumbnail: thumbnailUrl },
      { returnDocument: "after", runValidators: true }
    );

    if (!series) {
      return res.status(404).json({ success: false, message: "Test series not found" });
    }

    res.status(200).json({ success: true, data: series });
  } catch (error) {
    console.error("saveSeriesThumbnail error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to save thumbnail" });
  }
};

// ─── DELETE THUMBNAIL ──────────────────────────────────────────────────────────
// DELETE /api/test-series/:id/thumbnail
export const deleteSeriesThumbnail = async (req, res) => {
  try {
    const series = await TestSeries.findById(req.params.id);
    if (!series) {
      return res.status(404).json({ success: false, message: "Test series not found" });
    }

    if (series.thumbnail) {
      const key = keyFromUrl(series.thumbnail);
      if (key) {
        await deleteFromR2(key);
      }
    }

    series.thumbnail = "";
    await series.save();

    res.status(200).json({ success: true, message: "Thumbnail deleted", data: series });
  } catch (error) {
    console.error("deleteSeriesThumbnail error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to delete thumbnail" });
  }
};
