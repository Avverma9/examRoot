import { BASE_URL } from '../utils/baseUrl'

/**
 * Fetch all active banners for home screen
 * Returns array sorted by display order
 */
export const getAllBanners = async () => {
  try {
    const res = await fetch(`${BASE_URL}/banners`)
    const data = await res.json()
    if (!res.ok) throw new Error(data?.message || 'Failed to fetch banners')
    return data?.data || []
  } catch (error) {
    console.error('Error fetching banners:', error)
    return []
  }
}
