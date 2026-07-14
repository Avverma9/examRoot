import mongoose from "mongoose";

const seriesQuestionSchema = new mongoose.Schema(
  {
    seriesId: { type: mongoose.Schema.Types.ObjectId, ref: "TestSeries", required: true, index: true },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: "SeriesTest", required: true, index: true },
    order: { type: Number, default: 0 },
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
  { timestamps: true }
);

seriesQuestionSchema.index({ testId: 1, order: 1 });
seriesQuestionSchema.index({ seriesId: 1, testId: 1, order: 1 });

export default mongoose.model("SeriesQuestion", seriesQuestionSchema);
