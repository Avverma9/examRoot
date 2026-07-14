import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../utils/baseUrl';

// ── Helpers ───────────────────────────────────────────────────────────────────
const headers = (token) => ({ Authorization: `Bearer ${token}` });

const TYPE_CONFIG = {
  mock_test:    { label: 'Mock Test',    color: '#D97706', bg: '#FEF3C7' },
  test_series:  { label: 'Test Series',  color: '#2563EB', bg: '#DBEAFE' },
  practice_set: { label: 'Practice',     color: '#059669', bg: '#D1FAE5' },
  video:        { label: 'Video',        color: '#7C3AED', bg: '#EDE9FE' },
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color, bg }) => (
  <View style={{ flex: 1, backgroundColor: bg, borderRadius: 16, padding: 16, alignItems: 'center', marginHorizontal: 4 }}>
    <Feather name={icon} size={20} color={color} style={{ marginBottom: 6 }} />
    <Text style={{ color, fontSize: 22, fontWeight: '900' }}>{value}</Text>
    <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 2, textAlign: 'center' }}>{label}</Text>
  </View>
);

// ── Horizontal activity bar ───────────────────────────────────────────────────
const DayBar = ({ date, total, max, breakdown }) => {
  const pct     = max > 0 ? (total / max) * 100 : 0;
  const label   = date?.slice(5) ?? '';    // MM-DD
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
        <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '500' }}>{label}</Text>
        <Text style={{ fontSize: 11, color: '#374151', fontWeight: '700' }}>{total}</Text>
      </View>
      {/* Stacked bar: mock=amber, practice=green, video=purple */}
      <View style={{ height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, flexDirection: 'row', overflow: 'hidden' }}>
        {breakdown.mock_test > 0 && (
          <View style={{ width: `${(breakdown.mock_test / max) * 100}%`, backgroundColor: '#D97706' }} />
        )}
        {breakdown.practice_set > 0 && (
          <View style={{ width: `${(breakdown.practice_set / max) * 100}%`, backgroundColor: '#059669' }} />
        )}
        {breakdown.video > 0 && (
          <View style={{ width: `${(breakdown.video / max) * 100}%`, backgroundColor: '#7C3AED' }} />
        )}
      </View>
    </View>
  );
};

export default function MyPerformanceScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const token   = useSelector((state) => state.auth.token);
  const user    = useSelector((state) => state.auth.user);

  const testsTaken = user?.testsTaken ?? 0;
  const accuracy   = user?.accuracy   ?? 0;
  const streak     = user?.streak     ?? 0;

  const [analytics,   setAnalytics]   = useState([]);   // daily activity
  const [history,     setHistory]     = useState([]);   // recent completions
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [days,        setDays]        = useState(14);

  const fetchData = useCallback(async (silent = false) => {
    if (!token) { setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      const [anaRes, histRes] = await Promise.all([
        fetch(`${API_BASE_URL}/tracking/analytics?days=${days}`, { headers: headers(token) }),
        fetch(`${API_BASE_URL}/tracking/history?limit=10`, { headers: headers(token) }),
      ]);
      const [ana, hist] = await Promise.all([anaRes.json(), histRes.json()]);

      if (ana.success) {
        // Build a filled date array for the chart
        const map = {};
        for (let i = 0; i < days; i++) {
          const d   = new Date();
          d.setDate(d.getDate() - (days - 1 - i));
          const key = d.toISOString().slice(0, 10);
          map[key]  = { date: key, total: 0, mock_test: 0, practice_set: 0, video: 0, test_series: 0 };
        }
        ana.data.forEach(({ _id, count }) => {
          const key = _id.date;
          if (map[key]) {
            map[key][_id.resourceType] = (map[key][_id.resourceType] || 0) + count;
            map[key].total             += count;
          }
        });
        setAnalytics(Object.values(map));
      }

      if (hist.success) setHistory(hist.data || []);
    } catch (err) {
      console.warn('Performance fetch failed:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(true); };

  const maxActivity = Math.max(...analytics.map((d) => d.total), 1);
  const hasActivity = testsTaken > 0 || analytics.some((d) => d.total > 0);

  const typeLabel = (type) => TYPE_CONFIG[type]?.label ?? type;
  const typeColor = (type) => TYPE_CONFIG[type]?.color ?? '#6B7280';
  const typeBg    = (type) => TYPE_CONFIG[type]?.bg    ?? '#F3F4F6';

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF7ED', paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor="#F97316" />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#F97316', borderBottomWidth: 1, borderBottomColor: '#EA580C' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '800', color: '#ffffff', flex: 1 }}>My Performance</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Feather name="refresh-cw" size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#D97706" />
          <Text style={{ color: '#94A3B8', marginTop: 10, fontSize: 13 }}>Loading your stats…</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D97706" colors={['#D97706']} />}
        >
          {/* ── OVERVIEW STAT CARDS ── */}
          <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Overview</Text>
            <View style={{ flexDirection: 'row' }}>
              <StatCard icon="clipboard" label="Tests Taken"  value={testsTaken}     color="#2563EB" bg="#EFF6FF" />
              <StatCard icon="target"    label="Accuracy"     value={`${accuracy}%`}  color="#059669" bg="#F0FDF4" />
              <StatCard icon="zap"       label="Day Streak"   value={streak}          color="#D97706" bg="#FFFBEB" />
            </View>
          </View>

          {/* ── DAY RANGE TOGGLE ── */}
          <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 4, gap: 8 }}>
            {[7, 14, 30].map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => setDays(d)}
                style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: days === d ? '#D97706' : '#F1F5F9' }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: days === d ? '#fff' : '#64748B' }}>{d}d</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── DAILY ACTIVITY CHART ── */}
          <View style={{ marginHorizontal: 16, marginTop: 12, backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Feather name="bar-chart-2" size={16} color="#2563EB" />
              <Text style={{ fontWeight: '700', color: '#0F172A', marginLeft: 8, fontSize: 14 }}>
                Activity — Last {days} Days
              </Text>
            </View>

            {/* Legend */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
              {[['mock_test', '#D97706', 'Mock'], ['practice_set', '#059669', 'Practice'], ['video', '#7C3AED', 'Video']].map(([type, color, label]) => (
                <View key={type} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color, marginRight: 4 }} />
                  <Text style={{ fontSize: 10, color: '#6B7280', fontWeight: '600' }}>{label}</Text>
                </View>
              ))}
            </View>

            {analytics.every((d) => d.total === 0) ? (
              <View style={{ height: 80, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#CBD5E1', fontSize: 13 }}>No activity in this period</Text>
              </View>
            ) : (
              analytics.map((d) => (
                <DayBar
                  key={d.date}
                  date={d.date}
                  total={d.total}
                  max={maxActivity}
                  breakdown={d}
                />
              ))
            )}
          </View>

          {/* ── RECENT COMPLETIONS ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              Recent Activity
            </Text>

            {history.length === 0 ? (
              <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' }}>
                <View style={{ width: 64, height: 64, backgroundColor: '#F0FDF4', borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Feather name="activity" size={28} color="#10B981" />
                </View>
                <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 16, marginBottom: 6 }}>No activity yet</Text>
                <Text style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                  Take a test or practice session to see your history here.
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)')}
                  style={{ marginTop: 16, backgroundColor: '#059669', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Start Practising</Text>
                </TouchableOpacity>
              </View>
            ) : (
              history.map((item) => {
                const isTest = item.resourceType === 'mock_test' || item.resourceType === 'test_series';
                const color  = typeColor(item.resourceType);
                const bg     = typeBg(item.resourceType);
                return (
                  <View
                    key={item._id}
                    style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center' }}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Feather
                        name={item.resourceType === 'video' ? 'play-circle' : item.resourceType === 'practice_set' ? 'book-open' : 'file-text'}
                        size={18}
                        color={color}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                        <View style={{ backgroundColor: bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginRight: 6 }}>
                          <Text style={{ fontSize: 9, fontWeight: '800', color, textTransform: 'uppercase' }}>{typeLabel(item.resourceType)}</Text>
                        </View>
                        <View style={{ backgroundColor: item.status === 'completed' ? '#D1FAE5' : '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                          <Text style={{ fontSize: 9, fontWeight: '700', color: item.status === 'completed' ? '#065F46' : '#92400E' }}>
                            {item.status === 'completed' ? '✓ Done' : 'In Progress'}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }} numberOfLines={1}>
                        {item.resourceTitle || 'Untitled'}
                      </Text>
                      {isTest && item.accuracy != null && (
                        <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                          Accuracy: {Math.round(item.accuracy)}% · Score: {item.score ?? 0}/{item.totalQuestions ?? 0}
                        </Text>
                      )}
                      {item.durationInMinutes > 0 && (
                        <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>
                          {item.durationInMinutes} min
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
