import { Platform } from 'react-native'

// URL resolution priority:
// 1. EXPO_PUBLIC_API_BASE_URL from .env
// 2. Localhost fallback only for development
// 3. Web current origin for web

const normalizeApiUrl = (value) => {
  if (!value) return null
  const trimmed = value.trim().replace(/\/$/, '')
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
}

const ENV_URL = normalizeApiUrl(process.env.EXPO_PUBLIC_API_BASE_URL)

export const BASE_URL = (() => {
  if (ENV_URL) {
    console.log('🌐 API URL (from .env):', ENV_URL)
    return ENV_URL
  }

  if (__DEV__ && Platform.OS !== 'web') {
    const localhostUrl = normalizeApiUrl('http://localhost:3000')
    console.log('🌐 API URL (localhost fallback):', localhostUrl)
    return localhostUrl
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    const originUrl = normalizeApiUrl(window.location.origin)
    console.log('🌐 API URL (web origin fallback):', originUrl)
    return originUrl
  }

  const productionFallback = normalizeApiUrl('https://backend.examroot.cc')
  console.log('🌐 API URL (production fallback):', productionFallback)
  return productionFallback
})()

export const API_BASE_URL = BASE_URL
