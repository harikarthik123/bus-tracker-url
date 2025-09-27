// Central API configuration - change IP here and it updates everywhere
const API_CONFIG = {
  // Change this IP address and it will update all API calls
  BASE_URL: 'http://192.168.29.81:5000',
  
  // API endpoints
  ENDPOINTS: {
    AUTH: '/api/auth',
    ADMIN: '/api/admin',
    DRIVER: '/api/driver',
    PASSENGER: '/api/passenger',
    LOCATION: '/api/location',
    ETA: '/api/eta'
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Pre-built URLs for common endpoints
export const API_URLS = {
  AUTH: getApiUrl(API_CONFIG.ENDPOINTS.AUTH),
  ADMIN: getApiUrl(API_CONFIG.ENDPOINTS.ADMIN),
  DRIVER: getApiUrl(API_CONFIG.ENDPOINTS.DRIVER),
  PASSENGER: getApiUrl(API_CONFIG.ENDPOINTS.PASSENGER),
  LOCATION: getApiUrl(API_CONFIG.ENDPOINTS.LOCATION),
  ETA: getApiUrl(API_CONFIG.ENDPOINTS.ETA)
};

// WebSocket URL
export const WS_URL = `ws://${API_CONFIG.BASE_URL.replace('http://', '')}/ws`;

// Origin base for building absolute asset URLs (e.g., uploads)
export const BASE_ORIGIN = API_CONFIG.BASE_URL;

export default API_CONFIG;
