import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import RevenueSummary from '../../components/dashboard/RevenueSummary';
import Navbar from '../../components/Navbar';

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = authService.getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        const userProfile = await authService.getUserProfile();
        
        // Redirect role 3 (Account Manager) to signup page to create accounts
        if (userProfile.role === 3) {
          navigate('/signup');
          return;
        }
        
        setUserData({ 
          name: userProfile.name || 'User',
          ...userProfile // Spread other user data if available
        });
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Handle error (e.g., show error message, redirect to login, etc.)
        authService.setAuthToken(null);
        navigate('/login');
      }
    };

    fetchUserData();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar activePage="dashboard" />


      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome {userData?.name}!
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              View your dashboard overview below.
            </p>
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Revenue Summary */}
            <RevenueSummary />
            
            {/* Additional dashboard content */}
            <div className="mt-8">
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 flex items-center justify-center">
                <p className="text-gray-500">Additional dashboard content goes here</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}