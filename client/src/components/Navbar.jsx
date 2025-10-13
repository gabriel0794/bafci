import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

export default function Navbar({ activePage }) {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

  const isActive = (pageName) => {
    return activePage === pageName 
      ? 'border-green-500 text-gray-900' 
      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700';
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <a href="/dashboard" className="text-2xl font-bold text-gray-900">BAFCI</a>
            </div>
          </div>

          <div className="flex items-center space-x-8">
            <div className="hidden sm:flex sm:space-x-8">
              <a
                href="/dashboard"
                className={`${isActive('dashboard')} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Dashboard
              </a>
              <a
                href="/revenue"
                className={`${isActive('revenue')} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Revenue
              </a>
              <a
                href="/members"
                className={`${isActive('members')} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Members
              </a>
              <a
                href="/payments"
                className={`${isActive('payments')} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Payments
              </a>
            </div>
            <div className="relative">
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Sign out
              </button>
              
              {/* Logout Confirmation Dialog */}
              {showLogoutConfirm && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg overflow-hidden z-10 border border-gray-200">
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900">Confirm Logout</h3>
                    <p className="mt-1 text-sm text-gray-500">Are you sure you want to sign out?</p>
                    <div className="mt-4 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={cancelLogout}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={confirmLogout}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
