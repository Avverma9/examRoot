const normalizeApiUrl = (value) => {
  if (!value) return null
  const trimmed = value.trim().replace(/\/$/, '')
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
}

const envUrl = normalizeApiUrl(import.meta.env.VITE_API_BASE_URL)

if (!envUrl) {
  throw new Error('VITE_API_BASE_URL is not set')
}

export const BASE_URL = envUrl
