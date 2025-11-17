// API Configuration for different environments
const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:5000',
    apiURL: 'http://localhost:5000/api',
  },
  production: {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://bafci-backend.onrender.com',
    apiURL: `${import.meta.env.VITE_API_BASE_URL || 'https://bafci-backend.onrender.com'}/api`,
  }
};

// Determine current environment
const environment = import.meta.env.MODE || 'development';

// Export the appropriate configuration
export const { baseURL, apiURL } = API_CONFIG[environment];

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${apiURL}/${cleanEndpoint}`;
};

// Helper function to get uploads URL
export const getUploadsUrl = (filename) => {
  if (!filename) return '';
  return `${baseURL}/uploads/${filename}`;
};

export default {
  baseURL,
  apiURL,
  getApiUrl,
  getUploadsUrl,
};
