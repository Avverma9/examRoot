import mongoose from "mongoose";

const savedQuestionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Source type: which player did user save from
    sourceType: {
      type: String,
      enum: ["mock_test", "practice_set", "test_series"],
      required: true,
    },
    // The parent resource id (test._id, practice._id, series test _id)
    resourceId: {
      type: String,
      required: true,
    },
    resourceTitle: {
      type: String,
      default: "",
    },
    // Question data snapshot
    questionIndex: {
      type: Number,
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    questionHi: { type: String, default: "" },
    options: {
      type: [String],
      required: true,
    },
    optionsHi: { type: [String], default: [] },
    correctAnswer: { type: String, default: "" },
    correctAnswerHi: { type: String, default: "" },
    explanation: { type: String, default: "" },
    explanationHi: { type: String, default: "" },
  },
  { timestamps: true }
);

// Unique constraint: one save per user per question per resource
savedQuestionSchema.index({ userId: 1, resourceId: 1, questionIndex: 1 }, { unique: true });

export default mongoose.model("SavedQuestion", savedQuestionSchema);
