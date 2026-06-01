# Practice Set Player - Complete Guide

## Overview
Professional practice set player with instant feedback, translation support, and smart bookmarking.

## Features

### 🎯 Core Features
- ✅ Instant answer feedback
- ✅ Show/Hide explanation
- ✅ Bookmark questions
- ✅ Real-time scoring
- ✅ Question palette with status
- ✅ EN/HI translation support
- ✅ Progress tracking
- ✅ Professional compact UI

### 🎨 UI/UX Features
- Modern slate color scheme
- Compact design (25% less padding)
- Visual feedback (green/red for correct/wrong)
- Smooth transitions
- Responsive layout
- Touch-optimized buttons

### 🌐 Translation Features
- Auto-preload translations
- Dictionary-based (instant)
- API fallback (Google Translate)
- Smart caching
- Seamless language switching

## Differences: Practice Set vs Mock Test

| Feature | Practice Set | Mock Test |
|---------|-------------|-----------|
| **Purpose** | Learning & Practice | Exam Simulation |
| **Timer** | ❌ No timer | ✅ Countdown timer |
| **Instant Feedback** | ✅ Immediate | ❌ After submission |
| **Show Answer** | ✅ Anytime | ❌ Only after submit |
| **Explanation** | ✅ Per question | ✅ In results |
| **Marking** | ❌ No negative | ✅ +1, -0.25 |
| **Navigation** | ✅ Free movement | ✅ Free movement |
| **Bookmarking** | ✅ Yes | ✅ Yes (as marked) |
| **Result Screen** | ❌ Simple alert | ✅ Detailed analysis |
| **Pressure** | 🟢 Low | 🔴 High |

## Question Status Colors

### Practice Set Player
- 🔵 **Blue** - Current question
- 🟢 **Green** - Answered correctly
- 🔴 **Red** - Answered incorrectly
- 🟡 **Yellow** - Bookmarked
- ⚪ **Gray** - Not attempted

### Mock Test Player
- 🔵 **Blue** - Current question
- 🟢 **Green** - Answered
- 🟣 **Purple** - Marked for review
- 🔴 **Red** - Visited but not answered
- ⚪ **Gray** - Not visited

## Usage

### Starting Practice
```javascript
// From practice set list
router.push({ 
  pathname: '/practice-set-player', 
  params: { practice: JSON.stringify(practiceSet) } 
});
```

### Practice Set Data Structure
```javascript
{
  title: "General Knowledge Practice",
  category: "GK",
  subject: "History",
  topic: "Ancient India",
  level: "easy", // easy | medium | hard
  totalQuestions: 10,
  questions: [
    {
      question: "What is the capital of India?",
      questionHi: "भारत की राजधानी क्या है?",
      options: ["Mumbai", "Delhi", "Kolkata", "Chennai"],
      optionsHi: ["मुंबई", "दिल्ली", "कोलकाता", "चेन्नई"],
      correctAnswer: "Delhi",
      correctAnswerHi: "दिल्ली",
      explanation: "New Delhi is the capital of India.",
      explanationHi: "नई दिल्ली भारत की राजधानी है।"
    }
  ]
}
```

## User Flow

### 1. Question Attempt
```
User sees question
  ↓
Selects an option
  ↓
Answer is locked
  ↓
Visual feedback (green/red border)
  ↓
"Show Answer" button appears
```

### 2. View Explanation
```
Click "Show Answer"
  ↓
Correct answer highlighted (green)
  ↓
Wrong answer shown (red) if applicable
  ↓
Explanation box appears
  ↓
Can move to next question
```

### 3. Bookmarking
```
Click bookmark icon (top right)
  ↓
Question marked with yellow badge
  ↓
Visible in question palette
  ↓
Can review later
```

### 4. Language Switch
```
Click EN/HI toggle
  ↓
All text switches instantly
  ↓
Questions, options, explanations translated
  ↓
Answer selection preserved
```

## Component Structure

```
PracticeSetPlayer
├── Header
│   ├── Close button
│   ├── Title
│   ├── Language toggle
│   ├── Score display
│   └── Progress bar
├── Body (ScrollView)
│   ├── Question header (number + bookmark)
│   ├── Question text
│   ├── Options (A, B, C, D)
│   ├── Result badge (correct/wrong)
│   ├── Explanation box
│   └── Question palette
└── Footer
    ├── Previous button
    ├── Show Answer button (conditional)
    └── Next/Finish button
```

## State Management

```javascript
const [current, setCurrent] = useState(0);           // Current question index
const [answers, setAnswers] = useState({});          // User answers {0: 1, 1: 2}
const [showAnswer, setShowAnswer] = useState({});    // Show explanation {0: true}
const [bookmarked, setBookmarked] = useState({});    // Bookmarked questions {0: true}
const [lang, setLang] = useState('EN');              // Current language
const [translatedQuestions, setTranslatedQuestions] = useState([]); // Translated data
const [isTranslating, setIsTranslating] = useState(false); // Loading state
```

## Styling Guide

### Color Palette
- **Primary**: #3B82F6 (Blue)
- **Success**: #10B981 (Green)
- **Error**: #EF4444 (Red)
- **Warning**: #F59E0B (Yellow/Amber)
- **Background**: #F8FAFC (Slate 50)
- **Text**: #0F172A (Slate 900)
- **Muted**: #64748B (Slate 500)

### Typography
- **Title**: 13px, weight 700
- **Question**: 15px, weight 600
- **Options**: 13px, weight 500
- **Labels**: 10-11px, weight 800
- **Explanation**: 12px, weight 400

### Spacing
- **Container padding**: 14px
- **Element gap**: 8-10px
- **Button padding**: 11-12px vertical
- **Border radius**: 10-12px

## Performance Optimization

### Translation
- Preloads all translations on mount
- Uses dictionary mode (instant)
- Caches results in memory
- Batch processing (5 questions parallel)

### Rendering
- Conditional rendering for explanations
- Optimized ScrollView
- Minimal re-renders
- Efficient state updates

## Best Practices

### For Developers
1. Always validate question data structure
2. Handle missing translations gracefully
3. Test with different question counts
4. Ensure proper cleanup on unmount
5. Use proper TypeScript types (if applicable)

### For Content Creators
1. Provide clear, concise questions
2. Write detailed explanations
3. Include Hindi translations for better reach
4. Use proper grammar and formatting
5. Test questions before publishing

## Troubleshooting

### Translation not working?
- Check internet connection
- Verify question structure has required fields
- Try dictionary mode (offline)
- Clear cache and reload

### UI issues?
- Check device screen size
- Verify safe area insets
- Test on different devices
- Check for console errors

### Navigation issues?
- Ensure proper route configuration
- Verify params are stringified
- Check router setup
- Test back navigation

## Future Enhancements
- [ ] Offline mode with local storage
- [ ] Performance analytics
- [ ] Time tracking per question
- [ ] Difficulty-based scoring
- [ ] Social sharing
- [ ] Leaderboards
- [ ] Streak tracking
- [ ] Daily challenges
