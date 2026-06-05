import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  return (
    <Tabs 
      screenOptions={{ 
        tabBarActiveTintColor: '#F59E0B',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
            paddingBottom: Math.max(5, insets.bottom),
            paddingTop: 5,
            height: 60 + Math.max(0, insets.bottom),
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#F3F4F6',
        },
        tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#F59E0B',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerTitleAlign: 'left',
      }}
    >
      {/* 1. HOME TAB */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} />,
          headerTitle: () => (
            <View className="flex-row items-center">
              <Image 
                source={require('../../../assets/app-logo.jpeg')}
                style={{ width: 32, height: 32, borderRadius: 6 }}
                resizeMode="cover"
              />
              <Text className="text-white text-xl font-extrabold tracking-wide ml-2">
                Exam<Text className="text-white">Root</Text>
              </Text>
            </View>
          ),
          headerTitleAlign: 'left',
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

      {/* 5. TEST SERIES TAB */}
      <Tabs.Screen
        name="test-series"
        options={{
          title: 'Tests',
          headerTitle: 'Book Test Series',
          tabBarIcon: ({ color }) => <Feather name="book" size={24} color={color} />,
        }}
      />

      {/* 6. REELS TAB - hidden from tab bar */}
      <Tabs.Screen
        name="reels"
        options={{
          title: 'Shorts',
          headerShown: false,
          tabBarItemStyle: { display: 'none' },
        }}
      />

      {/* PROFILE TAB - hidden from tab bar */}
      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          tabBarItemStyle: { display: 'none' },
        }}
      />
    </Tabs>
  );
}