import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { useDispatch, useSelector } from 'react-redux'
import { fetchTestSeries } from '../../store/slices/testSeriesSlice'
import { useRouter } from 'expo-router'

const FILTERS = ['All', 'Free', 'Paid']

export default function TestSeriesScreen() {
  const dispatch = useDispatch()
  const router = useRouter()
  const { items, status, error } = useSelector((state) => state.testSeries)
  const [activeFilter, setActiveFilter] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => { dispatch(fetchTestSeries()) }, [dispatch])

  const filtered = items.filter(s => {
    const matchFilter = activeFilter === 'All' || (activeFilter === 'Free' && !s.isPaid) || (activeFilter === 'Paid' && s.isPaid)
    const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.bookName.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  if (status === 'loading') return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#8B5CF6" />
    </View>
  )

  if (status === 'failed') return (
    <View style={styles.center}>
      <Feather name="wifi-off" size={40} color="#EF4444" />
      <Text style={styles.errorText}>Failed to load test series</Text>
      <TouchableOpacity onPress={() => dispatch(fetchTestSeries())} style={styles.retryBtn}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <Feather name="search" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search by title or book name..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Feather name="x" size={16} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => setActiveFilter(f)}
            style={[styles.filterBtn, activeFilter === f && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Feather name="book" size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>No test series found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/test-series-detail', params: { id: item._id } })}
            style={styles.card}
            activeOpacity={0.85}
          >
            {/* Top: Title + Badge */}
            <View style={styles.cardTop}>
              <View style={styles.cardIconWrap}>
                <Feather name="book" size={20} color="#8B5CF6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.cardBook} numberOfLines={1}>📖 {item.bookName}</Text>
              </View>
              <View style={[styles.badge, item.isPaid ? styles.badgePaid : styles.badgeFree]}>
                <Text style={[styles.badgeText, item.isPaid ? styles.badgeTextPaid : styles.badgeTextFree]}>
                  {item.isPaid ? 'PAID' : 'FREE'}
                </Text>
              </View>
            </View>

            {/* Meta */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Feather name="layers" size={12} color="#64748B" />
                <Text style={styles.metaText}>{item.totalTests || item.tests?.length || 0} Tests</Text>
              </View>
              <View style={styles.metaItem}>
                <Feather name="tag" size={12} color="#64748B" />
                <Text style={styles.metaText}>{item.subject}</Text>
              </View>
              {item.author ? (
                <View style={styles.metaItem}>
                  <Feather name="user" size={12} color="#64748B" />
                  <Text style={styles.metaText} numberOfLines={1}>{item.author}</Text>
                </View>
              ) : null}
            </View>

            {/* Footer */}
            <View style={styles.cardFooter}>
              {item.isPaid ? (
                <View style={styles.priceWrap}>
                  {item.discountedPrice > 0 && item.discountedPrice < item.price ? (
                    <>
                      <Text style={styles.priceFinal}>₹{item.discountedPrice}</Text>
                      <Text style={styles.priceOld}>₹{item.price}</Text>
                    </>
                  ) : (
                    <Text style={styles.priceFinal}>₹{item.price}</Text>
                  )}
                </View>
              ) : (
                <Text style={styles.freeLabel}>Free Access</Text>
              )}
              <View style={styles.startBtn}>
                <Text style={styles.startBtnText}>View Series</Text>
                <Feather name="chevron-right" size={14} color="#8B5CF6" />
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { color: '#EF4444', fontWeight: '700', fontSize: 16, marginTop: 12 },
  retryBtn: { marginTop: 16, backgroundColor: '#8B5CF6', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '700' },
  emptyText: { color: '#94A3B8', fontWeight: '600', marginTop: 12 },

  searchWrap: { flexDirection: 'row', alignItems: 'center', margin: 14, marginBottom: 10, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A', padding: 0 },

  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, marginBottom: 12 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E2E8F0' },
  filterBtnActive: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
  filterText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  filterTextActive: { color: '#fff' },

  list: { paddingHorizontal: 14, paddingBottom: 20 },

  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  cardIconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', lineHeight: 20, marginBottom: 3 },
  cardBook: { fontSize: 12, color: '#64748B', fontWeight: '500' },

  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
  badgeFree: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0' },
  badgePaid: { backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA' },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  badgeTextFree: { color: '#065F46' },
  badgeTextPaid: { color: '#92400E' },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: '#64748B', fontWeight: '600' },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
  priceWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  priceFinal: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  priceOld: { fontSize: 12, color: '#94A3B8', textDecorationLine: 'line-through', fontWeight: '600' },
  freeLabel: { fontSize: 13, fontWeight: '700', color: '#10B981' },
  startBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F5F3FF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  startBtnText: { fontSize: 12, fontWeight: '800', color: '#8B5CF6' },
})
