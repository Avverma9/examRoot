import TestSeries from "../models/TestSeries.mjs";
import MockTest from "../models/MockTest.mjs";
import PracticeSet from "../models/PracticeSet.mjs";
import User from "../models/User.mjs";
import { formatBulkError, normalizeBulkItems } from "../utils/bulk.mjs";
import { hasActiveSubscription } from "./paymentController.mjs";
import { v4 as uuidv4 } from "uuid";
import { getPresignedUploadUrl, deleteFromR2, keyFromUrl } from "../utils/r2.mjs";

// ─── CREATE ──────────────────────────────────────────────────────────────────
export const createTestSeries = async (req, res) => {
  try {
    const body = req.body;
    if (body.tests?.length) {
      body.totalTests = body.tests.length;
      body.tests = normalizeTests(body.tests, body.freeTestsCount);
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
      tests: normalizeTests(item.tests || [], item.freeTestsCount),
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

const ensureTestTotals = (series) => {
  if (!series || !Array.isArray(series.tests)) return series;
  series.tests = series.tests.map((test) => ({
    ...test,
    totalQuestions: Array.isArray(test.questions)
      ? test.questions.length
      : test.totalQuestions || 0,
  }));
  series.totalTests = Array.isArray(series.tests) ? series.tests.length : series.totalTests || 0;
  return series;
};

// ─── GET ALL (list — no questions) ───────────────────────────────────────────
export const getAllTestSeries = async (req, res) => {
  try {
    const { subject, category, isPaid, search, includeDrafts, includeQuestions, mode, page = 1, limit = 20 } = req.query;
    const filter = includeDrafts === "true" ? {} : { isPublished: true };

    if (subject)   filter.subject  = new RegExp(subject, "i");
    if (category)  filter.category = new RegExp(category, "i");
    if (isPaid !== undefined) filter.isPaid = isPaid === "true";
    if (search)    filter.$or = [
      { title:    new RegExp(search, "i") },
      { bookName: new RegExp(search, "i") },
      { author:   new RegExp(search, "i") },
    ];

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (safePage - 1) * safeLimit;

    let projection = "-tests.questions";
    if (mode === "summary") {
      projection = "title bookName subject category language isPaid price discountedPrice totalTests isPublished freeTestsCount createdAt updatedAt";
    }

    let query = TestSeries.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .select(projection);

    if (includeQuestions === "true" && mode !== "summary") {
      query = query.select("+tests.questions");
    }

    const [series, total] = await Promise.all([
      query.lean(),
      TestSeries.countDocuments(filter),
    ]);

    const normalized = series.map((item) => ensureTestTotals(item));
    res.status(200).json({
      success: true,
      total,
      page: safePage,
      limit: safeLimit,
      pages: Math.ceil(total / safeLimit),
      data: normalized,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET SERIES DETAIL (tests list — no questions) ───────────────────────────
export const getTestSeriesById = async (req, res) => {
  try {
    let query = TestSeries.findById(req.params.id);
    if (req.query.includeQuestions !== "true") query = query.select("-tests.questions");
    const series = await query.lean();
    if (!series) return res.status(404).json({ success: false, message: "Test series not found" });
    res.status(200).json({ success: true, data: ensureTestTotals(series) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET SINGLE TEST WITH QUESTIONS (for player) ─────────────────────────────
export const getTestById = async (req, res) => {
  try {
    // Fetch only series metadata + the matched test (positional projection)
    const series = await TestSeries.findOne({ _id: req.params.seriesId, "tests._id": req.params.testId })
      .select("isPaid discountedPrice price _id tests.$")
      .lean();

    if (!series) return res.status(404).json({ success: false, message: "Test series not found" });

    const test = (series.tests && series.tests[0]) || null;
    if (!test) return res.status(404).json({ success: false, message: "Test not found" });

    // Free series → serve all tests without any check
    if (!series.isPaid) return res.status(200).json({ success: true, data: test });

    // Free test inside a paid series → serve
    if (test.isFree) return res.status(200).json({ success: true, data: test });

    // Paid test — check active subscription
    const userId = req.userId;
    if (userId) {
      const user = await User.findById(userId).select("subscriptions").lean();
      if (user && hasActiveSubscription(user, series._id)) {
        return res.status(200).json({ success: true, data: test });
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

// ─── UPDATE ──────────────────────────────────────────────────────────────────
export const updateTestSeries = async (req, res) => {
  try {
    const body = req.body;
    if (body.tests?.length) {
      body.totalTests = body.tests.length;
      body.tests = body.tests.map((t, idx) => ({
        ...t,
        group: typeof t.group === "string" ? t.group.trim() : "",
        totalQuestions: t.questions?.length || t.totalQuestions || 0,
        order: t.order ?? idx,
      }));
    }
    const updated = await TestSeries.findByIdAndUpdate(req.params.id, body, { returnDocument: "after", runValidators: true });
    if (!updated) return res.status(404).json({ success: false, message: "Test series not found" });
    res.status(200).json({ success: true, data: updated });
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
        set[`tests.$.${field}`] = value;
      }
    }

    if (!Object.keys(set).length) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }

    const series = await TestSeries.findOneAndUpdate(
      { _id: id, "tests._id": testId },
      { $set: set },
      { returnDocument: "after", runValidators: true }
    );

    if (!series) {
      return res.status(404).json({ success: false, message: "Test series/test not found" });
    }

    const updatedTest = series.tests?.id(testId);
    return res.status(200).json({
      success: true,
      message: "Test updated successfully",
      data: updatedTest,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
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

// ─── HELPER: shuffle array (Fisher-Yates) ────────────────────────────────────
const shuffleArray = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const normalizeTests = (tests = [], freeTestsCount = 1) =>
  tests.map((t, idx) => ({
    ...t,
    group: typeof t.group === "string" ? t.group.trim() : "",
    totalQuestions: t.questions?.length || t.totalQuestions || 0,
    isFree: idx < (freeTestsCount || 1) ? true : (t.isFree || false),
    order: t.order ?? idx,
  }));

// ─── GET TESTS META (for generate modal — no questions) ──────────────────────
// GET /api/test-series/:id/tests-meta
export const getTestsMeta = async (req, res) => {
  try {
    const series = await TestSeries.findById(req.params.id).select(
      "title subject category language tests._id tests.title tests.totalQuestions tests.description"
    ).lean();
    if (!series) return res.status(404).json({ success: false, message: "Test series not found" });
    series.tests = series.tests?.map((test) => ({
      ...test,
      totalQuestions: Array.isArray(test.questions)
        ? test.questions.length
        : test.totalQuestions || 0,
    })) || [];
    res.status(200).json({ success: true, data: series });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GENERATE MOCK TEST FROM TEST SERIES ─────────────────────────────────────
// POST /api/test-series/:id/generate-mock
// Body: { title, description, category, duration, testIds[], maxQuestions, shuffle }
export const generateMockTest = async (req, res) => {
  try {
    const series = await TestSeries.findById(req.params.id);
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

    if (!title)    return res.status(400).json({ success: false, message: "title is required" });
    if (!duration) return res.status(400).json({ success: false, message: "duration is required" });

    const selectedTests = testIds?.length
      ? series.tests.filter((t) => testIds.includes(String(t._id)))
      : series.tests;

    if (!selectedTests.length)
      return res.status(400).json({ success: false, message: "No tests found for given testIds" });

    let allQuestions = selectedTests.flatMap((t) => t.questions || []);

    if (!allQuestions.length)
      return res.status(400).json({ success: false, message: "Selected tests have no questions" });

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
    const series = await TestSeries.findById(req.params.id);
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

    const selectedTests = testIds?.length
      ? series.tests.filter((t) => testIds.includes(String(t._id)))
      : series.tests;

    if (!selectedTests.length)
      return res.status(400).json({ success: false, message: "No tests found for given testIds" });

    let allQuestions = selectedTests.flatMap((t) => t.questions || []);

    if (!allQuestions.length)
      return res.status(400).json({ success: false, message: "Selected tests have no questions" });

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

    // Verify series exists
    const series = await TestSeries.findById(req.params.id);
    if (!series) {
      return res.status(404).json({ success: false, message: "Test series not found" });
    }

    // Build unique key: thumbnails/uuid-filename
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
