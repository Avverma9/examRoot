import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';

/**
 * Google OAuth redirect handler screen.
 *
 * Flow:
 * 1. User logs in on Google → browser redirects to
 *    com.googleusercontent.apps.XXXXX://oauth2redirect?code=...
 * 2. Android resolves that scheme → opens this screen
 * 3. WebBrowser.maybeCompleteAuthSession() detects the URL and
 *    passes it back to the waiting promptAsync() call in login.jsx
 * 4. login.jsx gets result.type === 'success' → proceeds with login
 */

// THIS IS THE KEY CALL — must be at module level, not inside a hook
WebBrowser.maybeCompleteAuthSession();

export default function OAuth2Redirect() {
  const router = useRouter();

  useEffect(() => {
    // maybeCompleteAuthSession() above handles passing the result
    // back to promptAsync(). This screen will be automatically
    // dismissed by expo-web-browser after that happens.
    // If somehow still here after 3s, go back to login.
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#D97706" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
});
