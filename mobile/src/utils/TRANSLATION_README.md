# Intelligent Translation Module

## Overview
Smart English to Hindi translation system for exam questions with multiple fallback strategies.

## Features
✅ **Real-time Translation** - Translates questions on-the-fly
✅ **Multiple APIs** - MyMemory API + Google Translate fallback
✅ **Offline Dictionary** - 50+ common exam terms for instant translation
✅ **Smart Caching** - Prevents redundant API calls
✅ **Zero Configuration** - No API keys required
✅ **Automatic Preloading** - Translates all questions on app load

## How It Works

### Translation Strategy (Priority Order)
1. **Cache Check** - Returns cached translation if available
2. **MyMemory API** - Free translation API (no key needed)
3. **Google Translate API** - Fallback free API
4. **Dictionary** - Offline word-by-word translation

### Dictionary Coverage
- Question words: what, which, who, when, where, why, how
- Exam terms: article, constitution, president, independence
- Common words: and, or, not, in, of, to, from, by
- Numbers: one through ten

## Usage

### In Mock Test Player
```javascript
import { preloadTranslations } from '../utils/translator';

// Preload translations when test loads
useEffect(() => {
  preloadTranslations(questions, false) // false = use API, true = dictionary only
    .then(translated => setTranslatedQuestions(translated));
}, [questions]);
```

### Manual Translation
```javascript
import { translateText, translateQuestion } from '../utils/translator';

// Translate single text
const hindi = await translateText("What is your name?", true);

// Translate entire question
const translatedQ = await translateQuestion(questionObj, false);
```

## API Details

### MyMemory Translation API
- **URL**: https://api.mymemory.translated.net
- **Free Tier**: 1000 requests/day
- **No API Key**: Required
- **Response Time**: ~500ms

### Google Translate API
- **URL**: https://translate.googleapis.com
- **Free Tier**: Unlimited (unofficial)
- **No API Key**: Required
- **Response Time**: ~300ms

## Performance

### Translation Speed
- **Cached**: Instant (<1ms)
- **Dictionary**: ~5ms per question
- **API**: ~500ms per question
- **Preload 10 questions**: ~2-3 seconds

### Cache Strategy
- Stores translations in memory (Map)
- Persists during app session
- Cleared on app restart
- Can be manually cleared with `clearTranslationCache()`

## Extending Dictionary

Add more translations in `translator.js`:

```javascript
const DICTIONARY = {
  'your_word': 'आपका_शब्द',
  'another_term': 'दूसरा_शब्द',
  // ... add more
};
```

## Troubleshooting

### Translation not working?
1. Check internet connection (for API mode)
2. Verify questions have `question` field
3. Check console for errors
4. Try dictionary mode: `preloadTranslations(questions, true)`

### Poor translation quality?
1. Add specific terms to DICTIONARY
2. Use API mode instead of dictionary
3. Pre-translate in database for best quality

## Future Enhancements
- [ ] Add more languages (Tamil, Telugu, Bengali)
- [ ] Improve dictionary with ML-based translations
- [ ] Add translation quality scoring
- [ ] Support for mathematical equations
- [ ] Offline translation with local models
