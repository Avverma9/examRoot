import mongoose from "mongoose";
import User from "../models/User.mjs";
import Tracking from "../models/Tracking.mjs";
import Video from "../models/Video.mjs";
import MockTest from "../models/MockTest.mjs";
import PracticeSet from "../models/PracticeSet.mjs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { jsonrepair } from "jsonrepair";

const GEMINI_MODEL_NAME = String(process.env.GEMINI_MODEL || "gemini-2.0-flash-lite").trim();
const GEMINI_API_KEY = String(process.env.GEMINI_API_KEY || "").trim();

const createModel = (apiKey, modelName) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
};

const buildQuestionSchema = (targetJson, questionCount) => {
  const template = Array.isArray(targetJson) ? targetJson[0] : targetJson;
  const questionTemplate = {
    question: "",
    questionHi: "",
    options: ["", "", "", ""],
    optionsHi: ["", "", "", ""],
    correctAnswer: "",
    correctAnswerHi: "",
    explanation: "",
    explanationHi: "",
  };

  const filled = {
    ...(template || {}),
    questions: Array.from({ length: questionCount }, () => questionTemplate),
  };

  return Array.isArray(targetJson) ? [filled] : filled;
};

const extractJson = (text) => {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```json\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) return trimmed.slice(firstBrace, lastBrace + 1);
  return trimmed;
};

const safeJsonParse = (text) => {
  const candidates = [
    text,
    extractJson(text),
    extractJson(text).replace(/,\s*([}\]])/g, "$1"),
  ];

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch (_) {
      // keep trying
    }
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(jsonrepair(candidate));
    } catch (_) {
      // keep trying
    }
  }

  throw new Error(`Unable to parse Gemini JSON response. Snippet: ${String(text).slice(0, 180)}`);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withTimeout = async (promiseFactory, ms, message = "Gemini request timed out") => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });
  try {
    return await Promise.race([promiseFactory(), timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const generateWithRetry = async (model, payload, retries = 2) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await withTimeout(
        () => model.generateContent(payload),
        120000,
      );
    } catch (error) {
      lastError = error;
      const retryable = [429, 500, 503].includes(error?.status) || /timeout/i.test(error?.message || "");
      if (!retryable || attempt === retries) break;
      await sleep(750 * (attempt + 1));
    }
  }
  throw lastError;
};

const generateOnce = async ({ payload, retries = 2 }) => {
  const model = createModel(GEMINI_API_KEY, GEMINI_MODEL_NAME);
  return generateWithRetry(model, payload, retries);
};

const repairMalformedJson = async (model, rawText, templateJson) => {
  const repairPrompt = `
You are a JSON repair tool.
Fix the malformed JSON below and return ONLY valid JSON.
Do not change the intended structure.
Keep the output matching this template shape:
${JSON.stringify(templateJson, null, 2)}

Malformed JSON:
${rawText}
`.trim();

  const repairResult = await generateWithRetry(model, {
    contents: [
      {
        role: "user",
        parts: [{ text: repairPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
      maxOutputTokens: 8192,
    },
  });

  return repairResult?.response?.text?.() || repairResult?.response?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "{}";
};

const generateBatchPrompt = ({
  template,
  batchSize,
  startIndex,
  endIndex,
  sourceText,
}) => `
You are generating structured exam questions.
Return ONLY valid JSON.

Use this source material:
${sourceText?.trim() ? sourceText.trim() : "[No source text provided - infer from image]"}

Rules:
- Match the shape of the provided target JSON exactly, including whether it is an array or object.
- Generate exactly ${batchSize} questions for question numbers ${startIndex} to ${endIndex}.
- Keep output concise, accurate, and directly based on source material.
- If target JSON has Hindi fields, include them too.
- Preserve the top-level structure from the template.
- Make sure options are unique and correctAnswer matches one of the options.
- Do not include questions outside the requested range.
- Return only machine-readable JSON, no markdown, no commentary.

Target JSON template:
${JSON.stringify(template, null, 2)}
`.trim();

const generateQuestionsChunk = async ({ model, base64Data, mimeType, template, batchSize, startIndex, endIndex, sourceText = "", tries = 1 }) => {
  const prompt = generateBatchPrompt({ template, batchSize, startIndex, endIndex, sourceText });
  const result = await generateWithRetry(model, {
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
      maxOutputTokens: 8192,
    },
  }, tries);

  const text = result?.response?.text?.() || result?.response?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "{}";
  try {
    return safeJsonParse(text);
  } catch {
    const repairedText = await repairMalformedJson(model, text, template);
    return safeJsonParse(repairedText);
  }
};

// ── GET /api/admin/stats  (summary card numbers) ──────────────────────────────
export const getAdminStats = async (req, res) => {
  try {
    const now       = new Date();
    const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7     = new Date(today); last7.setDate(today.getDate() - 6);
    const last30    = new Date(today); last30.setDate(today.getDate() - 29);

    const [
      totalUsers,
      activeToday,
      activeLast7,
      testsAttempted,
      practiceAttempted,
      videosWatched,
      totalVideoViews,
      avgAccuracyResult,
    ] = await Promise.all([
      // total registered users
      User.countDocuments(),

      // users active today (any completed tracking)
      Tracking.distinct("userId", { updatedAt: { $gte: today }, status: "completed" })
        .then((arr) => arr.length),

      // users active last 7 days
      Tracking.distinct("userId", { updatedAt: { $gte: last7 }, status: "completed" })
        .then((arr) => arr.length),

      // total mock/series tests attempted (completed)
      Tracking.countDocuments({
        resourceType: { $in: ["mock_test", "test_series"] },
        status: "completed",
      }),

      // total practice sets completed
      Tracking.countDocuments({
        resourceType: "practice_set",
        status: "completed",
      }),

      // total video watches (tracking records)
      Tracking.countDocuments({ resourceType: "video", status: "completed" }),

      // sum of all video view counts
      Video.aggregate([{ $group: { _id: null, total: { $sum: "$views" } } }])
        .then((r) => r[0]?.total ?? 0),

      // platform average accuracy across all completed tests
      Tracking.aggregate([
        {
          $match: {
            resourceType: { $in: ["mock_test", "test_series"] },
            status: "completed",
            accuracy: { $ne: null },
          },
        },
        { $group: { _id: null, avg: { $avg: "$accuracy" } } },
      ]).then((r) => r[0]?.avg ?? 0),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeToday,
        activeLast7,
        testsAttempted,
        practiceAttempted,
        videosWatched,
        totalVideoViews,
        avgAccuracy: Math.round(avgAccuracyResult * 10) / 10,
      },
    });
  } catch (err) {
    console.error("getAdminStats error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/admin/activity?days=30  (daily activity chart data) ──────────────
export const getDailyActivity = async (req, res) => {
  try {
    const days      = Math.min(parseInt(req.query.days) || 30, 90);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const raw = await Tracking.aggregate([
      {
        $match: {
          status: "completed",
          updatedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
            type: "$resourceType",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    // Build a complete date range so chart has no gaps
    const dateMap = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dateMap[key] = { date: key, mock_test: 0, practice_set: 0, video: 0, test_series: 0, total: 0 };
    }

    raw.forEach(({ _id, count }) => {
      if (dateMap[_id.date]) {
        dateMap[_id.date][_id.type] = (dateMap[_id.date][_id.type] || 0) + count;
        dateMap[_id.date].total     += count;
      }
    });

    res.status(200).json({ success: true, data: Object.values(dateMap) });
  } catch (err) {
    console.error("getDailyActivity error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/admin/top-content  (most viewed/attempted content) ───────────────
export const getTopContent = async (req, res) => {
  try {
    const [topVideos, topTests, topPractice] = await Promise.all([
      // Top videos by view count
      Video.find({ isPublished: true })
        .sort({ views: -1 })
        .limit(5)
        .select("videoTitle category views"),

      // Top mock tests by attempts in Tracking
      Tracking.aggregate([
        { $match: { resourceType: { $in: ["mock_test", "test_series"] }, status: "completed" } },
        { $group: { _id: "$resourceId", title: { $first: "$resourceTitle" }, attempts: { $sum: 1 }, avgAccuracy: { $avg: "$accuracy" } } },
        { $sort: { attempts: -1 } },
        { $limit: 5 },
      ]),

      // Top practice sets by completions
      Tracking.aggregate([
        { $match: { resourceType: "practice_set", status: "completed" } },
        { $group: { _id: "$resourceId", title: { $first: "$resourceTitle" }, completions: { $sum: 1 } } },
        { $sort: { completions: -1 } },
        { $limit: 5 },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: { topVideos, topTests, topPractice },
    });
  } catch (err) {
    console.error("getTopContent error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/admin/user-growth?days=30  (new user registrations per day) ──────
export const getUserGrowth = async (req, res) => {
  try {
    const days      = Math.min(parseInt(req.query.days) || 30, 90);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const raw = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          newUsers: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill gaps
    const dateMap = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dateMap[key] = { date: key, newUsers: 0 };
    }
    raw.forEach(({ _id, newUsers }) => {
      if (dateMap[_id]) dateMap[_id].newUsers = newUsers;
    });

    res.status(200).json({ success: true, data: Object.values(dateMap) });
  } catch (err) {
    console.error("getUserGrowth error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const generateQuestionsFromImage = async (req, res) => {
  try {
  const { imageBase64, imageName, targetJson, questionCount, sourceText } = req.body || {};

    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "No Gemini API key found",
        attempts: [],
      });
    }

    if (!imageBase64) {
      if (!sourceText || !String(sourceText).trim()) {
        return res.status(400).json({ success: false, message: "Image or sourceText is required" });
      }
    }

    const count = Number(questionCount);
    if (!Number.isInteger(count) || count <= 0) {
      return res.status(400).json({ success: false, message: "Question count must be a positive number" });
    }

    const parsedTarget = targetJson && typeof targetJson === "object" ? targetJson : {};
    const base64Data = typeof imageBase64 === "string" && imageBase64.includes(",")
      ? imageBase64.split(",")[1]
      : (typeof imageBase64 === "string" ? imageBase64 : "");
    const mimeType = imageName?.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
    const fullTemplate = buildQuestionSchema(parsedTarget, count);
    const templateRoot = Array.isArray(fullTemplate) ? fullTemplate[0] : fullTemplate;
    const batchSize = Math.min(10, count);
    const totalBatches = Math.ceil(count / batchSize);
    const allQuestions = [];
    const attempts = [];

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex += 1) {
      const startIndex = batchIndex * batchSize + 1;
      const endIndex = Math.min(count, startIndex + batchSize - 1);
      const currentBatchSize = endIndex - startIndex + 1;
      const batchTemplate = Array.isArray(fullTemplate)
        ? [{ ...templateRoot, questions: Array.from({ length: currentBatchSize }, () => ({ ...templateRoot.questions?.[0] })) }]
        : { ...templateRoot, questions: Array.from({ length: currentBatchSize }, () => ({ ...templateRoot.questions?.[0] })) };

      let batchData = null;
      let lastBatchError = null;

      try {
        const payloadParts = [{ text: generateBatchPrompt({ template: batchTemplate, batchSize: currentBatchSize, startIndex, endIndex, sourceText }) }];
        if (base64Data) {
          payloadParts.push({
            inlineData: {
              mimeType,
              data: base64Data,
            },
          });
        }

        const payload = {
          contents: [
            {
              role: "user",
              parts: payloadParts,
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
            maxOutputTokens: 8192,
          },
        };

        const generated = await generateOnce({ payload });
        attempts.push({
          key: "GEMINI_API_KEY",
          model: GEMINI_MODEL_NAME,
          batch: `${startIndex}-${endIndex}`,
          status: "success",
        });

        const text = generated?.response?.text?.() || generated?.response?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "{}";
        try {
          batchData = safeJsonParse(text);
        } catch {
          const repairedText = await repairMalformedJson(
            createModel(GEMINI_API_KEY, GEMINI_MODEL_NAME),
            text,
            batchTemplate
          );
          batchData = safeJsonParse(repairedText);
        }
      } catch (error) {
        lastBatchError = error;
        attempts.push({
          key: "GEMINI_API_KEY",
          model: GEMINI_MODEL_NAME,
          batch: `${startIndex}-${endIndex}`,
          status: "failed",
          message: error?.message || "Unknown Gemini error",
        });
      }

      if (!batchData) {
        const err = new Error(lastBatchError?.message || "Gemini request failed");
        err.attempts = attempts;
        throw err;
      }

      const batchRoot = Array.isArray(batchData) ? batchData[0] : batchData;
      const batchQuestions = Array.isArray(batchRoot?.questions) ? batchRoot.questions : [];
      allQuestions.push(...batchQuestions);
    }

    const data = Array.isArray(fullTemplate)
      ? [{ ...templateRoot, questions: allQuestions.slice(0, count) }]
      : { ...templateRoot, questions: allQuestions.slice(0, count) };

    return res.status(200).json({
      success: true,
      data,
      attempts,
      modelCandidates: [GEMINI_MODEL_NAME],
    });
  } catch (error) {
    console.error("generateQuestionsFromImage error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate questions",
      attempts: error?.attempts || [],
    });
  }
};
