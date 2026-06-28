import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";
import TestSeries from "./models/TestSeries.mjs";

dotenv.config();

const inputPath = process.argv[2] || path.resolve(process.cwd(), "test.json");

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

const toSeries = (rawItems) =>
  rawItems.map((item) => ({
    title: item.title,
    description: item.description || "",
    bookName: item.bookName || item.title || "Imported Test Series",
    author: item.author || "",
    publisher: item.publisher || "",
    subject: item.subject || "General Knowledge",
    category: item.category || "General",
    language: item.language || "Hindi + English",
    isPaid: item.isPaid ?? false,
    price: item.price ?? 0,
    discountedPrice: item.discountedPrice ?? 0,
    freeTestsCount: item.freeTestsCount ?? 1,
    tags: Array.isArray(item.tags) ? item.tags : [],
    isPublished: item.isPublished ?? true,
    totalTests: Array.isArray(item.tests)
      ? item.tests.length
      : Array.isArray(item.questions)
        ? 1
        : 0,
    tests: (item.tests || (Array.isArray(item.questions) ? [item] : [])).map((test, index) => ({
      title: test.title,
      description: test.description || "",
      duration: test.duration,
      isFree: test.isFree ?? index < (item.freeTestsCount || 1),
      isPublished: test.isPublished ?? true,
      order: test.order ?? index,
      totalQuestions: test.questions?.length || test.totalQuestions || 0,
      questions: (test.questions || []).map((question) => ({
        question: question.question,
        questionHi: question.questionHi || "",
        options: question.options || [],
        optionsHi: question.optionsHi || [],
        correctAnswer: question.correctAnswer,
        correctAnswerHi: question.correctAnswerHi || "",
        explanation: question.explanation || "",
        explanationHi: question.explanationHi || "",
      })),
    })),
  }));

const main = async () => {
  const mongod = await connect();
  try {
    const raw = await fs.readFile(inputPath, "utf8");
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed) ? parsed : [parsed];
    const seriesDocs = toSeries(items);

    const inserted = await TestSeries.insertMany(seriesDocs, { ordered: false });
    console.log(`Inserted ${inserted.length} test series from ${inputPath}`);
  } finally {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
