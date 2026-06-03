import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useGetAllVideosQuery } from '../../services/videoApi';

export default function VideosScreen() {
  const { data, isLoading, isError, refetch } = useGetAllVideosQuery();
  const videos = data?.data || [];

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
        <Text className="text-red-500 font-bold text-lg mt-3">Failed to load videos</Text>
        <TouchableOpacity onPress={refetch} className="mt-4 bg-amber-600 px-6 py-2 rounded-lg">
          <Text className="text-white font-bold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity className="mb-6 bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
      <View className="h-48 bg-gray-200 items-center justify-center relative">
        <Feather name="play-circle" size={48} color="white" />
        {item.duration && (
          <View className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded">
            <Text className="text-white text-xs font-bold">{item.duration}</Text>
          </View>
        )}
      </View>
      <View className="p-4">
        <Text className="text-lg font-bold text-gray-800" numberOfLines={2}>
          {item.videoTitle}
        </Text>
        <Text className="text-gray-500 text-sm mt-1">
          {item.category} {item.views != null ? `• ${item.views} Views` : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50 p-4">
      {videos.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Feather name="video-off" size={40} color="#9CA3AF" />
          <Text className="text-gray-400 mt-3 font-semibold">No videos available</Text>
        </View>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
