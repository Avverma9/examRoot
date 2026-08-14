import { Tabs, useRouter, Redirect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

// Floating pill behind the active tab icon — gives the bar a raised, 3D feel
function TabIcon({ name, focused, color }) {
  if (!focused) {
    return <Feather name={name} size={23} color={color} />;
  }
  return (
    <LinearGradient
      colors={['#FDBA74', '#F97316']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -18,
        shadowColor: '#C2410C',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 8,
        borderWidth: 3,
        borderColor: '#ffffff',
      }}
    >
      <Feather name={name} size={20} color="#ffffff" />
    </LinearGradient>
  );
}

export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isInitialized } = useAuth();

  // ── Auth Guard: agar token nahi hai toh login pe bhejo ──────────────────
  useEffect(() => {
    if (!isInitialized) return;          // abhi check chal raha hai, wait karo
    if (!isAuthenticated) {
      router.replace('/login');          // token nahi → login
    }
  }, [isInitialized, isAuthenticated]);

  // Jab tak init nahi hua, kuch mat dikhao
  if (!isInitialized) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }
  
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }
  
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#F97316" translucent={false} />
      <Tabs 
      screenOptions={{ 
        tabBarActiveTintColor: '#F97316',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
            paddingBottom: Math.max(5, insets.bottom),
            paddingTop: 12,
            height: 64 + Math.max(0, insets.bottom),
            backgroundColor: '#ffffff',
            borderTopWidth: 0,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.08,
            shadowRadius: 14,
            elevation: 16,
        },
        tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 2,
        },
        headerStyle: {
          backgroundColor: '#F97316',
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
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/profile')} className="mr-4">
              <View className="bg-white/20 p-2 rounded-full">
                <Feather name="user" size={20} color="white" />
              </View>
            </TouchableOpacity>
          ),
      }}
    >
      {/* 1. HOME TAB */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <TabIcon name="home" color={color} focused={focused} />,
          headerTitle: () => (
            <View className="flex-row items-center">
              <Image 
                source={require('../../../assets/app-logo.png')}
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

      {/* 2. TEST SERIES TAB */}
      <Tabs.Screen
        name="test-series"
        options={{
          title: 'Test Series',
          headerTitle: 'Book Test Series',
          tabBarIcon: ({ color, focused }) => <TabIcon name="book" color={color} focused={focused} />,
        }}
      />

      {/* 3. PYQ TAB */}
      <Tabs.Screen
        name="pyq"
        options={{
          title: 'PYQ',
          headerTitle: 'Previous Year Questions',
          tabBarIcon: ({ color, focused }) => <TabIcon name="clock" color={color} focused={focused} />,
        }}
      />

      {/* 4. VIDEOS TAB */}
      <Tabs.Screen
        name="videos"
        options={{
          title: 'Videos',
          headerTitle: 'Video Lectures',
          tabBarIcon: ({ color, focused }) => <TabIcon name="play-circle" color={color} focused={focused} />,
        }}
      />

      {/* REELS TAB - hidden from tab bar */}
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
    </>
  );
}
