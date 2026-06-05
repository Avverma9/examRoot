import mongoose from "mongoose";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";
import MockTest from "./models/MockTest.mjs";
import PracticeSet from "./models/PracticeSet.mjs";
import TestSeries from "./models/TestSeries.mjs";
import Video from "./models/Video.mjs";
import User from "./models/User.mjs";
import Tracking from "./models/Tracking.mjs";
import PYQPaper from "./models/PYQPaper.mjs";

dotenv.config();

const question = (text, options, correctAnswer, explanation = "", extra = {}) => ({
  question: text,
  options,
  correctAnswer,
  explanation,
  ...extra,
});

const withTotalQuestions = (item) => ({
  ...item,
  totalQuestions: item.questions?.length || 0,
});

const videos = [
  {
    videoTitle: "SSC CGL Complete Strategy",
    thumbnail: "https://picsum.photos/seed/ssc-strategy/640/360",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    duration: "15:30",
    subject: "Exam Strategy",
    category: "SSC",
    description: "Complete preparation strategy for SSC CGL aspirants.",
    instructor: "ExamRoot Faculty",
    views: 12500,
    likes: 830,
    tags: ["ssc", "strategy", "cgl"],
    language: "Hindi",
    order: 1,
  },
  {
    videoTitle: "Percentage Tricks for Exams",
    thumbnail: "https://picsum.photos/seed/percentage-tricks/640/360",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    duration: "22:45",
    subject: "Mathematics",
    category: "Quant",
    description: "Fast percentage methods for SSC, Banking, and RRB.",
    instructor: "Amit Sir",
    views: 34000,
    likes: 2120,
    tags: ["maths", "percentage"],
    language: "Hindi",
    order: 2,
  },
  {
    videoTitle: "English Grammar: Tenses",
    thumbnail: "https://picsum.photos/seed/english-tenses/640/360",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    duration: "18:20",
    subject: "English",
    category: "Grammar",
    description: "All major tense rules with examples.",
    instructor: "Neha Ma'am",
    views: 21000,
    likes: 1560,
    tags: ["english", "grammar"],
    language: "English",
    order: 3,
  },
  {
    videoTitle: "Reasoning: Blood Relations",
    thumbnail: "https://picsum.photos/seed/blood-relations/640/360",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    duration: "12:40",
    subject: "Reasoning",
    category: "Reasoning",
    description: "Simple diagram method for blood relation questions.",
    instructor: "Ravi Sir",
    views: 18900,
    likes: 980,
    tags: ["reasoning", "blood relation"],
    language: "Hindi",
    order: 4,
  },
  {
    videoTitle: "Polity: Constitution Basics",
    thumbnail: "https://picsum.photos/seed/polity-basics/640/360",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    duration: "33:20",
    subject: "General Studies",
    category: "UPSC",
    description: "Fundamental rights, duties, and directive principles.",
    instructor: "ExamRoot GS Team",
    views: 38900,
    likes: 3010,
    tags: ["polity", "constitution"],
    language: "Hindi",
    order: 5,
  },
];

const mockTests = [
  withTotalQuestions({
    title: "SSC CGL Tier 1 Full Mock",
    description: "Complete SSC CGL style mock test with mixed sections.",
    category: "SSC",
    duration: 60,
    questions: [
      question("What is 15% of 200?", ["20", "25", "30", "35"], "30", "15% of 200 = 30."),
      question("Who wrote the Indian National Anthem?", ["Rabindranath Tagore", "Bankim Chandra", "Subhash Bose", "Mahatma Gandhi"], "Rabindranath Tagore", "Jana Gana Mana was written by Rabindranath Tagore."),
      question("Find the next number: 2, 4, 8, 16, ?", ["24", "28", "32", "36"], "32", "Each term is multiplied by 2."),
      question("Synonym of 'Abundant' is:", ["Scarce", "Plentiful", "Rare", "Empty"], "Plentiful", "Abundant means available in large quantity."),
      question("Which planet is called the Red Planet?", ["Venus", "Mars", "Jupiter", "Saturn"], "Mars", "Mars looks reddish because of iron oxide on its surface."),
      question("If a train travels 300 km in 5 hours, its speed is:", ["50 km/h", "55 km/h", "60 km/h", "65 km/h"], "60 km/h", "Speed = distance/time = 300/5 = 60 km/h."),
    ],
  }),
  withTotalQuestions({
    title: "Banking PO Quant Mock",
    description: "Quantitative aptitude mock test for banking exams.",
    category: "Banking",
    duration: 45,
    questions: [
      question("Simple interest on Rs. 5000 at 10% for 2 years is:", ["Rs. 500", "Rs. 750", "Rs. 1000", "Rs. 1250"], "Rs. 1000", "SI = PRT/100 = 5000*10*2/100 = 1000."),
      question("If 8 men complete work in 12 days, 6 men complete it in:", ["14", "16", "18", "20"], "16", "Total work = 8*12 = 96 man-days. 96/6 = 16."),
      question("LCM of 12, 18 and 24 is:", ["36", "48", "72", "96"], "72", "Prime factorization gives LCM 72."),
      question("A shopkeeper sells at 20% profit. CP is Rs. 250. SP is:", ["Rs. 280", "Rs. 290", "Rs. 300", "Rs. 310"], "Rs. 300", "SP = 250*1.2 = 300."),
      question("Average of five numbers is 40. Four numbers average 35. Removed number is:", ["55", "60", "65", "70"], "60", "5-number sum = 200, 4-number sum = 140, removed = 60."),
    ],
  }),
  withTotalQuestions({
    title: "General Science Mini Mock",
    description: "Science questions for SSC, RRB and state exams.",
    category: "Science",
    duration: 30,
    questions: [
      question("Unit of electric current is:", ["Volt", "Watt", "Ampere", "Ohm"], "Ampere", "Ampere is the SI unit of electric current."),
      question("Chemical formula of water is:", ["HO", "H2O", "H2O2", "HO2"], "H2O", "Water contains two hydrogen atoms and one oxygen atom."),
      question("Which organ filters blood?", ["Heart", "Liver", "Kidney", "Lungs"], "Kidney", "Kidneys remove waste products from blood."),
      question("Vitamin produced by sunlight exposure is:", ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"], "Vitamin D", "Skin synthesizes Vitamin D in sunlight."),
    ],
  }),
];

const practiceSets = [
  withTotalQuestions({
    title: "Percentage Basics",
    subject: "Mathematics",
    topic: "Percentage",
    description: "Beginner level percentage practice.",
    level: "easy",
    language: "English",
    tags: ["maths", "percentage"],
    questions: [
      question("Find 20% of 500.", ["80", "100", "120", "150"], "100", "20% of 500 = 100."),
      question("35% of 400 is:", ["120", "130", "140", "150"], "140", "400*35/100 = 140."),
      question("If 25% of a number is 75, the number is:", ["200", "250", "300", "350"], "300", "Number = 75*100/25 = 300."),
      question("A price increased from 200 to 250. Increase percentage is:", ["20%", "25%", "30%", "35%"], "25%", "Increase = 50. 50/200*100 = 25%."),
    ],
  }),
  withTotalQuestions({
    title: "Profit and Loss Practice",
    subject: "Mathematics",
    topic: "Profit and Loss",
    description: "Common profit-loss exam questions.",
    level: "medium",
    language: "English",
    tags: ["maths", "profit loss"],
    questions: [
      question("CP = Rs. 100 and SP = Rs. 120. Profit percent is:", ["10%", "15%", "20%", "25%"], "20%", "Profit = 20. Profit% = 20/100*100."),
      question("Marked price Rs. 500, discount 10%. Selling price is:", ["Rs. 400", "Rs. 450", "Rs. 475", "Rs. 490"], "Rs. 450", "SP = 500 - 10% = 450."),
      question("CP = Rs. 200, loss = 10%. SP is:", ["Rs. 160", "Rs. 170", "Rs. 180", "Rs. 190"], "Rs. 180", "SP = 200*0.9 = 180."),
      question("SP = Rs. 660, profit = 10%. CP is:", ["Rs. 580", "Rs. 590", "Rs. 600", "Rs. 610"], "Rs. 600", "CP = 660/1.1 = 600."),
    ],
  }),
  withTotalQuestions({
    title: "English Tenses Drill",
    subject: "English",
    topic: "Tenses",
    description: "Practice tense selection in simple sentences.",
    level: "easy",
    language: "English",
    tags: ["english", "grammar"],
    questions: [
      question("He ___ to school daily.", ["go", "goes", "going", "gone"], "goes", "Singular subject takes 'goes'."),
      question("They ___ playing cricket now.", ["is", "are", "was", "were"], "are", "They is plural, so use 'are'."),
      question("She ___ her homework yesterday.", ["complete", "completes", "completed", "completing"], "completed", "Yesterday indicates simple past."),
      question("I ___ never seen the Taj Mahal.", ["have", "has", "had", "having"], "have", "Use 'have' with I in present perfect."),
    ],
  }),
  withTotalQuestions({
    title: "Reasoning Series",
    subject: "Reasoning",
    topic: "Number Series",
    description: "Pattern based reasoning questions.",
    level: "medium",
    language: "English",
    tags: ["reasoning", "series"],
    questions: [
      question("2, 4, 8, 16, ?", ["24", "28", "32", "36"], "32", "Multiply by 2."),
      question("1, 4, 9, 16, 25, ?", ["30", "34", "36", "40"], "36", "These are square numbers."),
      question("1, 1, 2, 3, 5, 8, ?", ["11", "12", "13", "14"], "13", "Fibonacci series."),
      question("A, C, E, G, ?", ["H", "I", "J", "K"], "I", "Alternate letters."),
    ],
  }),
];

const pyqPapers = [
  withTotalQuestions({
    examName: "SSC CGL",
    paperTitle: "Tier 1 Previous Year Paper",
    year: 2023,
    subject: "General Aptitude",
    category: "SSC",
    shift: "Morning",
    duration: 60,
    language: "English",
    tags: ["ssc", "pyq"],
    questions: mockTests[0].questions.slice(0, 4),
  }),
  withTotalQuestions({
    examName: "IBPS PO",
    paperTitle: "Quant Previous Year Paper",
    year: 2022,
    subject: "Quantitative Aptitude",
    category: "Banking",
    shift: "Evening",
    duration: 45,
    language: "English",
    tags: ["banking", "pyq"],
    questions: mockTests[1].questions.slice(0, 4),
  }),
];

const testSeries = [
  {
    title: "SSC Maths Book Test Series",
    description: "Book based chapter-wise tests for SSC maths practice.",
    bookName: "SSC Mathematics Practice Book",
    author: "ExamRoot Faculty",
    publisher: "ExamRoot Publications",
    subject: "Mathematics",
    category: "SSC",
    coverImage: "https://picsum.photos/seed/ssc-book/400/600",
    language: "English",
    isPaid: true,
    price: 299,
    discountedPrice: 199,
    freeTestsCount: 1,
    tags: ["ssc", "maths", "book"],
    rating: 4.5,
    enrolledCount: 1240,
    tests: [
      withTotalQuestions({
        title: "Percentage Chapter Test",
        description: "Questions from percentage chapter.",
        duration: 35,
        isFree: true,
        order: 0,
        questions: practiceSets[0].questions,
      }),
      withTotalQuestions({
        title: "Profit and Loss Chapter Test",
        description: "Questions from profit and loss chapter.",
        duration: 35,
        isFree: false,
        order: 1,
        questions: practiceSets[1].questions,
      }),
    ],
  },
  {
    title: "Banking Quant Test Series",
    description: "Topic-wise quant tests for banking prelims.",
    bookName: "Banking Quant Booster",
    author: "ExamRoot Banking Team",
    publisher: "ExamRoot Publications",
    subject: "Quantitative Aptitude",
    category: "Banking",
    coverImage: "https://picsum.photos/seed/banking-book/400/600",
    language: "English",
    isPaid: false,
    price: 0,
    discountedPrice: 0,
    freeTestsCount: 2,
    tags: ["banking", "quant"],
    rating: 4.2,
    enrolledCount: 860,
    tests: [
      withTotalQuestions({
        title: "Banking Quant Mini Test",
        description: "Mixed quant questions for banking.",
        duration: 30,
        isFree: true,
        order: 0,
        questions: mockTests[1].questions,
      }),
    ],
  },
].map((series) => ({
  ...series,
  totalTests: series.tests.length,
}));

const users = [
  {
    email: "demo@examroot.test",
    name: "Demo Student",
    phone: "9999999999",
    isVerified: true,
    lastLogin: new Date(),
    totalMockTestsTaken: 2,
    totalPracticeSetsTaken: 3,
    accuracy: 78,
    preferredLanguage: "en",
  },
  {
    email: "hindi@examroot.test",
    name: "Hindi Learner",
    phone: "8888888888",
    isVerified: true,
    lastLogin: new Date(),
    totalMockTestsTaken: 1,
    totalPracticeSetsTaken: 2,
    accuracy: 72,
    preferredLanguage: "hi",
  },
];

async function connectDB() {
  let uri = process.env.MONGO_URI;

  if (uri) {
    try {
      await mongoose.connect(uri);
      console.log("Connected to MongoDB Atlas");
      return;
    } catch (error) {
      console.log("Atlas connection failed, using in-memory MongoDB");
    }
  }

  const mongod = await MongoMemoryServer.create();
  uri = `${mongod.getUri()}examRoot`;
  await mongoose.connect(uri);
  console.log("Connected to in-memory MongoDB");
}

async function seedDatabase() {
  try {
    await connectDB();

    await Promise.all([
      MockTest.deleteMany({}),
      PracticeSet.deleteMany({}),
      TestSeries.deleteMany({}),
      Video.deleteMany({}),
      User.deleteMany({}),
      Tracking.deleteMany({}),
      PYQPaper.deleteMany({}),
    ]);
    console.log("Cleared existing seedable data");

    const [insertedVideos, insertedMockTests, insertedPracticeSets, insertedTestSeries, insertedUsers, insertedPYQ] =
      await Promise.all([
        Video.insertMany(videos),
        MockTest.insertMany(mockTests),
        PracticeSet.insertMany(practiceSets),
        TestSeries.insertMany(testSeries),
        User.insertMany(users),
        PYQPaper.insertMany(pyqPapers),
      ]);

    const now = new Date();
    const tracking = [
      {
        userId: insertedUsers[0]._id,
        activityType: "mock_test_end",
        resourceId: insertedMockTests[0]._id.toString(),
        resourceType: "mock_test",
        resourceTitle: insertedMockTests[0].title,
        startTime: new Date(now.getTime() - 60 * 60 * 1000),
        endTime: new Date(now.getTime() - 20 * 60 * 1000),
        durationInMinutes: 40,
        score: 5,
        totalQuestions: insertedMockTests[0].totalQuestions,
        correctAnswers: 5,
        accuracy: 83,
        status: "completed",
      },
      {
        userId: insertedUsers[0]._id,
        activityType: "practice_set_end",
        resourceId: insertedPracticeSets[0]._id.toString(),
        resourceType: "practice_set",
        resourceTitle: insertedPracticeSets[0].title,
        startTime: new Date(now.getTime() - 30 * 60 * 1000),
        endTime: new Date(now.getTime() - 15 * 60 * 1000),
        durationInMinutes: 15,
        score: 3,
        totalQuestions: insertedPracticeSets[0].totalQuestions,
        correctAnswers: 3,
        accuracy: 75,
        status: "completed",
      },
      {
        userId: insertedUsers[1]._id,
        activityType: "video_watch",
        resourceId: insertedVideos[0]._id.toString(),
        resourceType: "video",
        resourceTitle: insertedVideos[0].videoTitle,
        startTime: new Date(now.getTime() - 10 * 60 * 1000),
        endTime: now,
        durationInMinutes: 10,
        status: "completed",
      },
    ];

    const insertedTracking = await Tracking.insertMany(tracking);

    console.log(`Inserted ${insertedVideos.length} videos`);
    console.log(`Inserted ${insertedMockTests.length} mock tests`);
    console.log(`Inserted ${insertedPracticeSets.length} practice sets`);
    console.log(`Inserted ${insertedTestSeries.length} test series`);
    console.log(`Inserted ${insertedPYQ.length} PYQ papers`);
    console.log(`Inserted ${insertedUsers.length} users`);
    console.log(`Inserted ${insertedTracking.length} tracking records`);
    console.log("Database seeded successfully");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

seedDatabase();
