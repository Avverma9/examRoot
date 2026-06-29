import { Platform } from 'react-native'
import Constants from 'expo-constants'

// URL resolution priority:
// 1. EXPO_PUBLIC_API_BASE_URL from .env
// 2. Expo dev server host (physical device / dev client)
// 3. Web current origin

const normalizeApiUrl = (value) => {
  if (!value) return null
  const trimmed = value.trim().replace(/\/$/, '')
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
}

const ENV_URL = normalizeApiUrl(process.env.EXPO_PUBLIC_API_BASE_URL)

const getExpoHost = () => {
  try {
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
  if (ENV_URL) {
    console.log('🌐 API URL (from .env):', ENV_URL)
    return ENV_URL
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    const originUrl = normalizeApiUrl(window.location.origin)
    console.log('🌐 API URL (web origin fallback):', originUrl)
    return originUrl
  }

  const expoHost = getExpoHost()
  if (expoHost) {
    const detected = `http://${expoHost}:3000/api`
    console.log('🌐 API URL (auto-detected):', detected)
    return detected
  }

  throw new Error('EXPO_PUBLIC_API_BASE_URL is not set and no runtime API host could be detected')
})()

export const API_BASE_URL = BASE_URL
