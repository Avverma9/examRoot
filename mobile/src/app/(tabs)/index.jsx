import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
// Redux Hooks import karein
import { useSelector, useDispatch } from 'react-redux';
import { incrementTestCount } from '../store/slices/userSlice';

export default function HomeScreen() {
  // Redux store se user ka data nikaal rahe hain
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const stats = [
    { id: 1, title: 'Tests Taken', value: user.testsTaken, icon: 'file-text', color: 'text-blue-500' },
    { id: 2, title: 'Accuracy', value: `${user.accuracy}%`, icon: 'target', color: 'text-green-500' },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      {/* Greeting Section */}
      <View className="mb-6 mt-2">
        <Text className="text-gray-500 text-base">Hello, {user.name.split(' ')[0]}! 👋</Text>
        <Text className="text-2xl font-bold text-gray-800">Ready to learn today?</Text>
      </View>

      {/* Stats Grid */}
      <View className="flex-row justify-between mb-6">
        {stats.map((stat) => (
          <View key={stat.id} className="bg-white p-4 rounded-2xl w-[48%] shadow-sm border border-gray-100">
            <Feather name={stat.icon} size={24} className={stat.color} />
            <Text className="text-2xl font-bold text-gray-800 mt-3">{stat.value}</Text>
            <Text className="text-gray-500 text-sm">{stat.title}</Text>
          </View>
        ))}
      </View>

      {/* REDUX TEST BUTTON - Ispe click karne par test count badhega */}
      <TouchableOpacity 
        onPress={() => dispatch(incrementTestCount())}
        className="bg-blue-600 p-4 rounded-2xl flex-row items-center justify-center mb-6 shadow-sm"
      >
        <Feather name="plus-circle" size={20} color="white" className="mr-2" />
        <Text className="text-white text-base font-bold ml-2">Simulate Test Completion</Text>
      </TouchableOpacity>

      {/* Continue Learning Section */}
      <Text className="text-lg font-bold text-gray-800 mb-3">Continue Learning</Text>
      <TouchableOpacity className="bg-white p-4 rounded-2xl flex-row items-center justify-between shadow-sm border border-gray-100 mb-6">
        <View className="flex-row items-center">
          <View className="bg-blue-100 p-3 rounded-full mr-4">
            <Feather name="play" size={20} color="#007AFF" />
          </View>
          <View>
            <Text className="text-base font-bold text-gray-800">Physics: Kinematics</Text>
            <Text className="text-gray-500 text-sm">Video • 12 mins left</Text>
          </View>
        </View>
        <Feather name="chevron-right" size={20} color="gray" />
      </TouchableOpacity>
    </ScrollView>
  );
}