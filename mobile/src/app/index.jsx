import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { getHasSeenIntro } from './intro';

export default function Index() {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (getHasSeenIntro()) {
        router.replace('/(tabs)');
      } else {
        router.replace('/intro');
      }
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#ffffff" />
    </View>
  );
}
