import express from "express";
import videoRoute from "./videoRoute.mjs";
import practiceRoute from "./practiceRoute.js";
import mockRoute from "./mockRoute.mjs";
import testSeriesRoute from "./testSeriesRoute.mjs";
import authRoute from "./authRoute.mjs";
import trackingRoute from "./trackingRoute.mjs";

const router = express.Router();

router.use("/auth", authRoute);
router.use("/videos", videoRoute);
router.use("/practice", practiceRoute);
router.use("/mock", mockRoute);
router.use("/test-series", testSeriesRoute);
router.use("/tracking", trackingRoute);

export default router;
