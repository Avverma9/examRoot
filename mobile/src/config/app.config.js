/**
 * Centralized App Configuration
 * SAFE FALLBACK APPROACH - Always works even if Constants fails
 * 
 * Priority:
 * 1. Try Constants (for EAS builds)
 * 2. Fallback to hardcoded values (for classic builds)
 */

// Hardcoded production values (ALWAYS SAFE)
const PRODUCTION_CONFIG = {
  API_BASE_URL: 'https://backend.examroot.cc',
  API_PATH: '/api',
  TIMEOUT: 30000,
  GOOGLE_ANDROID_CLIENT_ID: '1094183809507-020798lscgvs0geugvi07v9r581enm7d.apps.googleusercontent.com',
  GOOGLE_WEB_CLIENT_ID: '139031461465-srum45v6munuerhk9h0skga7uf8rfb2l.apps.googleusercontent.com',
  EAS_PROJECT_ID: '6af03f9c-9a85-45e0-961f-126db961b4f8',
};

// Try to load Constants safely
let Constants;
let extraConfig = null;

try {
  Constants = require('expo-constants').default;
  
  // Try different sources
  if (Constants?.expoConfig?.extra) {
    extraConfig = Constants.expoConfig.extra;
  } else if (Constants?.manifest2?.extra) {
    extraConfig = Constants.manifest2.extra;
  } else if (Constants?.manifest?.extra) {
    extraConfig = Constants.manifest.extra;
  }
} catch (error) {
  console.warn('⚠️ Could not load Constants, using hardcoded config');
}

// API Configuration
export const API_CONFIG = {
  BASE_URL: extraConfig?.apiConfig?.baseUrl || PRODUCTION_CONFIG.API_BASE_URL,
  API_PATH: extraConfig?.apiConfig?.apiPath || PRODUCTION_CONFIG.API_PATH,
  TIMEOUT: extraConfig?.apiConfig?.timeout || PRODUCTION_CONFIG.TIMEOUT,
};

// Computed API URLs
export const API_URLS = {
  BASE: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PATH}`,
  ROOT: API_CONFIG.BASE_URL,
};

// Google OAuth Configuration
export const GOOGLE_AUTH = {
  ANDROID_CLIENT_ID: extraConfig?.googleAuth?.androidClientId || PRODUCTION_CONFIG.GOOGLE_ANDROID_CLIENT_ID,
  WEB_CLIENT_ID: extraConfig?.googleAuth?.webClientId || PRODUCTION_CONFIG.GOOGLE_WEB_CLIENT_ID,
};

// EAS Project Configuration
export const EAS_CONFIG = {
  PROJECT_ID: extraConfig?.eas?.projectId || PRODUCTION_CONFIG.EAS_PROJECT_ID,
};

// Default export
export default {
  API_CONFIG,
  API_URLS,
  GOOGLE_AUTH,
  EAS_CONFIG,
};

// Safe logging
try {
  console.log('✅ App Config Loaded');
  console.log('  API:', API_URLS.BASE);
  console.log('  Source:', extraConfig ? 'Constants' : 'Hardcoded');
} catch (e) {
  // Ignore logging errors
}

