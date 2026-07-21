import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    imageUrl: { type: String, required: true },
    actionType: { 
      type: String, 
      enum: ['series', 'url', 'none'],
      default: 'none'
    },
    actionValue: { type: String, default: "" },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);

bannerSchema.index({ isActive: 1, displayOrder: 1 });
bannerSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.model("Banner", bannerSchema);
