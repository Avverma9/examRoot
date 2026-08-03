import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from '../store/store';
import { AuthProvider } from '../context/AuthContext';
import AppUpdateWrapper from '../components/AppUpdateWrapper';
import { ErrorBoundary } from 'react-error-boundary';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useEffect } from 'react';
import "../global.css";

// Global error handler for uncaught errors
if (typeof ErrorUtils !== 'undefined') {
  const originalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('🔴 Global Error:', error);
    console.error('Fatal:', isFatal);
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#e74c3c' }}>
        Something went wrong
      </Text>
      <ScrollView style={{ maxHeight: 200, marginBottom: 20 }}>
        <Text style={{ fontSize: 12, color: '#555', textAlign: 'center' }}>
          {error?.message || 'An unexpected error occurred'}
        </Text>
        {__DEV__ && error?.stack && (
          <Text style={{ fontSize: 10, color: '#999', marginTop: 10, fontFamily: 'monospace' }}>
            {error.stack}
          </Text>
        )}
      </ScrollView>
      <TouchableOpacity
        onPress={resetErrorBoundary}
        style={{ backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
      >
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    console.log('🚀 App Root Layout Mounted');
  }, []);

  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback} 
      onError={(error, errorInfo) => {
        console.error('ErrorBoundary caught:', error);
        console.error('Error Info:', errorInfo);
      }}
      onReset={() => {
        console.log('ErrorBoundary reset');
      }}
    >
      <SafeAreaProvider>
        <Provider store={store}>
          <AuthProvider>
            <AppUpdateWrapper>
              <Stack>
                <Stack.Screen name="index"               options={{ headerShown: false }} />
                <Stack.Screen name="intro"               options={{ headerShown: false }} />
                <Stack.Screen name="login"               options={{ headerShown: false }} />
                <Stack.Screen name="otp-verify"          options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)"              options={{ headerShown: false }} />
                <Stack.Screen name="mock-test-player"    options={{ headerShown: false }} />
                <Stack.Screen name="practice-set-player" options={{ headerShown: false }} />
                <Stack.Screen name="test-series-detail"  options={{ headerShown: false }} />
                <Stack.Screen name="video-player"        options={{ headerShown: false }} />
                <Stack.Screen name="cashfree-checkout"   options={{ headerShown: false }} />
                <Stack.Screen name="my-subscriptions"    options={{ headerShown: false }} />
                <Stack.Screen name="oauth2redirect"      options={{ headerShown: false }} />
                <Stack.Screen name="saved-questions"     options={{ headerShown: false }} />
                <Stack.Screen name="my-performance"      options={{ headerShown: false }} />
                <Stack.Screen name="settings"            options={{ headerShown: false }} />
                <Stack.Screen name="help-support"        options={{ headerShown: false }} />
              </Stack>
            </AppUpdateWrapper>
          </AuthProvider>
        </Provider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
