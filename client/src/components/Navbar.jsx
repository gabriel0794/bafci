import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authService } from '../services/api';
import NotificationPanel from './NotificationPanel';
import { useNotifications } from '../contexts/NotificationContext';

export default function Navbar({ activePage }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { getUnreadCount } = useNotifications();
  const unreadCount = getUnreadCount();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);
  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);
  const [userName, setUserName] = useState('Staff');
  const [userInitials, setUserInitials] = useState('S');
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Minimum swipe distance required (in px)
  const minSwipeDistance = 50;

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    authService.setAuthToken(null);
    navigate('/login');
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  // Load basic user info for topbar
  useEffect(() => {
    const loadUser = async () => {
      try {
        const profile = await authService.getUserProfile();
        if (profile) {
          const name = profile.name || profile.full_name || 'Staff';
          setUserName(name);
          const parts = name.split(' ').filter(Boolean);
          const initials = parts.slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('') || 'S';
          setUserInitials(initials);
        }
      } catch (e) {
        console.error('Error loading user profile for Navbar:', e);
      }
    };

    loadUser();
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  // Handle touch events for swipe gesture on sidebar (to close)
  const onSidebarTouchStart = (e) => {
    touchStartRef.current = e.targetTouches[0].clientX;
    touchEndRef.current = null;
  };

  const onSidebarTouchMove = (e) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  };

  const onSidebarTouchEnd = () => {
    if (touchStartRef.current === null || touchEndRef.current === null) return;
    
    const distance = touchEndRef.current - touchStartRef.current;
    const isLeftSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      setIsSidebarOpen(false);
    }
    
    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  // Add touch event listeners to document for edge swipe (to open)
  useEffect(() => {
    let edgeTouchStart = null;
    let edgeTouchEnd = null;

    const handleDocumentTouchStart = (e) => {
      // Only trigger if touch starts from left edge (within 30px)
      if (e.touches[0].clientX < 30) {
        edgeTouchStart = e.touches[0].clientX;
        edgeTouchEnd = null;
      } else {
        edgeTouchStart = null;
      }
    };

    const handleDocumentTouchMove = (e) => {
      if (edgeTouchStart !== null) {
        edgeTouchEnd = e.touches[0].clientX;
      }
    };

    const handleDocumentTouchEnd = () => {
      if (edgeTouchStart === null || edgeTouchEnd === null) return;
      
      const distance = edgeTouchEnd - edgeTouchStart;
      if (distance > minSwipeDistance) {
        setIsSidebarOpen(prev => {
          if (!prev) return true;
          return prev;
        });
      }
      edgeTouchStart = null;
      edgeTouchEnd = null;
    };

    document.addEventListener('touchstart', handleDocumentTouchStart);
    document.addEventListener('touchmove', handleDocumentTouchMove);
    document.addEventListener('touchend', handleDocumentTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleDocumentTouchStart);
      document.removeEventListener('touchmove', handleDocumentTouchMove);
      document.removeEventListener('touchend', handleDocumentTouchEnd);
    };
  }, []);

  const isActive = (pageName) => {
    return activePage === pageName 
      ? 'bg-green-50 border-l-4 border-green-600 text-green-700' 
      : 'border-l-4 border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900';
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', page: 'dashboard' },
    { name: 'Revenue', href: '/revenue', page: 'revenue' },
    { name: 'Members', href: '/members', page: 'members' },
    { name: 'Barangays', href: '/add-barangay-members', page: 'add-barangay-members' },
  ];

  return (
    <>
      {/* Topbar (desktop & mobile) */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-white shadow-sm z-20 flex items-center justify-between px-3 sm:px-6 border-b border-gray-100 lg:left-64">
        
        {/* Burger menu for mobile */}
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none"
          aria-label="Open menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        
        {/* Empty div for desktop to maintain layout */}
        <div className="hidden lg:block"></div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Notification bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotificationDropdown(prev => !prev)}
              className={`relative p-2 rounded-full ${
                showNotificationDropdown ? 'bg-green-50 text-green-600' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {/* Notification badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            {showNotificationDropdown && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <NotificationPanel />
              </div>
            )}
          </div>

          {/* User avatar & dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileDropdown(prev => !prev)}
              className="flex items-center gap-2 rounded-sm hover:bg-gray-100 px-2 py-1"
            >
              <div className="hidden sm:flex flex-col items-end leading-tight">
                <span className="text-xs text-gray-500">Signed in as</span>
                <span className="text-sm font-semibold text-gray-800 max-w-[140px] truncate">{userName}</span>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-green-600 flex items-center justify-center text-white text-xs sm:text-sm font-semibold shadow-md">
                {userInitials}
              </div>
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 11-4 0v-1m0-10V5a2 2 0 114 0v1"
                    />
                  </svg>
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Desktop Sidebar - Always visible on large screens */}
      <div className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-white shadow-lg flex-col z-40">
        {/* Logo/Brand Section */}
        <div className="flex items-center justify-center h-20 border-b border-gray-200 bg-gradient-to-r from-green-600 to-green-700">
          <Link to="/dashboard" className="text-3xl font-bold text-white tracking-wide">
            BAFCI
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => (
            <Link
              key={item.page}
              to={item.href}
              className={`${isActive(item.page)} flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200`}
            >
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

      </div>

      {/* Mobile Sidebar - Only visible when swiped open */}
      <div 
        ref={sidebarRef}
        onTouchStart={onSidebarTouchStart}
        onTouchMove={onSidebarTouchMove}
        onTouchEnd={onSidebarTouchEnd}
        className={`lg:hidden fixed inset-y-0 left-0 w-64 bg-white shadow-lg flex flex-col transition-transform duration-300 ease-in-out z-40 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        {/* Logo/Brand Section */}
        <div className="flex items-center justify-center h-20 border-b border-gray-200 bg-gradient-to-r from-green-600 to-green-700">
          <Link to="/dashboard" className="text-3xl font-bold text-white tracking-wide">
            BAFCI
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => (
            <Link
              key={item.page}
              to={item.href}
              onClick={closeSidebar}
              className={`${isActive(item.page)} flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200`}
            >
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Logout</h3>
            <p className="text-sm text-gray-600 mb-6">Are you sure you want to sign out?</p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
