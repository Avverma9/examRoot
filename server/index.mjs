import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";
import routes from "./routes/index.mjs";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;
const allowedExactOrigins = new Set(
  [
    process.env.CORS_ORIGIN,
    process.env.FRONTEND_URL,
    process.env.PANEL_URL,
    "https://examrootpanel.vercel.app",
    "https://examroot.cc",
    "http://localhost:3000",
    "http://localhost:5173",
  ]
    .filter(Boolean)
    .map((origin) => origin.replace(/\/$/, ""))
);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  const normalizedOrigin = origin.replace(/\/$/, "");
  if (allowedExactOrigins.has(normalizedOrigin)) return true;

  try {
    const url = new URL(normalizedOrigin);
    return url.protocol === "https:" && url.hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
};

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.options("*", cors());
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }
  next();
});

// ─── Raw body capture for Cashfree webhook signature verification ─────────────
// Must be registered BEFORE express.json() for the /api/payment/webhook route
app.use("/api/payment/webhook", express.raw({ type: "application/json" }), (req, _res, next) => {
  req.rawBody = req.body.toString("utf8");
  next();
});

app.use(express.json({ limit: "50mb" }));

// Routes
app.use("/api", routes);

// MongoDB Connection
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

connectDB();

// Test Route
app.get("/", (req, res) => {
  res.send("Server is running...");
});

// Central error handler so oversized/invalid payloads return JSON instead of HTML
app.use((err, _req, res, next) => {
  if (!err) return next();

  if (err.type === "entity.too.large" || err instanceof SyntaxError && err.status === 413) {
    return res.status(413).json({
      success: false,
      message: "Request body is too large. Please reduce the JSON size or split it into smaller parts.",
    });
  }

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON syntax. Please check the pasted data and try again.",
    });
  }

  return res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
