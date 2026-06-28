import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, useWindowDimensions,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useDispatch, useSelector } from 'react-redux'
import { fetchTestSeriesById, fetchTestById, clearSelectedTest } from '../store/slices/testSeriesSlice'
import { createOrder, clearCurrentOrder } from '../store/slices/paymentSlice'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// ── Subject group config ─────────────────────────────────────────────────────
// Dynamic colors can't be in className, so we keep them here as data.
const GROUP_STYLES = {
  History:   { icon: 'clock',        bg: '#EEEDFE', fg: '#534AB7' },
  Geography: { icon: 'globe',        bg: '#E6F1FB', fg: '#185FA5' },
  Polity:    { icon: 'shield',       bg: '#FAECE7', fg: '#993C1D' },
  Economy:   { icon: 'trending-up',  bg: '#EAF3DE', fg: '#3B6D11' },
  Science:   { icon: 'zap',         bg: '#FAEEDA', fg: '#854F0B' },
  Maths:     { icon: 'percent',      bg: '#FBEAF0', fg: '#993556' },
  Reasoning: { icon: 'cpu',          bg: '#E1F5EE', fg: '#0F6E56' },
  English:   { icon: 'book-open',    bg: '#FCEBEB', fg: '#A32D2D' },
  Ungrouped: { icon: 'folder',       bg: '#F1EFE8', fg: '#5F5E5A' },
}
const DEFAULT_GROUP_STYLE = { icon: 'grid', bg: '#EEEDFE', fg: '#534AB7' }
const getGroupStyle = (name) => GROUP_STYLES[name] || DEFAULT_GROUP_STYLE

// ── Responsive grid helpers ──────────────────────────────────────────────────
// We use a manual flexWrap View (not FlatList numColumns) so the last partial
// row does NOT stretch — tiles always keep the exact computed width.
const H_PAD = 14
const GAP   = 10
const getNumCols       = (w) => (w >= 900 ? 4 : w >= 640 ? 3 : 2)
const getContentMaxW   = (w) => (w >= 900 ? 900 : undefined)

// ── Shadow presets (must stay as inline style — RN maps these to platform APIs)
const SHADOW_SM  = { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,  elevation: 1 }
const SHADOW_MD  = { shadowColor: '#6D28D9', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 }
const SHADOW_LG  = { shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1,  shadowRadius: 10, elevation: 3 }

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

  const { selectedSeries: series, seriesStatus, selectedTest, testStatus } =
    useSelector(s => s.testSeries)
  const { token, isAuthenticated }      = useSelector(s => s.auth)
  const { subscriptions, orderStatus, currentOrder } = useSelector(s => s.payment)

  const [activeGroup, setActiveGroup] = useState(null)

  const hasActiveSub = subscriptions.some(
    sub => sub.isActive && String(sub.seriesId?._id || sub.seriesId) === String(id)
  )

  useEffect(() => {
    dispatch(fetchTestSeriesById(id))
    return () => dispatch(clearSelectedTest())
  }, [id])

  useEffect(() => {
    if (testStatus === 'succeeded' && selectedTest) {
      dispatch(clearSelectedTest())
      router.push({
        pathname: '/mock-test-player',
        params: {
          test: JSON.stringify({
            ...selectedTest,
            title: selectedTest.title || series?.title,
            seriesTitle: series?.title,
          }),
        },
      })
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

  // ── Loading / empty guards ─────────────────────────────────────────────────
  if (seriesStatus === 'loading') return (
    <View className="flex-1 items-center justify-center bg-slate-50" style={{ paddingTop: insets.top }}>
      <ActivityIndicator size="large" color="#8B5CF6" />
    </View>
  )
  if (!series) return null

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleStartTest = (test) => {
    if (!series.isPaid || test.isFree || hasActiveSub) {
      dispatch(fetchTestById({ seriesId: series._id, testId: test._id }))
      return
    }
    handleBuyNow()
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

  // Bucket tests by group name
  const groups = (series.tests || []).reduce((acc, test) => {
    const name = test.group?.trim() || 'Ungrouped'
    let b = acc.find(g => g.title === name)
    if (!b) { b = { title: name, data: [] }; acc.push(b) }
    b.data.push(test)
    return acc
  }, [])

  const activeGroupData = activeGroup ? groups.find(g => g.title === activeGroup) : null

  // ── Subject tile (grid cell) ───────────────────────────────────────────────
  const renderGroupTile = (item) => {
    const st       = getGroupStyle(item.title)
    const freeCount = item.data.filter(t => t.isFree).length
    return (
      <TouchableOpacity
        key={item.title}
        activeOpacity={0.80}
        disabled={isTestLoading}
        onPress={() => setActiveGroup(item.title)}
        // tileWidth is computed → must stay in style
        style={[{ width: tileWidth }, SHADOW_MD, {
          backgroundColor: '#fff',
          borderRadius: 18,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: '#E8E4F4',
        }]}
      >
        {/* Coloured thumbnail block */}
        <View
          className="items-center justify-center"
          style={{ height: 78, backgroundColor: st.bg }}
        >
          {/* Semi-transparent circle behind icon */}
          <View
            className="w-11 h-11 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.48)' }}
          >
            <Feather name={st.icon} size={22} color={st.fg} />
          </View>
        </View>

        {/* Text row */}
        <View className="px-2.5 py-2">
          <Text
            className="text-[12.5px] font-extrabold text-slate-900 mb-0.5"
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text className="text-[10.5px] text-slate-400 font-semibold">
            {item.data.length} test{item.data.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Free badge */}
        {freeCount > 0 && (
          <View className="absolute top-1.5 right-1.5 bg-emerald-50 rounded-md px-1.5 py-0.5">
            <Text className="text-[8.5px] font-extrabold text-emerald-800">
              {freeCount} FREE
            </Text>
          </View>
        )}

        {/* Subtle bottom accent line using the group fg color */}
        <View style={{ height: 2.5, backgroundColor: st.fg, opacity: 0.25 }} />
      </TouchableOpacity>
    )
  }

  // ── Test card ──────────────────────────────────────────────────────────────
  const renderTestCard = (item, index) => {
    const isLocked = series.isPaid && !item.isFree && !hasActiveSub
    return (
      <View
        key={item._id}
        className={`rounded-2xl p-3.5 mb-2.5 border flex-row items-center
          ${isLocked ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200/80'}`}
        style={SHADOW_SM}
      >
        {/* Left: number / lock + info */}
        <View className="flex-1 flex-row items-center">
          {/* Index circle */}
          <View
            className={`w-9 h-9 rounded-xl items-center justify-center mr-3
              ${isLocked ? 'bg-slate-100' : 'bg-violet-50'}`}
          >
            {isLocked
              ? <Feather name="lock" size={13} color="#94A3B8" />
              : <Text className="text-[13px] font-black text-violet-500">{index + 1}</Text>
            }
          </View>

          {/* Title / meta */}
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
            </View>
          </View>
        </View>

        {/* CTA button */}
        <TouchableOpacity
          onPress={() => handleStartTest(item)}
          disabled={isTestLoading || isOrderLoading}
          className={`items-center justify-center px-3.5 py-2.5 rounded-xl ml-3 min-w-[58px]
            ${isLocked ? 'bg-slate-100' : 'bg-violet-500'}`}
        >
          {isTestLoading
            ? <ActivityIndicator size="small" color={isLocked ? '#94A3B8' : '#fff'} />
            : <Text className={`text-[11px] font-extrabold
                ${isLocked ? 'text-slate-500' : 'text-white'}`}>
                {isLocked ? 'Unlock' : 'Start'}
              </Text>
          }
        </TouchableOpacity>
      </View>
    )
  }

  // ── Series header (info card + price banner + section heading) ─────────────
  const renderSeriesHeader = () => (
    <View>
      {/* ── Info card ── */}
      <View
        className="bg-white rounded-2xl p-4 mb-3 border border-slate-200/80"
        style={SHADOW_LG}
      >
        <View className="flex-row items-start mb-3">
          {/* Book icon */}
          <View className="w-12 h-12 rounded-[14px] bg-violet-50 items-center justify-center mr-3">
            <Feather name="book" size={24} color="#8B5CF6" />
          </View>

          {/* Title block */}
          <View className="flex-1 mr-2">
            <Text
              className="text-[15px] font-extrabold text-slate-900 leading-[22px]"
              numberOfLines={2}
            >
              {series.title}
            </Text>
            <Text className="text-[11px] text-slate-500 font-semibold mt-0.5">
              📖 {series.bookName}
            </Text>
            {series.author ? (
              <Text className="text-[10.5px] text-slate-400 font-medium mt-0.5">
                by {series.author}
              </Text>
            ) : null}
          </View>

          {/* Paid / Free badge */}
          <View className={`self-start px-2 py-1 rounded-lg
            ${series.isPaid
              ? 'bg-orange-50 border border-orange-200'
              : 'bg-emerald-50 border border-emerald-200'
            }`}
          >
            <Text className={`text-[9px] font-extrabold tracking-widest
              ${series.isPaid ? 'text-amber-800' : 'text-emerald-800'}`}
            >
              {series.isPaid ? 'PAID' : 'FREE'}
            </Text>
          </View>
        </View>

        {/* Description */}
        {series.description ? (
          <Text className="text-[12.5px] text-slate-500 leading-5 mb-3">
            {series.description}
          </Text>
        ) : null}

        {/* Stats row */}
        <View className="flex-row border-t border-slate-100 pt-3">
          {[
            { icon: 'layers', val: `${series.tests?.length || 0}`, label: 'Tests' },
            { icon: 'tag',    val: series.subject,                  label: 'Subject' },
            { icon: 'grid',   val: series.category,                 label: 'Category' },
          ].map((s, i) => (
            <View key={i} className="flex-1 items-center gap-1">
              <Feather name={s.icon} size={13} color="#8B5CF6" />
              <Text className="text-[12.5px] font-extrabold text-slate-900 mt-0.5">
                {s.val}
              </Text>
              <Text className="text-[9.5px] text-slate-400 font-semibold uppercase tracking-wide">
                {s.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Price / subscription banner ── */}
      {series.isPaid && (
        hasActiveSub ? (
          /* Active sub */
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
          /* Locked — buy prompt */
          <View className="flex-row items-center bg-amber-50 rounded-2xl p-3.5 mb-3 border-2 border-amber-300">
            <View className="w-8 h-8 rounded-xl bg-amber-100 items-center justify-center mr-2.5">
              <Feather name="lock" size={14} color="#92400E" />
            </View>
            <View className="flex-1">
              <Text className="text-[12.5px] font-extrabold text-amber-900">
                Premium Series
              </Text>
              <Text className="text-[10.5px] text-amber-700 mt-0.5 leading-4">
                {series.freeTestsCount || 1} free test{series.freeTestsCount > 1 ? 's' : ''} available
                {' • '}Full unlock:{' '}
                {series.discountedPrice > 0 && series.discountedPrice < series.price
                  ? `₹${series.discountedPrice}`
                  : `₹${series.price}`}
                {' '}/ 30 days
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleBuyNow}
              disabled={isOrderLoading}
              className={`bg-amber-400 px-3.5 py-2.5 rounded-xl min-w-[70px] items-center
                ${isOrderLoading ? 'opacity-70' : ''}`}
            >
              {isOrderLoading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text className="text-white font-extrabold text-xs">
                    Buy ₹{displayAmount}
                  </Text>
              }
            </TouchableOpacity>
          </View>
        )
      )}

      {/* Section label */}
      <Text className="text-[13px] font-extrabold text-slate-800 mb-3 tracking-wide">
        Browse by Topic
      </Text>
    </View>
  )

  // ── Root render ────────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>

      {/* ── Top bar ── */}
      <View
        className="flex-row items-center bg-white px-4 py-3 border-b border-slate-100"
        style={SHADOW_SM}
      >
        <TouchableOpacity
          onPress={() => (activeGroup ? setActiveGroup(null) : router.back())}
          className="p-1.5 rounded-xl bg-slate-50 mr-2.5"
        >
          <Feather name="arrow-left" size={18} color="#334155" />
        </TouchableOpacity>

        <Text className="flex-1 text-[14.5px] font-bold text-slate-900" numberOfLines={1}>
          {activeGroup || series.title}
        </Text>

        {isAuthenticated && !activeGroup && (
          <TouchableOpacity
            onPress={() => router.push('/my-subscriptions')}
            className="p-1.5 rounded-xl bg-violet-50"
          >
            <Feather name="award" size={17} color="#8B5CF6" />
          </TouchableOpacity>
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
          // ── Group detail: coloured header + test list ──────────────────────
          <>
            {/* Group colour-block header */}
            <View
              className="flex-row items-center rounded-2xl p-3 mb-3"
              style={{ backgroundColor: getGroupStyle(activeGroup).bg }}
            >
              <View
                className="w-10 h-10 rounded-[12px] items-center justify-center mr-2.5"
                style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}
              >
                <Feather
                  name={getGroupStyle(activeGroup).icon}
                  size={18}
                  color={getGroupStyle(activeGroup).fg}
                />
              </View>
              <View className="flex-1">
                <Text
                  className="text-[13.5px] font-extrabold"
                  style={{ color: getGroupStyle(activeGroup).fg }}
                >
                  {activeGroup}
                </Text>
                <Text
                  className="text-[10.5px] font-semibold mt-0.5 opacity-75"
                  style={{ color: getGroupStyle(activeGroup).fg }}
                >
                  {activeGroupData?.data.length || 0}{' '}
                  test{(activeGroupData?.data.length || 0) !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            {/* Test cards */}
            {activeGroupData?.data.length
              ? activeGroupData.data.map((item, idx) => renderTestCard(item, idx))
              : (
                <View className="items-center justify-center py-14">
                  <Feather name="inbox" size={34} color="#CBD5E1" />
                  <Text className="text-slate-400 font-semibold text-sm mt-3">
                    No tests in this group yet
                  </Text>
                </View>
              )
            }
          </>
        ) : (
          // ── Grid view: header + tile grid ─────────────────────────────────
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
              // flexWrap grid — avoids FlatList numColumns last-row stretch bug
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