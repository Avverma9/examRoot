import { useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useDispatch, useSelector } from 'react-redux'
import { fetchTestSeriesById, fetchTestById, clearSelectedTest } from '../store/slices/testSeriesSlice'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function TestSeriesDetail() {
  const { id } = useLocalSearchParams()
  const dispatch = useDispatch()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { selectedSeries: series, seriesStatus, selectedTest, testStatus } = useSelector(s => s.testSeries)

  useEffect(() => {
    dispatch(fetchTestSeriesById(id))
    return () => dispatch(clearSelectedTest())
  }, [id])

  // When test loads navigate to player
  useEffect(() => {
    if (testStatus === 'succeeded' && selectedTest) {
      dispatch(clearSelectedTest())
      router.push({ pathname: '/mock-test-player', params: { test: JSON.stringify({ ...selectedTest, title: series?.title }) } })
    }
  }, [testStatus, selectedTest])

  if (seriesStatus === 'loading') return (
    <View style={[styles.center, { paddingTop: insets.top }]}>
      <ActivityIndicator size="large" color="#8B5CF6" />
    </View>
  )

  if (!series) return null

  const handleStartTest = (test) => {
    if (series.isPaid && !test.isFree) {
      // Paid test — show purchase prompt (extend with payment gateway)
      return alert('This test requires a paid subscription.')
    }
    dispatch(fetchTestById({ seriesId: series._id, testId: test._id }))
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#334155" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{series.title}</Text>
      </View>

      <FlatList
        data={series.tests || []}
        keyExtractor={(t) => t._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            {/* Series Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoTop}>
                <View style={styles.iconWrap}>
                  <Feather name="book" size={26} color="#8B5CF6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoTitle}>{series.title}</Text>
                  <Text style={styles.infoBook}>📖 {series.bookName}</Text>
                  {series.author ? <Text style={styles.infoAuthor}>by {series.author}</Text> : null}
                </View>
                <View style={[styles.badge, series.isPaid ? styles.badgePaid : styles.badgeFree]}>
                  <Text style={[styles.badgeText, series.isPaid ? styles.badgeTextPaid : styles.badgeTextFree]}>
                    {series.isPaid ? 'PAID' : 'FREE'}
                  </Text>
                </View>
              </View>
              {series.description ? <Text style={styles.infoDesc}>{series.description}</Text> : null}
              <View style={styles.statsRow}>
                {[
                  { icon: 'layers', val: `${series.tests?.length || 0}`, label: 'Tests' },
                  { icon: 'tag', val: series.subject, label: 'Subject' },
                  { icon: 'grid', val: series.category, label: 'Category' },
                ].map((s, i) => (
                  <View key={i} style={styles.statItem}>
                    <Feather name={s.icon} size={14} color="#8B5CF6" />
                    <Text style={styles.statVal}>{s.val}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {series.isPaid && (
              <View style={styles.priceBanner}>
                <Feather name="lock" size={16} color="#92400E" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.priceBannerTitle}>Premium Series</Text>
                  <Text style={styles.priceBannerSub}>
                    {series.freeTestsCount || 1} free test{series.freeTestsCount > 1 ? 's' : ''} available • Unlock all for{' '}
                    {series.discountedPrice > 0 && series.discountedPrice < series.price
                      ? `₹${series.discountedPrice}`
                      : `₹${series.price}`}
                  </Text>
                </View>
                <TouchableOpacity style={styles.buyBtn}>
                  <Text style={styles.buyBtnText}>Buy Now</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.testsHeading}>All Tests</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const isLocked = series.isPaid && !item.isFree
          const isLoading = testStatus === 'loading'
          return (
            <View style={[styles.testCard, isLocked && styles.testCardLocked]}>
              <View style={styles.testLeft}>
                <View style={[styles.testNumCircle, isLocked && styles.testNumCircleLocked]}>
                  {isLocked
                    ? <Feather name="lock" size={14} color="#94A3B8" />
                    : <Text style={styles.testNum}>{index + 1}</Text>
                  }
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.testTitle, isLocked && styles.testTitleLocked]} numberOfLines={2}>{item.title}</Text>
                  <View style={styles.testMeta}>
                    <Feather name="help-circle" size={11} color="#94A3B8" />
                    <Text style={styles.testMetaText}>{item.totalQuestions || item.questions?.length || 0} Qs</Text>
                    <Feather name="clock" size={11} color="#94A3B8" style={{ marginLeft: 8 }} />
                    <Text style={styles.testMetaText}>{item.duration} min</Text>
                    {item.isFree && (
                      <View style={styles.freeChip}>
                        <Text style={styles.freeChipText}>FREE</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => handleStartTest(item)}
                disabled={isLoading}
                style={[styles.startBtn, isLocked && styles.startBtnLocked]}
              >
                {isLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={[styles.startBtnText, isLocked && styles.startBtnTextLocked]}>
                      {isLocked ? 'Unlock' : 'Start'}
                    </Text>
                }
              </TouchableOpacity>
            </View>
          )
        }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Feather name="inbox" size={36} color="#CBD5E1" />
            <Text style={styles.emptyText}>No tests available yet</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { color: '#94A3B8', fontWeight: '600', marginTop: 12 },

  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  backBtn: { padding: 4, marginRight: 10 },
  headerTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#0F172A' },

  list: { padding: 14, paddingBottom: 24 },

  infoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
  infoTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  iconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  infoTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', lineHeight: 22, marginBottom: 2 },
  infoBook: { fontSize: 12, color: '#64748B', fontWeight: '600', marginBottom: 2 },
  infoAuthor: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  infoDesc: { fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 14 },
  statsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  statLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },

  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeFree: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0' },
  badgePaid: { backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA' },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  badgeTextFree: { color: '#065F46' },
  badgeTextPaid: { color: '#92400E' },

  priceBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1.5, borderColor: '#FCD34D' },
  priceBannerTitle: { fontSize: 13, fontWeight: '800', color: '#92400E' },
  priceBannerSub: { fontSize: 11, color: '#A16207', marginTop: 2 },
  buyBtn: { backgroundColor: '#F59E0B', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  buyBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  testsHeading: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 12 },

  testCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  testCardLocked: { backgroundColor: '#F8FAFC', borderColor: '#F1F5F9' },
  testLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  testNumCircle: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  testNumCircleLocked: { backgroundColor: '#F1F5F9' },
  testNum: { fontSize: 14, fontWeight: '900', color: '#8B5CF6' },
  testTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 6, lineHeight: 20 },
  testTitleLocked: { color: '#94A3B8' },
  testMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  testMetaText: { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginRight: 4 },
  freeChip: { backgroundColor: '#ECFDF5', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 4 },
  freeChipText: { fontSize: 9, fontWeight: '800', color: '#065F46' },
  startBtn: { backgroundColor: '#8B5CF6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginLeft: 10 },
  startBtnLocked: { backgroundColor: '#F1F5F9' },
  startBtnText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  startBtnTextLocked: { color: '#64748B' },
})
