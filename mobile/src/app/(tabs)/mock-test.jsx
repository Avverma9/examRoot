import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useGetAllMockTestsQuery } from '../../services/mockTestApi';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { getRecentProgress } from '../../services/progressApi';

export default function MockTestScreen() {
  const router   = useRouter();
  const token    = useSelector((state) => state.auth.token);

  const { data, isLoading, isError, refetch } = useGetAllMockTestsQuery();
  const mockTests = data?.data || [];

  // ── In-progress map: resourceId → tracking doc ───────────────────────────
  const [progressMap, setProgressMap] = useState({});

  useEffect(() => {
    if (!token) return;
    getRecentProgress(token)
      .then((res) => {
        if (!res?.success) return;
        const map = {};
        (res.data || []).forEach((p) => {
          if (p.resourceType === 'mock_test') map[p.resourceId] = p;
        });
        setProgressMap(map);
      })
      .catch(() => {});
  }, [token]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Feather name="wifi-off" size={40} color="#EF4444" />
        <Text className="text-red-500 font-bold text-lg mt-3">Failed to load tests</Text>
        <TouchableOpacity onPress={refetch} className="mt-4 bg-amber-600 px-6 py-2 rounded-lg">
          <Text className="text-white font-bold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderItem = ({ item }) => {
    const inProgress  = progressMap[item._id];
    const answered    = inProgress?.metadata?.answeredCount || 0;
    const totalQ      = inProgress?.totalQuestions || item.totalQuestions || 1;
    const progressPct = inProgress ? Math.min(100, Math.round((answered / totalQ) * 100)) : 0;
    const resumeQ     = inProgress?.metadata?.currentQuestion ?? 0;

    return (
      <View className="bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-100">
        {/* Title row */}
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-base font-bold text-gray-800 flex-1 pr-2" numberOfLines={2}>
            {item.title}
          </Text>
          <View className="bg-amber-50 px-2 py-1 rounded-md">
            <Text className="text-amber-600 text-xs font-bold">{item.category}</Text>
          </View>
        </View>

        {/* Meta row */}
        <View className="flex-row items-center mt-1 mb-3">
          <Feather name="clock" size={13} color="#9CA3AF" />
          <Text className="text-gray-400 text-xs ml-1 mr-3 font-medium">{item.duration} Mins</Text>
          <Feather name="list" size={13} color="#9CA3AF" />
          <Text className="text-gray-400 text-xs ml-1 font-medium">{item.totalQuestions || 0} Qs</Text>
          {inProgress && (
            <View className="ml-auto flex-row items-center bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
              <View className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-1.5" />
              <Text className="text-orange-600 text-[10px] font-bold">In Progress</Text>
            </View>
          )}
        </View>

        {/* Progress bar — only for in-progress tests */}
        {inProgress && (
          <View className="mb-3">
            <View className="flex-row justify-between mb-1">
              <Text className="text-xs text-gray-400 font-medium">
                {answered}/{totalQ} answered · Q{resumeQ + 1} next
              </Text>
              <Text className="text-xs font-bold text-amber-600">{progressPct}%</Text>
            </View>
            <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <View
                className="h-full rounded-full bg-amber-500"
                style={{ width: `${progressPct}%` }}
              />
            </View>
          </View>
        )}

        {/* CTA button */}
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/mock-test-player',
              params: { test: JSON.stringify(item) },
            })
          }
          className="py-3 rounded-xl items-center flex-row justify-center"
          style={{ backgroundColor: inProgress ? '#F59E0B' : '#D97706' }}
        >
          {inProgress ? (
            <>
              <Feather name="play" size={14} color="#fff" style={{ marginRight: 6 }} />
              <Text className="text-white font-bold text-sm">Resume Test</Text>
            </>
          ) : (
            <>
              <Feather name="zap" size={14} color="#fff" style={{ marginRight: 6 }} />
              <Text className="text-white font-bold text-sm">Start Test</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50 px-4 pt-4">
      {mockTests.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Feather name="clipboard" size={40} color="#9CA3AF" />
          <Text className="text-gray-400 mt-3 font-semibold">No mock tests available</Text>
        </View>
      ) : (
        <FlatList
          data={mockTests}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}
