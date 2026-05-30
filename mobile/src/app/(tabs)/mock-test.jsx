import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

const mockTests = [
  { id: '1', title: 'SSC CGL Prelims - Test 1', duration: '60 Mins', questions: 100, tags: 'New' },
  { id: '2', title: 'Railway NTPC Full Mock', duration: '90 Mins', questions: 120, tags: 'Popular' },
  { id: '3', title: 'Bank PO Mains Level', duration: '180 Mins', questions: 155, tags: 'Hard' },
];

export default function MockTestScreen() {
  const renderItem = ({ item }) => (
    <View className="bg-white p-4 rounded-xl mb-4 shadow-sm border border-gray-100">
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-bold text-gray-800 flex-1">{item.title}</Text>
        <View className="bg-blue-50 px-2 py-1 rounded-md">
          <Text className="text-blue-600 text-xs font-bold">{item.tags}</Text>
        </View>
      </View>
      
      <View className="flex-row items-center mt-2 mb-4">
        <Feather name="clock" size={14} color="gray" />
        <Text className="text-gray-500 text-sm ml-1 mr-4">{item.duration}</Text>
        <Feather name="list" size={14} color="gray" />
        <Text className="text-gray-500 text-sm ml-1">{item.questions} Qs</Text>
      </View>

      <TouchableOpacity className="bg-blue-600 py-3 rounded-lg items-center">
        <Text className="text-white font-bold">Start Test</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <FlatList
        data={mockTests}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}