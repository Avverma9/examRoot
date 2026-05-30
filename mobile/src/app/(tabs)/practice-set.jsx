import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

const subjects = [
  { id: 1, name: 'Quantitative Aptitude', topics: 24, icon: 'pie-chart', color: 'text-purple-500', bg: 'bg-purple-100' },
  { id: 2, name: 'General Intelligence', topics: 18, icon: 'cpu', color: 'text-orange-500', bg: 'bg-orange-100' },
  { id: 3, name: 'English Language', topics: 15, icon: 'book', color: 'text-teal-500', bg: 'bg-teal-100' },
  { id: 4, name: 'General Awareness', topics: 30, icon: 'globe', color: 'text-pink-500', bg: 'bg-pink-100' },
];

export default function PracticeSetScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <Text className="text-lg font-bold text-gray-800 mb-4">Choose a Subject</Text>
      
      <View className="flex-row flex-wrap justify-between">
        {subjects.map((sub) => (
          <TouchableOpacity key={sub.id} className="bg-white w-[48%] p-4 rounded-xl mb-4 shadow-sm border border-gray-100 items-center text-center">
            <View className={`${sub.bg} p-4 rounded-full mb-3`}>
              <Feather name={sub.icon} size={28} className={sub.color} />
            </View>
            <Text className="text-base font-bold text-gray-800 text-center">{sub.name}</Text>
            <Text className="text-gray-500 text-xs mt-1">{sub.topics} Topics</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}