import { BASE_URL } from '../utils/baseUrl'

const parseJsonResponse = async (res) => {
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return res.json()
  }

  const text = await res.text()
  throw new Error(text || `Unexpected response format from ${res.url}`)
}

/**
 * Fetch all active banners for home screen
 * Returns array sorted by display order
 */
export const getAllBanners = async () => {
  try {
    const res = await fetch(`${BASE_URL}/banners`)
    const data = await parseJsonResponse(res)
    if (!res.ok) throw new Error(data?.message || 'Failed to fetch banners')
    return data?.data || []
  } catch (error) {
    console.error('Error fetching banners:', error)
    return []
  }
}
