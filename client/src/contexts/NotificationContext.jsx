import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/api';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications from database on mount
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        // Not logged in, skip fetching
        return;
      }
      
      const response = await notificationService.getNotifications(50, 0);
      if (response.success) {
        // Transform database notifications to match expected format
        const transformedNotifications = response.notifications.map(notif => ({
          id: notif.id,
          type: notif.type,
          message: notif.message,
          read: notif.read,
          timestamp: notif.createdAt,
          memberId: notif.memberId,
          member: notif.member,
          metadata: notif.metadata
        }));
        setNotifications(transformedNotifications);
        setUnreadCount(response.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch notifications on mount and set up polling
  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Add a new notification (saves to database)
  const addNotification = async (notification) => {
    try {
      const response = await notificationService.createNotification({
        type: notification.type || 'general',
        message: notification.message,
        memberId: notification.memberId || null,
        metadata: notification.metadata || null
      });
      
      if (response.success) {
        // Refresh notifications to get the new one
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  // Mark a notification as read
  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete a notification
  const clearNotification = async (id) => {
    try {
      const notification = notifications.find(n => n.id === id);
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Delete all notifications
  const clearAllNotifications = async () => {
    try {
      await notificationService.deleteAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  // Get unread count
  const getUnreadCount = () => {
    return unreadCount;
  };

  // Refresh notifications manually
  const refreshNotifications = () => {
    fetchNotifications();
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAllNotifications,
        getUnreadCount,
        refreshNotifications,
        loading
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
