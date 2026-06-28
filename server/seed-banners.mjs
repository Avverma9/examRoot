import mongoose from "mongoose";
import dotenv from "dotenv";
import Banner from "./models/Banner.mjs";

dotenv.config();

const sampleBanners = [
  {
    title: "Welcome to ExamRoot",
    subtitle: "Your Complete Exam Preparation Platform",
    imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=400&fit=crop",
    color: "#4F46E5",
    order: 1,
    isActive: true,
    link: "",
  },
  {
    title: "50% Off on All Test Series",
    subtitle: "Limited Time Offer - Grab Now!",
    imageUrl: "https://images.unsplash.com/photo-1533750516457-a7f992034fec?w=800&h=400&fit=crop",
    color: "#DC2626",
    order: 2,
    isActive: true,
    link: "",
  },
  {
    title: "New Mock Tests Available",
    subtitle: "Practice with Latest Question Papers",
    imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop",
    color: "#059669",
    order: 3,
    isActive: true,
    link: "",
  },
];

async function seedBanners() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error("❌ MONGO_URI not found in .env");
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log("✅ MongoDB Connected");

    // Clear existing banners
    const deleteCount = await Banner.deleteMany({});
    console.log(`🗑️  Deleted ${deleteCount.deletedCount} existing banners`);

    // Insert sample banners
    const inserted = await Banner.insertMany(sampleBanners);
    console.log(`✨ Inserted ${inserted.length} sample banners:`);
    
    inserted.forEach((banner, idx) => {
      console.log(`   ${idx + 1}. ${banner.title} (Order: ${banner.order})`);
    });

    console.log("\n✅ Banner seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding banners:", error.message);
    process.exit(1);
  }
}

seedBanners();
