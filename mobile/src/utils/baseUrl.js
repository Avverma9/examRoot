import Constants from 'expo-constants'

// API base URL is sourced from Expo app config.
// Build will fail fast if the env-backed config is missing.

const normalizeApiUrl = (value) => {
  if (!value) return null
  const trimmed = value.trim().replace(/\/$/, '')
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
}

const appConfig = Constants.expoConfig?.extra?.publicConfig || {}
const ENV_URL = normalizeApiUrl(appConfig.apiBaseUrl)

export const BASE_URL = (() => {
  if (ENV_URL) {
    console.log('🌐 API URL (from env):', ENV_URL)
    return ENV_URL
  }

  throw new Error('EXPO_PUBLIC_API_BASE_URL is missing from app config.')
})()

export const API_BASE_URL = BASE_URL
