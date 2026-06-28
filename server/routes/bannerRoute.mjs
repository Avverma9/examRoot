import express from "express";
import {
  getAllBanners,
  getAllBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner,
  getBannerPresignedUrl,
  reorderBanners,
} from "../controllers/bannerController.mjs";

const router = express.Router();

// Public routes (mobile fetches these)
router.get("/", getAllBanners);

// Admin routes
router.get("/admin/all", getAllBannersAdmin);
router.post("/admin", createBanner);
router.put("/admin/:id", updateBanner);
router.delete("/admin/:id", deleteBanner);
router.post("/admin/presign", getBannerPresignedUrl);
router.post("/admin/reorder", reorderBanners);

export default router;
