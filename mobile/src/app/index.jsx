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

    const timer = setTimeout(() => {
      // If user is authenticated, go to tabs
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } 
      // If user has seen intro, go to login
      else if (getHasSeenIntro()) {
        router.replace('/login');
      } 
      // Otherwise, show intro
      else {
        router.replace('/intro');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [isInitialized, isAuthenticated, router]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#ffffff" />
    </View>
  );
}
