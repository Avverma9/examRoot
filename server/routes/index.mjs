import express from "express";
import videoRoute from "./videoRoute.mjs";
import practiceRoute from "./practiceRoute.js";
import mockRoute from "./mockRoute.mjs";
import testSeriesRoute from "./testSeriesRoute.mjs";
import authRoute from "./authRoute.mjs";
import trackingRoute from "./trackingRoute.mjs";
import paymentRoute from "./paymentRoute.mjs";
import savedQuestionRoute from "./savedQuestionRoute.mjs";
import progressRoute from "./progressRoute.mjs";
import adminRoute from "./adminRoute.mjs";
import uploadRoute from "./uploadRoute.mjs";
import bannerRoute from "./bannerRoute.mjs";

const router = express.Router();

router.use("/auth",            authRoute);
router.use("/videos",          videoRoute);
router.use("/practice",        practiceRoute);
router.use("/mock",            mockRoute);
router.use("/test-series",     testSeriesRoute);
router.use("/tracking",        trackingRoute);
router.use("/payment",         paymentRoute);
router.use("/saved-questions", savedQuestionRoute);
router.use("/progress",        progressRoute);
router.use("/admin",           adminRoute);
router.use("/upload",          uploadRoute);
router.use("/banners",         bannerRoute);

export default router;
