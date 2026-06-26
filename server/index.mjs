import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";
import routes from "./routes/index.mjs";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());

// ─── Raw body capture for Cashfree webhook signature verification ─────────────
// Must be registered BEFORE express.json() for the /api/payment/webhook route
app.use("/api/payment/webhook", express.raw({ type: "application/json" }), (req, _res, next) => {
  req.rawBody = req.body.toString("utf8");
  next();
});

app.use(express.json());

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

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});