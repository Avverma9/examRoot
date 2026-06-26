import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const StatCard = ({ icon, label, value, color, bg }) => (
  <View className={`flex-1 ${bg} rounded-2xl p-4 items-center mx-1`}>
    <View className="mb-2">
      <Feather name={icon} size={22} color={color} />
    </View>
    <Text style={{ color }} className="text-2xl font-bold">{value}</Text>
    <Text className="text-gray-500 text-xs mt-1 text-center">{label}</Text>
  </View>
);

export default function MyPerformanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user   = useSelector((state) => state.auth.user);

  const testsTaken = user?.testsTaken ?? 0;
  const accuracy   = user?.accuracy   ?? 0;
  const streak     = user?.streak     ?? 0;

  const hasActivity = testsTaken > 0;

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-3 p-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={22} color="#1f2937" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800 flex-1">My Performance</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats Row */}
        <View className="px-4 pt-5 pb-2">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Overview
          </Text>
          <View className="flex-row">
            <StatCard
              icon="clipboard"
              label="Tests Taken"
              value={testsTaken}
              color="#2563eb"
              bg="bg-blue-50"
            />
            <StatCard
              icon="target"
              label="Accuracy"
              value={`${accuracy}%`}
              color="#059669"
              bg="bg-green-50"
            />
            <StatCard
              icon="zap"
              label="Day Streak"
              value={streak}
              color="#d97706"
              bg="bg-amber-50"
            />
          </View>
        </View>

        {/* Performance Cards */}
        <View className="px-4 pt-4">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Detailed Analytics
          </Text>

          {hasActivity ? (
            <>
              {/* Accuracy Card */}
              <View className="bg-white rounded-2xl p-5 mb-3 border border-gray-100 shadow-sm">
                <View className="flex-row items-center mb-3">
                  <Feather name="bar-chart-2" size={18} color="#2563eb" />
                  <Text className="text-gray-800 font-semibold ml-2">Accuracy Trend</Text>
                </View>
                <View className="h-32 items-center justify-center bg-blue-50 rounded-xl">
                  <Feather name="trending-up" size={32} color="#93c5fd" />
                  <Text className="text-blue-400 text-sm mt-2">Charts coming soon</Text>
                </View>
              </View>

              {/* Subject Breakdown */}
              <View className="bg-white rounded-2xl p-5 mb-3 border border-gray-100 shadow-sm">
                <View className="flex-row items-center mb-3">
                  <Feather name="pie-chart" size={18} color="#d97706" />
                  <Text className="text-gray-800 font-semibold ml-2">Subject Breakdown</Text>
                </View>
                <View className="h-32 items-center justify-center bg-amber-50 rounded-xl">
                  <Feather name="pie-chart" size={32} color="#fcd34d" />
                  <Text className="text-amber-400 text-sm mt-2">Coming soon</Text>
                </View>
              </View>
            </>
          ) : (
            /* Empty State */
            <View className="bg-white rounded-2xl p-8 items-center border border-gray-100 shadow-sm mb-4">
              <View className="w-20 h-20 bg-green-50 rounded-full items-center justify-center mb-4">
                <Feather name="activity" size={38} color="#10b981" />
              </View>
              <Text className="text-gray-800 font-bold text-lg text-center mb-2">
                No activity yet
              </Text>
              <Text className="text-gray-500 text-sm text-center leading-6">
                Take a mock test or practice session to see your performance stats here.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)')}
                className="mt-6 bg-green-500 px-8 py-3 rounded-xl"
              >
                <Text className="text-white font-semibold text-base">Start Practising</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}
