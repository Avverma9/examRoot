/**
 * Base URL Configuration
 * Simple, working approach - direct hardcoded values
 * No dependency on env or Constants
 */

// Production API URL (hardcoded - always works)
const ROOT_URL = 'https://backend.examroot.cc';

// All API endpoints are under '/api' path
export const BASE_URL = `${ROOT_URL}/api`;
export const API_BASE_URL = `${ROOT_URL}/api`;

// Export root URL if needed elsewhere
export const ROOT_API_URL = ROOT_URL;

// Log URL during development to confirm
console.log('🚀 API URL:', BASE_URL);
