import { authService } from './api';
import { apiURL } from '../config/api.config.js';

export function setupInterceptors() {
  // This function will be called for every request
  const originalFetch = window.fetch;
  
  window.fetch = async function (url, options = {}) {
    // Only add auth header for our API calls
    if (url.startsWith(apiURL) || url.includes('/api/')) {
      const token = authService.getAuthToken();
      
      // Add the auth header if we have a token
      if (token) {
        // Create new options object with headers
        options = {
          ...options,
          headers: {
            ...(options.headers || {}),
            'x-auth-token': token,
          },
        };
        console.log('✅ Token attached to request:', url);
      } else {
        console.warn('⚠️ No token found for API request:', url);
      }
    }

    const response = await originalFetch(url, options);
    
    // Handle 401 Unauthorized responses
    if (response.status === 401) {
      console.error(' 401 Unauthorized response from:', url);
      console.error('Request headers:', options.headers);
      console.error('Token exists:', !!authService.getAuthToken());
      
      // Clear the invalid token
      authService.setAuthToken(null);
      // Redirect to login if we're not already there
      if (!window.location.pathname.includes('/login')) {
        console.log('Redirecting to login due to 401 response');
        window.location.href = '/login';
      }
    }
    
    return response;
  };
}