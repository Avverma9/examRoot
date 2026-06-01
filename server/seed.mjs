import mongoose from "mongoose";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";
import MockTest from "./models/MockTest.mjs";
import PracticeSet from "./models/PracticeSet.mjs";
import Video from "./models/Video.mjs";

dotenv.config();

// ─── VIDEOS ───────────────────────────────────────────────────────────────────
const videos = [
  {
    videoTitle: "SSC CGL Complete Strategy 2024",
    thumbnail: "https://picsum.photos/seed/ssc1/400/225",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    duration: "15:30",
    category: "SSC",
    description: "Complete preparation strategy for SSC CGL 2024 exam",
    views: 12500,
    isPublished: true,
  },
  {
    videoTitle: "Quantitative Aptitude - Percentage Tricks",
    thumbnail: "https://picsum.photos/seed/math1/400/225",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    duration: "22:45",
    category: "Mathematics",
    description: "Learn quick tricks to solve percentage problems in seconds",
    views: 34000,
    isPublished: true,
  },
  {
    videoTitle: "English Grammar - All Tenses Explained",
    thumbnail: "https://picsum.photos/seed/eng1/400/225",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    duration: "18:20",
    category: "English",
    description: "Complete guide to English tenses with examples and exercises",
    views: 21000,
    isPublished: true,
  },
  {
    videoTitle: "UPSC Prelims 2024 - Current Affairs",
    thumbnail: "https://picsum.photos/seed/upsc1/400/225",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    duration: "30:15",
    category: "UPSC",
    description: "Important current affairs for UPSC Prelims 2024",
    views: 56000,
    isPublished: true,
  },
  {
    videoTitle: "Reasoning - Blood Relations Made Easy",
    thumbnail: "https://picsum.photos/seed/reason1/400/225",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    duration: "12:40",
    category: "Reasoning",
    description: "Simple tricks to solve blood relation questions",
    views: 18900,
    isPublished: true,
  },
  {
    videoTitle: "General Science - Physics Basics",
    thumbnail: "https://picsum.photos/seed/sci1/400/225",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    duration: "25:10",
    category: "Science",
    description: "Fundamental concepts of physics for competitive exams",
    views: 27500,
    isPublished: true,
  },
  {
    videoTitle: "RRB NTPC - Complete GK in 1 Video",
    thumbnail: "https://picsum.photos/seed/rrb1/400/225",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    duration: "45:00",
    category: "RRB",
    description: "All important GK topics for RRB NTPC exam in one video",
    views: 41200,
    isPublished: true,
  },
  {
    videoTitle: "Banking - Simple & Compound Interest",
    thumbnail: "https://picsum.photos/seed/bank1/400/225",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    duration: "19:55",
    category: "Banking",
    description: "Master SI and CI formulas with shortcut tricks",
    views: 15600,
    isPublished: true,
  },
  {
    videoTitle: "Polity - Indian Constitution Basics",
    thumbnail: "https://picsum.photos/seed/polity1/400/225",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    duration: "33:20",
    category: "UPSC",
    description: "Fundamental rights, duties and directive principles explained",
    views: 38900,
    isPublished: true,
  },
  {
    videoTitle: "Time & Work - Shortcut Methods",
    thumbnail: "https://picsum.photos/seed/tw1/400/225",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    duration: "16:45",
    category: "Mathematics",
    description: "Solve time and work problems in under 30 seconds",
    views: 29300,
    isPublished: true,
  },
  {
    videoTitle: "History - Ancient India for Competitive Exams",
    thumbnail: "https://picsum.photos/seed/hist1/400/225",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    duration: "28:10",
    category: "History",
    description: "Indus Valley, Vedic period and Maurya Empire covered",
    views: 22100,
    isPublished: true,
  },
  {
    videoTitle: "Geography - Indian Rivers & Mountains",
    thumbnail: "https://picsum.photos/seed/geo1/400/225",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    duration: "21:30",
    category: "Geography",
    description: "Complete map-based study of Indian rivers and mountain ranges",
    views: 17800,
    isPublished: true,
  },
];

// ─── MOCK TESTS ───────────────────────────────────────────────────────────────
const mockTests = [
  {
    title: "SSC CGL Tier-1 Full Mock Test",
    description: "Complete mock test for SSC CGL Tier 1 with all 4 sections",
    category: "SSC",
    duration: 60,
    isPublished: true,
    questions: [
      { question: "What is the capital of India?", questionHi: "भारत की राजधानी क्या है?", options: ["Mumbai", "Delhi", "Kolkata", "Chennai"], optionsHi: ["मुंबई", "दिल्ली", "कोलकाता", "चेन्नई"], correctAnswer: "Delhi", correctAnswerHi: "दिल्ली", explanation: "Delhi is the capital of India", explanationHi: "दिल्ली भारत की राजधानी है" },
      { question: "Who wrote the Indian National Anthem?", questionHi: "भारतीय राष्ट्रगान किसने लिखा?", options: ["Rabindranath Tagore", "Bankim Chandra", "Subhash Bose", "Gandhi"], optionsHi: ["रवींद्रनाथ टैगोर", "बंकिम चंद्र", "सुभाष बोस", "गांधी"], correctAnswer: "Rabindranath Tagore", correctAnswerHi: "रवींद्रनाथ टैगोर", explanation: "Jana Gana Mana was written by Rabindranath Tagore", explanationHi: "जन गण मन रवींद्रनाथ टैगोर द्वारा लिखा गया था" },
      { question: "What is 15% of 200?", questionHi: "200 का 15% क्या है?", options: ["20", "25", "30", "35"], optionsHi: ["20", "25", "30", "35"], correctAnswer: "30", correctAnswerHi: "30", explanation: "15% of 200 = 30", explanationHi: "200 का 15% = 30" },
      { question: "Which planet is known as Red Planet?", questionHi: "किस ग्रह को लाल ग्रह कहा जाता है?", options: ["Venus", "Mars", "Jupiter", "Saturn"], optionsHi: ["शुक्र", "मंगल", "बृहस्पति", "शनि"], correctAnswer: "Mars", correctAnswerHi: "मंगल", explanation: "Mars is called the Red Planet due to iron oxide on its surface", explanationHi: "मंगल को लाल ग्रह कहा जाता है क्योंकि इसकी सतह पर आयरन ऑक्साइड है" },
      { question: "Who is the father of Indian Constitution?", questionHi: "भारतीय संविधान के जनक कौन हैं?", options: ["Gandhi", "Nehru", "Ambedkar", "Patel"], optionsHi: ["गांधी", "नेहरू", "अंबेडकर", "पटेल"], correctAnswer: "Ambedkar", correctAnswerHi: "अंबेडकर", explanation: "Dr. B.R. Ambedkar is known as the father of Indian Constitution", explanationHi: "डॉ. बी.आर. अंबेडकर को भारतीय संविधान का जनक कहा जाता है" },
      { question: "Speed of light is approximately?", questionHi: "प्रकाश की गति लगभग कितनी है?", options: ["3×10^6 m/s", "3×10^8 m/s", "3×10^10 m/s", "3×10^4 m/s"], optionsHi: ["3×10^6 m/s", "3×10^8 m/s", "3×10^10 m/s", "3×10^4 m/s"], correctAnswer: "3×10^8 m/s", correctAnswerHi: "3×10^8 m/s", explanation: "Speed of light in vacuum is 3×10^8 m/s", explanationHi: "निर्वात में प्रकाश की गति 3×10^8 m/s है" },
      { question: "Synonym of 'Abundant'", questionHi: "'Abundant' का समानार्थी शब्द?", options: ["Scarce", "Plentiful", "Empty", "Rare"], optionsHi: ["दुर्लभ", "प्रचुर", "खाली", "विरल"], correctAnswer: "Plentiful", correctAnswerHi: "प्रचुर", explanation: "Abundant means existing in large quantities", explanationHi: "Abundant का अर्थ है बड़ी मात्रा में उपलब्ध" },
      { question: "If a train travels 300 km in 5 hours, what is its speed?", questionHi: "यदि एक ट्रेन 5 घंटे में 300 किमी चलती है, तो उसकी गति क्या है?", options: ["50 km/h", "55 km/h", "60 km/h", "65 km/h"], optionsHi: ["50 किमी/घंटा", "55 किमी/घंटा", "60 किमी/घंटा", "65 किमी/घंटा"], correctAnswer: "60 km/h", correctAnswerHi: "60 किमी/घंटा", explanation: "Speed = Distance/Time = 300/5 = 60 km/h", explanationHi: "गति = दूरी/समय = 300/5 = 60 किमी/घंटा" },
      { question: "Which is the largest ocean?", questionHi: "सबसे बड़ा महासागर कौन सा है?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], optionsHi: ["अटलांटिक", "हिंद", "आर्कटिक", "प्रशांत"], correctAnswer: "Pacific", correctAnswerHi: "प्रशांत", explanation: "Pacific Ocean is the largest and deepest ocean", explanationHi: "प्रशांत महासागर सबसे बड़ा और गहरा महासागर है" },
      { question: "How many bones are in the human body?", questionHi: "मानव शरीर में कितनी हड्डियाँ होती हैं?", options: ["196", "206", "216", "226"], optionsHi: ["196", "206", "216", "226"], correctAnswer: "206", correctAnswerHi: "206", explanation: "An adult human body has 206 bones", explanationHi: "एक वयस्क मानव शरीर में 206 हड्डियाँ होती हैं" },
    ],
    totalQuestions: 10,
  },
  {
    title: "UPSC Prelims GS Paper Mock",
    description: "General Studies Paper 1 mock for UPSC Civil Services Prelims",
    category: "UPSC",
    duration: 120,
    isPublished: true,
    questions: [
      { question: "When did India gain independence?", questionHi: "भारत को स्वतंत्रता कब मिली?", options: ["1945", "1946", "1947", "1948"], optionsHi: ["1945", "1946", "1947", "1948"], correctAnswer: "1947", correctAnswerHi: "1947", explanation: "India gained independence on 15th August 1947", explanationHi: "भारत को 15 अगस्त 1947 को स्वतंत्रता मिली" },
      { question: "What is the largest state in India by area?", questionHi: "क्षेत्रफल की दृष्टि से भारत का सबसे बड़ा राज्य कौन सा है?", options: ["Maharashtra", "Rajasthan", "Madhya Pradesh", "Uttar Pradesh"], optionsHi: ["महाराष्ट्र", "राजस्थान", "मध्य प्रदेश", "उत्तर प्रदेश"], correctAnswer: "Rajasthan", correctAnswerHi: "राजस्थान", explanation: "Rajasthan is the largest state by area", explanationHi: "राजस्थान क्षेत्रफल की दृष्टि से सबसे बड़ा राज्य है" },
      { question: "Who was the first President of India?", questionHi: "भारत के प्रथम राष्ट्रपति कौन थे?", options: ["Nehru", "Rajendra Prasad", "Radhakrishnan", "Patel"], optionsHi: ["नेहरू", "राजेंद्र प्रसाद", "राधाकृष्णन", "पटेल"], correctAnswer: "Rajendra Prasad", correctAnswerHi: "राजेंद्र प्रसाद", explanation: "Dr. Rajendra Prasad was the first President of India", explanationHi: "डॉ. राजेंद्र प्रसाद भारत के प्रथम राष्ट्रपति थे" },
      { question: "Which river is called Ganga of South?", questionHi: "किस नदी को दक्षिण की गंगा कहा जाता है?", options: ["Krishna", "Godavari", "Kaveri", "Narmada"], optionsHi: ["कृष्णा", "गोदावरी", "कावेरी", "नर्मदा"], correctAnswer: "Godavari", correctAnswerHi: "गोदावरी", explanation: "Godavari is known as Ganga of South India", explanationHi: "गोदावरी को दक्षिण भारत की गंगा कहा जाता है" },
      { question: "Panchayati Raj is related to which article?", questionHi: "पंचायती राज किस अनुच्छेद से संबंधित है?", options: ["Article 40", "Article 42", "Article 44", "Article 46"], optionsHi: ["अनुच्छेद 40", "अनुच्छेद 42", "अनुच्छेद 44", "अनुच्छेद 46"], correctAnswer: "Article 40", correctAnswerHi: "अनुच्छेद 40", explanation: "Article 40 directs the state to organise village panchayats", explanationHi: "अनुच्छेद 40 राज्य को ग्राम पंचायतों के गठन का निर्देश देता है" },
      { question: "Which gas is most abundant in Earth's atmosphere?", questionHi: "पृथ्वी के वायुमंडल में सबसे अधिक कौन सी गैस है?", options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Argon"], optionsHi: ["ऑक्सीजन", "कार्बन डाइऑक्साइड", "नाइट्रोजन", "आर्गन"], correctAnswer: "Nitrogen", correctAnswerHi: "नाइट्रोजन", explanation: "Nitrogen makes up about 78% of Earth's atmosphere", explanationHi: "नाइट्रोजन पृथ्वी के वायुमंडल का लगभग 78% हिस्सा बनाती है" },
      { question: "The Tropic of Cancer passes through how many Indian states?", questionHi: "कर्क रेखा कितने भारतीय राज्यों से होकर गुजरती है?", options: ["6", "7", "8", "9"], optionsHi: ["6", "7", "8", "9"], correctAnswer: "8", correctAnswerHi: "8", explanation: "Tropic of Cancer passes through 8 Indian states", explanationHi: "कर्क रेखा 8 भारतीय राज्यों से होकर गुजरती है" },
      { question: "Who founded the Indian National Congress?", questionHi: "भारतीय राष्ट्रीय कांग्रेस की स्थापना किसने की?", options: ["Bal Gangadhar Tilak", "A.O. Hume", "Dadabhai Naoroji", "Gopal Krishna Gokhale"], optionsHi: ["बाल गंगाधर तिलक", "ए.ओ. ह्यूम", "दादाभाई नौरोजी", "गोपाल कृष्ण गोखले"], correctAnswer: "A.O. Hume", correctAnswerHi: "ए.ओ. ह्यूम", explanation: "Allan Octavian Hume founded the INC in 1885", explanationHi: "एलन ऑक्टेवियन ह्यूम ने 1885 में INC की स्थापना की" },
    ],
    totalQuestions: 8,
  },
  {
    title: "RRB NTPC General Awareness Mock",
    description: "General Awareness section mock test for RRB NTPC exam",
    category: "RRB",
    duration: 90,
    isPublished: true,
    questions: [
      { question: "Which is the longest railway platform in India?", questionHi: "भारत का सबसे लंबा रेलवे प्लेटफॉर्म कौन सा है?", options: ["Gorakhpur", "Kharagpur", "Kollam", "Bilaspur"], optionsHi: ["गोरखपुर", "खड़गपुर", "कोल्लम", "बिलासपुर"], correctAnswer: "Gorakhpur", correctAnswerHi: "गोरखपुर", explanation: "Gorakhpur railway platform is the longest in India at 1366.33 m", explanationHi: "गोरखपुर रेलवे प्लेटफॉर्म 1366.33 मीटर के साथ भारत का सबसे लंबा है" },
      { question: "Indian Railways was nationalised in which year?", questionHi: "भारतीय रेलवे का राष्ट्रीयकरण किस वर्ष हुआ?", options: ["1947", "1950", "1951", "1952"], optionsHi: ["1947", "1950", "1951", "1952"], correctAnswer: "1951", correctAnswerHi: "1951", explanation: "Indian Railways was nationalised in 1951", explanationHi: "भारतीय रेलवे का राष्ट्रीयकरण 1951 में हुआ" },
      { question: "Which is the fastest train in India?", questionHi: "भारत की सबसे तेज ट्रेन कौन सी है?", options: ["Rajdhani", "Shatabdi", "Vande Bharat", "Duronto"], optionsHi: ["राजधानी", "शताब्दी", "वंदे भारत", "दुरंतो"], correctAnswer: "Vande Bharat", correctAnswerHi: "वंदे भारत", explanation: "Vande Bharat Express is currently the fastest train in India", explanationHi: "वंदे भारत एक्सप्रेस वर्तमान में भारत की सबसे तेज ट्रेन है" },
      { question: "How many railway zones are there in India?", questionHi: "भारत में कितने रेलवे जोन हैं?", options: ["16", "17", "18", "19"], optionsHi: ["16", "17", "18", "19"], correctAnswer: "18", correctAnswerHi: "18", explanation: "Indian Railways has 18 railway zones", explanationHi: "भारतीय रेलवे में 18 रेलवे जोन हैं" },
      { question: "What does IRCTC stand for?", questionHi: "IRCTC का पूर्ण रूप क्या है?", options: ["Indian Railway Catering and Tourism Corporation", "Indian Rail Commerce and Travel Corporation", "Indian Railway Central Ticketing Corporation", "None of these"], optionsHi: ["इंडियन रेलवे कैटरिंग एंड टूरिज्म कॉर्पोरेशन", "इंडियन रेल कॉमर्स एंड ट्रैवल कॉर्पोरेशन", "इंडियन रेलवे सेंट्रल टिकटिंग कॉर्पोरेशन", "इनमें से कोई नहीं"], correctAnswer: "Indian Railway Catering and Tourism Corporation", correctAnswerHi: "इंडियन रेलवे कैटरिंग एंड टूरिज्म कॉर्पोरेशन", explanation: "IRCTC stands for Indian Railway Catering and Tourism Corporation", explanationHi: "IRCTC का अर्थ है इंडियन रेलवे कैटरिंग एंड टूरिज्म कॉर्पोरेशन" },
      { question: "First railway in India ran between?", questionHi: "भारत में पहली रेलगाड़ी कहाँ से कहाँ चली?", options: ["Delhi to Agra", "Mumbai to Thane", "Kolkata to Delhi", "Chennai to Bangalore"], optionsHi: ["दिल्ली से आगरा", "मुंबई से ठाणे", "कोलकाता से दिल्ली", "चेन्नई से बैंगलोर"], correctAnswer: "Mumbai to Thane", correctAnswerHi: "मुंबई से ठाणे", explanation: "First railway in India ran between Mumbai (Bombay) and Thane in 1853", explanationHi: "भारत में पहली रेलगाड़ी 1853 में मुंबई (बॉम्बे) और ठाणे के बीच चली" },
    ],
    totalQuestions: 6,
  },
  {
    title: "Banking PO Quantitative Aptitude Mock",
    description: "Quantitative Aptitude section for IBPS PO / SBI PO exam",
    category: "Banking",
    duration: 45,
    isPublished: true,
    questions: [
      { question: "A sum of Rs.5000 at 10% per annum SI for 2 years gives interest of?", questionHi: "Rs.5000 पर 10% वार्षिक साधारण ब्याज 2 वर्षों के लिए कितना होगा?", options: ["Rs.500", "Rs.750", "Rs.1000", "Rs.1250"], optionsHi: ["Rs.500", "Rs.750", "Rs.1000", "Rs.1250"], correctAnswer: "Rs.1000", correctAnswerHi: "Rs.1000", explanation: "SI = (P×R×T)/100 = (5000×10×2)/100 = Rs.1000", explanationHi: "साधारण ब्याज = (मूलधन×दर×समय)/100 = (5000×10×2)/100 = Rs.1000" },
      { question: "If 8 men can do a work in 12 days, how many days will 6 men take?", questionHi: "यदि 8 आदमी 12 दिनों में काम कर सकते हैं, तो 6 आदमी कितने दिनों में करेंगे?", options: ["14", "16", "18", "20"], optionsHi: ["14", "16", "18", "20"], correctAnswer: "16", correctAnswerHi: "16", explanation: "8×12 = 6×D, D = 96/6 = 16 days", explanationHi: "8×12 = 6×D, D = 96/6 = 16 दिन" },
      { question: "A train 200m long passes a pole in 10 seconds. Speed of train?", questionHi: "200 मीटर लंबी ट्रेन 10 सेकंड में एक खंभे को पार करती है। ट्रेन की गति?", options: ["18 km/h", "20 km/h", "72 km/h", "60 km/h"], optionsHi: ["18 किमी/घंटा", "20 किमी/घंटा", "72 किमी/घंटा", "60 किमी/घंटा"], correctAnswer: "72 km/h", correctAnswerHi: "72 किमी/घंटा", explanation: "Speed = 200/10 = 20 m/s = 72 km/h", explanationHi: "गति = 200/10 = 20 m/s = 72 किमी/घंटा" },
      { question: "What is the LCM of 12, 18 and 24?", questionHi: "12, 18 और 24 का LCM क्या है?", options: ["36", "48", "72", "96"], optionsHi: ["36", "48", "72", "96"], correctAnswer: "72", correctAnswerHi: "72", explanation: "LCM of 12, 18, 24 = 72", explanationHi: "12, 18, 24 का LCM = 72" },
      { question: "A shopkeeper sells at 20% profit. If CP is Rs.250, find SP.", questionHi: "एक दुकानदार 20% लाभ पर बेचता है। यदि CP Rs.250 है, तो SP ज्ञात करें।", options: ["Rs.280", "Rs.290", "Rs.300", "Rs.310"], optionsHi: ["Rs.280", "Rs.290", "Rs.300", "Rs.310"], correctAnswer: "Rs.300", correctAnswerHi: "Rs.300", explanation: "SP = CP × 1.2 = 250 × 1.2 = Rs.300", explanationHi: "विक्रय मूल्य = 250 × 1.2 = Rs.300" },
    ],
    totalQuestions: 5,
  },
  {
    title: "General Science Full Mock Test",
    description: "Physics, Chemistry and Biology for SSC, RRB and other exams",
    category: "Science",
    duration: 30,
    isPublished: true,
    questions: [
      { question: "Unit of electric current is?", questionHi: "विद्युत धारा की इकाई क्या है?", options: ["Volt", "Watt", "Ampere", "Ohm"], optionsHi: ["वोल्ट", "वाट", "एम्पीयर", "ओम"], correctAnswer: "Ampere", correctAnswerHi: "एम्पीयर", explanation: "Ampere is the SI unit of electric current", explanationHi: "एम्पीयर विद्युत धारा की SI इकाई है" },
      { question: "Which vitamin is produced by sunlight?", questionHi: "सूर्य के प्रकाश से कौन सा विटामिन बनता है?", options: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"], optionsHi: ["विटामिन A", "विटामिन B", "विटामिन C", "विटामिन D"], correctAnswer: "Vitamin D", correctAnswerHi: "विटामिन D", explanation: "Vitamin D is synthesized in skin when exposed to sunlight", explanationHi: "सूर्य के प्रकाश के संपर्क में आने पर त्वचा में विटामिन D बनता है" },
      { question: "Chemical formula of water is?", questionHi: "पानी का रासायनिक सूत्र क्या है?", options: ["HO", "H2O", "H2O2", "HO2"], optionsHi: ["HO", "H2O", "H2O2", "HO2"], correctAnswer: "H2O", correctAnswerHi: "H2O", explanation: "Water is composed of 2 hydrogen and 1 oxygen atom", explanationHi: "पानी 2 हाइड्रोजन और 1 ऑक्सीजन परमाणु से बना है" },
      { question: "Which organ purifies blood in human body?", questionHi: "मानव शरीर में रक्त को कौन सा अंग शुद्ध करता है?", options: ["Heart", "Liver", "Kidney", "Lungs"], optionsHi: ["हृदय", "यकृत", "गुर्दा", "फेफड़े"], correctAnswer: "Kidney", correctAnswerHi: "गुर्दा", explanation: "Kidneys filter blood and remove waste products", explanationHi: "गुर्दे रक्त को छानते हैं और अपशिष्ट पदार्थों को हटाते हैं" },
      { question: "Newton's second law gives the definition of?", questionHi: "न्यूटन का दूसरा नियम किसकी परिभाषा देता है?", options: ["Inertia", "Force", "Momentum", "Energy"], optionsHi: ["जड़त्व", "बल", "संवेग", "ऊर्जा"], correctAnswer: "Force", correctAnswerHi: "बल", explanation: "F = ma defines force according to Newton's second law", explanationHi: "F = ma न्यूटन के दूसरे नियम के अनुसार बल को परिभाषित करता है" },
      { question: "Photosynthesis occurs in which part of plant?", questionHi: "प्रकाश संश्लेषण पौधे के किस भाग में होता है?", options: ["Root", "Stem", "Chloroplast", "Mitochondria"], optionsHi: ["जड़", "तना", "क्लोरोप्लास्ट", "माइटोकॉन्ड्रिया"], correctAnswer: "Chloroplast", correctAnswerHi: "क्लोरोप्लास्ट", explanation: "Chloroplasts contain chlorophyll and are the site of photosynthesis", explanationHi: "क्लोरोप्लास्ट में क्लोरोफिल होता है और यह प्रकाश संश्लेषण का स्थान है" },
    ],
    totalQuestions: 6,
  },
];
  {
    title: "SSC CGL Tier-1 Full Mock Test",
    description: "Complete mock test for SSC CGL Tier 1 with all 4 sections",
    category: "SSC",
    duration: 60,
    isPublished: true,
    questions: [
      { question: "What is the capital of India?", options: ["Mumbai", "Delhi", "Kolkata", "Chennai"], correctAnswer: "Delhi", explanation: "Delhi is the capital of India" },
      { question: "Who wrote the Indian National Anthem?", options: ["Rabindranath Tagore", "Bankim Chandra", "Subhash Bose", "Gandhi"], correctAnswer: "Rabindranath Tagore", explanation: "Jana Gana Mana was written by Rabindranath Tagore" },
      { question: "What is 15% of 200?", options: ["20", "25", "30", "35"], correctAnswer: "30", explanation: "15% of 200 = 30" },
      { question: "Which planet is known as Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correctAnswer: "Mars", explanation: "Mars is called the Red Planet due to iron oxide on its surface" },
      { question: "Who is the father of Indian Constitution?", options: ["Gandhi", "Nehru", "Ambedkar", "Patel"], correctAnswer: "Ambedkar", explanation: "Dr. B.R. Ambedkar is known as the father of Indian Constitution" },
      { question: "Speed of light is approximately?", options: ["3×10^6 m/s", "3×10^8 m/s", "3×10^10 m/s", "3×10^4 m/s"], correctAnswer: "3×10^8 m/s", explanation: "Speed of light in vacuum is 3×10^8 m/s" },
      { question: "Synonym of 'Abundant'", options: ["Scarce", "Plentiful", "Empty", "Rare"], correctAnswer: "Plentiful", explanation: "Abundant means existing in large quantities" },
      { question: "If a train travels 300 km in 5 hours, what is its speed?", options: ["50 km/h", "55 km/h", "60 km/h", "65 km/h"], correctAnswer: "60 km/h", explanation: "Speed = Distance/Time = 300/5 = 60 km/h" },
      { question: "Which is the largest ocean?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correctAnswer: "Pacific", explanation: "Pacific Ocean is the largest and deepest ocean" },
      { question: "How many bones are in the human body?", options: ["196", "206", "216", "226"], correctAnswer: "206", explanation: "An adult human body has 206 bones" },
    ],
    totalQuestions: 10,
  },
  {
    title: "UPSC Prelims GS Paper Mock",
    description: "General Studies Paper 1 mock for UPSC Civil Services Prelims",
    category: "UPSC",
    duration: 120,
    isPublished: true,
    questions: [
      { question: "When did India gain independence?", options: ["1945", "1946", "1947", "1948"], correctAnswer: "1947", explanation: "India gained independence on 15th August 1947" },
      { question: "What is the largest state in India by area?", options: ["Maharashtra", "Rajasthan", "Madhya Pradesh", "Uttar Pradesh"], correctAnswer: "Rajasthan", explanation: "Rajasthan is the largest state by area" },
      { question: "Who was the first President of India?", options: ["Nehru", "Rajendra Prasad", "Radhakrishnan", "Patel"], correctAnswer: "Rajendra Prasad", explanation: "Dr. Rajendra Prasad was the first President of India" },
      { question: "Which river is called Ganga of South?", options: ["Krishna", "Godavari", "Kaveri", "Narmada"], correctAnswer: "Godavari", explanation: "Godavari is known as Ganga of South India" },
      { question: "Panchayati Raj is related to which article?", options: ["Article 40", "Article 42", "Article 44", "Article 46"], correctAnswer: "Article 40", explanation: "Article 40 directs the state to organise village panchayats" },
      { question: "Which gas is most abundant in Earth's atmosphere?", options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Argon"], correctAnswer: "Nitrogen", explanation: "Nitrogen makes up about 78% of Earth's atmosphere" },
      { question: "The Tropic of Cancer passes through how many Indian states?", options: ["6", "7", "8", "9"], correctAnswer: "8", explanation: "Tropic of Cancer passes through 8 Indian states" },
      { question: "Who founded the Indian National Congress?", options: ["Bal Gangadhar Tilak", "A.O. Hume", "Dadabhai Naoroji", "Gopal Krishna Gokhale"], correctAnswer: "A.O. Hume", explanation: "Allan Octavian Hume founded the INC in 1885" },
    ],
    totalQuestions: 8,
  },
  {
    title: "RRB NTPC General Awareness Mock",
    description: "General Awareness section mock test for RRB NTPC exam",
    category: "RRB",
    duration: 90,
    isPublished: true,
    questions: [
      { question: "Which is the longest railway platform in India?", options: ["Gorakhpur", "Kharagpur", "Kollam", "Bilaspur"], correctAnswer: "Gorakhpur", explanation: "Gorakhpur railway platform is the longest in India at 1366.33 m" },
      { question: "Indian Railways was nationalised in which year?", options: ["1947", "1950", "1951", "1952"], correctAnswer: "1951", explanation: "Indian Railways was nationalised in 1951" },
      { question: "Which is the fastest train in India?", options: ["Rajdhani", "Shatabdi", "Vande Bharat", "Duronto"], correctAnswer: "Vande Bharat", explanation: "Vande Bharat Express is currently the fastest train in India" },
      { question: "How many railway zones are there in India?", options: ["16", "17", "18", "19"], correctAnswer: "18", explanation: "Indian Railways has 18 railway zones" },
      { question: "What does IRCTC stand for?", options: ["Indian Railway Catering and Tourism Corporation", "Indian Rail Commerce and Travel Corporation", "Indian Railway Central Ticketing Corporation", "None of these"], correctAnswer: "Indian Railway Catering and Tourism Corporation", explanation: "IRCTC stands for Indian Railway Catering and Tourism Corporation" },
      { question: "First railway in India ran between?", options: ["Delhi to Agra", "Mumbai to Thane", "Kolkata to Delhi", "Chennai to Bangalore"], correctAnswer: "Mumbai to Thane", explanation: "First railway in India ran between Mumbai (Bombay) and Thane in 1853" },
    ],
    totalQuestions: 6,
  },
  {
    title: "Banking PO Quantitative Aptitude Mock",
    description: "Quantitative Aptitude section for IBPS PO / SBI PO exam",
    category: "Banking",
    duration: 45,
    isPublished: true,
    questions: [
      { question: "A sum of Rs.5000 at 10% per annum SI for 2 years gives interest of?", options: ["Rs.500", "Rs.750", "Rs.1000", "Rs.1250"], correctAnswer: "Rs.1000", explanation: "SI = (P×R×T)/100 = (5000×10×2)/100 = Rs.1000" },
      { question: "If 8 men can do a work in 12 days, how many days will 6 men take?", options: ["14", "16", "18", "20"], correctAnswer: "16", explanation: "8×12 = 6×D, D = 96/6 = 16 days" },
      { question: "A train 200m long passes a pole in 10 seconds. Speed of train?", options: ["18 km/h", "20 km/h", "72 km/h", "60 km/h"], correctAnswer: "72 km/h", explanation: "Speed = 200/10 = 20 m/s = 20×18/5 = 72 km/h" },
      { question: "What is the LCM of 12, 18 and 24?", options: ["36", "48", "72", "96"], correctAnswer: "72", explanation: "LCM of 12, 18, 24 = 72" },
      { question: "If x:y = 3:4 and y:z = 2:3, find x:z", options: ["1:2", "3:8", "1:3", "2:3"], correctAnswer: "1:2", explanation: "x:y:z = 6:8:12 = 3:4:6, so x:z = 3:6 = 1:2" },
      { question: "A shopkeeper sells at 20% profit. If CP is Rs.250, find SP.", options: ["Rs.280", "Rs.290", "Rs.300", "Rs.310"], correctAnswer: "Rs.300", explanation: "SP = CP × (1 + profit%) = 250 × 1.2 = Rs.300" },
      { question: "Average of 5 numbers is 40. If one number is removed, average becomes 35. Find removed number.", options: ["55", "60", "65", "70"], correctAnswer: "60", explanation: "Sum of 5 = 200, Sum of 4 = 140, Removed = 200-140 = 60" },
    ],
    totalQuestions: 7,
  },
  {
    title: "General Science Full Mock Test",
    description: "Physics, Chemistry and Biology for SSC, RRB and other exams",
    category: "Science",
    duration: 30,
    isPublished: true,
    questions: [
      { question: "Unit of electric current is?", options: ["Volt", "Watt", "Ampere", "Ohm"], correctAnswer: "Ampere", explanation: "Ampere is the SI unit of electric current" },
      { question: "Which vitamin is produced by sunlight?", options: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"], correctAnswer: "Vitamin D", explanation: "Vitamin D is synthesized in skin when exposed to sunlight" },
      { question: "Chemical formula of water is?", options: ["HO", "H2O", "H2O2", "HO2"], correctAnswer: "H2O", explanation: "Water is composed of 2 hydrogen and 1 oxygen atom" },
      { question: "Which organ purifies blood in human body?", options: ["Heart", "Liver", "Kidney", "Lungs"], correctAnswer: "Kidney", explanation: "Kidneys filter blood and remove waste products" },
      { question: "Newton's second law gives the definition of?", options: ["Inertia", "Force", "Momentum", "Energy"], correctAnswer: "Force", explanation: "F = ma defines force according to Newton's second law" },
      { question: "Photosynthesis occurs in which part of plant?", options: ["Root", "Stem", "Chloroplast", "Mitochondria"], correctAnswer: "Chloroplast", explanation: "Chloroplasts contain chlorophyll and are the site of photosynthesis" },
    ],
    totalQuestions: 6,
  },
];

// ─── PRACTICE SETS ────────────────────────────────────────────────────────────
const practiceSets = [
  {
    title: "Percentage - Basic to Advanced",
    subject: "Mathematics",
    topic: "Percentage",
    level: "easy",
    questions: [
      { question: "Find 20% of 500", options: ["80", "100", "120", "150"], correctAnswer: "100" },
      { question: "What is 35% of 400?", options: ["120", "130", "140", "150"], correctAnswer: "140" },
      { question: "If 25% of a number is 75, find the number", options: ["200", "250", "300", "350"], correctAnswer: "300" },
      { question: "A price increased from 200 to 250. Find % increase", options: ["20%", "25%", "30%", "35%"], correctAnswer: "25%" },
      { question: "What percent of 80 is 20?", options: ["20%", "25%", "30%", "40%"], correctAnswer: "25%" },
    ],
    totalQuestions: 5,
  },
  {
    title: "Profit & Loss - Practice Set",
    subject: "Mathematics",
    topic: "Profit & Loss",
    level: "medium",
    questions: [
      { question: "CP = Rs.100, SP = Rs.120. Find profit %", options: ["10%", "15%", "20%", "25%"], correctAnswer: "20%" },
      { question: "A shirt marked at Rs.500 sold at 10% discount. Find SP", options: ["Rs.400", "Rs.450", "Rs.475", "Rs.490"], correctAnswer: "Rs.450" },
      { question: "CP = Rs.200, Loss = 10%. Find SP", options: ["Rs.160", "Rs.170", "Rs.180", "Rs.190"], correctAnswer: "Rs.180" },
      { question: "SP = Rs.660, Profit = 10%. Find CP", options: ["Rs.580", "Rs.590", "Rs.600", "Rs.610"], correctAnswer: "Rs.600" },
      { question: "A man buys 10 oranges for Rs.40 and sells 8 for Rs.40. Profit %?", options: ["20%", "25%", "30%", "35%"], correctAnswer: "25%" },
    ],
    totalQuestions: 5,
  },
  {
    title: "Simple & Compound Interest",
    subject: "Mathematics",
    topic: "Interest",
    level: "medium",
    questions: [
      { question: "SI on Rs.1000 at 5% for 3 years?", options: ["Rs.100", "Rs.125", "Rs.150", "Rs.175"], correctAnswer: "Rs.150" },
      { question: "CI on Rs.1000 at 10% for 2 years?", options: ["Rs.200", "Rs.210", "Rs.220", "Rs.230"], correctAnswer: "Rs.210" },
      { question: "At what rate will Rs.500 double in 10 years (SI)?", options: ["5%", "10%", "15%", "20%"], correctAnswer: "10%" },
      { question: "Difference between CI and SI for 2 years at 10% on Rs.1000?", options: ["Rs.5", "Rs.10", "Rs.15", "Rs.20"], correctAnswer: "Rs.10" },
      { question: "SI on Rs.2000 at 8% for 2.5 years?", options: ["Rs.350", "Rs.380", "Rs.400", "Rs.420"], correctAnswer: "Rs.400" },
    ],
    totalQuestions: 5,
  },
  {
    title: "Time, Speed & Distance",
    subject: "Mathematics",
    topic: "Speed & Distance",
    level: "hard",
    questions: [
      { question: "A car travels 300 km in 5 hours. Find speed.", options: ["50 km/h", "55 km/h", "60 km/h", "65 km/h"], correctAnswer: "60 km/h" },
      { question: "A train 150m long passes a pole in 15 sec. Speed in km/h?", options: ["32", "36", "40", "44"], correctAnswer: "36" },
      { question: "Two trains 100m and 150m long run at 60 and 40 km/h towards each other. Time to cross?", options: ["9 sec", "10 sec", "11 sec", "12 sec"], correctAnswer: "9 sec" },
      { question: "A man walks at 5 km/h. How long to cover 2.5 km?", options: ["20 min", "25 min", "30 min", "35 min"], correctAnswer: "30 min" },
      { question: "Speed ratio of A:B = 3:4. If B covers 80 km, A covers?", options: ["55 km", "60 km", "65 km", "70 km"], correctAnswer: "60 km" },
    ],
    totalQuestions: 5,
  },
  {
    title: "English Grammar - Tenses",
    subject: "English",
    topic: "Tenses",
    level: "easy",
    questions: [
      { question: "He ___ to school daily.", options: ["go", "goes", "going", "gone"], correctAnswer: "goes" },
      { question: "They ___ playing cricket now.", options: ["is", "are", "was", "were"], correctAnswer: "are" },
      { question: "She ___ her homework yesterday.", options: ["complete", "completes", "completed", "completing"], correctAnswer: "completed" },
      { question: "I ___ never seen the Taj Mahal.", options: ["have", "has", "had", "having"], correctAnswer: "have" },
      { question: "By next year, he ___ this project.", options: ["will complete", "will have completed", "completes", "completed"], correctAnswer: "will have completed" },
    ],
    totalQuestions: 5,
  },
  {
    title: "English Vocabulary - Synonyms & Antonyms",
    subject: "English",
    topic: "Vocabulary",
    level: "medium",
    questions: [
      { question: "Synonym of 'Happy'", options: ["Sad", "Joyful", "Angry", "Tired"], correctAnswer: "Joyful" },
      { question: "Antonym of 'Ancient'", options: ["Old", "Modern", "Historic", "Traditional"], correctAnswer: "Modern" },
      { question: "Synonym of 'Brave'", options: ["Coward", "Fearful", "Courageous", "Timid"], correctAnswer: "Courageous" },
      { question: "Antonym of 'Transparent'", options: ["Clear", "Opaque", "Bright", "Shiny"], correctAnswer: "Opaque" },
      { question: "Synonym of 'Abundant'", options: ["Scarce", "Rare", "Plentiful", "Empty"], correctAnswer: "Plentiful" },
    ],
    totalQuestions: 5,
  },
  {
    title: "General Knowledge - Indian History",
    subject: "General Knowledge",
    topic: "Indian History",
    level: "easy",
    questions: [
      { question: "When did India gain independence?", options: ["1945", "1946", "1947", "1948"], correctAnswer: "1947" },
      { question: "Who was the first Prime Minister of India?", options: ["Gandhi", "Nehru", "Patel", "Ambedkar"], correctAnswer: "Nehru" },
      { question: "Battle of Plassey was fought in?", options: ["1757", "1764", "1857", "1947"], correctAnswer: "1757" },
      { question: "Who gave the slogan 'Do or Die'?", options: ["Nehru", "Gandhi", "Bose", "Tilak"], correctAnswer: "Gandhi" },
      { question: "The Sepoy Mutiny occurred in?", options: ["1847", "1857", "1867", "1877"], correctAnswer: "1857" },
    ],
    totalQuestions: 5,
  },
  {
    title: "Reasoning - Series & Patterns",
    subject: "Reasoning",
    topic: "Number Series",
    level: "medium",
    questions: [
      { question: "2, 4, 8, 16, ?", options: ["24", "28", "32", "36"], correctAnswer: "32" },
      { question: "1, 4, 9, 16, 25, ?", options: ["30", "34", "36", "40"], correctAnswer: "36" },
      { question: "3, 6, 11, 18, 27, ?", options: ["36", "38", "40", "42"], correctAnswer: "38" },
      { question: "A, C, E, G, ?", options: ["H", "I", "J", "K"], correctAnswer: "I" },
      { question: "1, 1, 2, 3, 5, 8, ?", options: ["11", "12", "13", "14"], correctAnswer: "13" },
    ],
    totalQuestions: 5,
  },
  {
    title: "General Science - Biology",
    subject: "Science",
    topic: "Biology",
    level: "easy",
    questions: [
      { question: "Which vitamin is produced by sunlight?", options: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"], correctAnswer: "Vitamin D" },
      { question: "How many chambers does human heart have?", options: ["2", "3", "4", "5"], correctAnswer: "4" },
      { question: "Largest organ of human body?", options: ["Liver", "Skin", "Lungs", "Brain"], correctAnswer: "Skin" },
      { question: "Which blood group is universal donor?", options: ["A", "B", "AB", "O"], correctAnswer: "O" },
      { question: "DNA stands for?", options: ["Deoxyribonucleic Acid", "Diribonucleic Acid", "Deoxyribose Nucleic Acid", "None"], correctAnswer: "Deoxyribonucleic Acid" },
    ],
    totalQuestions: 5,
  },
  {
    title: "Polity - Indian Constitution",
    subject: "General Knowledge",
    topic: "Indian Polity",
    level: "hard",
    questions: [
      { question: "How many fundamental rights are in Indian Constitution?", options: ["5", "6", "7", "8"], correctAnswer: "6" },
      { question: "Article 21 of Indian Constitution deals with?", options: ["Right to Equality", "Right to Freedom", "Right to Life", "Right to Education"], correctAnswer: "Right to Life" },
      { question: "Who appoints the Chief Justice of India?", options: ["Prime Minister", "President", "Parliament", "Supreme Court"], correctAnswer: "President" },
      { question: "Rajya Sabha members are elected for how many years?", options: ["4 years", "5 years", "6 years", "7 years"], correctAnswer: "6 years" },
      { question: "Which schedule of Constitution deals with languages?", options: ["6th", "7th", "8th", "9th"], correctAnswer: "8th" },
    ],
    totalQuestions: 5,
  },
];

// ─── SEED FUNCTION ────────────────────────────────────────────────────────────
async function seedDatabase() {
  try {
    let uri = process.env.MONGO_URI;

    if (uri) {
      try {
        await mongoose.connect(uri);
        console.log("✅ Connected to MongoDB Atlas");
      } catch (err) {
        console.log("⚠️ Atlas failed, falling back to in-memory MongoDB...");
        const mongod = await MongoMemoryServer.create();
        uri = mongod.getUri() + "examRoot";
        await mongoose.connect(uri);
        console.log("🧠 Connected to in-memory MongoDB");
      }
    } else {
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri() + "examRoot";
      await mongoose.connect(uri);
      console.log("🧠 Connected to in-memory MongoDB");
    }

    await MockTest.deleteMany({});
    await PracticeSet.deleteMany({});
    await Video.deleteMany({});
    console.log("🗑️  Cleared existing data");

    const insertedVideos = await Video.insertMany(videos);
    console.log(`✅ Inserted ${insertedVideos.length} videos`);

    const insertedMockTests = await MockTest.insertMany(mockTests);
    console.log(`✅ Inserted ${insertedMockTests.length} mock tests`);

    const insertedPracticeSets = await PracticeSet.insertMany(practiceSets);
    console.log(`✅ Inserted ${insertedPracticeSets.length} practice sets`);

    console.log("\n🎉 Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
