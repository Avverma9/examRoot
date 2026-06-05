import mongoose from "mongoose";

const pyqQuestionSchema = new mongoose.Schema(
  {
    question:        { type: String, required: true, trim: true },
    questionHi:      { type: String, default: "" },
    options:         { type: [String], required: true, validate: { validator: (v) => v.length >= 2, message: "At least 2 options" } },
    optionsHi:       { type: [String], default: [] },
    correctAnswer:   { type: String, required: true },
    correctAnswerHi: { type: String, default: "" },
    explanation:     { type: String, default: "" },
    explanationHi:   { type: String, default: "" },
    topic:           { type: String, default: "" },
    difficulty:      { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  },
  { _id: false }
);

const pyqPaperSchema = new mongoose.Schema(
  {
    examName:       { type: String, required: true, trim: true },   // e.g. "UPSC CSE"
    paperTitle:     { type: String, required: true, trim: true },   // e.g. "GS Paper 1 - 2023"
    year:           { type: Number, required: true },               // e.g. 2023
    subject:        { type: String, required: true },               // e.g. "General Studies"
    category:       { type: String, required: true },               // e.g. "UPSC"
    shift:          { type: String, default: "" },                  // e.g. "Morning", "Evening"
    duration:       { type: Number, default: 120 },                 // in minutes
    totalQuestions: { type: Number, default: 0 },
    questions:      [pyqQuestionSchema],
    isPublished:    { type: Boolean, default: true },
    isFree:         { type: Boolean, default: true },
    language:       { type: String, default: "English" },
    tags:           [{ type: String }],
    downloadUrl:    { type: String, default: "" },                  // PDF download link
  },
  { timestamps: true }
);

export default mongoose.model("PYQPaper", pyqPaperSchema);
