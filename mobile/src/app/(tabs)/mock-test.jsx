import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useGetAllMockTestsQuery } from '../../services/mockTestApi';
import { useRouter } from 'expo-router';

export default function MockTestScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useGetAllMockTestsQuery();
  const mockTests = data?.data || [];

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

  const renderItem = ({ item }) => (
    <View className="bg-white p-4 rounded-xl mb-4 shadow-sm border border-gray-100">
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-bold text-gray-800 flex-1">{item.title}</Text>
        <View className="bg-amber-50 px-2 py-1 rounded-md">
          <Text className="text-amber-600 text-xs font-bold">{item.category}</Text>
        </View>
      </View>

      <View className="flex-row items-center mt-2 mb-4">
        <Feather name="clock" size={14} color="gray" />
        <Text className="text-gray-500 text-sm ml-1 mr-4">{item.duration} Mins</Text>
        <Feather name="list" size={14} color="gray" />
        <Text className="text-gray-500 text-sm ml-1">{item.totalQuestions || 0} Qs</Text>
      </View>

      <TouchableOpacity
        onPress={() => router.push({ pathname: '/mock-test-player', params: { test: JSON.stringify(item) } })}
        className="bg-amber-600 py-3 rounded-lg items-center"
      >
        <Text className="text-white font-bold">Start Test</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50 p-4">
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
        />
      )}
    </View>
  );
}
