import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: "" },
    imageUrl: { type: String, required: true }, // R2 public URL
    color: { type: String, default: "#FF6B6B" }, // Hex color for fallback
    order: { type: Number, default: 0 }, // Display order
    isActive: { type: Boolean, default: true },
    link: { type: String, default: "" }, // Optional redirect link
  },
  { timestamps: true }
);

export default mongoose.model("Banner", bannerSchema);
