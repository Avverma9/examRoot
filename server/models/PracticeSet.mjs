import mongoose from "mongoose";

const practiceQuestionSchema = new mongoose.Schema(
  {
    question:      { type: String, required: true, trim: true },
    questionHi:    { type: String, default: "" },
    options:       { type: [String], required: true, validate: { validator: (v) => v.length >= 2, message: "At least 2 options required" } },
    optionsHi:     { type: [String], default: [] },
    correctAnswer: { type: String, required: true },
    correctAnswerHi: { type: String, default: "" },
    explanation:   { type: String, default: "" },
    explanationHi: { type: String, default: "" },
  },
  { _id: false }
);

const practiceSetSchema = new mongoose.Schema(
  {
    title:          { type: String, required: true, trim: true },
    subject:        { type: String, required: true, trim: true },
    topic:          { type: String, default: "" },
    description:    { type: String, default: "" },
    level:          { type: String, enum: ["easy", "medium", "hard"], default: "easy" },
    totalQuestions: { type: Number, default: 0 },
    questions:      [practiceQuestionSchema],
    isPublished:    { type: Boolean, default: true },
    language:       { type: String, default: "English" },
    tags:           [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model("PracticeSet", practiceSetSchema);
