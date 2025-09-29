import React, { useState, useEffect } from 'react';
import { authService } from '../../services/api';

const RevenueSummary = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revenues, setRevenues] = useState([]);
  const [activePeriod, setActivePeriod] = useState('daily');

  // Calculate summary based on active period
  const calculateSummary = (period) => {
    const now = new Date();
    let startDate;

    switch(period) {
      case 'daily':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'weekly':
        startDate = new Date(now.setDate(now.getDate() - now.getDay()));
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0); // All time
    }

    const filteredRevenues = revenues.filter(revenue => {
      const revenueDate = new Date(revenue.date);
      return revenueDate >= startDate;
    });

    const total = filteredRevenues.reduce((sum, rev) => sum + parseFloat(rev.amount), 0);
    
    return {
      total,
      count: filteredRevenues.length
    };
  };

  useEffect(() => {
    const fetchRevenues = async () => {
      try {
        setLoading(true);
        const token = authService.getAuthToken();
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const response = await fetch('/api/revenue', {
          headers: {
            'x-auth-token': token,
            'Accept': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch revenue data');
        }

        const data = await response.json();
        setRevenues(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching revenues:', err);
        setError('Failed to load revenue data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRevenues();
  }, []);

  // Calculate summaries for all periods
  const summary = {
    daily: calculateSummary('daily'),
    weekly: calculateSummary('weekly'),
    monthly: calculateSummary('monthly'),
    yearly: calculateSummary('yearly')
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle period change
  const handlePeriodChange = (period) => {
    setActivePeriod(period);
  };

  // Get active summary based on selected period
  const activeSummary = summary[activePeriod] || { total: 0, count: 0 };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Revenue Overview</h2>
        <div className="flex space-x-2">
          {['daily', 'weekly', 'monthly', 'yearly'].map((period) => (
            <button
              key={period}
              onClick={() => handlePeriodChange(period)}
              className={`px-3 py-1 text-sm font-medium rounded-md ${
                activePeriod === period
                  ? 'bg-green-100 text-green-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h3l-4 4-4-4h3V3h2v4zm-9 1h3v10h2V8h3l-4-4-4 4z" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {activePeriod.charAt(0).toUpperCase() + activePeriod.slice(1)} Revenue
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(activeSummary.total)}
                  </div>
                  <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                    {activeSummary.count} {activeSummary.count === 1 ? 'transaction' : 'transactions'}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Additional metrics can be added here in a grid layout */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Daily Summary */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-sm font-medium text-gray-500">Daily</h3>
            <div className="mt-2 text-2xl font-semibold text-gray-900">
              {formatCurrency(summary.daily.total)}
            </div>
            <div className="mt-1 text-sm text-gray-500">
              {summary.daily.count} {summary.daily.count === 1 ? 'transaction' : 'transactions'}
            </div>
          </div>
        </div>

        {/* Weekly Summary */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-sm font-medium text-gray-500">Weekly</h3>
            <div className="mt-2 text-2xl font-semibold text-gray-900">
              {formatCurrency(summary.weekly.total)}
            </div>
            <div className="mt-1 text-sm text-gray-500">
              {summary.weekly.count} {summary.weekly.count === 1 ? 'transaction' : 'transactions'}
            </div>
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-sm font-medium text-gray-500">Monthly</h3>
            <div className="mt-2 text-2xl font-semibold text-gray-900">
              {formatCurrency(summary.monthly.total)}
            </div>
            <div className="mt-1 text-sm text-gray-500">
              {summary.monthly.count} {summary.monthly.count === 1 ? 'transaction' : 'transactions'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueSummary;
