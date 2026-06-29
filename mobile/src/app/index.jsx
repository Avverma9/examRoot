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

    if (isAuthenticated) {
      router.replace('/(tabs)');
    } else if (getHasSeenIntro()) {
      router.replace('/login');
    } else {
      router.replace('/intro');
    }
  }, [isInitialized, isAuthenticated, router]);

  // Splash screen while checking auth
  return (
    <View style={{ flex: 1, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#ffffff" />
    </View>
  );
}
