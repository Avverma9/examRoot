import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'expo-router';
import { useGetAllMockTestsQuery } from '../../services/mockTestApi';
import AdBannerSlider from '../../components/AdBannerSlider';
import AdMobBanner from '../../components/AdMobBanner';
import { getCurrentUser } from '../../services/authApi';
import { setUser } from '../../store/slices/authSlice';

export default function HomeScreen() {
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();
  const router = useRouter();
  const { data: mockData } = useGetAllMockTestsQuery();
  const recommendedTests = (mockData?.data || []).slice(0, 5);

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

  const quickLinks = [
    { id: 1, name: 'Mock Tests', icon: 'file-text', color: '#D97706', bg: 'bg-amber-100', route: '/mock-test' },
    { id: 2, name: 'Practice', icon: 'book-open', color: '#059669', bg: 'bg-green-100', route: '/practice-set' },
    { id: 3, name: 'Video Class', icon: 'play-circle', color: '#EA580C', bg: 'bg-orange-100', route: '/videos' },
    { id: 4, name: 'PYQ Papers', icon: 'clock', color: '#7C3AED', bg: 'bg-purple-100', route: '/mock-test' },
  ];

  const continueLearning = {
    subject: 'Quantitative Aptitude',
    topic: 'Time, Speed & Distance',
    progress: 65, // Percentage
    timeLeft: '15 mins left',
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
        
        {/* 1. AD BANNER SLIDER */}
        <View className="px-5 pt-6">
          <AdBannerSlider />
          <View className="mt-4">
            <AdMobBanner />
          </View>
        </View>

        {/* 2. STATS CARD */}
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
          
          {/* 3. QUICK SHORTCUTS (GRID) */}
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

          {/* 4. CONTINUE LEARNING (PROGRESS BANNER) */}
          <View className="flex-row justify-between items-end mb-4">
            <Text className="text-lg font-extrabold text-gray-900 tracking-tight">Continue Learning</Text>
            <TouchableOpacity onPress={() => router.push('/videos')}>
              <Text className="text-amber-600 font-bold text-sm">See All</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            onPress={() => router.push('/videos')}
            className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-8"
          >
            <View className="flex-row items-center mb-4">
              <View className="bg-orange-50 p-3.5 rounded-2xl mr-4">
                <Feather name="play" size={22} color="#EA580C" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-orange-600 mb-1 uppercase tracking-wider">{continueLearning.subject}</Text>
                <Text className="text-base font-extrabold text-gray-900">{continueLearning.topic}</Text>
              </View>
            </View>
            
            {/* Progress Bar */}
            <View className="flex-row items-center">
              <View className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden mr-3">
                <View 
                  className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full" 
                  style={{ width: `${continueLearning.progress}%`, backgroundColor: '#F59E0B' }} 
                />
              </View>
              <Text className="text-xs font-bold text-gray-400">{continueLearning.timeLeft}</Text>
            </View>
          </TouchableOpacity>

          {/* 5. RECOMMENDED MOCK TESTS (HORIZONTAL SCROLL) */}
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