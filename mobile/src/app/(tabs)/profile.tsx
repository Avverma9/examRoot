import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function ProfileScreen() {
  const menuItems: { icon: keyof typeof Feather.glyphMap; title: string }[] = [
    { icon: 'bookmark', title: 'Saved Questions' },
    { icon: 'pie-chart', title: 'My Performance' },
    { icon: 'settings', title: 'Settings' },
    { icon: 'help-circle', title: 'Help & Support' },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Profile Header */}
      <View className="bg-blue-600 px-4 pt-8 pb-6 items-center rounded-b-[30px]">
        <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-3">
          <Feather name="user" size={40} color="#2563EB" />
        </View>
        <Text className="text-2xl font-bold text-white">Rahul Kumar</Text>
        <Text className="text-blue-200 text-sm">rahul.kumar@example.com</Text>
      </View>

      {/* Menu List */}
      <View className="p-4 mt-2">
        {menuItems.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            className="flex-row items-center bg-white p-4 rounded-xl mb-3 shadow-sm border border-gray-100"
          >
            <View className="bg-gray-50 p-2 rounded-lg mr-4">
              <Feather name={item.icon} size={20} color="#4B5563" />
            </View>
            <Text className="text-base font-medium text-gray-700 flex-1">{item.title}</Text>
            <Feather name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}

        {/* Logout Button */}
        <TouchableOpacity className="flex-row items-center bg-red-50 p-4 rounded-xl mt-4 border border-red-100">
          <Feather name="log-out" size={20} color="#DC2626" className="mr-4" />
          <Text className="text-base font-bold text-red-600 ml-4">Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}