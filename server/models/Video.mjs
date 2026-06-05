import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    videoTitle:   { type: String, required: true, trim: true },
    thumbnail:    { type: String, default: "" },
    videoUrl:     { type: String, required: true },
    duration:     { type: String, default: "0:00" },
    subject:      { type: String, default: "" },
    category:     { type: String, required: true },
    description:  { type: String, default: "" },
    instructor:   { type: String, default: "" },
    views:        { type: Number, default: 0 },
    likes:        { type: Number, default: 0 },
    isPublished:  { type: Boolean, default: true },
    isPremium:    { type: Boolean, default: false },
    tags:         [{ type: String }],
    language:     { type: String, default: "Hindi" },
    order:        { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Video", videoSchema);
