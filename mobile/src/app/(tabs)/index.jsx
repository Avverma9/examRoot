import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, useFocusEffect } from 'expo-router';
import { getCurrentUser } from '../../services/authApi';
import { setUser } from '../../store/slices/authSlice';
import { getRecentProgress } from '../../services/progressApi';
import { getActiveBanners } from '../../services/bannerApi';
import BannerCarousel from '../../components/BannerCarousel';
import { API_URLS } from '../../config/app.config';
import { useCallback } from 'react';

export default function HomeScreen() {
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();
  const router = useRouter();

  // ── Banners ───────────────────────────────────────────────────────────────
  const [banners, setBanners] = useState([]);

  // ── Real "Continue Learning" data ─────────────────────────────────────────
  const [recentProgress, setRecentProgress] = useState([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const [resumeLoadingId, setResumeLoadingId] = useState(null);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const result = await getActiveBanners();
        console.log('🎯 Banner API Response:', JSON.stringify(result, null, 2));
        if (result.success) {
          console.log('✅ Setting banners:', result.data?.length || 0, 'banners');
          setBanners(result.data || []);
        } else {
          console.log('❌ Banner fetch failed:', result.message);
        }
      } catch (error) {
        console.log('❌ Banner fetch error:', error.message);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (token) {
        try {
          const data = await getCurrentUser(token);
          if (data.success && data.user) {
            dispatch(setUser(data.user));
          }
        } catch (error) {
          // Silent catch
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

  // ── Auto-refresh progress when screen comes into focus (user returns from test) ──
  useFocusEffect(
    useCallback(() => {
      if (token) {
        console.log('🔄 Home screen focused, refreshing progress...');
        getRecentProgress(token)
          .then(res => {
            if (res.success) {
              console.log('✅ Progress refreshed, items:', res.data?.length || 0);
              setRecentProgress(res.data || []);
            } else {
              console.log('⚠️ Progress refresh failed:', res.message);
            }
          })
          .catch((err) => {
            console.log('❌ Progress refresh error:', err.message);
          });
      }
    }, [token])
  );

  const handleContinueLearning = async (item) => {
    if (!item?.resourceType || !item?.resourceId) {
      console.log('❌ Missing resourceType or resourceId:', item);
      return;
    }

    console.log('▶️ Resuming:', item.resourceType, item.resourceId);
    setResumeLoadingId(item.resourceId);
    
    try {
      if (item.resourceType === 'mock_test') {
        console.log('🎯 Loading mock test:', item.resourceId);
        let testData = null;

        // Try to fetch exact test by ID
        try {
          const exactRes = await fetch(`${API_URLS.BASE}/mock/${item.resourceId}`);
          const exactJson = await exactRes.json();
          if (exactRes.ok && exactJson?.data) {
            testData = exactJson.data;
          }
        } catch (e) {
          console.log('Failed to fetch exact test, trying list:', e.message);
        }

        // Fallback: Search in all tests
        if (!testData) {
          try {
            const listRes = await fetch(`${API_URLS.BASE}/mock`);
            const listJson = await listRes.json();
            const allTests = listJson?.data || [];
            testData = allTests.find((test) => String(test._id) === String(item.resourceId));
          } catch (e) {
            console.log('Failed to fetch test list:', e.message);
          }
        }

        if (!testData) {
          console.log('❌ Test not found:', item.resourceId);
          Alert.alert(
            'Test Unavailable', 
            'This test may have been removed. Your progress will be cleared.',
            [{ text: 'OK' }]
          );
          setResumeLoadingId(null);
          return;
        }

        console.log('✅ Test loaded, resuming at question:', item.metadata?.currentQuestion);
        router.push({
          pathname: '/mock-test-player',
          params: {
            test: JSON.stringify(testData),
            currentQuestion: String(item.metadata?.currentQuestion ?? 0),
            answers: JSON.stringify(item.metadata?.answers || {}),
            timeLeft: String(item.metadata?.timeLeft ?? testData.duration * 60),
          },
        });
        return;
      }

      if (item.resourceType === 'practice_set') {
        console.log('📝 Loading practice set:', item.resourceId);
        const res = await fetch(`${API_URLS.BASE}/practice/${item.resourceId}`);
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data?.message || 'Failed to load practice set');
        }
        
        console.log('✅ Practice set loaded');
        router.push({
          pathname: '/practice-set-player',
          params: {
            practice: JSON.stringify(data?.data || data),
            currentQuestion: String(item.metadata?.currentQuestion ?? 0),
            answers: JSON.stringify(item.metadata?.answers || {}),
          },
        });
        return;
      }

      if (item.resourceType === 'video') {
        console.log('🎥 Loading video:', item.resourceId);
        const res = await fetch(`${API_URLS.BASE}/videos/${item.resourceId}`);
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data?.message || 'Failed to load video');
        }
        
        console.log('✅ Video loaded');
        router.push({
          pathname: '/video-player',
          params: {
            video: JSON.stringify(data?.data || data),
          },
        });
        return;
      }

      if (item.resourceType === 'test_series') {
        console.log('📚 Navigating to test series:', item.resourceId);
        router.push({ 
          pathname: '/test-series-detail', 
          params: { id: String(item.resourceId) } 
        });
        return;
      }

      console.log('⚠️ Unknown resource type:', item.resourceType);
    } catch (error) {
      console.error('❌ Failed to resume progress:', error);
      Alert.alert('Error', error.message || 'Failed to resume. Please try again.');
    } finally {
      setResumeLoadingId(null);
    }
  };

  const quickLinks = [
    { id: 1, name: 'Test Series', icon: 'book', color: '#2563EB', bg: 'bg-blue-100', route: '/(tabs)/test-series' },
    { id: 2, name: 'PYQ Papers', icon: 'clock', color: '#7C3AED', bg: 'bg-purple-100', route: '/(tabs)/pyq' },
    { id: 3, name: 'Video Class', icon: 'play-circle', color: '#EA580C', bg: 'bg-orange-100', route: '/(tabs)/videos' },
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
        
        {/* Banner Carousel */}
        <BannerCarousel banners={banners} />

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
            <Text className="text-lg font-extrabold text-gray-900 tracking-tight">Featured Content</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/videos')}>
              <Text className="text-amber-600 font-bold text-sm">Explore</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-10 items-center justify-center">
            <Feather name="star" size={32} color="#F59E0B" className="mb-2" />
            <Text className="text-gray-900 text-sm font-semibold mt-2">More features coming soon!</Text>
            <Text className="text-gray-400 text-xs mt-1">Stay tuned for exciting updates</Text>
          </View>

        </View>
      </ScrollView>
  );
}
