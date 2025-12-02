import React, { useState, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { apiURL } from '../config/api.config';
import axios from 'axios';

const NotificationPanel = () => {
  const { notifications, markAsRead, markAllAsRead, clearNotification, getUnreadCount } = useNotifications();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showSMSPanel, setShowSMSPanel] = useState(false);
  const [overdueMembers, setOverdueMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [smsAlert, setSmsAlert] = useState({ show: false, type: '', message: '' });
  const unreadCount = getUnreadCount();
  
  const API_BASE_URL = apiURL;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'payment_due':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'new_member':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        );
      case 'payment_made':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'expense_added':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
            </svg>
          </div>
        );
      case 'barangay_member_added':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        );
      case 'field_worker_added':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case 'program_added':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Fetch overdue members (3+ months)
  const fetchOverdueMembers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/notifications/overdue-members?monthsOverdue=3`,
        {
          headers: { 'x-auth-token': token }
        }
      );
      setOverdueMembers(response.data.members || []);
    } catch (error) {
      console.error('Error fetching overdue members:', error);
      setSmsAlert({
        show: true,
        type: 'error',
        message: 'Failed to load overdue members'
      });
    } finally {
      setLoading(false);
    }
  };

  // Send SMS to specific member
  const sendSMSToMember = async (memberId, memberName) => {
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/notifications/send-overdue-sms/${memberId}`,
        { monthsOverdue: 3 },
        {
          headers: { 'x-auth-token': token }
        }
      );
      setSmsAlert({
        show: true,
        type: 'success',
        message: `SMS sent to ${memberName}`
      });
      fetchOverdueMembers();
    } catch (error) {
      console.error('Error sending SMS:', error);
      setSmsAlert({
        show: true,
        type: 'error',
        message: `Failed to send SMS to ${memberName}`
      });
    } finally {
      setSending(false);
    }
  };

  // Send bulk SMS
  const sendBulkSMS = async () => {
    if (!window.confirm(`Send SMS to all ${overdueMembers.length} overdue members?`)) {
      return;
    }
    
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/notifications/send-bulk-overdue-sms`,
        { monthsOverdue: 3 },
        {
          headers: { 'x-auth-token': token }
        }
      );
      setSmsAlert({
        show: true,
        type: 'success',
        message: response.data.message
      });
      fetchOverdueMembers();
    } catch (error) {
      console.error('Error sending bulk SMS:', error);
      setSmsAlert({
        show: true,
        type: 'error',
        message: 'Failed to send bulk SMS'
      });
    } finally {
      setSending(false);
    }
  };

  // Load overdue members when SMS panel is opened
  useEffect(() => {
    if (showSMSPanel && overdueMembers.length === 0) {
      fetchOverdueMembers();
    }
  }, [showSMSPanel]);

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div>
      {/* Notification Panel Content - Always visible */}
      <div className="bg-white">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setShowSMSPanel(false)}
              className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
                !showSMSPanel
                  ? 'text-green-600 border-b-2 border-green-600 bg-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setShowSMSPanel(true)}
              className={`flex-1 px-4 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                showSMSPanel
                  ? 'text-green-600 border-b-2 border-green-600 bg-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              SMS Alerts
              {overdueMembers.length > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                  {overdueMembers.length}
                </span>
              )}
            </button>
          </div>

          {/* General Notifications Tab */}
          {!showSMSPanel && (
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">No notifications yet</p>
                </div>
              ) : (
                <>
                  {unreadCount > 0 && (
                    <div className="px-4 py-2 border-b border-gray-200">
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-green-600 hover:text-green-700 font-medium"
                      >
                        Mark all as read
                      </button>
                    </div>
                  )}
                  <div className="divide-y divide-gray-200">
                    {recentNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-4 py-3 hover:bg-white transition-colors ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => !notification.read && markAsRead(notification.id)}
                      >
                        <div className="flex items-start space-x-3">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTime(notification.timestamp)}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              clearNotification(notification.id);
                            }}
                            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {notifications.length > 5 && (
                    <div className="px-4 py-2 text-center border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Showing 5 of {notifications.length} notifications
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* SMS Alerts Tab */}
          {showSMSPanel && (
            <div className="max-h-80 overflow-y-auto">
              {/* SMS Alert Message */}
              {smsAlert.show && (
                <div className={`mx-4 mt-2 px-3 py-2 rounded text-xs ${
                  smsAlert.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {smsAlert.message}
                  <button
                    onClick={() => setSmsAlert({ ...smsAlert, show: false })}
                    className="float-right font-bold"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* SMS Controls */}
              <div className="px-4 py-3 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-xs font-medium text-gray-700">
                      {overdueMembers.length} member(s) overdue 3+ months
                    </span>
                  </div>
                  <button
                    onClick={fetchOverdueMembers}
                    disabled={loading}
                    className="text-xs text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
                {overdueMembers.length > 0 && (
                  <button
                    onClick={sendBulkSMS}
                    disabled={sending}
                    className="mt-2 w-full px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? 'Sending...' : `Send SMS to All (${overdueMembers.length})`}
                  </button>
                )}
              </div>

              {/* Overdue Members List */}
              {loading ? (
                <div className="px-4 py-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <p className="mt-2 text-xs text-gray-500">Loading overdue members...</p>
                </div>
              ) : overdueMembers.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <svg className="mx-auto h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-700 font-medium">All caught up!</p>
                  <p className="text-xs text-gray-500">No members with overdue payments</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {overdueMembers.map((member) => (
                    <div key={member.id} className="px-4 py-3 hover:bg-white transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {member.fullName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {member.contactNumber || 'No phone number'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              {member.monthsSinceLastPayment ? `${member.monthsSinceLastPayment} months` : 'Never paid'}
                            </span>
                          </div>
                        </div>
                        {member.contactNumber && (
                          <button
                            onClick={() => sendSMSToMember(member.id, member.fullName)}
                            disabled={sending}
                            className="flex-shrink-0 p-2 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                            title="Send SMS"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
    </div>
  );
};

export default NotificationPanel;
