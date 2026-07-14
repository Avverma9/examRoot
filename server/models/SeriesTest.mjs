import mongoose from "mongoose";

const seriesTestSchema = new mongoose.Schema(
  {
    seriesId: { type: mongoose.Schema.Types.ObjectId, ref: "TestSeries", required: true, index: true },
    group: { type: String, default: "", trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    duration: { type: Number, required: true },
    totalQuestions: { type: Number, default: 0 },
    isFree: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

seriesTestSchema.index({ seriesId: 1, order: 1 });
seriesTestSchema.index({ seriesId: 1, isPublished: 1, order: 1 });

export default mongoose.model("SeriesTest", seriesTestSchema);
