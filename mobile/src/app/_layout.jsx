import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { store } from '../store/store'; // Store import kiya
import "../global.css"; // NativeWind CSS

export default function RootLayout() {
  return (
    // Provider se pure app ko wrap kar diya
    <Provider store={store}>
      <Stack>
        {/* Aapka Tabs group */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="mock-test-player" options={{ headerShown: false }} />
        <Stack.Screen name="video-player" options={{ headerShown: false }} />
      </Stack>
    </Provider>
  );
}