/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  BackHandler,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { Feather } from '@expo/vector-icons';
import { preloadTranslations } from '../utils/translator';
import { API_URLS } from '../config/app.config';
import { toggleSavedQuestion, getSavedStatus } from '../services/savedQuestionsApi';
import { saveProgress, completeProgress } from '../services/progressApi';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const LABELS = ['A', 'B', 'C', 'D', 'E'];

const FALLBACK_PRACTICE = {
  title: 'General Knowledge Practice',
  category: 'GK',
  questions: [
    {
      question: "What is the capital of India?",
      options: ["Mumbai", "Delhi", "Kolkata", "Chennai"],
      correctAnswer: "Delhi",
      explanation: "New Delhi is the capital of India.",
    }
  ]
};

const safeParsePractice = value => {
  if (!value) return FALLBACK_PRACTICE;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.error('Failed to parse practice set:', error);
    return FALLBACK_PRACTICE;
  }
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function PracticeSetPlayer() {
  const insets = useSafeAreaInsets();
  const { practice, currentQuestion } = useLocalSearchParams();
  const router = useRouter();

  const [parsedPractice, setParsedPractice] = useState(() => safeParsePractice(practice));
  const questions = parsedPractice.questions || [];
  const initialQuestion = Math.max(0, Number.parseInt(Array.isArray(currentQuestion) ? currentQuestion[0] : currentQuestion || '0', 10) || 0);

  const [current, setCurrent] = useState(initialQuestion);
  const [answers, setAnswers] = useState({});
  const [showAnswer, setShowAnswer] = useState({});
  const [bookmarked, setBookmarked] = useState({});   // { index: true/false }
  const [savingBookmark, setSavingBookmark] = useState({}); // { index: true } while API call
  const [lang, setLang] = useState('EN');
  const [fontScale, setFontScale] = useState(1);
  const [translatedQuestions, setTranslatedQuestions] = useState(questions);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isLoadingPractice, setIsLoadingPractice] = useState(false);
  const [loadError, setLoadError] = useState('');

  const token = useSelector((state) => state.auth.token);

  // ─── Load saved status for this resource ─────────────────────────────────
  useEffect(() => {
    if (!token || !parsedPractice?._id) return;
    getSavedStatus(token, parsedPractice._id)
      .then(({ savedIndices }) => {
        const map = {};
        savedIndices.forEach(idx => { map[idx] = true; });
        setBookmarked(map);
      })
      .catch(() => {}); // non-critical
  }, [token, parsedPractice?._id]);

  useEffect(() => {
    const shouldFetchDetails = parsedPractice?._id && questions.length === 0;
    if (!shouldFetchDetails) return;

    setIsLoadingPractice(true);
    setLoadError('');

    fetch(`${API_URLS.BASE}/practice/${parsedPractice._id}`)
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.message || 'Failed to load practice set');
        setParsedPractice(data?.data || parsedPractice);
      })
      .catch(error => {
        console.error('Practice detail load failed:', error);
        setLoadError(error.message || 'Failed to load practice set');
      })
      .finally(() => setIsLoadingPractice(false));
  }, [parsedPractice?._id, questions.length]);

  // ─── PRELOAD TRANSLATIONS ───
  useEffect(() => {
    if (questions.length > 0) {
      setIsTranslating(true);
      
      preloadTranslations(questions, false)
        .then(translated => {
          setTranslatedQuestions(translated);
          setIsTranslating(false);
        })
        .catch(err => {
          console.error('Translation failed:', err);
          setIsTranslating(false);
        });
    }
  }, [parsedPractice?._id, questions.length]);

  // ─── NAVIGATION ───
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmExit();
      return true;
    });
    return () => sub.remove();
  }, []);

  function confirmExit() {
    Alert.alert('Exit Practice', 'Are you sure you want to exit?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Exit', style: 'destructive', onPress: () => {
          // Save progress when leaving mid-way
          if (token && parsedPractice?._id) {
            saveProgress(token, {
              resourceId: parsedPractice._id,
              resourceType: 'practice_set',
              resourceTitle: parsedPractice.title || '',
              currentQuestion: current,
              totalQuestions: questions.length,
              answeredCount: Object.keys(answers).length,
            });
          }
          router.back();
        },
      },
    ]);
  }

  // ─── Bookmark toggle with real API ───────────────────────────────────────
  const handleBookmark = async (index) => {
    if (!token) return; // not logged in, skip
    const q = translatedQuestions[index] || questions[index];
    if (!q) return;

    setSavingBookmark(prev => ({ ...prev, [index]: true }));
    try {
      const result = await toggleSavedQuestion(token, {
        sourceType: 'practice_set',
        resourceId: parsedPractice._id || parsedPractice.title || 'unknown',
        resourceTitle: parsedPractice.title || '',
        questionIndex: index,
        question: q.question,
        questionHi: q.questionHi || '',
        options: q.options,
        optionsHi: q.optionsHi || [],
        correctAnswer: q.correctAnswer || '',
        correctAnswerHi: q.correctAnswerHi || '',
        explanation: q.explanation || '',
        explanationHi: q.explanationHi || '',
      });
      setBookmarked(prev => ({ ...prev, [index]: result.saved }));
    } catch (err) {
      console.warn('Bookmark toggle failed:', err.message);
    } finally {
      setSavingBookmark(prev => ({ ...prev, [index]: false }));
    }
  };

  // ─── HELPERS ───
  const getCorrectIdx = q => {
    const correctAns = q.correctAnswer;
    return q.options?.indexOf(correctAns) ?? -1;
  };

  const getScore = () => questions.filter((q, i) => answers[i] === getCorrectIdx(q)).length;
  const getAttempted = () => Object.keys(answers).length;

  // ─── LANG-AWARE TEXT HELPERS ───
  const qText = q => (lang === 'HI' && q.questionHi) ? q.questionHi : q.question;
  const opts = q => (lang === 'HI' && q.optionsHi?.length) ? q.optionsHi : q.options;
  const expText = q => (lang === 'HI' && q.explanationHi) ? q.explanationHi : (q.explanation || '');
  const renderLangToggle = () => (
    <View style={styles.langToggleWrap}>
      {['EN', 'HI'].map(l => (
        <TouchableOpacity
          key={l}
          onPress={() => setLang(l)}
          disabled={isTranslating}
          style={[styles.langBtn, { backgroundColor: lang === l ? '#3B82F6' : 'transparent', opacity: isTranslating ? 0.5 : 1 }]}
        >
          <Text style={[styles.langBtnText, { color: lang === l ? '#fff' : 'rgba(255,255,255,0.75)' }]}>{l}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderFontToggle = () => (
    <View style={styles.fontToggleWrap}>
      {[-1, 0, 1].map((step) => {
        const scale = step === -1 ? 0.92 : step === 0 ? 1 : 1.12;
        const label = step === -1 ? 'A-' : step === 0 ? 'A' : 'A+';
        const active = fontScale === scale;
        return (
          <TouchableOpacity
            key={label}
            onPress={() => setFontScale(scale)}
            style={[styles.fontBtn, active && styles.fontBtnActive]}
          >
            <Text style={[styles.fontBtnText, active && styles.fontBtnTextActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // ─── MAIN PLAYER ─────────────────────────────────────────────────────────────
  const q = translatedQuestions[current];
  if (isLoadingPractice) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ marginTop: 12, color: '#64748B', fontSize: 13 }}>Loading practice questions...</Text>
      </View>
    );
  }

  if (!q) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Feather name="alert-circle" size={32} color="#EF4444" />
        <Text style={{ marginTop: 12, color: '#0F172A', fontSize: 15, fontWeight: '700', textAlign: 'center' }}>
          {loadError || 'No questions found in this practice set'}
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16, backgroundColor: '#3B82F6', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 }}>
          <Text style={{ color: '#fff', fontWeight: '800' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isTranslating && lang === 'HI') {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ marginTop: 12, color: '#64748B', fontSize: 13 }}>Loading translations...</Text>
      </View>
    );
  }

  const progress = ((current + 1) / questions.length) * 100;
  const isBookmarked = !!bookmarked[current];
  const curOpts = opts(q) || [];
  const correctIdx = getCorrectIdx(q);
  const userAnswer = answers[current];
  const isAnswered = userAnswer !== undefined;
  const isCorrect = userAnswer === correctIdx;
  const showExp = showAnswer[current];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#F97316" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={confirmExit} style={styles.closeBtn}>
            <Feather name="x" size={20} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>{parsedPractice.title}</Text>
            {(parsedPractice.subject || parsedPractice.category) && (
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {parsedPractice.subject || parsedPractice.category}
                {parsedPractice.topic && ` • ${parsedPractice.topic}`}
              </Text>
            )}
          </View>
          {renderLangToggle()}
          {renderFontToggle()}
          <View style={styles.statsPill}>
            <Text style={styles.statsText}>{getAttempted()}/{questions.length}</Text>
          </View>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <View style={styles.progressDataRow}>
          <Text style={styles.progressDataText}>Question {current + 1} of {questions.length}</Text>
          <Text style={styles.progressDataText}>Score: {getScore()}/{getAttempted()}</Text>
        </View>
      </View>

      {/* BODY */}
      <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        
        {/* Question Number & Bookmark */}
        <View style={styles.qHeaderRow}>
          <View style={styles.qNumBadge}>
            <Text style={styles.qNumText}>Q{current + 1}</Text>
          </View>
          <TouchableOpacity
            onPress={() => handleBookmark(current)}
            disabled={!!savingBookmark[current]}
            style={[styles.bookmarkBtn, { backgroundColor: isBookmarked ? '#FEF3C7' : '#F8FAFC' }]}
          >
            {savingBookmark[current]
              ? <ActivityIndicator size={14} color="#F59E0B" />
              : <Feather name="bookmark" size={14} color={isBookmarked ? '#F59E0B' : '#94A3B8'} />
            }
          </TouchableOpacity>
        </View>

        {/* Question Text */}
        <Text style={[styles.questionText, { fontSize: 16 * fontScale, lineHeight: 26 * fontScale }]}>{qText(q)}</Text>

        {/* Options */}
        <View style={styles.optionsWrap}>
          {curOpts.map((opt, i) => {
            const isSelected = userAnswer === i;
            const isCorrectOpt = i === correctIdx;
            
            let borderColor = '#E2E8F0';
            let bgColor = '#fff';
            
            if (isAnswered && showExp) {
              if (isCorrectOpt) {
                borderColor = '#10B981';
                bgColor = '#ECFDF5';
              } else if (isSelected && !isCorrect) {
                borderColor = '#EF4444';
                bgColor = '#FEF2F2';
              }
            } else if (isSelected) {
              borderColor = '#3B82F6';
              bgColor = '#EFF6FF';
            }

            return (
              <TouchableOpacity
                key={i}
                activeOpacity={0.75}
                disabled={isAnswered}
                onPress={() => {
                  setAnswers({ ...answers, [current]: i });
                  setTimeout(() => setShowAnswer({ ...showAnswer, [current]: true }), 300);
                }}
                style={[styles.optBtn, { borderColor, backgroundColor: bgColor }]}
              >
                <View style={[styles.optBubble, { 
                  backgroundColor: isAnswered && showExp && isCorrectOpt ? '#10B981' : 
                                   isAnswered && showExp && isSelected && !isCorrect ? '#EF4444' :
                                   isSelected ? '#3B82F6' : '#F1F5F9' 
                }]}>
                  <Text style={[styles.optBubbleText, { 
                    color: (isAnswered && showExp && (isCorrectOpt || (isSelected && !isCorrect))) || isSelected ? '#fff' : '#64748B' 
                  }]}>{LABELS[i]}</Text>
                </View>
                <Text style={[styles.optText, { 
                  fontSize: 14 * fontScale,
                  lineHeight: 22 * fontScale,
                  color: isAnswered && showExp && isCorrectOpt ? '#065F46' :
                         isAnswered && showExp && isSelected && !isCorrect ? '#991B1B' :
                         isSelected ? '#1E40AF' : '#334155' 
                }]}>{opt}</Text>
                {isAnswered && showExp && isCorrectOpt && <Feather name="check-circle" size={16} color="#10B981" />}
                {isAnswered && showExp && isSelected && !isCorrect && <Feather name="x-circle" size={16} color="#EF4444" />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Result Badge */}
        {isAnswered && showExp && (
          <View style={[styles.resultBadge, { backgroundColor: isCorrect ? '#ECFDF5' : '#FEF2F2', borderColor: isCorrect ? '#A7F3D0' : '#FECACA' }]}>
            <Feather name={isCorrect ? 'check-circle' : 'x-circle'} size={18} color={isCorrect ? '#10B981' : '#EF4444'} />
            <Text style={[styles.resultText, { color: isCorrect ? '#065F46' : '#991B1B' }]}>
              {isCorrect ? '✓ Correct Answer!' : '✗ Wrong Answer'}
            </Text>
          </View>
        )}

        {/* Explanation */}
        {isAnswered && showExp && expText(q) && (
          <View style={styles.expBox}>
            <View style={styles.expHeader}>
              <Feather name="info" size={14} color="#3B82F6" />
              <Text style={styles.expTitle}>EXPLANATION</Text>
            </View>
            <Text style={styles.expText}>{expText(q)}</Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* FOOTER */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={() => setCurrent(c => Math.max(0, c - 1))}
            disabled={current === 0}
            style={[styles.navBtnPrev, current === 0 && styles.navBtnPrevDisabled]}
          >
            <Feather name="chevron-left" size={18} color={current === 0 ? '#CBD5E1' : '#334155'} />
            <Text style={[styles.navBtnPrevText, { color: current === 0 ? '#CBD5E1' : '#334155' }]}>Previous</Text>
          </TouchableOpacity>
          
          {isAnswered && !showExp && (
            <TouchableOpacity
              onPress={() => setShowAnswer({ ...showAnswer, [current]: true })}
              style={styles.showAnsBtn}
            >
              <Feather name="eye" size={14} color="#fff" />
              <Text style={styles.showAnsBtnText}>Show Answer</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            onPress={() => {
              if (current < questions.length - 1) {
                setCurrent(c => c + 1);
              } else {
                // Mark as completed on server
                if (token && parsedPractice?._id) {
                  const score = getScore();
                  const attempted = getAttempted();
                  const acc = attempted > 0 ? Math.round((score / attempted) * 100) : 0;
                  completeProgress(token, {
                    resourceId: parsedPractice._id,
                    resourceType: 'practice_set',
                    status: 'completed',
                    score,
                    accuracy: acc,
                    totalQuestions: questions.length,
                    correctAnswers: score,
                  });
                }
                Alert.alert(
                  'Practice Complete!',
                  `You scored ${getScore()} out of ${getAttempted()} attempted questions.`,
                  [{ text: 'OK', onPress: () => router.back() }]
                );
              }
            }}
            style={[styles.navBtnNext, { backgroundColor: current < questions.length - 1 ? '#3B82F6' : '#10B981' }]}
          >
            <Text style={styles.navBtnNextText}>{current < questions.length - 1 ? 'Next' : 'Finish'}</Text>
            <Feather name={current < questions.length - 1 ? 'chevron-right' : 'check'} size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── STYLESHEET ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7ED' },
  
  header: { backgroundColor: '#F97316', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#EA580C', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 3 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  closeBtn: { padding: 4, marginRight: 10, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 10 },
  headerTitleWrap: { flex: 1, marginRight: 8 },
  headerTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  headerSubtitle: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.82)' },
  statsPill: { backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, marginLeft: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  statsText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  progressBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 4, overflow: 'hidden', marginTop: 2 },
  progressFill: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: 4 },
  progressDataRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  progressDataText: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },

  langToggleWrap: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 7, padding: 2 },
  langBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  langBtnText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, color: '#FFFFFF' },
  fontToggleWrap: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 7, padding: 2, marginLeft: 8 },
  fontBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginHorizontal: 1 },
  fontBtnActive: { backgroundColor: '#3B82F6' },
  fontBtnText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3, color: '#FFFFFF' },
  fontBtnTextActive: { color: '#fff' },

  bodyScroll: { flex: 1 },
  bodyContent: { padding: 16, paddingTop: 20 },
  
  qHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  qNumBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1.5, borderColor: '#93C5FD' },
  qNumText: { fontSize: 12, fontWeight: '800', color: '#1E40AF', letterSpacing: 0.3 },
  bookmarkBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#E2E8F0' },
  
  questionText: { fontSize: 16, fontWeight: '600', color: '#0F172A', lineHeight: 26, marginBottom: 20, letterSpacing: 0.2 },
  
  optionsWrap: { gap: 12, marginBottom: 20 },
  optBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  optBubble: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  optBubbleText: { fontSize: 13, fontWeight: '800' },
  optText: { flex: 1, fontSize: 14, fontWeight: '500', lineHeight: 22 },

  resultBadge: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 2, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  resultText: { fontSize: 14, fontWeight: '700', marginLeft: 10 },

  expBox: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: '#BFDBFE', marginBottom: 20, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 },
  expHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  expTitle: { fontSize: 12, fontWeight: '800', color: '#1E40AF', marginLeft: 8, letterSpacing: 0.8 },
  expText: { fontSize: 13, color: '#475569', lineHeight: 22, letterSpacing: 0.2 },

  bottomSpacer: { height: 20 },

  footer: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 4 },
  navRow: { flexDirection: 'row', gap: 10 },
  navBtnPrev: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  navBtnPrevDisabled: { borderColor: '#F1F5F9', backgroundColor: '#F8FAFC', opacity: 0.5 },
  navBtnPrevText: { fontSize: 13, fontWeight: '800', marginLeft: 4 },
  showAnsBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: 14, backgroundColor: '#8B5CF6', gap: 6, shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  showAnsBtnText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  navBtnNext: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: 14, gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  navBtnNextText: { fontSize: 13, fontWeight: '800', color: '#fff' },
});
