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

const mockTestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      required: true,
    },

    totalQuestions: {
      type: Number,
      default: 0,
    },

    duration: {
      type: Number, // in minutes
      required: true,
    },

    questions: [questionSchema],

    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("MockTest", mockTestSchema);