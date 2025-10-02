const API_URL = 'http://localhost:5000/api';

export const authService = {
    async signup(userData) {
        try {
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw {
                    response: {
                        status: response.status,
                        data: errorData
                    }
                };
            }

            const data = await response.json();
            if (data.token) {
                this.setAuthToken(data.token);
            }
            return data;
        } catch (error) {
            console.error('Signup API error:', error);
            throw error;
        }
    },

    async login(credentials) {
        try {
          const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: credentials.email, // Make sure this matches your backend's expected field
              password: credentials.password,
            }),
          });
      
          if (!response.ok) {
            const errorData = await response.json();
            throw {
              response: {
                status: response.status,
                data: errorData
              }
            };
          }
      
          return await response.json();
        } catch (error) {
          console.error('Login API error:', error);
          throw error;
        }
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

  // Get the authenticated user's profile
  async getUserProfile() {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': this.getAuthToken()
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },
};