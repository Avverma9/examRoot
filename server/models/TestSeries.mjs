import mongoose from "mongoose";

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
    freeTestsCount: { type: Number, default: 1 },
    tags: [{ type: String }],
    isPublished: { type: Boolean, default: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    enrolledCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Read-heavy list/index pages rely on these fields; indexes reduce query latency.
testSeriesSchema.index({ isPublished: 1, createdAt: -1 });
testSeriesSchema.index({ subject: 1, category: 1, isPaid: 1 });
testSeriesSchema.index({ title: 1, bookName: 1, author: 1 });

export default mongoose.model("TestSeries", testSeriesSchema);
