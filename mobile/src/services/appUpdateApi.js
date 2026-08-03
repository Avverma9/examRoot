import * as Application from 'expo-application';
import { API_URLS } from '../config/app.config';
import { Platform } from 'react-native';

/**
 * Get current app version info
 */
export const getAppVersionInfo = () => {
  const version = Application.nativeApplicationVersion || '1.0.0';
  const versionCode = Application.nativeBuildVersion || '1';
  const platform = Platform.OS;
  
  return {
    version,
    versionCode: parseInt(versionCode, 10),
    platform,
  };
};

/**
 * Get current app update (if available)
 * Returns null if no update or user already dismissed
 */
export const getCurrentUpdate = async (token) => {
  try {
    const { version, versionCode, platform } = getAppVersionInfo();
    
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${API_URLS.BASE}/app-update/current?currentVersionCode=${versionCode}&currentVersion=${version}&platform=${platform}`;
    console.log('[API] Fetching update from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    console.log('[API] Response status:', response.status);

    const text = await response.text();
    console.log('[API] Response text:', text.substring(0, 200)); // Log first 200 chars

    if (!text) {
      console.log('[API] Empty response');
      return { success: true, data: null, updateAvailable: false };
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('[API] JSON parse error:', e);
      console.error('[API] Response was:', text);
      return { success: false, message: 'Invalid JSON response' };
    }
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to check for updates');
    }

    console.log('[API] Update data:', data);
    return data;
  } catch (error) {
    console.error('getCurrentUpdate error:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Dismiss update (user clicked "Later" or installed)
 */
export const dismissUpdate = async (token, updateId, installed = false) => {
  try {
    if (!token) {
      return { success: false, message: 'Not authenticated' };
    }

    const response = await fetch(`${API_URLS.BASE}/app-update/dismiss`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ updateId, installed }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to dismiss update');
    }

    return data;
  } catch (error) {
    return { success: false, message: error.message };
  }
};
