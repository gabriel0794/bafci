import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import RevenueSummary from '../../components/dashboard/RevenueSummary';
import RevenueChart from '../../components/dashboard/RevenueChart';
import MembersList from '../../components/dashboard/MembersList';
import FieldWorkersList from '../../components/dashboard/FieldWorkersList';
import Navbar from '../../components/Navbar';


export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [timeRange, setTimeRange] = useState('1M'); // '1D', '5D', '1M', '1Y', '5Y', 'MAX'
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

      <div className="py-6 px-2 sm:px-4">
        <div className="max-w-[99%] mx-auto">
          <header className="mb-6 px-2 sm:px-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Welcome back, {userData?.name}!
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Here's what's happening with your business today
            </p>
          </header>

          <main className="space-y-4 sm:space-y-6">
            {/* Revenue Summary and Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 flex flex-col h-[330px]">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Revenue Overview</h2>
                <div className="flex-1">
                  <RevenueSummary />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 flex flex-col h-[330px]">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Revenue Chart</h2>
                <div className="flex-1 min-h-0">
                  <RevenueChart 
                    timeRange={timeRange}
                    onTimeRangeChange={setTimeRange}
                  />
                </div>
              </div>
            </div>
            
            {/* Members List and Field Workers List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <MembersList />
              </div>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <FieldWorkersList />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
