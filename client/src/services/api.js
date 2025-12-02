import { apiURL } from '../config/api.config.js';

const API_URL = apiURL;

export const authService = {
    async signup(userData) {
        try {
            const token = this.getAuthToken();
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token || '',
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
              username: credentials.username,
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
      console.log('🗑️ Token removed from localStorage');
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
          'Content-Type': 'application/json'
          // x-auth-token will be added by the interceptor
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

// Notification Service - Database-backed notifications
export const notificationService = {
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'x-auth-token': token || '',
    };
  },

  // Fetch all notifications
  async getNotifications(limit = 50, offset = 0) {
    try {
      const response = await fetch(
        `${API_URL}/notifications?limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  // Create a new notification
  async createNotification({ type, message, memberId, metadata }) {
    try {
      const response = await fetch(`${API_URL}/notifications`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ type, message, memberId, metadata }),
      });

      if (!response.ok) {
        throw new Error('Failed to create notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  // Mark a notification as read
  async markAsRead(id) {
    try {
      const response = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const response = await fetch(`${API_URL}/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  // Delete a notification
  async deleteNotification(id) {
    try {
      const response = await fetch(`${API_URL}/notifications/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  // Delete all notifications
  async deleteAllNotifications() {
    try {
      const response = await fetch(`${API_URL}/notifications`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete all notifications');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  },

  // Get unread count only
  async getUnreadCount() {
    try {
      const response = await fetch(`${API_URL}/notifications/unread-count`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to get unread count');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  },
};