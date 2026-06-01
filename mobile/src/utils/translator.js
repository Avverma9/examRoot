// ─── INTELLIGENT TRANSLATION MODULE ─────────────────────────────────────────
// Ultra-fast English to Hindi translation with smart caching

const CACHE = new Map();
const BATCH_SIZE = 5; // Parallel translation batch size

// Comprehensive exam dictionary (instant translation)
const DICT = {
  'what': 'क्या', 'which': 'कौन सा', 'who': 'कौन', 'when': 'कब', 'where': 'कहाँ',
  'why': 'क्यों', 'how': 'कैसे', 'is': 'है', 'are': 'हैं', 'was': 'था', 'were': 'थे',
  'the': '', 'of': 'का', 'in': 'में', 'to': 'को', 'at': 'पर', 'and': 'और',
  'or': 'या', 'not': 'नहीं', 'from': 'से', 'by': 'द्वारा', 'with': 'के साथ',
  'for': 'के लिए', 'on': 'पर', 'as': 'के रूप में', 'be': 'होना', 'been': 'रहा',
  'article': 'अनुच्छेद', 'constitution': 'संविधान', 'president': 'राष्ट्रपति',
  'prime minister': 'प्रधानमंत्री', 'india': 'भारत', 'indian': 'भारतीय',
  'year': 'वर्ष', 'independence': 'स्वतंत्रता', 'first': 'प्रथम', 'second': 'द्वितीय',
  'third': 'तृतीय', 'correct': 'सही', 'wrong': 'गलत', 'answer': 'उत्तर',
  'question': 'प्रश्न', 'explanation': 'व्याख्या', 'solve': 'हल करें',
  'calculate': 'गणना करें', 'find': 'खोजें', 'abolishes': 'समाप्त करता है',
  'untouchability': 'अस्पृश्यता', 'served': 'कार्य किया', 'gained': 'प्राप्त किया',
  'british': 'ब्रिटिश', 'rule': 'शासन', 'august': 'अगस्त', 'following': 'निम्नलिखित',
  'given': 'दिया गया', 'above': 'ऊपर', 'below': 'नीचे', 'between': 'के बीच',
  'among': 'के बीच में', 'during': 'के दौरान', 'after': 'के बाद', 'before': 'से पहले',
  'according': 'के अनुसार', 'form': 'रूप', 'any': 'कोई भी', 'all': 'सभी',
  'each': 'प्रत्येक', 'every': 'हर', 'some': 'कुछ', 'many': 'कई', 'most': 'अधिकांश',
};

// Fast dictionary translation
function dictTranslate(text) {
  if (!text) return text;
  let result = text;
  Object.entries(DICT)
    .sort((a, b) => b[0].length - a[0].length)
    .forEach(([en, hi]) => {
      if (hi) result = result.replace(new RegExp(`\\b${en}\\b`, 'gi'), hi);
    });
  return result.replace(/\s+/g, ' ').trim();
}

// Ultra-fast Google Translate (optimized)
async function apiTranslate(text) {
  try {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(text)}`,
      { method: 'GET', headers: { 'Accept': 'application/json' } }
    );
    const data = await res.json();
    return data?.[0]?.map(i => i[0]).join('').trim() || null;
  } catch {
    return null;
  }
}

// Main translate function
export async function translateText(text, useAPI = false) {
  if (!text) return text;
  const key = `${text}_${useAPI}`;
  if (CACHE.has(key)) return CACHE.get(key);
  
  let result = useAPI ? await apiTranslate(text) : null;
  if (!result) result = dictTranslate(text);
  
  CACHE.set(key, result);
  return result;
}

// Batch translate (parallel processing)
async function batchTranslate(items, useAPI) {
  const results = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const translated = await Promise.all(batch.map(item => translateText(item, useAPI)));
    results.push(...translated);
  }
  return results;
}

// Translate question (optimized)
export async function translateQuestion(q, useAPI = false) {
  if (!q) return q;
  
  const [qHi, optsHi, expHi, corrHi] = await Promise.all([
    translateText(q.question, useAPI),
    batchTranslate(q.options || [], useAPI),
    translateText(q.explanation || '', useAPI),
    translateText(q.correctAnswer, useAPI),
  ]);
  
  return { ...q, questionHi: qHi, optionsHi: optsHi, explanationHi: expHi, correctAnswerHi: corrHi };
}

// Preload all questions (fast batch processing)
export async function preloadTranslations(questions, useAPI = false) {
  if (!Array.isArray(questions)) return questions;
  
  const results = [];
  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE);
    const translated = await Promise.all(batch.map(q => translateQuestion(q, useAPI)));
    results.push(...translated);
  }
  
  return results;
}

export function clearCache() { CACHE.clear(); }
