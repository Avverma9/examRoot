import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function TabLayout() {
  const router = useRouter();
  
  return (
    <Tabs 
      screenOptions={{ 
        tabBarActiveTintColor: '#2563EB', // Tailwind blue-600
        tabBarInactiveTintColor: '#9CA3AF', // Tailwind gray-400
        tabBarStyle: {
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#F3F4F6', // Very light gray border
        },
        tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
        },
        // 👇 HEADER KI GLOBAL STYLING YAHAN HAI 👇
        headerStyle: {
          backgroundColor: '#2563EB', // Blue background for headers
          elevation: 0, // Android pe shadow hatane ke liye
          shadowOpacity: 0, // iOS pe shadow hatane ke liye
          borderBottomWidth: 0,
        },
        headerTintColor: '#ffffff', // Header text aur icons ka color (White)
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerTitleAlign: 'center', // Center align titles
      }}
    >
      {/* 1. HOME TAB - CUSTOM EXAMROOT HEADER */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} />,
          // Home screen ke liye custom header
          headerTitle: () => (
            <View className="flex-row items-center">
              <View className="bg-white p-1.5 rounded-lg mr-2">
                <Feather name="book-open" size={18} color="#2563EB" />
              </View>
              <Text className="text-white text-xl font-extrabold tracking-wide">
                Exam<Text className="text-yellow-400">Root</Text>
              </Text>
            </View>
          ),
          headerTitleAlign: 'left', // Logo left side acha lagta hai
          // Header ke right side me profile icon add karna
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => router.push('/profile')}
              className="mr-4 bg-white/20 p-2 rounded-full"
            >
              <Feather name="user" size={22} color="#ffffff" />
            </TouchableOpacity>
          ),
        }}
      />

      {/* 2. MOCK TEST TAB */}
      <Tabs.Screen
        name="mock-test"
        options={{
          title: 'Mock Test',
          headerTitle: 'Available Tests',
          tabBarIcon: ({ color }) => <Feather name="file-text" size={24} color={color} />,
        }}
      />

      {/* 3. PRACTICE SET TAB */}
      <Tabs.Screen
        name="practice-set"
        options={{
          title: 'Practice', 
          headerTitle: 'Subject Practice',
          tabBarIcon: ({ color }) => <Feather name="book-open" size={24} color={color} />,
        }}
      />

      {/* 4. VIDEOS TAB */}
      <Tabs.Screen
        name="videos"
        options={{
          title: 'Videos',
          headerTitle: 'Video Lectures',
          tabBarIcon: ({ color }) => <Feather name="play-circle" size={24} color={color} />,
        }}
      />

      {/* 5. REELS TAB */}
      <Tabs.Screen
        name="reels"
        options={{
          title: 'Shorts',
          headerShown: false,
          tabBarIcon: ({ color }) => <Feather name="smartphone" size={24} color={color} />,
        }}
      />

      {/* 6. PROFILE TAB */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          // Profile me header hide kar dete hain kyunki wahan 
          // humne screen ke andar khud blue header design kiya hai
          headerShown: false, 
          tabBarIcon: ({ color }) => <Feather name="user" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}