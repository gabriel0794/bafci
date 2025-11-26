import { authService } from './api';
import { apiURL } from '../config/api.config.js';

export function setupInterceptors() {
  // This function will be called for every request
  const originalFetch = window.fetch;
  
  window.fetch = async function (url, options = {}) {
    console.log('🌐 Interceptor: Fetch called for URL:', url);
    console.log('🌐 apiURL:', apiURL);
    console.log('🌐 URL starts with apiURL?', url.startsWith(apiURL));
    console.log('🌐 URL includes /api/?', url.includes('/api/'));
    
    // Only add auth header for our API calls (check if URL starts with our API URL)
    if (url.startsWith(apiURL) || url.includes('/api/')) {
      const token = authService.getAuthToken();
      console.log('🔐 Token retrieved:', token ? 'EXISTS' : 'MISSING');
      
      // Add the auth header if we have a token
      if (token) {
        // Ensure options.headers exists
        if (!options.headers) {
          options.headers = {};
        }
        
        // Create a new Headers object or plain object
        options.headers = {
          ...options.headers,
          'x-auth-token': token,
        };
        console.log('✅ Added x-auth-token to headers');
        console.log('📋 Final headers:', options.headers);
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