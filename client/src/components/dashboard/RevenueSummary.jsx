import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/format';
import { authService } from '../../services/api';

const RevenueSummary = () => {
  // State hooks must be called at the top level
  const [revenues, setRevenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePeriod, setActivePeriod] = useState('today'); // 'today', 'weekly', 'monthly', 'yearly'

  // Calculate all date ranges at the top level
  const now = new Date();
  
  // Daily: Today from 00:00 to 23:59:59
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  
  // Weekly: Current week from Monday to Sunday
  const currentDay = now.getDay();
  const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59);
  
  // Monthly: Current month from 1st to last day
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  
  // Yearly: Current year from Jan 1 to Dec 31
  const yearStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
  const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

  useEffect(() => {
    const fetchRevenues = async () => {
      try {
        const token = authService.getAuthToken();
        const response = await fetch('http://localhost:5000/api/revenue', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token,
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch revenue data');
        }

        const data = await response.json();
        setRevenues(data);
      } catch (err) {
        console.error('Error fetching revenue data:', err);
        setError('Failed to load revenue data');
      } finally {
        setLoading(false);
      }
    };

    fetchRevenues();
  }, []);

  // Filter revenues by date range
  const filterRevenuesByDateRange = (startDate, endDate) => {
    if (!revenues) return [];
    return revenues.filter(rev => {
      if (!rev.date) return false;
      const revDate = new Date(rev.date);
      return revDate >= startDate && revDate <= endDate;
    });
  };

  if (loading) return <div>Loading revenue data...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  // Filter revenues for each period
  const dailyRevenues = filterRevenuesByDateRange(todayStart, todayEnd);
  const weeklyRevenues = filterRevenuesByDateRange(weekStart, weekEnd);
  const monthlyRevenues = filterRevenuesByDateRange(monthStart, monthEnd);
  const yearlyRevenues = filterRevenuesByDateRange(yearStart, yearEnd);



  // Calculate totals for each period
  const calculateTotals = (revenueList) => {
    if (!revenueList || revenueList.length === 0) {
      return { total: 0, added: 0, expenses: 0 };
    }
    const total = revenueList.reduce((sum, rev) => sum + parseFloat(rev.amount || 0), 0);
    const added = revenueList
      .filter(rev => parseFloat(rev.amount || 0) > 0)
      .reduce((sum, rev) => sum + parseFloat(rev.amount || 0), 0);
    const expenses = Math.abs(
      revenueList
        .filter(rev => parseFloat(rev.amount || 0) < 0)
        .reduce((sum, rev) => sum + parseFloat(rev.amount || 0), 0)
    );
    return { total, added, expenses };
  };

  // Calculate totals for each period
  const daily = calculateTotals(dailyRevenues);
  const weekly = calculateTotals(weeklyRevenues);
  const monthly = calculateTotals(monthlyRevenues);
  const yearly = calculateTotals(yearlyRevenues);

  // Set active period
  const setPeriod = (period) => setActivePeriod(period);

  // Helper function to render time period section
  const renderTimePeriod = (title, period, isVisible, toggleFn) => (
    <div className="mb-6">
      <button
        onClick={toggleFn}
        className="flex items-center text-md font-bold text-gray-700 mb-3 hover:text-indigo-600 transition-colors"
      >
        {title}
        <svg
          className={`ml-2 w-4 h-4 transition-transform ${isVisible ? 'transform rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isVisible && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Total Revenue</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">
              {formatCurrency(period.total)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Total Added</div>
            <div className="mt-1 text-2xl font-semibold text-green-600">
              {formatCurrency(period.added)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Total Expenses</div>
            <div className="mt-1 text-2xl font-semibold text-red-600">
              {formatCurrency(period.expenses)}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Get the current period data based on activePeriod
  const getActivePeriodData = () => {
    switch (activePeriod) {
      case 'weekly':
        return { title: 'This Week', data: weekly };
      case 'monthly':
        return { title: 'This Month', data: monthly };
      case 'yearly':
        return { title: 'This Year', data: yearly };
      case 'today':
      default:
        return { title: 'Today', data: daily };
    }
  };

  const { title, data } = getActivePeriodData();

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Revenue Overview</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setPeriod('today')}
            className={`px-3 py-1 text-sm rounded-md ${
              activePeriod === 'today' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setPeriod('weekly')}
            className={`px-3 py-1 text-sm rounded-md ${
              activePeriod === 'weekly' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-3 py-1 text-sm rounded-md ${
              activePeriod === 'monthly' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setPeriod('yearly')}
            className={`px-3 py-1 text-sm rounded-md ${
              activePeriod === 'yearly' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Yearly
          </button>
        </div>
      </div>
      
      {/* Show the active period */}
      {renderTimePeriod(title, data, true, () => {})}
    </div>
  );
};

export default RevenueSummary;
