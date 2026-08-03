import { API_URLS } from '../config/app.config';

/**
 * Get active banners for home screen carousel
 */
export const getActiveBanners = async () => {
  try {
    const url = `${API_URLS.BASE}/banners/active`;
    console.log('🔗 Fetching banners from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('📦 Banner Response Status:', response.status);
    console.log('📦 Banner Response Data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch banners');
    }

    return data;
  } catch (error) {
    console.log('💥 Banner API Error:', error.message);
    return { success: false, message: error.message, data: [] };
  }
};
