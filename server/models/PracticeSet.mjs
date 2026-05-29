import mongoose from "mongoose";

const practiceQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },

    options: {
      type: [String],
      required: true,
    },

    correctAnswer: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const practiceSetSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    subject: {
      type: String,
      required: true,
    },

    topic: {
      type: String,
      required: true,
    },

    totalQuestions: {
      type: Number,
      default: 0,
    },

    questions: [practiceQuestionSchema],

    level: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("PracticeSet", practiceSetSchema);