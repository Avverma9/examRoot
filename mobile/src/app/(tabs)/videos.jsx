import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGetAllVideosQuery } from '../../services/videoApi';

export default function VideosScreen() {
  const router = useRouter();
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
    <TouchableOpacity 
      onPress={() => router.push({
        pathname: '/video-player',
        params: { video: JSON.stringify(item) }
      })}
      className="mb-6 bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100"
      activeOpacity={0.7}
    >
      {/* Video Thumbnail */}
      <View className="h-48 bg-gray-200 items-center justify-center relative">
        {item.thumbnail ? (
          <>
            <Image 
              source={{ uri: item.thumbnail }} 
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
            {/* Play overlay */}
            <View className="absolute inset-0 bg-black/30 items-center justify-center">
              <View className="bg-white/90 rounded-full p-4">
                <Feather name="play" size={32} color="#F59E0B" />
              </View>
            </View>
          </>
        ) : (
          <View className="items-center justify-center">
            <View className="bg-amber-50 rounded-full p-4 mb-2">
              <Feather name="play-circle" size={48} color="#F59E0B" />
            </View>
            <Text className="text-gray-400 text-sm">No Thumbnail</Text>
          </View>
        )}
        
        {/* Duration badge */}
        {item.duration && (
          <View className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded">
            <Text className="text-white text-xs font-bold">{item.duration} min</Text>
          </View>
        )}
      </View>
      
      {/* Video Info */}
      <View className="p-4">
        <Text className="text-lg font-bold text-gray-800" numberOfLines={2}>
          {item.videoTitle || item.title || 'Untitled Video'}
        </Text>
        <View className="flex-row items-center mt-2">
          {item.category && (
            <View className="bg-blue-50 px-2 py-1 rounded mr-2">
              <Text className="text-blue-600 text-xs font-bold">{item.category}</Text>
            </View>
          )}
          {item.views != null && (
            <Text className="text-gray-500 text-sm">
              {item.views.toLocaleString()} views
            </Text>
          )}
        </View>
        {item.description && (
          <Text className="text-gray-500 text-sm mt-2" numberOfLines={2}>
            {item.description}
          </Text>
        )}
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
