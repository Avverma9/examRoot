import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { useGetAllMockTestsQuery } from '../../services/mockTestApi';

export default function HomeScreen() {
  const user = useSelector((state) => state.user);
  const router = useRouter();
  const { data: mockData } = useGetAllMockTestsQuery();
  const recommendedTests = (mockData?.data || []).slice(0, 5);

  const quickLinks = [
    { id: 1, name: 'Mock Tests', icon: 'file-text', color: '#3B82F6', bg: 'bg-blue-100', route: '/mock-test' },
    { id: 2, name: 'Practice', icon: 'book-open', color: '#10B981', bg: 'bg-green-100', route: '/practice-set' },
    { id: 3, name: 'Video Class', icon: 'play-circle', color: '#F59E0B', bg: 'bg-yellow-100', route: '/videos' },
    { id: 4, name: 'PYQ Papers', icon: 'clock', color: '#8B5CF6', bg: 'bg-purple-100', route: '/mock-test' },
  ];

  const continueLearning = {
    subject: 'Quantitative Aptitude',
    topic: 'Time, Speed & Distance',
    progress: 65, // Percentage
    timeLeft: '15 mins left',
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      
      {/* 1. TOP GREETING & STATS CARD */}
      <View className="bg-blue-600 rounded-b-[30px] px-5 pt-4 pb-8 mb-4 shadow-sm">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-blue-100 text-sm font-medium">Welcome back,</Text>
            <Text className="text-white text-2xl font-extrabold tracking-wide mt-1">
              {user.name.split(' ')[0]} 👋
            </Text>
          </View>
        </View>

        {/* User Performance Card */}
        <View className="bg-white rounded-2xl p-4 flex-row justify-between items-center shadow-lg">
          <View className="items-center flex-1 border-r border-gray-200">
            <Text className="text-gray-500 text-xs font-semibold mb-1">TESTS TAKEN</Text>
            <Text className="text-2xl font-black text-blue-600">{user.testsTaken}</Text>
          </View>
          <View className="items-center flex-1">
            <Text className="text-gray-500 text-xs font-semibold mb-1">ACCURACY</Text>
            <Text className="text-2xl font-black text-green-500">{user.accuracy}%</Text>
          </View>
        </View>
      </View>

      <View className="px-5">
        
        {/* 2. QUICK SHORTCUTS (GRID) */}
        <Text className="text-lg font-bold text-gray-800 mb-4">Explore Categories</Text>
        <View className="flex-row flex-wrap justify-between mb-2">
          {quickLinks.map((link) => (
            <TouchableOpacity 
              key={link.id} 
              onPress={() => router.push(link.route)}
              className="w-[23%] items-center mb-4"
            >
              <View className={`${link.bg} w-16 h-16 rounded-2xl items-center justify-center mb-2 shadow-sm`}>
                <Feather name={link.icon} size={28} color={link.color} />
              </View>
              <Text className="text-xs font-semibold text-gray-700 text-center leading-tight">
                {link.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 3. CONTINUE LEARNING (PROGRESS BANNER) */}
        <View className="flex-row justify-between items-end mb-4 mt-2">
          <Text className="text-lg font-bold text-gray-800">Continue Learning</Text>
          <TouchableOpacity onPress={() => router.push('/videos')}>
            <Text className="text-blue-600 font-semibold text-sm">See All</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          onPress={() => router.push('/videos')}
          className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6"
        >
          <View className="flex-row items-center mb-3">
            <View className="bg-orange-100 p-3 rounded-full mr-4">
              <Feather name="play" size={20} color="#EA580C" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-orange-600 mb-1">{continueLearning.subject}</Text>
              <Text className="text-base font-bold text-gray-800">{continueLearning.topic}</Text>
            </View>
          </View>
          
          {/* Progress Bar */}
          <View className="flex-row items-center mt-2">
            <View className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden mr-3">
              <View 
                className="h-full bg-orange-500 rounded-full" 
                style={{ width: `${continueLearning.progress}%` }} 
              />
            </View>
            <Text className="text-xs font-semibold text-gray-500">{continueLearning.timeLeft}</Text>
          </View>
        </TouchableOpacity>

        {/* 4. RECOMMENDED MOCK TESTS (HORIZONTAL SCROLL) */}
        <View className="flex-row justify-between items-end mb-4">
          <Text className="text-lg font-bold text-gray-800">Recommended Tests</Text>
          <TouchableOpacity onPress={() => router.push('/mock-test')}>
            <Text className="text-blue-600 font-semibold text-sm">View All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          className="mb-8"
          contentContainerStyle={{ paddingRight: 20 }}
        >
          {recommendedTests.length === 0 ? (
            <View className="bg-white w-[260px] p-4 rounded-2xl shadow-sm border border-gray-100 mr-4 items-center justify-center">
              <Text className="text-gray-400 text-sm">No tests available</Text>
            </View>
          ) : (
            recommendedTests.map((test) => (
              <View
                key={test._id}
                className="bg-white w-[260px] p-4 rounded-2xl shadow-sm border border-gray-100 mr-4"
              >
                <View className="flex-row justify-between items-start mb-3">
                  <Text className="text-base font-bold text-gray-800 flex-1 leading-snug" numberOfLines={2}>
                    {test.title}
                  </Text>
                  <View className="bg-blue-50 px-2 py-1 rounded ml-2">
                    <Text className="text-blue-600 text-[10px] font-bold">{test.category || 'LIVE'}</Text>
                  </View>
                </View>

                <View className="flex-row items-center mb-4">
                  <Feather name="help-circle" size={14} color="#6B7280" />
                  <Text className="text-gray-500 text-xs ml-1 mr-3">{test.totalQuestions || 0} Qs</Text>

                  <Feather name="clock" size={14} color="#6B7280" />
                  <Text className="text-gray-500 text-xs ml-1">{test.duration} Mins</Text>
                </View>

                <View className="flex-row justify-between items-center mt-auto border-t border-gray-100 pt-3">
                  <TouchableOpacity
                    onPress={() => router.push('/mock-test')}
                    className="bg-blue-600 px-4 py-1.5 rounded-lg"
                  >
                    <Text className="text-white text-xs font-bold">Start</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>

      </View>
    </ScrollView>
  );
}