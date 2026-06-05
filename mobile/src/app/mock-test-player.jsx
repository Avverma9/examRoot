/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  BackHandler,
  Animated,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { preloadTranslations } from '../utils/translator';
import { BASE_URL } from '../utils/baseUrl';

// ─── CONSTANTS & FALLBACK DATA ───────────────────────────────────────────────
const LABELS = ['A', 'B', 'C', 'D', 'E'];

const STATUS_STYLE = {
  current:           { bg: '#3B82F6', border: '#3B82F6', text: '#fff' },
  answered:          { bg: '#10B981', border: '#10B981', text: '#fff' },
  marked:            { bg: '#8B5CF6', border: '#8B5CF6', text: '#fff' },
  'answered-marked': { bg: '#8B5CF6', border: '#8B5CF6', text: '#fff' },
  visited:           { bg: '#FEE2E2', border: '#FCA5A5', text: '#DC2626' },
  notvisited:        { bg: '#F8FAFC', border: '#CBD5E1', text: '#64748B' },
};

// Fallback data ensures the EN/HI toggle works out of the box if no params are passed
const FALLBACK_TEST = {
  title: 'UPSC Prelims — GS Paper I',
  duration: 120, // minutes
  questions: [
    {
      question: "Which article of the Indian Constitution abolishes untouchability?",
      questionHi: "भारतीय संविधान का कौन सा अनुच्छेद अस्पृश्यता को समाप्त करता है?",
      options: ["Article 14", "Article 15", "Article 17", "Article 21"],
      optionsHi: ["अनुच्छेद 14", "अनुच्छेद 15", "अनुच्छेद 17", "अनुच्छेद 21"],
      correctAnswer: "Article 17",
      correctAnswerHi: "अनुच्छेद 17",
      explanation: "Article 17 abolishes untouchability in any form.",
      explanationHi: "अनुच्छेद 17 किसी भी रूप में अस्पृश्यता को समाप्त करता है।",
    }
  ]
};

const safeParseTest = value => {
  if (!value) return FALLBACK_TEST;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.error('Failed to parse mock test:', error);
    return FALLBACK_TEST;
  }
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function MockTestPlayer() {
  const insets = useSafeAreaInsets();
  const { test } = useLocalSearchParams();
  const router = useRouter();

  const [parsedTest, setParsedTest] = useState(() => safeParseTest(test));
  const questions = parsedTest.questions || [];

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [lang, setLang] = useState('EN');
  const [timeLeft, setTimeLeft] = useState(parsedTest.duration * 60);
  const [timeTaken, setTimeTaken] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [translatedQuestions, setTranslatedQuestions] = useState(questions);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isLoadingTest, setIsLoadingTest] = useState(false);
  const [loadError, setLoadError] = useState('');

  const timerRef = useRef(null);
  const pulseAnim = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    const shouldFetchDetails = parsedTest?._id && questions.length === 0;
    if (!shouldFetchDetails) return;

    setIsLoadingTest(true);
    setLoadError('');

    fetch(`${BASE_URL}/mock/${parsedTest._id}`)
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.message || 'Failed to load mock test');
        setParsedTest(data?.data || parsedTest);
      })
      .catch(error => {
        console.error('Mock test detail load failed:', error);
        setLoadError(error.message || 'Failed to load mock test');
      })
      .finally(() => setIsLoadingTest(false));
  }, [parsedTest?._id, questions.length]);

  // ─── PRELOAD TRANSLATIONS ───
  useEffect(() => {
    if (questions.length > 0) {
      setIsTranslating(true);
      
      preloadTranslations(questions, true)
        .then(translated => {
          setTranslatedQuestions(translated);
          setIsTranslating(false);
        })
        .catch(err => {
          console.error('Translation failed:', err);
          setIsTranslating(false);
        });
    }
  }, [parsedTest?._id, questions.length]);

  // ─── TIMER & ANIMATIONS ───
  useEffect(() => {
    if (timeLeft <= 60 && !submitted) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.12, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [timeLeft <= 60, submitted]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); setSubmitted(true); return 0; }
        return t - 1;
      });
      setTimeTaken(t => t + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // ─── NAVIGATION & MODALS ───
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!submitted) { confirmExit(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [submitted]);

  function confirmExit() {
    Alert.alert('Exit Test', 'Your progress will be lost. Exit anyway?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Exit', style: 'destructive', onPress: () => { clearInterval(timerRef.current); router.back(); } },
    ]);
  }

  const handleSubmit = () => {
    const unanswered = questions.length - Object.keys(answers).length;
    Alert.alert(
      'Submit Test',
      unanswered > 0 ? `${unanswered} question(s) unanswered. Submit anyway?` : 'Are you sure you want to submit the test?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: () => { clearInterval(timerRef.current); setSubmitted(true); } },
      ]
    );
  };

  // ─── HELPERS ───
  const formatTime = s => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    const pad = n => String(n).padStart(2, '0');
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
  };

  const getCorrectIdx = q => {
    const correctAns = q.correctAnswer;
    return q.options?.indexOf(correctAns) ?? -1;
  };

  const getScore = () => questions.filter((q, i) => answers[i] === getCorrectIdx(q)).length;
  const getWrong = () => Object.keys(answers).filter(i => answers[i] !== getCorrectIdx(questions[i])).length;
  const getSkipped = () => questions.length - Object.keys(answers).length;

  const getQStatus = i => {
    const hasAnswer = answers[i] !== undefined;
    if (hasAnswer && marked[i]) return 'answered-marked';
    if (hasAnswer) return 'answered';
    if (marked[i]) return 'marked';
    if (i < current) return 'visited';
    if (i === current) return 'current';
    return 'notvisited';
  };

  // ─── LANG-AWARE TEXT HELPERS ───
  const qText = q => (lang === 'HI' && q.questionHi) ? q.questionHi : q.question;
  const opts = q => (lang === 'HI' && q.optionsHi?.length) ? q.optionsHi : q.options;
  const expText = q => (lang === 'HI' && q.explanationHi) ? q.explanationHi : (q.explanation || '');
  const corrText = q => (lang === 'HI' && q.correctAnswerHi) ? q.correctAnswerHi : q.correctAnswer;

  const renderLangToggle = () => (
    <View style={styles.langToggleWrap}>
      {['EN', 'HI'].map(l => (
        <TouchableOpacity
          key={l}
          onPress={() => setLang(l)}
          disabled={isTranslating}
          style={[styles.langBtn, { backgroundColor: lang === l ? '#3B82F6' : 'transparent', opacity: isTranslating ? 0.5 : 1 }]}
        >
          <Text style={[styles.langBtnText, { color: lang === l ? '#fff' : '#64748B' }]}>{l}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ─── RESULT SCREEN ─────────────────────────────────────────────────────────
  if (submitted) {
    const score = getScore();
    const wrong = getWrong();
    const skipped = getSkipped();
    const percent = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    const marks = (score * 1 - wrong * 0.25).toFixed(2);
    const bgColor = percent >= 60 ? '#10B981' : percent >= 35 ? '#F59E0B' : '#EF4444';

    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Test Result</Text>
          {renderLangToggle()}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.resultBannerWrap}>
            <View style={[styles.resultBannerTop, { backgroundColor: bgColor }]}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreText}>{percent}%</Text>
              </View>
              <Text style={styles.scoreMsg}>
                {percent >= 60 ? '🎉 Excellent Performance!' : percent >= 35 ? '👍 Keep Practicing' : '📚 Need More Practice'}
              </Text>
            </View>
            <View style={styles.statsRow}>
              {[
                { label: 'Correct', val: score, color: '#10B981' },
                { label: 'Wrong', val: wrong, color: '#EF4444' },
                { label: 'Skipped', val: skipped, color: '#9CA3AF' },
                { label: 'Marks', val: marks, color: '#2563EB' },
              ].map((s, i, arr) => (
                <View key={s.label} style={[styles.statBox, i < arr.length - 1 && styles.statBorder]}>
                  <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.infoRow}>
            {[
              { icon: 'clock', label: 'Time Taken', val: formatTime(timeTaken) },
              { icon: 'bar-chart-2', label: 'Attempted', val: `${Object.keys(answers).length}/${questions.length}` },
            ].map(s => (
              <View key={s.label} style={styles.infoCard}>
                <Feather name={s.icon} size={16} color="#6B7280" />
                <View style={styles.infoCardText}>
                  <Text style={styles.infoCardLabel}>{s.label}</Text>
                  <Text style={styles.infoCardVal}>{s.val}</Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.analysisSectionTitle}>Detailed Analysis</Text>
          <View style={styles.analysisList}>
            {translatedQuestions.map((q, i) => {
              const isCorrect = answers[i] === getCorrectIdx(q);
              const isSkipped = answers[i] === undefined;
              const bdrColor = isSkipped ? '#E5E7EB' : isCorrect ? '#A7F3D0' : '#FECACA';
              const topColor = isSkipped ? '#E5E7EB' : isCorrect ? '#34D399' : '#F87171';

              return (
                <View key={i} style={[styles.analysisCard, { borderColor: bdrColor }]}>
                  <View style={[styles.analysisTopIndicator, { backgroundColor: topColor }]} />
                  <View style={styles.analysisContent}>
                    <View style={styles.analysisHeaderRow}>
                      <Text style={styles.analysisQNum}>Q{i + 1}</Text>
                      <View style={[styles.analysisBadge, { backgroundColor: isSkipped ? '#F3F4F6' : isCorrect ? '#D1FAE5' : '#FEE2E2' }]}>
                        <Text style={[styles.analysisBadgeText, { color: isSkipped ? '#6B7280' : isCorrect ? '#065F46' : '#991B1B' }]}>
                          {isSkipped ? 'Skipped' : isCorrect ? '+1.00' : '-0.25'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.analysisQText}>{qText(q)}</Text>

                    <View style={[styles.ansRow, { backgroundColor: isCorrect ? '#ECFDF5' : isSkipped ? '#F9FAFB' : '#FEF2F2' }]}>
                      <Feather name={isSkipped ? 'minus-circle' : isCorrect ? 'check-circle' : 'x-circle'} size={14} color={isSkipped ? '#9CA3AF' : isCorrect ? '#10B981' : '#EF4444'} />
                      <Text style={[styles.ansRowVal, { color: isSkipped ? '#9CA3AF' : isCorrect ? '#065F46' : '#991B1B', fontStyle: isSkipped ? 'italic' : 'normal' }]}>
                        {answers[i] !== undefined ? opts(q)[answers[i]] : 'Not answered'}
                      </Text>
                      <Text style={styles.ansRowLabel}>Your answer</Text>
                    </View>

                    {!isCorrect && (
                      <View style={[styles.ansRow, { backgroundColor: '#ECFDF5' }]}>
                        <Feather name="check-circle" size={14} color="#10B981" />
                        <Text style={[styles.ansRowVal, { color: '#065F46' }]}>{corrText(q)}</Text>
                        <Text style={styles.ansRowLabel}>Correct</Text>
                      </View>
                    )}

                    {expText(q) ? (
                      <View style={styles.expBox}>
                        <Text style={styles.expTitle}>💡 EXPLANATION</Text>
                        <Text style={styles.expText}>{expText(q)}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View style={[styles.resultFooter, { paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Back to Tests</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── MAIN TEST PLAYER ──────────────────────────────────────────────────────
  const q = translatedQuestions[current];
  if (isLoadingTest) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ marginTop: 12, color: '#6B7280', fontSize: 14 }}>Loading test questions...</Text>
      </View>
    );
  }

  if (!q) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Feather name="alert-circle" size={32} color="#EF4444" />
        <Text style={{ marginTop: 12, color: '#0F172A', fontSize: 15, fontWeight: '700', textAlign: 'center' }}>
          {loadError || 'No questions found in this mock test'}
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16, backgroundColor: '#2563EB', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 }}>
          <Text style={{ color: '#fff', fontWeight: '800' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show loading indicator while translating
  if (isTranslating && lang === 'HI') {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ marginTop: 12, color: '#6B7280', fontSize: 14 }}>Loading translations...</Text>
      </View>
    );
  }

  const progress = ((current + 1) / questions.length) * 100;
  const isMarked = !!marked[current];
  const curOpts = opts(q) || [];
  const timerBg = timeLeft <= 60 ? '#EF4444' : timeLeft <= 300 ? '#F59E0B' : '#3B82F6';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={confirmExit} style={styles.closeBtn}>
            <Feather name="x" size={20} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitleMain} numberOfLines={1}>{parsedTest.title}</Text>
          {renderLangToggle()}
          <Animated.View style={[styles.timerPill, { backgroundColor: timerBg, transform: [{ scale: pulseAnim }] }]}>
            <Feather name="clock" size={11} color="#fff" />
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          </Animated.View>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <View style={styles.progressDataRow}>
          <Text style={styles.progressDataText}>Q {current + 1} / {questions.length}</Text>
          <Text style={styles.progressDataText}>{Object.keys(answers).length} answered</Text>
        </View>
      </View>

      <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <View style={styles.chipsRow}>
          <View style={[styles.chip, styles.chipGreen]}>
            <Text style={styles.chipTextGreen}>+1.00</Text>
          </View>
          <View style={[styles.chip, styles.chipRed]}>
            <Text style={styles.chipTextRed}>-0.25</Text>
          </View>
          {isMarked && (
            <View style={[styles.chip, styles.chipPurple]}>
              <Feather name="bookmark" size={11} color="#7C3AED" />
              <Text style={styles.chipTextPurple}>Marked</Text>
            </View>
          )}
        </View>

        <Text style={styles.questionTextMain}>{qText(q)}</Text>

        <View style={styles.optionsWrap}>
          {curOpts.map((opt, i) => {
            const isSelected = answers[current] === i;
            return (
              <TouchableOpacity
                key={i}
                activeOpacity={0.75}
                onPress={() => setAnswers({ ...answers, [current]: i })}
                style={[styles.optBtn, { borderColor: isSelected ? '#3B82F6' : '#E2E8F0', backgroundColor: isSelected ? '#EFF6FF' : '#fff' }]}
              >
                <View style={[styles.optBubble, { backgroundColor: isSelected ? '#3B82F6' : '#F1F5F9' }]}>
                  <Text style={[styles.optBubbleText, { color: isSelected ? '#fff' : '#64748B' }]}>{LABELS[i]}</Text>
                </View>
                <Text style={[styles.optText, { color: isSelected ? '#1E40AF' : '#334155' }]}>{opt}</Text>
                {isSelected && <Feather name="check-circle" size={16} color="#3B82F6" />}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.paletteContainer}>
          <Text style={styles.paletteTitle}>QUESTION PALETTE</Text>
          <View style={styles.legendRow}>
            {[
              { color: '#10B981', label: 'Answered' },
              { color: '#FEE2E2', border: '#FCA5A5', label: 'Not Answered' },
              { color: '#7C3AED', label: 'Marked' },
              { color: '#F9FAFB', border: '#D1D5DB', label: 'Not Visited' },
            ].map(l => (
              <View key={l.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: l.color, borderColor: l.border || 'transparent', borderWidth: l.border ? 1 : 0 }]} />
                <Text style={styles.legendText}>{l.label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.paletteGrid}>
            {questions.map((_, i) => {
              const s = STATUS_STYLE[getQStatus(i)];
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => setCurrent(i)}
                  style={[styles.paletteBtn, { backgroundColor: s.bg, borderColor: s.border }]}
                >
                  <Text style={[styles.paletteBtnText, { color: s.text }]}>{i + 1}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.footerTopRow}>
          <View style={styles.footerLeftActions}>
            <TouchableOpacity
              onPress={() => { const a = { ...answers }; delete a[current]; setAnswers(a); }}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryBtnText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMarked({ ...marked, [current]: !marked[current] })}
              style={[styles.secondaryBtn, { borderColor: isMarked ? '#8B5CF6' : '#E2E8F0', backgroundColor: isMarked ? '#F5F3FF' : '#fff' }]}
            >
              <Feather name="bookmark" size={12} color={isMarked ? '#8B5CF6' : '#94A3B8'} />
              <Text style={[styles.secondaryBtnText, { color: isMarked ? '#7C3AED' : '#64748B', marginLeft: 6 }]}>
                {isMarked ? 'Marked' : 'Mark'}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleSubmit} style={styles.submitBtnMini}>
            <Text style={styles.submitBtnMiniText}>Submit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={() => setCurrent(c => Math.max(0, c - 1))}
            disabled={current === 0}
            style={[styles.navBtnPrev, current === 0 && styles.navBtnPrevDisabled]}
          >
            <Feather name="chevron-left" size={18} color={current === 0 ? '#D1D5DB' : '#374151'} />
            <Text style={[styles.navBtnPrevText, { color: current === 0 ? '#D1D5DB' : '#374151' }]}>Prev</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => current < questions.length - 1 ? setCurrent(c => c + 1) : handleSubmit()}
            style={[styles.navBtnNext, { backgroundColor: current < questions.length - 1 ? '#3B82F6' : '#10B981' }]}
          >
            <Text style={styles.navBtnNextText}>{current < questions.length - 1 ? 'Save & Next' : 'Submit Test'}</Text>
            <Feather name={current < questions.length - 1 ? 'chevron-right' : 'check'} size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── STYLESHEET ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  
  header: { backgroundColor: '#fff', paddingHorizontal: 14, paddingTop: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backBtn: { marginRight: 10 },
  closeBtn: { padding: 3, marginRight: 6 },
  headerTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#0F172A' },
  headerTitleMain: { flex: 1, fontSize: 12, fontWeight: '700', color: '#334155' },
  timerPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 16, marginLeft: 6 },
  timerText: { color: '#fff', fontWeight: '700', fontSize: 11, marginLeft: 3 },
  progressBg: { height: 3, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 3 },
  progressDataRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 },
  progressDataText: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },

  langToggleWrap: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 6, padding: 2, marginRight: 6 },
  langBtn: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  langBtnText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  bodyScroll: { flex: 1 },
  bodyContent: { padding: 12 },
  chipsRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  chip: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, flexDirection: 'row', alignItems: 'center' },
  chipGreen: { backgroundColor: '#ECFDF5', borderColor: '#86EFAC' },
  chipTextGreen: { fontSize: 10, fontWeight: '700', color: '#065F46' },
  chipRed: { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' },
  chipTextRed: { fontSize: 10, fontWeight: '700', color: '#991B1B' },
  chipPurple: { backgroundColor: '#F5F3FF', borderColor: '#C4B5FD' },
  chipTextPurple: { fontSize: 10, fontWeight: '700', color: '#6D28D9', marginLeft: 3 },
  
  questionTextMain: { fontSize: 14, fontWeight: '600', color: '#0F172A', lineHeight: 22, marginBottom: 14 },
  optionsWrap: { gap: 8, marginBottom: 16 },
  optBtn: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1.5, backgroundColor: '#fff' },
  optBubble: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  optBubbleText: { fontSize: 11, fontWeight: '800' },
  optText: { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 20 },

  paletteContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  paletteTitle: { fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 8, letterSpacing: 0.5 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 3 },
  legendText: { fontSize: 9, color: '#94A3B8', fontWeight: '600' },
  paletteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  paletteBtn: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  paletteBtnText: { fontSize: 11, fontWeight: '800' },
  bottomSpacer: { height: 6 },

  footer: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingHorizontal: 12, paddingTop: 8, shadowColor: '#000', shadowOffset: { width: 0, height: -1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 3 },
  footerTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  footerLeftActions: { flexDirection: 'row', gap: 6 },
  secondaryBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff' },
  secondaryBtnText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  submitBtnMini: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#A7F3D0', backgroundColor: '#ECFDF5' },
  submitBtnMiniText: { fontSize: 11, fontWeight: '800', color: '#065F46' },
  navRow: { flexDirection: 'row', gap: 8 },
  navBtnPrev: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#fff' },
  navBtnPrevDisabled: { borderColor: '#F1F5F9', backgroundColor: '#F8FAFC' },
  navBtnPrevText: { fontSize: 12, fontWeight: '800', marginLeft: 2 },
  navBtnNext: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: 12, gap: 5 },
  navBtnNextText: { fontSize: 12, fontWeight: '800', color: '#fff' },

  resultBannerWrap: { margin: 12, borderRadius: 16, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  resultBannerTop: { alignItems: 'center', paddingVertical: 24 },
  scoreCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  scoreText: { fontSize: 30, fontWeight: '900', color: '#fff' },
  scoreMsg: { color: '#fff', fontWeight: '700', fontSize: 15 },
  statsRow: { flexDirection: 'row' },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statBorder: { borderRightWidth: 1, borderRightColor: '#E2E8F0' },
  statVal: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 10, color: '#94A3B8', marginTop: 2, fontWeight: '600' },
  infoRow: { flexDirection: 'row', marginHorizontal: 12, gap: 8, marginBottom: 12 },
  infoCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  infoCardText: { marginLeft: 6 },
  infoCardLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
  infoCardVal: { fontWeight: '800', color: '#0F172A', fontSize: 12 },
  analysisSectionTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginHorizontal: 12, marginBottom: 8 },
  analysisList: { marginHorizontal: 12, gap: 8, paddingBottom: 20 },
  analysisCard: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1 },
  analysisTopIndicator: { height: 3 },
  analysisContent: { padding: 12 },
  analysisHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  analysisQNum: { fontSize: 10, fontWeight: '800', color: '#94A3B8' },
  analysisBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 12 },
  analysisBadgeText: { fontSize: 10, fontWeight: '800' },
  analysisQText: { fontSize: 12, fontWeight: '600', color: '#0F172A', lineHeight: 18, marginBottom: 8 },
  ansRow: { flexDirection: 'row', alignItems: 'center', padding: 9, borderRadius: 8, marginBottom: 5 },
  ansRowVal: { flex: 1, marginLeft: 7, fontSize: 12, fontWeight: '600' },
  ansRowLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
  expBox: { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  expTitle: { fontSize: 10, fontWeight: '800', color: '#94A3B8', marginBottom: 3 },
  expText: { fontSize: 11, color: '#64748B', lineHeight: 17 },
  resultFooter: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingHorizontal: 12, paddingTop: 10 },
  primaryBtn: { backgroundColor: '#3B82F6', paddingVertical: 12, borderRadius: 12, alignItems: 'center', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 }
});
