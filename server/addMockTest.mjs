/**
 * addMockTest.mjs
 * ─────────────────────────────────────────────────────────────
 * Adds one practice mock test to the DB WITHOUT touching any
 * other existing data (users, tracking, etc.)
 *
 * Usage:  node addMockTest.mjs
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import MockTest from "./models/MockTest.mjs";

dotenv.config();

const q = (question, options, correctAnswer, explanation = "") => ({
  question,
  options,
  correctAnswer,
  explanation,
});

const practiceTest = {
  title: "Practice Mock Test — Mixed GK & Quant",
  description:
    "A short 10-question practice mock to verify continue-where-you-left-off tracking.",
  category: "Practice",
  duration: 15, // minutes
  isPublished: true,
  questions: [
    q(
      "Which article of the Indian Constitution abolishes untouchability?",
      ["Article 14", "Article 15", "Article 17", "Article 21"],
      "Article 17",
      "Article 17 abolishes untouchability in any form."
    ),
    q(
      "What is the SI unit of electric resistance?",
      ["Ampere", "Volt", "Ohm", "Watt"],
      "Ohm",
      "Ohm is the SI unit of resistance."
    ),
    q(
      "15% of 300 is:",
      ["30", "35", "40", "45"],
      "45",
      "15/100 × 300 = 45."
    ),
    q(
      "Capital of Australia is:",
      ["Sydney", "Melbourne", "Canberra", "Perth"],
      "Canberra",
      "Canberra is the capital, not Sydney."
    ),
    q(
      "If 12 men complete a job in 10 days, how many days for 15 men?",
      ["6", "7", "8", "9"],
      "8",
      "12×10 = 120 man-days. 120÷15 = 8."
    ),
    q(
      "Synonym of 'Eloquent' is:",
      ["Silent", "Articulate", "Confused", "Harsh"],
      "Articulate",
      "Eloquent means fluent and persuasive in speech."
    ),
    q(
      "Speed of light is approximately:",
      ["3×10⁶ m/s", "3×10⁸ m/s", "3×10¹⁰ m/s", "3×10⁴ m/s"],
      "3×10⁸ m/s",
      "Speed of light ≈ 3×10⁸ m/s in vacuum."
    ),
    q(
      "Find the odd one out: 4, 8, 12, 18, 24",
      ["4", "12", "18", "24"],
      "18",
      "All others are divisible by 4. 18 is not."
    ),
    q(
      "A train travels 360 km in 4 hours. Speed in m/s is:",
      ["20 m/s", "25 m/s", "30 m/s", "35 m/s"],
      "25 m/s",
      "Speed = 90 km/h = 90×(1000/3600) = 25 m/s."
    ),
    q(
      "Who invented the telephone?",
      ["Thomas Edison", "Nikola Tesla", "Alexander Graham Bell", "James Watt"],
      "Alexander Graham Bell",
      "Alexander Graham Bell is credited with inventing the telephone in 1876."
    ),
  ],
};

practiceTest.totalQuestions = practiceTest.questions.length;

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("❌  MONGO_URI not found in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("✅  Connected to MongoDB");

  const inserted = await MockTest.create(practiceTest);

  console.log("✅  Mock test inserted!");
  console.log("   _id   :", inserted._id.toString());
  console.log("   title :", inserted.title);
  console.log("   qs    :", inserted.totalQuestions);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌  Error:", err.message);
  mongoose.disconnect().catch(() => {});
  process.exit(1);
});
