import mongoose from "mongoose";
import dotenv from "dotenv";
import Tracking from "./models/Tracking.mjs";

dotenv.config();

async function clearProgress() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error("❌ MONGO_URI not found in .env");
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log("✅ MongoDB Connected");

    // Delete only in_progress records (continue learning history)
    const result = await Tracking.deleteMany({ status: "in_progress" });
    console.log(`🗑️  Deleted ${result.deletedCount} in_progress records`);

    // Show what remains
    const completed = await Tracking.countDocuments({ status: "completed" });
    const abandoned = await Tracking.countDocuments({ status: "abandoned" });
    
    console.log(`\n📊 Remaining records:`);
    console.log(`   ✅ Completed: ${completed}`);
    console.log(`   ⏸️  Abandoned: ${abandoned}`);
    
    console.log("\n✅ Continue learning history cleared successfully!");
    console.log("⚠️  All test/question data remains intact");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error clearing progress:", error.message);
    process.exit(1);
  }
}

clearProgress();
