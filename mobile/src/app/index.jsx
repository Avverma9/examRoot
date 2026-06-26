import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { getHasSeenIntro } from './intro';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuth();

  useEffect(() => {
    if (!isInitialized) return;

    // Small delay to avoid flash
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        // Token exists → go directly to tabs, skip login
        router.replace('/(tabs)');
      } else if (getHasSeenIntro()) {
        // No token, intro seen → go to login
        router.replace('/login');
      } else {
        // First launch → show intro
        router.replace('/intro');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [isInitialized, isAuthenticated, router]);

  // Splash screen while checking auth
  return (
    <View style={{ flex: 1, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#ffffff" />
    </View>
  );
}
