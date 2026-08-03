import cluster from "cluster";
import os from "os";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import compression from "compression";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";
import routes from "./routes/index.mjs";
import User from "./models/User.mjs";

dotenv.config();

const app = express();
// Default backend server port should be 5000; panel runs on 3000 locally
const PORT = process.env.PORT || 5000;
const WORKER_COUNT = Number(process.env.WORKER_COUNT) || os.cpus().length;
const USE_CLUSTER = process.env.USE_CLUSTER === "true" && Boolean(process.env.MONGO_URI);

app.set("trust proxy", true);

// ==============================
// CORS
// ==============================
const allowedOrigins = [
  "https://examrootpanel.vercel.app",
  "https://examroot.cc",
  "https://www.examroot.cc",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5000",
  "http://127.0.0.1:5000"
];

// Allow all origins (relaxed for frontend/panel access) and enable compression for large responses
app.use(cors());
app.use(compression());

// ==============================
// Raw Body (Cashfree Webhook)
// ==============================
app.use(
  "/api/payment/webhook",
  express.raw({ type: "application/json", limit: "200mb" }),
  (req, _res, next) => {
    req.rawBody = req.body.toString("utf8");
    next();
  }
);

// ==============================
// Body Parser
// ==============================
app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ extended: true, limit: "200mb" }));

// ==============================
// Routes
// ==============================
app.use("/api", routes);

// ==============================
// MongoDB Connection
// ==============================
async function ensureDummyTestUser() {
  try {
    const email = "test@examroot.com";
    const existing = await User.findOne({ email });
    if (existing) {
      if (!existing.hasPassword) {
        existing.password = "ExamRoot@123";
        existing.loginMethod = "email";
        await existing.save();
      }
      console.log("✅ Dummy test user exists:", email);
      return;
    }

    await User.create({
      email,
      name: "ExamRoot Test User",
      password: "ExamRoot@123",
      isVerified: true,
      loginMethod: "email",
      preferredLanguage: "en",
      lastLogin: new Date(),
    });
    console.log("✅ Created dummy test user:", email);
  } catch (error) {
    console.error("Failed to create dummy test user:", error);
  }
}

async function connectDB() {
  let uri = process.env.MONGO_URI;

  try {
    if (uri) {
      await mongoose.connect(uri);
      console.log("✅ MongoDB Connected (Atlas)");
      return;
    }
  } catch (err) {
    console.log("⚠️ Atlas failed, trying in-memory MongoDB...");
  }

  try {
    const mongod = await MongoMemoryServer.create();
    uri = mongod.getUri() + "examRoot";
    await mongoose.connect(uri);
    console.log("🧠 Using in-memory MongoDB");
  } catch (err) {
    console.log("❌ MongoDB Connection Error:", err.message);
  }
}

const bootstrap = async () => {
  await connectDB();
  await ensureDummyTestUser();
};

const startServer = async () => {
  await bootstrap();
  app.get("/", (req, res) => {
    res.send("🚀 Server is running...");
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server is running on port ${PORT} (pid: ${process.pid})`);
  });
};

if (USE_CLUSTER && cluster.isPrimary) {
  console.log(`🚀 Primary process ${process.pid} starting ${WORKER_COUNT} workers`);
  for (let i = 0; i < WORKER_COUNT; i += 1) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.warn(`⚠️ Worker ${worker.process.pid} exited with code ${code} signal ${signal}. Restarting...`);
    cluster.fork();
  });
} else {
  if (USE_CLUSTER) {
    console.log(`🧱 Worker process ${process.pid} started`);
  }
  startServer();
}

// ==============================
// Error Handler
// ==============================
// Error Handler
// ==============================
app.use((err, req, res, next) => {
  if (!err) return next();

  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message:
        "Request body is too large. Please reduce the JSON size or split it into smaller parts.",
    });
  }

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON syntax.",
    });
  }

  console.error(err);

  return res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});
