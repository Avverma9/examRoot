import { Platform } from 'react-native'
import Constants from 'expo-constants'

// ─── URL Resolution Priority ───────────────────────────────────────────────
// 1. EXPO_PUBLIC_API_BASE_URL from .env (highest priority - use this in prod)
// 2. Expo dev server host (auto-detected - works for physical devices)
// 3. Android emulator fallback (10.0.2.2)
// 4. localhost fallback (web/iOS simulator)

const ENV_URL = process.env.EXPO_PUBLIC_API_BASE_URL

const getExpoHost = () => {
  try {
    // expo-constants v14+ (SDK 50+)
    const hostUri =
      Constants.expoConfig?.hostUri ||
      Constants.manifest2?.extra?.expoClient?.hostUri ||
      Constants.manifest?.debuggerHost ||
      null
    if (hostUri) return hostUri.split(':')[0]
  } catch (_) {}
  return null
}

export const BASE_URL = (() => {
  // If .env has explicit URL, always use it
  if (ENV_URL) {
    console.log('🌐 API URL (from .env):', ENV_URL)
    return ENV_URL.replace(/\/$/, '')
  }

  // Web → localhost
  if (Platform.OS === 'web') return 'http://localhost:3000/api'

  // Try to auto-detect Expo dev server host (works for physical devices)
  const expoHost = getExpoHost()
  if (expoHost) {
    console.log('🌐 API URL (auto-detected):', `http://${expoHost}:3000/api`)
    return `http://${expoHost}:3000/api`
  }

  // Android emulator fallback
  if (Platform.OS === 'android') {
    console.log('🌐 API URL (emulator fallback): http://10.0.2.2:3000/api')
    return 'http://10.0.2.2:3000/api'
  }

  console.log('🌐 API URL (localhost fallback)')
  return 'http://localhost:3000/api'
})()

export const API_BASE_URL = BASE_URL
