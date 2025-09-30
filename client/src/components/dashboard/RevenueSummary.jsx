import React, { useState, useEffect } from 'react';
import { authService } from '../../services/api';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const RevenueSummary = () => {
  const [revenues, setRevenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) return <div>Loading revenue data...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  // Helper function to filter revenues by date range
  const filterRevenuesByDateRange = (startDate, endDate) => {
    return revenues.filter(rev => {
      const revDate = new Date(rev.date);
      return revDate >= startDate && revDate <= endDate;
    });
  };

  // Get current date and time boundaries
  const now = new Date();
  
  // Daily: Today from 00:00 to 23:59:59
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const dailyRevenues = filterRevenuesByDateRange(todayStart, todayEnd);
  
  // Weekly: Current week from Monday to Sunday
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysToMonday = currentDay === 0 ? 6 : currentDay - 1; // If Sunday, go back 6 days
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59);
  const weeklyRevenues = filterRevenuesByDateRange(weekStart, weekEnd);
  
  // Monthly: Current month from 1st to last day
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const monthlyRevenues = filterRevenuesByDateRange(monthStart, monthEnd);
  
  // Yearly: Current year from Jan 1 to Dec 31
  const yearStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
  const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
  const yearlyRevenues = filterRevenuesByDateRange(yearStart, yearEnd);

  // Calculate totals for each period
  const calculateTotals = (revenueList) => {
    const total = revenueList.reduce((sum, rev) => sum + parseFloat(rev.amount), 0);
    const added = revenueList
      .filter(rev => parseFloat(rev.amount) > 0)
      .reduce((sum, rev) => sum + parseFloat(rev.amount), 0);
    const expenses = Math.abs(
      revenueList
        .filter(rev => parseFloat(rev.amount) < 0)
        .reduce((sum, rev) => sum + parseFloat(rev.amount), 0)
    );
    return { total, added, expenses };
  };

  const daily = calculateTotals(dailyRevenues);
  const weekly = calculateTotals(weeklyRevenues);
  const monthly = calculateTotals(monthlyRevenues);
  const yearly = calculateTotals(yearlyRevenues);

  return (
    <div className="mt-8">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Revenue Overview</h2>
      
      {/* Daily and Weekly Revenue - Side by Side */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        {/* Daily Revenue */}
        <div className="flex-1">
          <h3 className="text-md font-bold text-gray-700 mb-3">Today</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">Total Revenue</div>
              <div className="mt-1 text-2xl font-semibold text-gray-900">
                {formatCurrency(daily.total)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">Total Added</div>
              <div className="mt-1 text-2xl font-semibold text-green-600">
                {formatCurrency(daily.added)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">Total Expenses</div>
              <div className="mt-1 text-2xl font-semibold text-red-600">
                {formatCurrency(daily.expenses)}
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Revenue */}
        <div className="flex-1">
          <h3 className="text-md font-bold text-gray-700 mb-3">Week (Mon-Sun)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">Total Revenue</div>
              <div className="mt-1 text-2xl font-semibold text-gray-900">
                {formatCurrency(weekly.total)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">Total Added</div>
              <div className="mt-1 text-2xl font-semibold text-green-600">
                {formatCurrency(weekly.added)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">Total Expenses</div>
              <div className="mt-1 text-2xl font-semibold text-red-600">
                {formatCurrency(weekly.expenses)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Revenue */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6">
      <div className="flex-1">
        <h3 className="text-md font-bold text-gray-700 mb-3">Month</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Total Revenue</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">
              {formatCurrency(monthly.total)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Total Added</div>
            <div className="mt-1 text-2xl font-semibold text-green-600">
              {formatCurrency(monthly.added)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Total Expenses</div>
            <div className="mt-1 text-2xl font-semibold text-red-600">
              {formatCurrency(monthly.expenses)}
            </div>
          </div>
        </div>
      </div>

      {/* Yearly Revenue */}
      <div className="flex-1">
        <h3 className="text-md font-bold text-gray-700 mb-3">Year</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Total Revenue</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">
              {formatCurrency(yearly.total)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Total Added</div>
            <div className="mt-1 text-2xl font-semibold text-green-600">
              {formatCurrency(yearly.added)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Total Expenses</div>
            <div className="mt-1 text-2xl font-semibold text-red-600">
              {formatCurrency(yearly.expenses)}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default RevenueSummary;
