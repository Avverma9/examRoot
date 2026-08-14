import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, Image, TextInput,
  ActivityIndicator, Alert, useWindowDimensions, StatusBar,
} from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useDispatch, useSelector } from 'react-redux'
import { fetchTestSeriesById, fetchSeriesTestsMeta, fetchTestById, clearSelectedTest } from '../store/slices/testSeriesSlice'
import { createOrder, clearCurrentOrder } from '../store/slices/paymentSlice'
import { getProgressStatusBatch, getRecentProgress } from '../services/progressApi'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// ── Subject / topic config — matched by keyword against the free-text group name ────
const LUCENT_LOGO = require('../../assets/lucent.png')

const TOPIC_REGISTRY = [
  { match: /geograph/i,            icon: 'globe',       bg: '#fff', fg: '#1D8FCC', asset: require('../../assets/geography.png') },
  { match: /ecolog|environment/i,  icon: 'feather',      bg: '#fff', fg: '#3B8F2E', asset: require('../../assets/ecology.png') },
  { match: /econom/i,              icon: 'trending-up', bg: '#fff', fg: '#D89B2E', asset: require('../../assets/economy.png') },
  { match: /histor/i,              icon: 'clock',        bg: '#fff', fg: '#6D5CDE', asset: require('../../assets/history.png') },
  { match: /polity|constitution/i, icon: 'shield',       bg: '#fff', fg: '#C2622C', asset: require('../../assets/indian-constitution.png') },
  { match: /science/i,             icon: 'zap',          bg: '#FAEEDA', fg: '#B4820F' },
  { match: /math/i,                icon: 'percent',      bg: '#FBEAF0', fg: '#C24E7C' },
  { match: /reason/i,              icon: 'cpu',          bg: '#E1F5EE', fg: '#12967A' },
  { match: /english/i,             icon: 'book-open',    bg: '#FCEBEB', fg: '#C43E3E' },
]
const DEFAULT_TOPIC_STYLE = { icon: 'grid', bg: '#f8f8f8', fg: '#D89B2E', asset: null }
const getTopicStyle = (name) => TOPIC_REGISTRY.find(t => t.match.test(name)) || DEFAULT_TOPIC_STYLE

// ── Responsive grid helpers ──────────────────────────────────────────────────
const H_PAD = 14
const GAP   = 10
const getNumCols       = (w) => (w >= 900 ? 4 : w >= 640 ? 3 : 2)
const getContentMaxW   = (w) => (w >= 900 ? 900 : undefined)

// ── Shadow presets ───────────────────────────────────────────────────────────
const SHADOW_SM  = { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,  elevation: 1 }
const SHADOW_MD  = { shadowColor: '#EA580C', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 }
const SHADOW_LG  = { shadowColor: '#C2410C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1,  shadowRadius: 10, elevation: 3 }

// ── Small circular % ring used on "Resume" test rows ─────────────────────────
function ProgressRing({ percent = 0, size = 34, strokeWidth = 3, color = '#2563EB' }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - Math.min(100, Math.max(0, percent)) / 100)
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#E2E8F0" strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={{ position: 'absolute', fontSize: 8.5, fontWeight: '800', color }}>
        {Math.round(percent)}%
      </Text>
    </View>
  )
}

// Compact "1.4k" style formatter for the global attempts badge
const formatCount = (n) => {
  if (!n) return '0'
  if (n >= 100000) return `${Math.round(n / 1000)}k`
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
}

// ── Component ────────────────────────────────────────────────────────────────
export default function TestSeriesDetail() {
  const { id }   = useLocalSearchParams()
  const dispatch = useDispatch()
  const router   = useRouter()
  const insets   = useSafeAreaInsets()
  const { width } = useWindowDimensions()

  const numCols        = getNumCols(width)
  const contentMaxW    = getContentMaxW(width)
  const effectiveW     = Math.min(width, contentMaxW || width)
  const tileWidth      = (effectiveW - H_PAD * 2 - GAP * (numCols - 1)) / numCols

  const { selectedSeries: series, selectedSeriesTests, seriesStatus, selectedTest, testStatus } =
    useSelector(s => s.testSeries)
  const { token, isAuthenticated }      = useSelector(s => s.auth)
  const { subscriptions, orderStatus, currentOrder } = useSelector(s => s.payment)

  const [activeGroup, setActiveGroup] = useState(null)
  // Track which test is specifically loading to fix the global spinner bug
  const [loadingTestId, setLoadingTestId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  // { [testId]: { status: 'in_progress' | 'completed', percent, accuracy } }
  const [progressMap, setProgressMap] = useState({})
  const resumeProgressRef = useRef(null)

  const hasActiveSub = subscriptions.some(
    sub => sub.isActive && String(sub.seriesId?._id || sub.seriesId) === String(id)
  )

  useEffect(() => {
    dispatch(fetchTestSeriesById(id))
    dispatch(fetchSeriesTestsMeta(id))
    return () => dispatch(clearSelectedTest())
  }, [id])

  useEffect(() => {
    if (testStatus === 'succeeded' && selectedTest) {
      const resume = resumeProgressRef.current
      router.push({
        pathname: '/mock-test-player',
        params: {
          test: JSON.stringify({
            ...selectedTest,
            title: selectedTest.title || series?.title,
            seriesTitle: series?.title,
          }),
          ...(resume?.status === 'in_progress'
            ? {
                currentQuestion: String(resume.metadata?.currentQuestion ?? 0),
                answers: JSON.stringify(resume.metadata?.answers || {}),
                timeLeft: String(resume.metadata?.timeLeft ?? ((selectedTest.duration || 120) * 60)),
              }
            : {}),
        },
      })
      resumeProgressRef.current = null
      dispatch(clearSelectedTest())
    }

    if (testStatus === 'succeeded' || testStatus === 'failed') {
      const timer = setTimeout(() => setLoadingTestId(null), 0)
      return () => clearTimeout(timer)
    }
  }, [testStatus, selectedTest])

  useEffect(() => {
    if (orderStatus === 'succeeded' && currentOrder) {
      const amt = series?.discountedPrice > 0 && series?.discountedPrice < series?.price
        ? series.discountedPrice : series?.price
      router.push({
        pathname: '/cashfree-checkout',
        params: {
          orderId:          currentOrder.orderId,
          paymentSessionId: currentOrder.paymentSessionId,
          seriesId:         id,
          seriesTitle:      series?.title || '',
          amount:           String(amt || currentOrder.orderAmount || ''),
        },
      })
      dispatch(clearCurrentOrder())
    }
  }, [orderStatus, currentOrder])

  // ── Refresh per-test progress (Resume %, Completed) whenever screen regains focus ──
  const testIdsKey = (selectedSeriesTests || series?.tests || []).map(t => t._id).join(',')
  useFocusEffect(
    useCallback(() => {
      if (!token || !testIdsKey) return
      const resourceIds = testIdsKey.split(',').filter(Boolean)
      if (!resourceIds.length) return
      getProgressStatusBatch(token, resourceIds).then(async (map) => {
        if (Object.keys(map || {}).length > 0) {
          setProgressMap(map)
          return
        }

        // Fallback for an older deployment where status-batch is not available.
        // The saved session still contains enough data to show Resume and %.
        try {
          const recent = await getRecentProgress(token)
          const fallback = {}
          for (const item of recent?.data || []) {
            if (!resourceIds.includes(String(item.resourceId))) continue
            const total = item.totalQuestions || item.metadata?.totalQuestions || 0
            const answered = item.metadata?.answeredCount || 0
            fallback[item.resourceId] = {
              status: item.status,
              percent: total > 0 ? Math.min(100, Math.round((answered / total) * 100)) : 0,
              accuracy: null,
              attemptCount: 1,
              globalAttempts: 0,
              metadata: item.metadata || {},
            }
          }
          setProgressMap(fallback)
        } catch (_) {
          setProgressMap({})
        }
      })
    }, [token, testIdsKey])
  )

  // ── Loading / empty guards ─────────────────────────────────────────────────
  if (seriesStatus === 'loading') return (
    <View className="flex-1 items-center justify-center bg-orange-50">
      <StatusBar barStyle="light-content" backgroundColor="#F97316" translucent={false} />
      <ActivityIndicator size="large" color="#F97316" />
    </View>
  )
  if (!series) return null

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleStartTestClick = (test) => {
    if (!series.isPaid || test.isFree || hasActiveSub) {
      resumeProgressRef.current = progressMap[test._id]?.status === 'in_progress'
        ? progressMap[test._id]
        : null
      // Only set loading for this specific test ID
      setLoadingTestId(test._id)
      dispatch(fetchTestById({ seriesId: series._id, testId: test._id }))
    } else {
      handleBuyNow()
    }
  }

  const handleBuyNow = () => {
    if (!isAuthenticated || !token) {
      Alert.alert('Login Required', 'Please login to purchase a subscription.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/login') },
      ])
      return
    }
    dispatch(createOrder({ seriesId: series._id, token }))
  }

  const displayAmount  = series.discountedPrice > 0 && series.discountedPrice < series.price
    ? series.discountedPrice : series.price
  const isOrderLoading = orderStatus === 'loading'
  const isTestLoading  = testStatus  === 'loading'

  const testsForRender = (selectedSeriesTests && selectedSeriesTests.length)
    ? selectedSeriesTests
    : (series.tests || [])

  const groups = testsForRender.reduce((acc, test) => {
    const name = test.group?.trim() || 'Ungrouped'
    let b = acc.find(g => g.title === name)
    if (!b) { b = { title: name, data: [] }; acc.push(b) }
    b.data.push(test)
    return acc
  }, [])

  const activeGroupData = activeGroup ? groups.find(g => g.title === activeGroup) : null
  const activeGroupTests = activeGroupData?.data || []
  const filteredActiveGroupTests = searchQuery.trim()
    ? activeGroupTests.filter(t =>
        t.title?.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : activeGroupTests
  const completedInGroup = activeGroupTests.filter(t => progressMap[t._id]?.status === 'completed').length

  // ── Subject tile (grid cell) ───────────────────────────────────────────────
  const renderGroupTile = (item) => {
    const st        = getTopicStyle(item.title)
    const freeCount = item.data.filter(t => t.isFree).length
    return (
      <TouchableOpacity
        key={item.title}
        activeOpacity={0.80}
        disabled={isTestLoading}
        onPress={() => setActiveGroup(item.title)}
        style={[{ width: tileWidth }, SHADOW_MD, {
          backgroundColor: '#fff',
          borderRadius: 18,
          overflow: 'hidden',
        }]}
      >
        <View
          className="items-center justify-center"
          style={{ height: 100, backgroundColor: st.bg }}
        >
          {st.asset ? (
            <Image
              source={st.asset}
              style={{ width: 76, height: 76 }}
              resizeMode="contain"
            />
          ) : (
            <Feather name={st.icon} size={32} color={st.fg} />
          )}
        </View>

        {freeCount > 0 && (
          <View className="absolute top-2 right-2 bg-emerald-500 rounded-md px-1.5 py-0.5">
            <Text className="text-[8.5px] font-extrabold text-white">
              {freeCount} FREE
            </Text>
          </View>
        )}

        <View className="px-3 py-2.5">
          <Text
            className="text-[13px] font-extrabold text-slate-900 mb-0.5"
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text className="text-[11px] text-slate-400 font-semibold">
            {item.data.length} test{item.data.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </TouchableOpacity>
    )
  }

  // ── Test card ──────────────────────────────────────────────────────────────
  const renderTestCard = (item, index) => {
    const isLocked = series.isPaid && !item.isFree && !hasActiveSub
    const isThisTestLoading = isTestLoading && loadingTestId === item._id
    const progress = progressMap[item._id]
    const isCompleted  = progress?.status === 'completed'
    const isInProgress = progress?.status === 'in_progress'

    return (
      <View
        key={item._id}
        className={`rounded-2xl p-3.5 mb-2.5 border flex-row items-center
          ${isLocked ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200/80'}`}
        style={SHADOW_SM}
      >
        <View className="flex-1 flex-row items-center">
          <View
            className={`w-9 h-9 rounded-xl items-center justify-center mr-3
              ${isLocked ? 'bg-slate-100' : 'bg-slate-100'}`}
          >
            {isLocked
              ? <Feather name="lock" size={13} color="#94A3B8" />
              : <Text className="text-[13px] font-black text-slate-600">{index + 1}</Text>
            }
          </View>

          <View className="flex-1">
            <Text
              className={`text-[13px] font-bold leading-[19px] mb-0.5
                ${isLocked ? 'text-slate-400' : 'text-slate-900'}`}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            {item.description ? (
              <Text className="text-[11px] text-slate-500 mb-1" numberOfLines={1}>
                {item.description}
              </Text>
            ) : null}
            <View className="flex-row items-center flex-wrap mt-0.5">
              <Feather name="help-circle" size={10} color="#94A3B8" />
              <Text className="text-[10px] text-slate-400 font-semibold ml-0.5 mr-2">
                {item.totalQuestions || item.questions?.length || 0} Qs
              </Text>
              <Feather name="clock" size={10} color="#94A3B8" />
              <Text className="text-[10px] text-slate-400 font-semibold ml-0.5">
                {item.duration} min
              </Text>
              {item.isFree && (
                <View className="bg-emerald-50 rounded px-1.5 py-0.5 ml-2">
                  <Text className="text-[8.5px] font-extrabold text-emerald-800">FREE</Text>
                </View>
              )}
              {(progress?.attemptCount > 0 || progress?.globalAttempts > 0) && (
                <View className="flex-row items-center bg-slate-100 rounded-full px-1.5 py-0.5 ml-2">
                  <Feather name="user" size={8} color="#64748B" />
                  <Text className="text-[8.5px] font-extrabold text-slate-600 ml-0.5">
                    {formatCount(progress.attemptCount || progress.globalAttempts)} Attempts
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => handleStartTestClick(item)}
          disabled={isTestLoading || isOrderLoading}
          className={`flex-row items-center justify-center px-4 py-2.5 rounded-xl ml-3 min-w-[70px]
            ${isLocked ? 'bg-slate-100' : isCompleted || isInProgress ? 'bg-blue-600' : 'bg-orange-500'}`}
        >
          {isThisTestLoading ? (
            <ActivityIndicator size="small" color={isLocked ? '#94A3B8' : '#fff'} />
          ) : isLocked ? (
            <>
              <Feather name="lock" size={11} color="#64748B" style={{ marginRight: 4 }} />
              <Text className="text-[11px] font-extrabold text-slate-500">Unlock</Text>
            </>
          ) : isCompleted ? (
            <>
              <Text className="text-[11px] font-extrabold text-white mr-2">Re-attempt</Text>
              <ProgressRing percent={progress.percent ?? 100} size={26} strokeWidth={2.5} color="#22C55E" />
            </>
          ) : isInProgress ? (
            <>
              <Text className="text-[11px] font-extrabold text-white mr-2">Resume</Text>
              <ProgressRing percent={progress.percent} size={26} strokeWidth={2.5} color="#fff" />
            </>
          ) : (
            <Text className="text-[11px] font-extrabold text-white">Start Now</Text>
          )}
        </TouchableOpacity>
      </View>
    )
  }

  // ── Series header ──────────────────────────────────────────────────────────
  const renderSeriesHeader = () => (
    <View>
      <View style={{ marginBottom: -48, zIndex: 2 }} className="flex-row items-center px-3">
        <View style={[SHADOW_LG, { transform: [{ rotate: '-8deg' }] }]}>
          <Image
            source={LUCENT_LOGO}
            style={{ width: 88, height: 116, borderRadius: 8 }}
            resizeMode="contain"
          />
        </View>

        <View className="flex-1 ml-3 mr-2">
          <Text
            className="text-[15px] font-extrabold text-slate-900 leading-[20px]"
            numberOfLines={2}
          >
            {series.title}
          </Text>
          {series.author ? (
            <Text className="text-[11px] text-slate-400 font-semibold mt-0.5">
              by {series.author}
            </Text>
          ) : null}
        </View>

        <View
          className="w-14 h-14 rounded-full items-center justify-center border-4 border-white"
          style={[SHADOW_MD, { backgroundColor: '#123B3B' }]}
        >
          <Feather name="award" size={22} color="#F5C242" />
        </View>
      </View>

      <View
        className="bg-white rounded-2xl px-4 pb-4 mb-3 border border-slate-200/80 items-center"
        style={[SHADOW_LG, { paddingTop: 56 }]}
      >
        {series.description ? (
          <Text className="text-[12.5px] text-slate-500 leading-5 text-center">
            {series.description}
          </Text>
        ) : null}

        <View className="flex-row w-full mt-3" style={{ gap: 8 }}>
          {[
            { icon: 'layers', val: `${testsForRender.length || 0}`, label: 'Tests',    fg: '#2C5AA0', bg: '#E6F1FB' },
            { icon: 'tag',    val: series.subject,                  label: 'Subject',  fg: '#C2622C', bg: '#FBEDE5' },
            { icon: 'grid',   val: series.category,                 label: 'Category', fg: '#6D5CDE', bg: '#EDEBFD' },
          ].map((s, i) => (
            <View
              key={i}
              className="flex-1 items-center px-2 py-2 rounded-xl border border-slate-100"
              style={{ backgroundColor: s.bg }}
            >
              <Feather name={s.icon} size={13} color={s.fg} />
              <Text className="text-[11.5px] font-extrabold text-slate-900 mt-1" numberOfLines={1}>
                {s.val}
              </Text>
              <Text className="text-[8.5px] text-slate-500 font-semibold uppercase tracking-wide mt-0.5">
                {s.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {series.isPaid && (
        hasActiveSub ? (
          <View className="flex-row items-center bg-emerald-50 rounded-2xl p-3.5 mb-3 border-2 border-emerald-200">
            <View className="w-8 h-8 rounded-xl bg-emerald-100 items-center justify-center mr-2.5">
              <Feather name="check-circle" size={15} color="#059669" />
            </View>
            <View className="flex-1">
              <Text className="text-[12.5px] font-extrabold text-emerald-900">
                Subscription Active ✓
              </Text>
              <Text className="text-[10.5px] text-emerald-600 mt-0.5">
                All tests unlocked •{' '}
                {(() => {
                  const sub = subscriptions.find(
                    s => String(s.seriesId?._id || s.seriesId) === String(id)
                  )
                  if (!sub) return ''
                  const days = Math.max(
                    0,
                    Math.ceil((new Date(sub.endDate) - new Date()) / 86_400_000)
                  )
                  return `${days} days left`
                })()}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/my-subscriptions')}
              className="bg-emerald-100 px-3 py-2 rounded-xl"
            >
              <Text className="text-emerald-900 font-extrabold text-[11px]">Manage</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <LinearGradient
            colors={['#7C3AED', '#F97316']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 18, padding: 14, marginBottom: 12 }}
            className="flex-row items-center"
          >
            <View className="w-8 h-8 rounded-xl bg-white/25 items-center justify-center mr-2.5">
              <Feather name="lock" size={14} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="text-[12.5px] font-extrabold text-white">
                Premium Series
              </Text>
              <Text className="text-[10.5px] text-white/85 mt-0.5 leading-4">
                Free for a limited time • Unlock all mock tests today
              </Text>
            </View>
            {/* <TouchableOpacity
              onPress={handleBuyNow}
              disabled={isOrderLoading}
              className={`bg-white px-3.5 py-2.5 rounded-xl min-w-[70px] items-center
                ${isOrderLoading ? 'opacity-70' : ''}`}
            >
              {isOrderLoading
                ? <ActivityIndicator size="small" color="#F97316" />
                : (
                  <Text className="text-orange-600 font-extrabold text-xs">
                    {series.discountedPrice > 0 && series.discountedPrice < series.price ? (
                      <>
                        <Text style={{ textDecorationLine: 'line-through', color: '#C2410C99' }}>
                          ₹{series.price}
                        </Text>
                        {'  '}₹{displayAmount}
                      </>
                    ) : (
                      <>Buy ₹{displayAmount}</>
                    )}
                  </Text>
                )
              }
            </TouchableOpacity> */}
          </LinearGradient>
        )
      )}

      <Text className="text-[13px] font-extrabold text-slate-800 mb-3 tracking-wide mt-1">
        Browse by Topic
      </Text>
    </View>
  )

  // ── Root render ────────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-orange-50">
      <StatusBar barStyle="light-content" backgroundColor="#F97316" translucent={false} />

      <View style={{ backgroundColor: '#F97316', paddingTop: insets.top }} />

      <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
        <View
          className="flex-row items-center px-4 py-3"
          style={SHADOW_SM}
        >
          <TouchableOpacity
            onPress={() => (activeGroup ? setActiveGroup(null) : router.back())}
            className="p-1.5 rounded-xl bg-gray-100 mr-3"
          >
            <Feather name="arrow-left" size={19} color="#1C2B42" />
          </TouchableOpacity>

          <Text className="flex-1 text-[16px] font-bold text-slate-900 tracking-wide" numberOfLines={1}>
            {activeGroup || series.title}
          </Text>

          {activeGroup && (
            <TouchableOpacity
              onPress={() => { setSearchOpen(o => !o); if (searchOpen) setSearchQuery('') }}
              className="p-2 rounded-xl bg-gray-100 mr-2"
            >
              <Feather name={searchOpen ? 'x' : 'search'} size={18} color="#1C2B42" />
            </TouchableOpacity>
          )}

          {isAuthenticated && !activeGroup && (
            <TouchableOpacity
              onPress={() => router.push('/my-subscriptions')}
              className="p-2 rounded-xl bg-gray-100"
            >
              <Feather name="award" size={18} color="#1C2B42" />
            </TouchableOpacity>
          )}
        </View>

        {activeGroup && searchOpen && (
          <View className="flex-row items-center mx-4 mb-3 px-3 py-2 rounded-xl bg-gray-100">
            <Feather name="search" size={14} color="#94A3B8" />
            <TextInput
              autoFocus
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={`Search in ${activeGroup}...`}
              placeholderTextColor="#94A3B8"
              className="flex-1 ml-2 text-[13px] text-slate-800"
            />
          </View>
        )}
      </View>

      {/* ── Scrollable body ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          { paddingHorizontal: H_PAD, paddingTop: H_PAD, paddingBottom: 36 },
          contentMaxW && { maxWidth: contentMaxW, alignSelf: 'center', width: '100%' },
        ]}
      >
        {activeGroup ? (
          <>
            <View
              className="flex-row items-center bg-white rounded-2xl p-3 mb-4 border border-slate-200/80"
              style={SHADOW_MD}
            >
              <View
                className="w-16 h-16 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: getTopicStyle(activeGroup).bg }}
              >
                {getTopicStyle(activeGroup).asset ? (
                  <Image
                    source={getTopicStyle(activeGroup).asset}
                    style={{ width: 56, height: 56 }}
                    resizeMode="contain"
                  />
                ) : (
                  <Feather name={getTopicStyle(activeGroup).icon} size={30} color={getTopicStyle(activeGroup).fg} />
                )}
              </View>

              <View className="flex-1">
                <Text className="text-[15px] font-extrabold text-slate-900">
                  {activeGroupTests.length} Test{activeGroupTests.length !== 1 ? 's' : ''} available
                </Text>
                <View className="h-1.5 rounded-full bg-slate-100 mt-2 overflow-hidden">
                  <View
                    className="h-full rounded-full bg-blue-600"
                    style={{
                      width: `${activeGroupTests.length ? Math.round((completedInGroup / activeGroupTests.length) * 100) : 0}%`,
                    }}
                  />
                </View>
                <Text className="text-[10.5px] text-slate-400 font-semibold mt-1.5">
                  {completedInGroup}/{activeGroupTests.length} Completed
                </Text>
              </View>
            </View>

            <Text className="text-[13px] font-extrabold text-slate-800 mb-3 tracking-wide">
              {activeGroup} Test Pages
            </Text>

            {filteredActiveGroupTests.length
              ? filteredActiveGroupTests.map((item, idx) => renderTestCard(item, idx))
              : (
                <View className="items-center justify-center py-14">
                  <Feather name="inbox" size={34} color="#CBD5E1" />
                  <Text className="text-slate-400 font-semibold text-sm mt-3">
                    {searchQuery.trim() ? 'No tests match your search' : 'No tests in this group yet'}
                  </Text>
                </View>
              )
            }
          </>
        ) : (
          <>
            {renderSeriesHeader()}

            {groups.length === 0 ? (
              <View className="items-center justify-center py-14">
                <Feather name="inbox" size={34} color="#CBD5E1" />
                <Text className="text-slate-400 font-semibold text-sm mt-3">
                  No tests available yet
                </Text>
              </View>
            ) : (
              <View
                className="flex-row flex-wrap"
                style={{ gap: GAP }}
              >
                {groups.map(item => renderGroupTile(item))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  )
}
