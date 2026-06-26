/**
 * my-subscriptions.jsx
 * Shows all active & expired subscriptions for the logged-in user.
 */
import React, { useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { fetchSubscriptions } from '../store/slices/paymentSlice'

export default function MySubscriptions() {
  const insets   = useSafeAreaInsets()
  const router   = useRouter()
  const dispatch = useDispatch()

  const token          = useSelector((s) => s.auth.token)
  const { subscriptions, subscriptionsStatus } = useSelector((s) => s.payment)

  useEffect(() => {
    if (token) dispatch(fetchSubscriptions(token))
  }, [token])

  const active  = subscriptions.filter((s) => s.isActive)
  const expired = subscriptions.filter((s) => !s.isActive)

  const renderItem = ({ item }) => {
    const end = new Date(item.endDate)
    const isActive = item.isActive

    return (
      <View style={[styles.card, !isActive && styles.cardExpired]}>
        <View style={styles.cardTop}>
          <View style={[styles.iconWrap, { backgroundColor: isActive ? '#F5F3FF' : '#F1F5F9' }]}>
            <Feather name="book" size={22} color={isActive ? '#8B5CF6' : '#94A3B8'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.seriesTitle, !isActive && styles.textMuted]} numberOfLines={2}>
              {item.seriesId?.title || 'Test Series'}
            </Text>
            <Text style={styles.seriesMeta}>
              {item.seriesId?.subject || ''}{item.seriesId?.category ? ` • ${item.seriesId.category}` : ''}
            </Text>
          </View>
          <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeExpired]}>
            <Text style={[styles.badgeText, isActive ? styles.badgeTextActive : styles.badgeTextExpired]}>
              {isActive ? 'ACTIVE' : 'EXPIRED'}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Feather name="calendar" size={12} color="#94A3B8" />
            <Text style={styles.infoText}>
              Expires: {end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>
          {isActive && (
            <View style={[styles.infoItem, styles.daysLeft]}>
              <Feather name="clock" size={12} color="#8B5CF6" />
              <Text style={[styles.infoText, { color: '#8B5CF6', fontWeight: '700' }]}>
                {item.daysLeft} days left
              </Text>
            </View>
          )}
          <View style={styles.infoItem}>
            <Feather name="tag" size={12} color="#94A3B8" />
            <Text style={styles.infoText}>₹{item.amount}</Text>
          </View>
        </View>

        {isActive && (
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => router.push({ pathname: '/test-series-detail', params: { id: String(item.seriesId?._id) } })}
          >
            <Text style={styles.continueBtnText}>Continue Learning</Text>
            <Feather name="arrow-right" size={14} color="#8B5CF6" />
          </TouchableOpacity>
        )}
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#334155" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Subscriptions</Text>
      </View>

      {subscriptionsStatus === 'loading' ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      ) : (
        <FlatList
          data={[...active, ...expired]}
          keyExtractor={(item) => String(item._id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="inbox" size={40} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No subscriptions yet</Text>
              <Text style={styles.emptySubtitle}>Subscribe to a test series to start learning</Text>
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => router.push('/(tabs)/test-series')}
              >
                <Text style={styles.exploreBtnText}>Explore Test Series</Text>
              </TouchableOpacity>
            </View>
          }
          ListHeaderComponent={
            active.length > 0 ? (
              <View style={styles.sectionHeader}>
                <Feather name="zap" size={14} color="#8B5CF6" />
                <Text style={styles.sectionTitle}>{active.length} Active</Text>
                {expired.length > 0 && (
                  <Text style={styles.sectionTitle2}> • {expired.length} Expired</Text>
                )}
              </View>
            ) : null
          }
          renderItem={renderItem}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2,
  },
  backBtn: { padding: 4, marginRight: 10 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 32 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#8B5CF6' },
  sectionTitle2: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },

  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  cardExpired: { backgroundColor: '#FAFAFA', borderColor: '#F1F5F9' },

  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  seriesTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A', lineHeight: 20, marginBottom: 3 },
  seriesMeta: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  textMuted: { color: '#94A3B8' },

  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeActive: { backgroundColor: '#F5F3FF', borderWidth: 1, borderColor: '#C4B5FD' },
  badgeExpired: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  badgeTextActive: { color: '#6D28D9' },
  badgeTextExpired: { color: '#94A3B8' },

  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  daysLeft: { backgroundColor: '#F5F3FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  infoText: { fontSize: 11, color: '#64748B', fontWeight: '600' },

  continueBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: '#C4B5FD', borderRadius: 10, paddingVertical: 10,
    backgroundColor: '#FAFAFF',
  },
  continueBtnText: { fontSize: 13, fontWeight: '800', color: '#8B5CF6' },

  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#334155' },
  emptySubtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },
  exploreBtn: { marginTop: 8, backgroundColor: '#8B5CF6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  exploreBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
})
