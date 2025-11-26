import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/format';
import { authService } from '../../services/api';
import { apiURL } from '../../config/api.config';

const RevenueSummary = () => {
  // State hooks must be called at the top level
  const [revenues, setRevenues] = useState([]);
  const [memberPayments, setMemberPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePeriod, setActivePeriod] = useState('today'); // 'today', 'weekly', 'monthly', 'yearly'
  const [timeRange, setTimeRange] = useState('1M'); // For chart time range

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
    const fetchData = async () => {
      try {
        const token = authService.getAuthToken();
        
        // Fetch revenue data
        const revenueResponse = await fetch(`${apiURL}/revenue`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token,
          },
          credentials: 'include',
        });

        if (!revenueResponse.ok) {
          throw new Error('Failed to fetch revenue data');
        }

        const revenueData = await revenueResponse.json();
        setRevenues(revenueData);

        // Fetch member payments
        const membersResponse = await fetch(`${apiURL}/members`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token,
          },
          credentials: 'include',
        });

        let allPayments = [];
        if (membersResponse.ok) {
          const members = await membersResponse.json();
          
          // Fetch payment history for each member
          for (const member of members) {
            try {
              const paymentResponse = await fetch(
                `${apiURL}/payments/member/${member.id}`,
                {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                  },
                  credentials: 'include',
                }
              );

              if (paymentResponse.ok) {
                const payments = await paymentResponse.json();
                allPayments.push(...payments);
              }
            } catch (error) {
              console.error(`Error fetching payments for member ${member.id}:`, error);
            }
          }
        }

        setMemberPayments(allPayments);
      } catch (err) {
        console.error('Error fetching revenue data:', err);
        setError('Failed to load revenue data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter revenues by date range
  const filterRevenuesByDateRange = (startDate, endDate) => {
    if (!revenues) return [];
    return revenues
      .filter(rev => {
        if (!rev.date) return false;
        const revDate = new Date(rev.date);
        return revDate >= startDate && revDate <= endDate;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Filter member payments by date range
  const filterPaymentsByDateRange = (startDate, endDate) => {
    if (!memberPayments) return [];
    return memberPayments
      .filter(payment => {
        if (!payment.payment_date) return false;
        const paymentDate = new Date(payment.payment_date);
        return paymentDate >= startDate && paymentDate <= endDate;
      })
      .sort((a, b) => new Date(a.payment_date) - new Date(b.payment_date));
  };

  if (loading) return <div>Loading revenue data...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  // Filter revenues for each period
  const dailyRevenues = filterRevenuesByDateRange(todayStart, todayEnd);
  const weeklyRevenues = filterRevenuesByDateRange(weekStart, weekEnd);
  const monthlyRevenues = filterRevenuesByDateRange(monthStart, monthEnd);
  const yearlyRevenues = filterRevenuesByDateRange(yearStart, yearEnd);

  // Filter member payments for each period
  const dailyPayments = filterPaymentsByDateRange(todayStart, todayEnd);
  const weeklyPayments = filterPaymentsByDateRange(weekStart, weekEnd);
  const monthlyPayments = filterPaymentsByDateRange(monthStart, monthEnd);
  const yearlyPayments = filterPaymentsByDateRange(yearStart, yearEnd);

  // Calculate totals for each period (including member payments)
  const calculateTotals = (revenueList, paymentList = []) => {
    // Calculate expenses from revenue list
    let expenses = 0;

    if (revenueList && revenueList.length > 0) {
      expenses = Math.abs(
        revenueList
          .filter(rev => parseFloat(rev.amount || 0) < 0)
          .reduce((sum, rev) => sum + parseFloat(rev.amount || 0), 0)
      );
    }

    // Separate membership fee payments from monthly payments
    const membershipFeePayments = paymentList ? paymentList.filter(p => p.membership_fee_paid) : [];
    const monthlyPayments = paymentList ? paymentList.filter(p => !p.membership_fee_paid) : [];
    
    const membershipFeeTotal = membershipFeePayments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
    const monthlyPaymentsTotal = monthlyPayments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);

    // Total revenue = (Monthly Payments + Membership Fees) - Expenses
    const totalRevenue = membershipFeeTotal + monthlyPaymentsTotal - expenses;

    return {
      total: totalRevenue,
      monthlyPayments: monthlyPaymentsTotal,
      membershipFees: membershipFeeTotal,
      expenses
    };
  };

  // Calculate totals for each period (including member payments)
  const daily = calculateTotals(dailyRevenues, dailyPayments);
  const weekly = calculateTotals(weeklyRevenues, weeklyPayments);
  const monthly = calculateTotals(monthlyRevenues, monthlyPayments);
  const yearly = calculateTotals(yearlyRevenues, yearlyPayments);

  // Set active period
  const setPeriod = (period) => setActivePeriod(period);

  // Helper function to render time period section
  const renderTimePeriod = (title, period, isVisible, toggleFn) => (
    <div className="w-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <button
          onClick={toggleFn}
          className="text-gray-500 hover:text-indigo-600 transition-colors p-1 -mr-2"
        >
          <svg
            className={`w-5 h-5 transition-transform ${isVisible ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
          </svg>
        </button>
      </div>
      {isVisible && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
          <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow transition-shadow min-h-[90px] flex flex-col justify-center">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</div>
            <div className="text-xl font-semibold text-gray-900 mt-1 break-words">
              {formatCurrency(period.total)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow transition-shadow min-h-[90px] flex flex-col justify-center">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Payments</div>
            <div className="text-xl font-semibold text-blue-600 mt-1 break-words">
              {formatCurrency(period.monthlyPayments)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow transition-shadow min-h-[90px] flex flex-col justify-center">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Membership Fee Payments</div>
            <div className="text-xl font-semibold text-green-600 mt-1 break-words">
              {formatCurrency(period.membershipFees)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow transition-shadow min-h-[90px] flex flex-col justify-center">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Expenses</div>
            <div className="text-xl font-semibold text-red-600 mt-1 break-words">
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

  // Prepare data for the chart (last 30 days by default)
  const getChartData = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30); // Default to 30 days
    
    // In a real app, you would filter based on the selected timeRange
    return filterRevenuesByDateRange(startDate, endDate);
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        <h2 className="text-lg font-medium text-gray-900">Revenue Overview</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setPeriod('today')}
            className={`px-3 py-1 text-sm rounded-md ${
              activePeriod === 'today' ? 'bg-green-200 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setPeriod('weekly')}
            className={`px-3 py-1 text-sm rounded-md ${
              activePeriod === 'weekly' ? 'bg-green-200 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-3 py-1 text-sm rounded-md ${
              activePeriod === 'monthly' ? 'bg-green-200 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setPeriod('yearly')}
            className={`px-3 py-1 text-sm rounded-md ${
              activePeriod === 'yearly' ? 'bg-green-200 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Yearly
          </button>
        </div>
      </div>
      
      <div className="w-full">
        {renderTimePeriod(title, data, true, () => {})}
      </div>
    </div>
  );
};

export default RevenueSummary;
