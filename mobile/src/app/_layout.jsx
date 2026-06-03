import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { store } from '../store/store';
import "../global.css";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="intro" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="mock-test-player" options={{ headerShown: false }} />
        <Stack.Screen name="practice-set-player" options={{ headerShown: false }} />
        <Stack.Screen name="video-player" options={{ headerShown: false }} />
      </Stack>
    </Provider>
  );
}