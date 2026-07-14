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
  ActivityIndicator,
  Pressable,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { Feather } from '@expo/vector-icons';
import { BASE_URL } from '../utils/baseUrl';
import { toggleSavedQuestion, getSavedStatus } from '../services/savedQuestionsApi';
import { saveProgress, completeProgress } from '../services/progressApi';

// ─── DESIGN TOKENS — "Test Booklet" ──────────────────────────────────────────
const PAPER         = '#FAF7F0';
const PAPER_ELEV    = '#FFFFFF';
const INK           = '#1C2B42';
const INK_SOFT      = '#5C6B80';
const INK_FAINT     = '#9CA7B4';
const RULE          = 'rgba(28,43,66,0.14)';
const RULE_SOFT     = 'rgba(28,43,66,0.08)';
const SEAL          = '#AE3B2A';
const SEAL_SOFT     = 'rgba(174,59,42,0.09)';
const SEAL_BORDER   = 'rgba(174,59,42,0.28)';
const CORRECT       = '#3E6A52';
const CORRECT_SOFT  = 'rgba(62,106,82,0.10)';
const CORRECT_BORDER = 'rgba(62,106,82,0.30)';
const MARKED        = '#8C6A1E';
const MARKED_SOFT   = 'rgba(140,106,30,0.10)';
const MARKED_BORDER = 'rgba(140,106,30,0.30)';

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
const MONO  = Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' });

// ─── CONSTANTS & FALLBACK DATA ───────────────────────────────────────────────
const LABELS = ['A', 'B', 'C', 'D', 'E'];

const STATUS_STYLE = {
  current:           { bg: INK,        border: INK,          text: PAPER_ELEV },
  answered:          { bg: CORRECT,    border: CORRECT,      text: PAPER_ELEV },
  marked:            { bg: MARKED,     border: MARKED,       text: PAPER_ELEV },
  'answered-marked': { bg: MARKED,     border: MARKED,       text: PAPER_ELEV },
  visited:           { bg: SEAL_SOFT,  border: SEAL_BORDER,  text: SEAL },
  notvisited:        { bg: PAPER_ELEV, border: RULE,         text: INK_FAINT },
};

const FALLBACK_TEST = {
  title: 'UPSC Prelims — GS Paper I',
  duration: 120,
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
  const { test, currentQuestion } = useLocalSearchParams();
  const router = useRouter();

  const [parsedTest, setParsedTest] = useState(() => safeParseTest(test));
  const questions = parsedTest.questions || [];
  const initialQuestion = Math.max(0, Number.parseInt(Array.isArray(currentQuestion) ? currentQuestion[0] : currentQuestion || '0', 10) || 0);

  const [current, setCurrent] = useState(initialQuestion);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [savedQ, setSavedQ] = useState({});
  const [savingQ, setSavingQ] = useState({});
  const [lang, setLang] = useState('EN');
  const [fontScale, setFontScale] = useState(1);
  const [timeLeft, setTimeLeft] = useState(parsedTest.duration * 60);
  const [timeTaken, setTimeTaken] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isLoadingTest, setIsLoadingTest] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [paletteOpen, setPaletteOpen] = useState(false);

  const touchX = useRef(0);
  const token = useSelector((state) => state.auth?.token);
  const timerRef = useRef(null);
  const pulseAnim = useMemo(() => new Animated.Value(1), []);
  const paletteAnim = useRef(new Animated.Value(0)).current;

  // ─── EFFECTS ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !parsedTest?._id) return;
    getSavedStatus(token, parsedTest._id)
      .then(({ savedIndices }) => {
        const map = {};
        savedIndices.forEach(idx => { map[idx] = true; });
        setSavedQ(map);
      })
      .catch(() => {});
  }, [token, parsedTest?._id]);

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
        setLoadError(error.message || 'Failed to load mock test');
      })
      .finally(() => setIsLoadingTest(false));
  }, [parsedTest?._id, questions.length]);

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
  }, [timeLeft, submitted, pulseAnim]);

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

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!submitted) { confirmExit(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [submitted]);

  useEffect(() => {
    // Smoother toggle animation for Palette
    Animated.timing(paletteAnim, {
      toValue: paletteOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [paletteOpen, paletteAnim]);

  const paletteTranslateX = paletteAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0], // Drawer width is 300
  });

  const backdropOpacity = paletteAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // ─── SWIPE HANDLERS ────────────────────────────────────────────────────────
  const onTouchStart = (e) => {
    touchX.current = e.nativeEvent.pageX;
  };

  const onTouchEnd = (e) => {
    const endX = e.nativeEvent.pageX;
    const distance = touchX.current - endX;
    const SWIPE_THRESHOLD = 50; 
    if (distance > SWIPE_THRESHOLD && current < questions.length - 1) {
      setCurrent(c => c + 1);
    } else if (distance < -SWIPE_THRESHOLD && current > 0) {
      setCurrent(c => c - 1);
    }
  };

  // ─── HELPERS ───────────────────────────────────────────────────────────────
  function confirmExit() {
    Alert.alert('Exit Test', 'Your progress will be lost. Exit anyway?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Exit', style: 'destructive', onPress: () => {
          clearInterval(timerRef.current);
          if (token && parsedTest?._id) {
            saveProgress(token, {
              resourceId: parsedTest._id,
              resourceType: 'mock_test',
              resourceTitle: parsedTest.title || '',
              currentQuestion: current,
              totalQuestions: questions.length,
              answeredCount: Object.keys(answers).length,
              metadata: { timeLeft },
            });
          }
          router.back();
        },
      },
    ]);
  }

  const handleSubmit = () => {
    const unanswered = questions.length - Object.keys(answers).length;
    Alert.alert(
      'Submit Test',
      unanswered > 0 ? `${unanswered} question(s) unanswered. Submit anyway?` : 'Are you sure you want to submit the test?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit', onPress: () => {
            clearInterval(timerRef.current);
            setSubmitted(true);
            if (token && parsedTest?._id) {
              const score = questions.filter((q, i) => answers[i] === (q.options?.indexOf(q.correctAnswer) ?? -1)).length;
              const acc = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
              completeProgress(token, {
                resourceId: parsedTest._id,
                resourceType: 'mock_test',
                status: 'completed',
                score,
                accuracy: acc,
                totalQuestions: questions.length,
                correctAnswers: score,
              });
            }
          },
        },
      ]
    );
  };

  const handleSaveQuestion = async (index) => {
    if (!token) return;
    const q = questions[index];
    if (!q) return;

    setSavingQ(prev => ({ ...prev, [index]: true }));
    try {
      const result = await toggleSavedQuestion(token, {
        sourceType: 'mock_test',
        resourceId: parsedTest._id || parsedTest.title || 'unknown',
        resourceTitle: parsedTest.title || '',
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
      setSavedQ(prev => ({ ...prev, [index]: result.saved }));
    } catch (err) {
      console.warn('Save question failed:', err.message);
    } finally {
      setSavingQ(prev => ({ ...prev, [index]: false }));
    }
  };

  const formatTime = s => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    const pad = n => String(n).padStart(2, '0');
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
  };

  const getCorrectIdx = q => q.options?.indexOf(q.correctAnswer) ?? -1;
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

  const qText = q => (lang === 'HI' && q.questionHi) ? q.questionHi : q.question;
  const opts = q => (lang === 'HI' && q.optionsHi?.length) ? q.optionsHi : q.options;
  const expText = q => (lang === 'HI' && q.explanationHi) ? q.explanationHi : (q.explanation || '');
  const corrText = q => (lang === 'HI' && q.correctAnswerHi) ? q.correctAnswerHi : q.correctAnswer;

  const renderLangToggle = () => (
    <View style={styles.langToggleWrap}>
      {['EN', 'HI'].map(l => (
        <TouchableOpacity key={l} onPress={() => setLang(l)} style={[styles.langBtn, lang === l && styles.langBtnActive]}>
          <Text style={[styles.langBtnText, lang === l && styles.langBtnTextActive]}>{l}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderFontToggle = () => (
    <View style={styles.fontToggleWrap}>
      {[ { label: 'A-', scale: 0.92 }, { label: 'A', scale: 1 }, { label: 'A+', scale: 1.12 } ].map((item) => (
        <TouchableOpacity key={item.label} onPress={() => setFontScale(item.scale)} style={[styles.fontBtn, fontScale === item.scale && styles.fontBtnActive]}>
          <Text style={[styles.fontBtnText, fontScale === item.scale && styles.fontBtnTextActive]}>{item.label}</Text>
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
    const band = percent >= 60
      ? { color: CORRECT, label: 'Strong attempt', icon: 'award' }
      : percent >= 35
        ? { color: MARKED, label: 'Needs more revision', icon: 'trending-up' }
        : { color: SEAL, label: 'Requires focused practice', icon: 'book-open' };

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#F97316" translucent={false} />
        <View style={{ backgroundColor: '#F97316', paddingTop: insets.top }} />
        <View style={[styles.header, { backgroundColor: PAPER_ELEV, borderBottomColor: RULE }]}>
            <View style={styles.headerTopRow}>
              <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                <Feather name="arrow-left" size={20} color={INK} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.kicker}>SCORE SHEET</Text>
                <Text style={styles.headerTitleMain} numberOfLines={1}>{parsedTest.title}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {renderLangToggle()}
                {renderFontToggle()}
              </View>
            </View>
          </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.resultBannerWrap}>
            <View style={styles.resultBannerTop}>
              <View style={[styles.scoreRing, { borderColor: band.color }]}>
                <Text style={[styles.scoreText, { color: band.color }]}>{percent}<Text style={styles.scoreTextPct}>%</Text></Text>
              </View>
              <View style={styles.scoreMsgRow}>
                <Feather name={band.icon} size={13} color={band.color} />
                <Text style={[styles.scoreMsg, { color: band.color }]}>{band.label}</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              {[
                { label: 'Correct', val: score, color: CORRECT },
                { label: 'Wrong', val: wrong, color: SEAL },
                { label: 'Skipped', val: skipped, color: INK_FAINT },
                { label: 'Net Marks', val: marks, color: INK },
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
                <Feather name={s.icon} size={14} color={INK_SOFT} />
                <View style={styles.infoCardText}>
                  <Text style={styles.infoCardLabel}>{s.label}</Text>
                  <Text style={styles.infoCardVal}>{s.val}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.sectionRuleRow}>
            <Text style={styles.sectionRuleTitle}>DETAILED ANALYSIS</Text>
            <View style={styles.sectionRuleLine} />
          </View>

          <View style={styles.analysisList}>
            {questions.map((q, i) => {
              const isCorrect = answers[i] === getCorrectIdx(q);
              const isSkipped = answers[i] === undefined;
              const barColor = isSkipped ? INK_FAINT : isCorrect ? CORRECT : SEAL;
              const badgeBg = isSkipped ? RULE_SOFT : isCorrect ? CORRECT_SOFT : SEAL_SOFT;
              const badgeText = isSkipped ? INK_SOFT : isCorrect ? CORRECT : SEAL;

              return (
                <View key={i} style={styles.analysisCard}>
                  <View style={[styles.analysisAccent, { backgroundColor: barColor }]} />
                  <View style={styles.analysisContent}>
                    <View style={styles.analysisHeaderRow}>
                      <View style={styles.qNumBadgeSm}>
                        <Text style={styles.qNumBadgeSmText}>Q{i + 1}</Text>
                      </View>
                      <View style={[styles.analysisBadge, { backgroundColor: badgeBg }]}>
                        <Text style={[styles.analysisBadgeText, { color: badgeText }]}>
                          {isSkipped ? 'SKIPPED' : isCorrect ? '+1.00' : '−0.25'}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Updated text component to accept font scale with base size 18 */}
                    <Text style={[styles.analysisQText, { fontSize: 18 * fontScale, lineHeight: 26 * fontScale }]}>
                      {qText(q)}
                    </Text>

                    {/* Applied font scale to the user's answer text for proportionality */}
                    <View style={[styles.ansRow, { backgroundColor: isCorrect ? CORRECT_SOFT : isSkipped ? RULE_SOFT : SEAL_SOFT }]}>
                      <Feather name={isSkipped ? 'minus-circle' : isCorrect ? 'check-circle' : 'x-circle'} size={13} color={isSkipped ? INK_FAINT : isCorrect ? CORRECT : SEAL} />
                      <Text style={[styles.ansRowVal, { fontSize: 13 * fontScale, color: isSkipped ? INK_FAINT : isCorrect ? CORRECT : SEAL, fontStyle: isSkipped ? 'italic' : 'normal' }]}>
                        {answers[i] !== undefined ? opts(q)[answers[i]] : 'Not answered'}
                      </Text>
                      <Text style={styles.ansRowLabel}>Your answer</Text>
                    </View>

                    {/* Applied font scale to the correct answer text */}
                    {!isCorrect && (
                      <View style={[styles.ansRow, { backgroundColor: CORRECT_SOFT }]}>
                        <Feather name="check-circle" size={13} color={CORRECT} />
                        <Text style={[styles.ansRowVal, { fontSize: 13 * fontScale, color: CORRECT }]}>{corrText(q)}</Text>
                        <Text style={styles.ansRowLabel}>Correct</Text>
                      </View>
                    )}

                    {/* Applied font scale to the explanation text */}
                    {expText(q) ? (
                      <View style={styles.expBox}>
                        <Text style={styles.expTitle}>EXPLANATION</Text>
                        <Text style={[styles.expText, { fontSize: 13 * fontScale, lineHeight: 19 * fontScale }]}>{expText(q)}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>

          <View style={[styles.resultFooter, { paddingBottom: insets.bottom + 8 }]}>
             <TouchableOpacity onPress={() => router.back()} style={styles.primaryBtn}>
               <Text style={styles.primaryBtnText}>Back to Tests</Text>
             </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─── MAIN TEST PLAYER ──────────────────────────────────────────────────────
  const q = questions[current];
  if (isLoadingTest) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor="#F97316" translucent={false} />
        <ActivityIndicator size="large" color={INK} />
        <Text style={styles.loadingText}>Loading test questions…</Text>
      </View>
    );
  }

  if (!q) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <StatusBar barStyle="light-content" backgroundColor="#F97316" translucent={false} />
        <Feather name="alert-circle" size={30} color={SEAL} />
        <Text style={styles.errorTitle}>{loadError || 'No questions found in this mock test'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.errorBtn}>
          <Text style={styles.errorBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progress = ((current + 1) / questions.length) * 100;
  const isMarked = !!marked[current];
  const isSaved = !!savedQ[current];
  const curOpts = opts(q) || [];
  const timerUrgent = timeLeft <= 60;
  const timerWarn = timeLeft <= 300 && !timerUrgent;
  const timerColor = timerUrgent ? SEAL : timerWarn ? MARKED : INK;
  const kickerText = parsedTest.seriesTitle || 'MOCK TEST';

  return (
    <View style={styles.container} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <StatusBar barStyle="light-content" backgroundColor="#F97316" />

      <View style={{ backgroundColor: '#F97316', paddingTop: insets.top }} />
      <View style={[styles.header, { backgroundColor: PAPER_ELEV, borderBottomColor: RULE }]}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={confirmExit} style={styles.closeBtn}>
              <Feather name="x" size={19} color={INK} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.kicker} numberOfLines={1}>{kickerText}</Text>
              <Text style={styles.headerTitleMain} numberOfLines={1}>{parsedTest.title}</Text>
            </View>
            <TouchableOpacity onPress={() => setPaletteOpen(true)} style={styles.menuIconBtn}>
              <Feather name="grid" size={20} color={INK} />
            </TouchableOpacity>
          </View>

          <View style={styles.headerControlsRow}>
            <Animated.View style={[styles.timerStamp, { borderColor: timerColor, transform: [{ scale: pulseAnim }] }]}>
              <Feather name="clock" size={11} color={timerColor} />
              <Text style={[styles.timerText, { color: timerColor }]}>{formatTime(timeLeft)}</Text>
            </Animated.View>
            {renderLangToggle()}
            {renderFontToggle()}
            <View style={{ flex: 1 }} />
            <Text style={styles.progressDataText}>Q {current + 1}/{questions.length}</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

      {/* 2. Main Scrollable Body */}
      <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <View style={styles.qHeaderRow}>
          <View style={styles.qNumBadge}>
            <Text style={styles.qNumBadgeText}>Q{current + 1}</Text>
          </View>
          <View style={styles.chipsRow}>
            <View style={[styles.chip, styles.chipCorrect]}>
              <Text style={[styles.chipText, { color: CORRECT }]}>+1.00</Text>
            </View>
            <View style={[styles.chip, styles.chipSeal]}>
              <Text style={[styles.chipText, { color: SEAL }]}>−0.25</Text>
            </View>
            {isMarked && (
              <View style={[styles.chip, styles.chipMarked]}>
                <Feather name="bookmark" size={10} color={MARKED} />
                <Text style={[styles.chipText, { color: MARKED, marginLeft: 3 }]}>Marked</Text>
              </View>
            )}
            {isSaved && (
              <View style={[styles.chip, styles.chipInk]}>
                <Feather name="star" size={10} color={INK} />
                <Text style={[styles.chipText, { color: INK, marginLeft: 3 }]}>Saved</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={[styles.questionTextMain, { fontSize: 15 * fontScale, lineHeight: 23 * fontScale }]}>{qText(q)}</Text>
        <View style={styles.qDivider} />

        <View style={styles.optionsWrap}>
          {curOpts.map((opt, i) => {
            const isSelected = answers[current] === i;
            return (
              <TouchableOpacity key={i} activeOpacity={0.75} onPress={() => setAnswers({ ...answers, [current]: i })} style={[styles.optBtn, isSelected && styles.optBtnSelected]}>
                <View style={[styles.bubble, isSelected && styles.bubbleSelected]}>
                  <Text style={[styles.bubbleText, isSelected && styles.bubbleTextSelected]}>{LABELS[i]}</Text>
                </View>
                <Text style={[styles.optText, isSelected && styles.optTextSelected, { fontSize: 13.5 * fontScale, lineHeight: 20 * fontScale }]}>{opt}</Text>
                {isSelected && <Feather name="check" size={15} color={INK} />}
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* 3. Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.footerTopRow}>
          <View style={styles.footerLeftActions}>
            <TouchableOpacity onPress={() => { const a = { ...answers }; delete a[current]; setAnswers(a); }} style={styles.secondaryBtn}>
              <Feather name="rotate-ccw" size={11} color={INK_SOFT} />
              <Text style={styles.secondaryBtnText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMarked({ ...marked, [current]: !marked[current] })} style={[styles.secondaryBtn, isMarked && styles.secondaryBtnMarkedActive]}>
              <Feather name="bookmark" size={11} color={isMarked ? MARKED : INK_SOFT} />
              <Text style={[styles.secondaryBtnText, isMarked && { color: MARKED }]}>{isMarked ? 'Marked' : 'Mark'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleSaveQuestion(current)} disabled={!!savingQ[current]} style={[styles.secondaryBtn, isSaved && styles.secondaryBtnSavedActive]}>
              {savingQ[current] ? <ActivityIndicator size={11} color={INK} /> : <Feather name="star" size={11} color={isSaved ? INK : INK_SOFT} />}
              <Text style={[styles.secondaryBtnText, isSaved && { color: INK }]}>{isSaved ? 'Saved' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleSubmit} style={styles.submitBtnMini}>
            <Feather name="check" size={11} color={CORRECT} />
            <Text style={styles.submitBtnMiniText}>Submit</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0} style={[styles.navBtnPrev, current === 0 && styles.navBtnPrevDisabled]}>
            <Feather name="chevron-left" size={17} color={current === 0 ? INK_FAINT : INK} />
            <Text style={[styles.navBtnPrevText, { color: current === 0 ? INK_FAINT : INK }]}>Prev</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => current < questions.length - 1 ? setCurrent(c => c + 1) : handleSubmit()} style={[styles.navBtnNext, { backgroundColor: current < questions.length - 1 ? INK : CORRECT }]}>
            <Text style={styles.navBtnNextText}>{current < questions.length - 1 ? 'Save & Next' : 'Submit Test'}</Text>
            <Feather name={current < questions.length - 1 ? 'chevron-right' : 'check'} size={15} color={PAPER_ELEV} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. PALETTE OVERLAY (Rendered last so it sits on top of everything) */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(28,43,66,0.45)', zIndex: 10, opacity: backdropOpacity }]} pointerEvents={paletteOpen ? 'auto' : 'none'}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setPaletteOpen(false)} />
      </Animated.View>

      <Animated.View 
        style={[
          styles.paletteSheet, 
          { 
            transform: [{ translateX: paletteTranslateX }], 
            paddingTop: insets.top + 16, // Respect safe area
            paddingBottom: insets.bottom + 16,
          }
        ]} 
        pointerEvents={paletteOpen ? 'auto' : 'none'}
      >
        <View style={styles.paletteHeader}>
          <View>
            <Text style={styles.kicker}>NAVIGATOR</Text>
            <Text style={styles.paletteTitle}>Question Palette</Text>
          </View>
          <TouchableOpacity onPress={() => setPaletteOpen(false)} style={styles.paletteCloseBtn}>
            <Feather name="x" size={18} color={INK} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.legendRow}>
          {[
            { color: CORRECT, label: 'Answered' },
            { color: SEAL_SOFT, border: SEAL_BORDER, label: 'Unanswered' },
            { color: MARKED, label: 'Marked' },
            { color: PAPER_ELEV, border: RULE, label: 'Not Visited' },
          ].map(l => (
            <View key={l.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: l.color, borderColor: l.border || 'transparent', borderWidth: l.border ? 1 : 0 }]} />
              <Text style={styles.legendText}>{l.label}</Text>
            </View>
          ))}
        </View>
        
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          <View style={styles.paletteGrid}>
            {questions.map((_, i) => {
              const s = STATUS_STYLE[getQStatus(i)];
              return (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.6}
                  onPress={() => { setCurrent(i); setPaletteOpen(false); }}
                  style={[styles.paletteBtn, { backgroundColor: s.bg, borderColor: s.border }]}
                >
                  <Text style={[styles.paletteBtnText, { color: s.text }]}>{String(i + 1).padStart(2, '0')}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </Animated.View>

    </View>
  );
}

// ─── STYLESHEET ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7ED' },

  kicker: { fontSize: 9.5, fontWeight: '800', color: '#EA580C', letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 1 },
  loadingText: { marginTop: 12, color: INK_SOFT, fontSize: 13 },
  errorTitle: { marginTop: 12, color: INK, fontSize: 14, fontWeight: '700', textAlign: 'center', fontFamily: SERIF },
  errorBtn: { marginTop: 16, backgroundColor: INK, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 10 },
  errorBtnText: { color: PAPER_ELEV, fontWeight: '800', fontSize: 13 },

  header: { backgroundColor: PAPER_ELEV, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 9, borderBottomWidth: 1, borderBottomColor: RULE, zIndex: 1 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 9 },
  closeBtn: { padding: 2, marginRight: 9, backgroundColor: '#F3F4F6', borderRadius: 10 },
  headerTitleMain: { fontSize: 14, fontWeight: '700', color: INK, fontFamily: SERIF },
  menuIconBtn: { paddingHorizontal: 8, paddingVertical: 4 },

  timerStamp: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 7, borderWidth: 1.5, backgroundColor: PAPER_ELEV },
  timerText: { fontWeight: '800', fontSize: 12, fontFamily: MONO },

  headerControlsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  progressDataText: { fontSize: 10.5, color: INK_SOFT, fontWeight: '600', fontFamily: MONO },

  progressBg: { height: 3, backgroundColor: RULE_SOFT, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: INK, borderRadius: 2 },

  langToggleWrap: { flexDirection: 'row', backgroundColor: PAPER_ELEV, borderRadius: 7, padding: 2, borderWidth: 1, borderColor: RULE },
  langBtn: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 5 },
  langBtnActive: { backgroundColor: INK },
  langBtnText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4, color: INK, fontFamily: MONO },
  langBtnTextActive: { color: PAPER_ELEV },
  
  fontToggleWrap: { flexDirection: 'row', backgroundColor: PAPER_ELEV, borderRadius: 7, padding: 2, borderWidth: 1, borderColor: RULE, marginLeft: 6 },
  fontBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5 },
  fontBtnActive: { backgroundColor: SEAL },
  fontBtnText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3, color: INK, fontFamily: MONO },
  fontBtnTextActive: { color: PAPER_ELEV },

  bodyScroll: { flex: 1 },
  bodyContent: { padding: 14 },

  qHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, gap: 8 },
  qNumBadge: { borderWidth: 1.5, borderColor: INK, borderRadius: 7, paddingHorizontal: 9, paddingVertical: 4, backgroundColor: PAPER_ELEV },
  qNumBadgeText: { fontSize: 12, fontWeight: '800', color: INK, fontFamily: SERIF },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flexShrink: 1, justifyContent: 'flex-end' },
  chip: { borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3.5, borderRadius: 6, flexDirection: 'row', alignItems: 'center' },
  chipCorrect: { backgroundColor: CORRECT_SOFT, borderColor: CORRECT_BORDER },
  chipSeal: { backgroundColor: SEAL_SOFT, borderColor: SEAL_BORDER },
  chipMarked: { backgroundColor: MARKED_SOFT, borderColor: MARKED_BORDER },
  chipInk: { backgroundColor: RULE_SOFT, borderColor: RULE },
  chipText: { fontSize: 10, fontWeight: '800', fontFamily: MONO },

  questionTextMain: { fontSize: 15, fontWeight: '600', color: INK, lineHeight: 23, marginBottom: 14, fontFamily: SERIF },
  qDivider: { height: 1, backgroundColor: RULE, marginBottom: 14 },

  optionsWrap: { gap: 9, marginBottom: 16 },
  optBtn: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: RULE, backgroundColor: PAPER_ELEV },
  optBtnSelected: { borderColor: INK, backgroundColor: '#F1EEE6' },

  bubble: { width: 27, height: 27, borderRadius: 14, borderWidth: 1.5, borderColor: INK_FAINT, alignItems: 'center', justifyContent: 'center', marginRight: 11, backgroundColor: PAPER },
  bubbleSelected: { backgroundColor: INK, borderColor: INK },
  bubbleText: { fontSize: 11.5, fontWeight: '800', color: INK_SOFT, fontFamily: MONO },
  bubbleTextSelected: { color: PAPER_ELEV },
  optText: { flex: 1, fontSize: 13.5, fontWeight: '500', lineHeight: 20, color: INK },
  optTextSelected: { color: INK, fontWeight: '700' },
  bottomSpacer: { height: 6 },

  footer: { backgroundColor: PAPER_ELEV, borderTopWidth: 1, borderTopColor: RULE, paddingHorizontal: 14, paddingTop: 10, zIndex: 1 },
  footerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 },
  footerLeftActions: { flexDirection: 'row', gap: 7 },
  secondaryBtn: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 7, borderWidth: 1, borderColor: RULE, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: PAPER },
  secondaryBtnMarkedActive: { borderColor: MARKED_BORDER, backgroundColor: MARKED_SOFT },
  secondaryBtnSavedActive: { borderColor: RULE, backgroundColor: RULE_SOFT },
  secondaryBtnText: { fontSize: 11, fontWeight: '700', color: INK_SOFT },
  submitBtnMini: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 7, borderWidth: 1, borderColor: CORRECT_BORDER, backgroundColor: CORRECT_SOFT },
  submitBtnMiniText: { fontSize: 11, fontWeight: '800', color: CORRECT },

  navRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  navBtnPrev: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: RULE, backgroundColor: PAPER_ELEV },
  navBtnPrevDisabled: { borderColor: RULE_SOFT, backgroundColor: PAPER },
  navBtnPrevText: { fontSize: 12.5, fontWeight: '800', marginLeft: 2 },
  navBtnNext: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 6 },
  navBtnNextText: { fontSize: 12.5, fontWeight: '800', color: PAPER_ELEV },

  // --- NEW POLISHED PALETTE DRAWER STYLES ---
  paletteSheet: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 300,
    backgroundColor: PAPER_ELEV,
    borderLeftWidth: 1,
    borderLeftColor: RULE,
    paddingHorizontal: 16,
    zIndex: 20, // Forces overlay
    elevation: 20, // Forces overlay on Android
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
  },
  paletteHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  paletteTitle: { fontSize: 16, fontWeight: '800', color: INK, fontFamily: SERIF, marginTop: 2 },
  paletteCloseBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: PAPER, borderWidth: 1, borderColor: RULE },

  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: RULE },
  legendItem: { flexDirection: 'row', alignItems: 'center', width: '45%' }, // Clean 2-column look
  legendDot: { width: 10, height: 10, borderRadius: 3, marginRight: 6 },
  legendText: { fontSize: 10.5, color: INK_SOFT, fontWeight: '600' },

  paletteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start' },
  paletteBtn: { width: 48, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  paletteBtnText: { fontSize: 13, fontWeight: '800', fontFamily: MONO },

  // Summary Result Banner
  resultBannerWrap: { margin: 14, marginBottom: 16, borderRadius: 14, backgroundColor: PAPER_ELEV, borderWidth: 1, borderColor: RULE, overflow: 'hidden' },
  resultBannerTop: { alignItems: 'center', paddingVertical: 26, borderBottomWidth: 1, borderBottomColor: RULE },
  scoreRing: { width: 92, height: 92, borderRadius: 46, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 12, backgroundColor: PAPER },
  scoreText: { fontSize: 28, fontWeight: '900', fontFamily: SERIF },
  scoreTextPct: { fontSize: 15, fontWeight: '700' },
  scoreMsgRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreMsg: { fontWeight: '700', fontSize: 13.5 },
  statsRow: { flexDirection: 'row' },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statBorder: { borderRightWidth: 1, borderRightColor: RULE },
  statVal: { fontSize: 18, fontWeight: '900', fontFamily: MONO },
  statLabel: { fontSize: 9.5, color: INK_SOFT, marginTop: 3, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
  infoRow: { flexDirection: 'row', marginHorizontal: 14, gap: 8, marginBottom: 16 },
  infoCard: { flex: 1, backgroundColor: PAPER_ELEV, borderRadius: 10, padding: 11, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: RULE },
  infoCardText: { marginLeft: 8 },
  infoCardLabel: { fontSize: 9.5, color: INK_FAINT, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  infoCardVal: { fontWeight: '800', color: INK, fontSize: 12.5, marginTop: 1, fontFamily: MONO },
  sectionRuleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 14, marginBottom: 10 },
  sectionRuleTitle: { fontSize: 11.5, fontWeight: '800', color: INK, letterSpacing: 1, fontFamily: SERIF },
  sectionRuleLine: { flex: 1, height: 1, backgroundColor: RULE },
  analysisList: { marginHorizontal: 14, gap: 9, paddingBottom: 24 },
  analysisCard: { flexDirection: 'row', backgroundColor: PAPER_ELEV, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: RULE },
  analysisAccent: { width: 3 },
  analysisContent: { flex: 1, padding: 12 },
  analysisHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  qNumBadgeSm: { borderWidth: 1, borderColor: RULE, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  qNumBadgeSmText: { fontSize: 10, fontWeight: '800', color: INK_SOFT, fontFamily: SERIF },
  analysisBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  analysisBadgeText: { fontSize: 9.5, fontWeight: '800', fontFamily: MONO, letterSpacing: 0.3 },
  analysisQText: { fontSize: 12.5, fontWeight: '600', color: INK, lineHeight: 19, marginBottom: 9 },
  ansRow: { flexDirection: 'row', alignItems: 'center', padding: 9, borderRadius: 8, marginBottom: 5 },
  ansRowVal: { flex: 1, marginLeft: 7, fontSize: 12, fontWeight: '600' },
  ansRowLabel: { fontSize: 9.5, color: INK_FAINT, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.2 },
  expBox: { marginTop: 7, paddingTop: 8, paddingLeft: 10, borderTopWidth: 1, borderTopColor: RULE, borderLeftWidth: 2, borderLeftColor: MARKED_BORDER },
  expTitle: { fontSize: 9.5, fontWeight: '800', color: MARKED, marginBottom: 3, letterSpacing: 0.5 },
  expText: { fontSize: 11.5, color: INK_SOFT, lineHeight: 17, fontStyle: 'italic' },
  resultFooter: { backgroundColor: PAPER_ELEV, borderTopWidth: 1, borderTopColor: RULE, paddingHorizontal: 14, paddingTop: 12 },
  primaryBtn: { backgroundColor: INK, paddingVertical: 13, borderRadius: 11, alignItems: 'center' },
  primaryBtnText: { color: PAPER_ELEV, fontWeight: '800', fontSize: 14 },
});
