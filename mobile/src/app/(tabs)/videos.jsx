import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';

const videoData = [
  { id: '1', title: 'Complete Time & Work in 1 Video', tutor: 'Maths Wizard', views: '12K', duration: '45:20' },
  { id: '2', title: 'Top 100 Current Affairs - May 2026', tutor: 'Exam Prep', views: '8.5K', duration: '28:15' },
  { id: '3', title: 'English Grammar Rules - Error Spotting', tutor: 'Learn English', views: '20K', duration: '34:50' },
];

export default function VideosScreen() {
  const renderItem = ({ item }) => (
    <TouchableOpacity className="mb-6 bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
      {/* Thumbnail Placeholder */}
      <View className="h-48 bg-gray-200 items-center justify-center relative">
        <Feather name="play-circle" size={48} color="white" className="opacity-80" />
        <View className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded">
          <Text className="text-white text-xs font-bold">{item.duration}</Text>
        </View>
      </View>
      
      {/* Video Info */}
      <View className="p-4">
        <Text className="text-lg font-bold text-gray-800 line-clamp-2" numberOfLines={2}>
          {item.title}
        </Text>
        <Text className="text-gray-500 text-sm mt-1">
          {item.tutor} • {item.views} Views
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <FlatList
        data={videoData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}