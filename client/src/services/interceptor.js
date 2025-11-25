import { authService } from './api';
import { apiURL } from '../config/api.config.js';

export function setupInterceptors() {
  // This function will be called for every request
  const originalFetch = window.fetch;
  
  window.fetch = async function (url, options = {}) {
    // Only add auth header for our API calls (check if URL starts with our API URL)
    if (url.startsWith(apiURL) || url.includes('/api/')) {
      const token = authService.getAuthToken();
      
      // Add the auth header if we have a token
      if (token) {
        options.headers = {
          ...options.headers,
          'x-auth-token': token,
        };
      }
    }

    const response = await originalFetch(url, options);
    
    // Handle 401 Unauthorized responses
    if (response.status === 401) {
      // Clear the invalid token
      authService.setAuthToken(null);
      // Redirect to login if we're not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return response;
  };
}