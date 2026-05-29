import express from "express";
import videoRoute from "./videoRoute.mjs";
import practiceRoute from "./practiceRoute.js";
import mockRoute from "./mockRoute.mjs";

const router = express.Router();

router.use("/videos", videoRoute);
router.use("/practice", practiceRoute);
router.use("/mock", mockRoute);

export default router;
