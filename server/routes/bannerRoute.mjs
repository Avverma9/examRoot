import express from "express";
import {
  getActiveBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
} from "../controllers/bannerController.mjs";

const router = express.Router();

// Mobile routes
router.get("/active", getActiveBanners);

// Admin routes
router.get("/admin/all", getAllBanners);
router.post("/admin", createBanner);
router.put("/admin/:id", updateBanner);
router.delete("/admin/:id", deleteBanner);
router.post("/admin/reorder", reorderBanners);

export default router;
