import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";
import TestSeries from "./models/TestSeries.mjs";
import SeriesTest from "./models/SeriesTest.mjs";
import SeriesQuestion from "./models/SeriesQuestion.mjs";

dotenv.config();

const inputPath = process.argv[2] || path.resolve(process.cwd(), "test.json");

const toObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (typeof value === "string" && mongoose.Types.ObjectId.isValid(value)) return new mongoose.Types.ObjectId(value);
  if (value && typeof value === "object" && typeof value.$oid === "string" && mongoose.Types.ObjectId.isValid(value.$oid)) {
    return new mongoose.Types.ObjectId(value.$oid);
  }
  return null;
};

const connect = async () => {
  let uri = process.env.MONGO_URI;
  if (uri) {
    await mongoose.connect(uri);
    return null;
  }

  const mongod = await MongoMemoryServer.create();
  uri = mongod.getUri();
  await mongoose.connect(uri);
  return mongod;
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

const toTests = (item) => {
  if (Array.isArray(item.tests)) return item.tests;
  if (Array.isArray(item.questions)) return [item];
  return [];
};

const main = async () => {
  const mongod = await connect();
  try {
    const raw = await fs.readFile(inputPath, "utf8");
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed) ? parsed : [parsed];

    await Promise.all([
      SeriesQuestion.deleteMany({}),
      SeriesTest.deleteMany({}),
      TestSeries.deleteMany({}),
    ]);

    let seriesCount = 0;
    let testsCount = 0;
    let questionsCount = 0;

    for (const item of items) {
      const seriesId = toObjectId(item._id) || new mongoose.Types.ObjectId();
      const sourceTests = toTests(item);

      const series = await TestSeries.create({
        _id: seriesId,
        title: item.title,
        description: item.description || "",
        bookName: item.bookName || item.title || "Imported Test Series",
        author: item.author || "",
        publisher: item.publisher || "",
        subject: item.subject || "General Knowledge",
        category: item.category || "General",
        coverImage: item.coverImage || "",
        thumbnail: item.thumbnail || "",
        language: item.language || "Hindi + English",
        isPaid: item.isPaid ?? false,
        price: item.price ?? 0,
        discountedPrice: item.discountedPrice ?? 0,
        totalTests: sourceTests.length,
        freeTestsCount: item.freeTestsCount ?? 1,
        tags: Array.isArray(item.tags) ? item.tags : [],
        isPublished: item.isPublished ?? true,
      });

      const testDocs = [];
      const questionDocs = [];

      sourceTests.forEach((test, testIndex) => {
        const testId = toObjectId(test._id) || new mongoose.Types.ObjectId();
        const questions = Array.isArray(test.questions) ? test.questions.map((q) => sanitizeQuestion(q)) : [];

        testDocs.push({
          _id: testId,
          seriesId: series._id,
          group: typeof test.group === "string" ? test.group.trim() : "",
          title: test.title || `Test ${testIndex + 1}`,
          description: test.description || "",
          duration: Number(test.duration) || 0,
          totalQuestions: questions.length,
          isFree: Object.prototype.hasOwnProperty.call(test, "isFree")
            ? !!test.isFree
            : testIndex < (series.freeTestsCount || 1),
          isPublished: Object.prototype.hasOwnProperty.call(test, "isPublished") ? !!test.isPublished : true,
          order: Object.prototype.hasOwnProperty.call(test, "order") ? Number(test.order) || 0 : testIndex,
        });

        questions.forEach((q, qIndex) => {
          questionDocs.push({
            seriesId: series._id,
            testId,
            order: qIndex,
            ...q,
          });
        });
      });

      if (testDocs.length) await SeriesTest.insertMany(testDocs, { ordered: true });
      if (questionDocs.length) await SeriesQuestion.insertMany(questionDocs, { ordered: true });

      seriesCount += 1;
      testsCount += testDocs.length;
      questionsCount += questionDocs.length;
    }

    console.log(`Imported ${seriesCount} series, ${testsCount} tests, ${questionsCount} questions from ${inputPath}`);
  } finally {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
