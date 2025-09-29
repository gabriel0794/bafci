const API_URL = 'http://localhost:5000/api';

export const authService = {
  async signup(userData) {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return await response.json();
  },

  async login(credentials) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: credentials.email, // Your login form uses email as username
        password: credentials.password,
      }),
    });
    return await response.json();
  },

  // Add this method to set the auth token for future requests
  setAuthToken(token) {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  },

  // Add this method to get the auth token
  getAuthToken() {
    return localStorage.getItem('token');
  },
};