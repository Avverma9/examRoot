import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from '../store/store';
import { AuthProvider } from '../context/AuthContext';
import "../global.css";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <AuthProvider>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="intro" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="otp-verify" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="mock-test-player" options={{ headerShown: false }} />
            <Stack.Screen name="practice-set-player" options={{ headerShown: false }} />
            <Stack.Screen name="test-series-detail" options={{ headerShown: false }} />
            <Stack.Screen name="video-player" options={{ headerShown: false }} />
          </Stack>
        </AuthProvider>
      </Provider>
    </SafeAreaProvider>
  );
}