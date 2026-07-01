import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'expo-router';
import { useGetAllMockTestsQuery } from '../../services/mockTestApi';
import { getCurrentUser } from '../../services/authApi';
import { setUser } from '../../store/slices/authSlice';
import { getRecentProgress } from '../../services/progressApi';
import { BASE_URL } from '../../utils/baseUrl';

export default function HomeScreen() {
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();
  const router = useRouter();
  const { data: mockData } = useGetAllMockTestsQuery();
  const recommendedTests = (mockData?.data || []).slice(0, 5);

  // ── Real "Continue Learning" data ─────────────────────────────────────────
  const [recentProgress, setRecentProgress] = useState([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const [resumeLoadingId, setResumeLoadingId] = useState(null);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (token) {
        try {
          const data = await getCurrentUser(token);
          if (data.success && data.user) {
            dispatch(setUser(data.user));
          }
        } catch (error) {
          console.error('Error fetching user stats:', error);
        }
      }
    };
    fetchUserStats();
  }, [token, dispatch]);

  useEffect(() => {
    if (!token) return;
    setProgressLoading(true);
    getRecentProgress(token)
      .then(res => {
        if (res.success) setRecentProgress(res.data || []);
      })
      .catch(() => {})
      .finally(() => setProgressLoading(false));
  }, [token]);

  const handleContinueLearning = async (item) => {
    if (!item?.resourceType || !item?.resourceId) return;

    setResumeLoadingId(item.resourceId);
    try {
      if (item.resourceType === 'mock_test') {
        let testData = null;

        const exactRes = await fetch(`${BASE_URL}/mock/${item.resourceId}`);
        const exactJson = await exactRes.json();
        if (exactRes.ok) {
          testData = exactJson?.data || exactJson;
        }

        if (!testData) {
          const listRes = await fetch(`${BASE_URL}/mock`);
          const listJson = await listRes.json();
          const allTests = listJson?.data || [];
          testData =
            allTests.find((test) => String(test._id) === String(item.resourceId)) ||
            allTests.find((test) => test.title === item.resourceTitle) ||
            null;
        }

        if (!testData) {
          router.push('/mock-test');
          return;
        }

        router.push({
          pathname: '/mock-test-player',
          params: {
            test: JSON.stringify(testData),
            currentQuestion: String(item.metadata?.currentQuestion ?? 0),
          },
        });
        return;
      }

      if (item.resourceType === 'practice_set') {
        const res = await fetch(`${BASE_URL}/practice/${item.resourceId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to load practice set');
        router.push({
          pathname: '/practice-set-player',
          params: {
            practice: JSON.stringify(data?.data || data),
            currentQuestion: String(item.metadata?.currentQuestion ?? 0),
          },
        });
        return;
      }

      if (item.resourceType === 'video') {
        const res = await fetch(`${BASE_URL}/videos/${item.resourceId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to load video');
        router.push({
          pathname: '/video-player',
          params: {
            video: JSON.stringify(data?.data || data),
          },
        });
        return;
      }

      if (item.resourceType === 'test_series') {
        router.push({ pathname: '/test-series-detail', params: { id: String(item.resourceId) } });
      }
    } catch (error) {
      console.error('Failed to resume progress:', error);
    } finally {
      setResumeLoadingId(null);
    }
  };

  const quickLinks = [
    { id: 1, name: 'Mock Tests', icon: 'file-text', color: '#D97706', bg: 'bg-amber-100', route: '/mock-test' },
    { id: 2, name: 'Practice', icon: 'book-open', color: '#059669', bg: 'bg-green-100', route: '/practice-set' },
    { id: 3, name: 'Video Class', icon: 'play-circle', color: '#EA580C', bg: 'bg-orange-100', route: '/videos' },
    { id: 4, name: 'PYQ Papers', icon: 'clock', color: '#7C3AED', bg: 'bg-purple-100', route: '/mock-test' },
  ];

  // Map resourceType to display config
  const getProgressConfig = (item) => {
    switch (item.resourceType) {
      case 'mock_test':
        return { icon: 'file-text', iconBg: 'bg-amber-50', iconColor: '#D97706', label: 'Mock Test', route: '/(tabs)' };
      case 'practice_set':
        return { icon: 'book-open', iconBg: 'bg-green-50', iconColor: '#059669', label: 'Practice Set', route: '/(tabs)' };
      case 'test_series':
        return { icon: 'book', iconBg: 'bg-blue-50', iconColor: '#2563EB', label: 'Test Series', route: '/(tabs)' };
      default:
        return { icon: 'play', iconBg: 'bg-orange-50', iconColor: '#EA580C', label: 'Study', route: '/videos' };
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
        
        {/* Stats Card */}
        <View className="px-5 mb-6">
          <View className="bg-white rounded-2xl p-5 flex-row justify-between items-center shadow-md border border-gray-100">
            <View className="items-center flex-1 border-r border-gray-100">
              <Text className="text-gray-400 text-[11px] font-bold tracking-widest mb-1">TESTS TAKEN</Text>
              <Text className="text-3xl font-black text-amber-600">{user?.testsTaken || 0}</Text>
            </View>
            <View className="items-center flex-1 border-r border-gray-100">
              <Text className="text-gray-400 text-[11px] font-bold tracking-widest mb-1">ACCURACY</Text>
              <Text className="text-3xl font-black text-green-500">{user?.accuracy || 0}%</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-gray-400 text-[11px] font-bold tracking-widest mb-1">STREAK</Text>
              {/* Changed hardcoded streak to dynamic streak */}
              <Text className="text-3xl font-black text-orange-500">{user?.streak || 0}🔥</Text>
            </View>
          </View>
        </View>

        <View className="px-5">
          
          {/* Quick Shortcuts (Grid) */}
          <Text className="text-lg font-extrabold text-gray-900 mb-4 tracking-tight">Explore Categories</Text>
          <View className="flex-row flex-wrap justify-between mb-4">
            {quickLinks.map((link) => (
              <TouchableOpacity 
                key={link.id} 
                onPress={() => router.push(link.route)}
                className="w-[22%] items-center mb-4"
              >
                <View className={`${link.bg} w-[4.5rem] h-[4.5rem] rounded-[20px] items-center justify-center mb-2 shadow-sm`}>
                  <Feather name={link.icon} size={26} color={link.color} />
                </View>
                <Text className="text-[11px] font-bold text-gray-700 text-center leading-tight">
                  {link.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Continue Learning (Real Data) */}
          <View className="flex-row justify-between items-end mb-4">
            <Text className="text-lg font-extrabold text-gray-900 tracking-tight">Continue Learning</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)')}>
              <Text className="text-amber-600 font-bold text-sm">See All</Text>
            </TouchableOpacity>
          </View>

          {progressLoading ? (
            <View className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-8 items-center justify-center" style={{ height: 80 }}>
              <ActivityIndicator size="small" color="#F59E0B" />
            </View>
          ) : recentProgress.length === 0 ? (
            /* No in-progress sessions */
            <View className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-8 items-center flex-row" style={{ gap: 14 }}>
              <View className="bg-amber-50 p-3 rounded-2xl">
                <Feather name="play" size={20} color="#D97706" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-gray-700">No recent activity</Text>
                <Text className="text-xs text-gray-400 mt-0.5">Start a test or practice to see it here</Text>
              </View>
            </View>
          ) : (
            recentProgress.map((item) => {
              const cfg = getProgressConfig(item);
              const answered = item.metadata?.answeredCount || 0;
              const total = item.totalQuestions || 1;
              const progressPct = Math.min(100, Math.round((answered / total) * 100));
              const isLoadingResume = resumeLoadingId === item.resourceId;
              return (
                <TouchableOpacity
                  onPress={() => handleContinueLearning(item)}
                  key={item._id}
                  className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-3"
                >
                  <View className="flex-row items-center mb-4">
                    <View className={`${cfg.iconBg} p-3.5 rounded-2xl mr-4`}>
                      <Feather name={cfg.icon} size={22} color={cfg.iconColor} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: cfg.iconColor }}>
                        {cfg.label}
                      </Text>
                      <Text className="text-base font-extrabold text-gray-900" numberOfLines={1}>
                        {item.resourceTitle || 'Untitled'}
                      </Text>
                    </View>
                    <View className="bg-gray-100 px-2 py-1 rounded-lg">
                      <Text className="text-xs font-bold text-gray-500">
                        Q {item.metadata?.currentQuestion != null ? item.metadata.currentQuestion + 1 : 1}/{total}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <View className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden mr-3">
                      <View
                        className="h-full rounded-full"
                        style={{ width: `${progressPct}%`, backgroundColor: cfg.iconColor }}
                      />
                    </View>
                    <Text className="text-xs font-bold text-gray-400">{progressPct}% done</Text>
                  </View>

                  {isLoadingResume ? (
                    <View className="mt-3 flex-row items-center justify-center bg-amber-50 rounded-xl py-2.5">
                      <ActivityIndicator size="small" color="#F59E0B" />
                      <Text className="ml-2 text-amber-700 text-sm font-bold">Opening resume point...</Text>
                    </View>
                  ) : (
                    <View className="mt-3 flex-row items-center justify-center bg-amber-600 rounded-xl py-2.5">
                      <Feather name="play" size={14} color="#fff" />
                      <Text className="ml-2 text-white text-sm font-bold">Resume</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}

          {/* Recommended Mock Tests (Horizontal Scroll) */}
          <View className="flex-row justify-between items-end mb-4">
            <Text className="text-lg font-extrabold text-gray-900 tracking-tight">Recommended Tests</Text>
            <TouchableOpacity onPress={() => router.push('/mock-test')}>
              <Text className="text-amber-600 font-bold text-sm">View All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            className="mb-10"
            contentContainerStyle={{ paddingRight: 20 }}
          >
            {recommendedTests.length === 0 ? (
              <View className="bg-white w-[280px] p-6 rounded-3xl shadow-sm border border-gray-100 mr-4 items-center justify-center border-dashed">
                <Feather name="inbox" size={32} color="#D1D5DB" className="mb-2" />
                <Text className="text-gray-400 text-sm font-semibold mt-2">No tests available right now</Text>
              </View>
            ) : (
              recommendedTests.map((test) => (
                <View
                  key={test._id}
                  className="bg-white w-[280px] p-5 rounded-3xl shadow-sm border border-gray-100 mr-4 flex-col justify-between"
                >
                  <View>
                    <View className="flex-row justify-between items-start mb-3">
                      <Text className="text-base font-extrabold text-gray-900 flex-1 leading-snug" numberOfLines={2}>
                        {test.title}
                      </Text>
                      <View className="bg-amber-50 px-2.5 py-1 rounded-md ml-3">
                        <Text className="text-amber-600 text-[10px] font-black uppercase tracking-wider">{test.category || 'LIVE'}</Text>
                      </View>
                    </View>

                    <View className="flex-row items-center mb-5">
                      <View className="flex-row items-center bg-gray-50 px-2 py-1 rounded-md mr-2">
                        <Feather name="help-circle" size={12} color="#6B7280" />
                        <Text className="text-gray-500 text-xs font-semibold ml-1.5">{test.totalQuestions || 0} Qs</Text>
                      </View>
                      <View className="flex-row items-center bg-gray-50 px-2 py-1 rounded-md">
                        <Feather name="clock" size={12} color="#6B7280" />
                        <Text className="text-gray-500 text-xs font-semibold ml-1.5">{test.duration} Mins</Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => router.push('/mock-test')}
                    className="bg-amber-600 px-4 py-3 rounded-xl flex-row justify-center items-center"
                  >
                    <Text className="text-white text-sm font-bold mr-2">Start Test</Text>
                    <Feather name="arrow-right" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>

        </View>
      </ScrollView>
  );
}
