import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    questionHi: { type: String, default: "" },
    options: {
      type: [String],
      required: true,
      validate: { validator: (v) => v.length >= 2, message: "At least 2 options required" },
    },
    optionsHi: { type: [String], default: [] },
    correctAnswer: { type: String, required: true },
    correctAnswerHi: { type: String, default: "" },
    explanation: { type: String, default: "" },
    explanationHi: { type: String, default: "" },
  },
  { _id: false }
);

const testSchema = new mongoose.Schema(
  {
    group: { type: String, default: "", trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    duration: { type: Number, required: true }, // in minutes
    questions: [questionSchema],
    totalQuestions: { type: Number, default: 0 },
    isFree: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const testSeriesSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    bookName: { type: String, required: true, trim: true },
    author: { type: String, default: "" },
    publisher: { type: String, default: "" },
    subject: { type: String, required: true },
    category: { type: String, required: true },
    coverImage: { type: String, default: "" },
    thumbnail: { type: String, default: "" }, // R2 public URL for series thumbnail
    language: { type: String, default: "English" },
    isPaid: { type: Boolean, default: false },
    price: { type: Number, default: 0 },
    discountedPrice: { type: Number, default: 0 },
    totalTests: { type: Number, default: 0 },
    tests: [testSchema],
    freeTestsCount: { type: Number, default: 1 },
    tags: [{ type: String }],
    isPublished: { type: Boolean, default: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    enrolledCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

function normalizeTestItem(test, index, freeTestsCount = 1) {
  const questions = Array.isArray(test.questions) ? test.questions : [];
  return {
    ...test.toObject?.() ?? test,
    group: typeof test.group === "string" ? test.group.trim() : "",
    questions,
    totalQuestions: questions.length,
    order: test.order ?? index,
    isFree: index < (freeTestsCount || 1) ? true : !!test.isFree,
  };
}

testSeriesSchema.pre("validate", function (next) {
  if (Array.isArray(this.tests)) {
    this.tests = this.tests.map((test, index) => normalizeTestItem(test, index, this.freeTestsCount));
  } else {
    this.tests = [];
  }
  this.totalTests = Array.isArray(this.tests) ? this.tests.length : 0;
  next();
});

// Read-heavy list/index pages rely on these fields; indexes reduce query latency.
testSeriesSchema.index({ isPublished: 1, createdAt: -1 });
testSeriesSchema.index({ subject: 1, category: 1, isPaid: 1 });
testSeriesSchema.index({ title: 1, bookName: 1, author: 1 });

export default mongoose.model("TestSeries", testSeriesSchema);
