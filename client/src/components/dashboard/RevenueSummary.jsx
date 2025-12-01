import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/format';
import { authService } from '../../services/api';
import { apiURL } from '../../config/api.config';

const RevenueSummary = () => {
  // State hooks must be called at the top level
  const [revenues, setRevenues] = useState([]);
  const [memberPayments, setMemberPayments] = useState([]);
  const [membershipFeePayments, setMembershipFeePayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePeriod, setActivePeriod] = useState('today'); // 'today', 'weekly', 'monthly', 'yearly'
  const [timeRange, setTimeRange] = useState('1M'); // For chart time range

  // Calculate all date ranges at the top level
  const now = new Date();
  
  // Daily: Today from 00:00 to 23:59:59
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  
  // Yesterday: For comparison
  const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
  const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
  
  // Weekly: Current week from Monday to Sunday
  const currentDay = now.getDay();
  const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59);
  
  // Last week: For weekly comparison
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(weekEnd);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
  
  // Last month: For monthly comparison
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  
  // Last year: For yearly comparison
  const lastYearStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0);
  const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
  
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
        let membershipFees = [];
        if (membersResponse.ok) {
          const members = await membersResponse.json();
          
          // Extract membership fee payments from members (one-time fees stored on member record)
          membershipFees = members
            .filter(member => member.membership_fee_paid && member.membership_fee_paid_date)
            .map(member => ({
              id: `mf-${member.id}`,
              member_name: member.full_name,
              member_id: member.id,
              payment_date: member.membership_fee_paid_date,
              amount: member.membership_fee_amount || 500
            }));
          
          // Fetch payment history for each member (monthly payments)
          for (const member of members) {
            try {
              const paymentResponse = await fetch(
                `${apiURL}/payments/history/${member.id}`,
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
        setMembershipFeePayments(membershipFees);
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

  // Filter membership fee payments by date range
  const filterMembershipFeesByDateRange = (startDate, endDate) => {
    if (!membershipFeePayments) return [];
    return membershipFeePayments
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

  // Filter member payments for each period (monthly payments from payments table)
  const dailyPayments = filterPaymentsByDateRange(todayStart, todayEnd);
  const weeklyPayments = filterPaymentsByDateRange(weekStart, weekEnd);
  const monthlyPaymentsFiltered = filterPaymentsByDateRange(monthStart, monthEnd);
  const yearlyPayments = filterPaymentsByDateRange(yearStart, yearEnd);

  // Filter membership fee payments for each period (from member records)
  const dailyMembershipFees = filterMembershipFeesByDateRange(todayStart, todayEnd);
  const weeklyMembershipFees = filterMembershipFeesByDateRange(weekStart, weekEnd);
  const monthlyMembershipFees = filterMembershipFeesByDateRange(monthStart, monthEnd);
  const yearlyMembershipFees = filterMembershipFeesByDateRange(yearStart, yearEnd);

  // Calculate totals for each period (including member payments)
  const calculateTotals = (revenueList, monthlyPaymentList = [], membershipFeeList = []) => {
    // Calculate expenses from revenue list
    let expenses = 0;

    if (revenueList && revenueList.length > 0) {
      expenses = Math.abs(
        revenueList
          .filter(rev => parseFloat(rev.amount || 0) < 0)
          .reduce((sum, rev) => sum + parseFloat(rev.amount || 0), 0)
      );
    }

    // Monthly payments come from payments table
    const monthlyPaymentsTotal = monthlyPaymentList.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
    
    // Membership fees come from member records
    const membershipFeeTotal = membershipFeeList.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);

    // Total revenue = (Monthly Payments + Membership Fees) - Expenses
    const totalRevenue = membershipFeeTotal + monthlyPaymentsTotal - expenses;

    return {
      total: totalRevenue,
      monthlyPayments: monthlyPaymentsTotal,
      membershipFees: membershipFeeTotal,
      expenses
    };
  };

  // Calculate totals for each period (including member payments and membership fees)
  const daily = calculateTotals(dailyRevenues, dailyPayments, dailyMembershipFees);
  const weekly = calculateTotals(weeklyRevenues, weeklyPayments, weeklyMembershipFees);
  const monthly = calculateTotals(monthlyRevenues, monthlyPaymentsFiltered, monthlyMembershipFees);
  const yearly = calculateTotals(yearlyRevenues, yearlyPayments, yearlyMembershipFees);

  // Calculate previous period totals for comparison
  const yesterdayRevenues = filterRevenuesByDateRange(yesterdayStart, yesterdayEnd);
  const yesterdayPayments = filterPaymentsByDateRange(yesterdayStart, yesterdayEnd);
  const yesterdayMembershipFees = filterMembershipFeesByDateRange(yesterdayStart, yesterdayEnd);
  const yesterday = calculateTotals(yesterdayRevenues, yesterdayPayments, yesterdayMembershipFees);

  const lastWeekRevenues = filterRevenuesByDateRange(lastWeekStart, lastWeekEnd);
  const lastWeekPayments = filterPaymentsByDateRange(lastWeekStart, lastWeekEnd);
  const lastWeekMembershipFeesData = filterMembershipFeesByDateRange(lastWeekStart, lastWeekEnd);
  const lastWeek = calculateTotals(lastWeekRevenues, lastWeekPayments, lastWeekMembershipFeesData);

  const lastMonthRevenues = filterRevenuesByDateRange(lastMonthStart, lastMonthEnd);
  const lastMonthPayments = filterPaymentsByDateRange(lastMonthStart, lastMonthEnd);
  const lastMonthMembershipFeesData = filterMembershipFeesByDateRange(lastMonthStart, lastMonthEnd);
  const lastMonth = calculateTotals(lastMonthRevenues, lastMonthPayments, lastMonthMembershipFeesData);

  const lastYearRevenues = filterRevenuesByDateRange(lastYearStart, lastYearEnd);
  const lastYearPayments = filterPaymentsByDateRange(lastYearStart, lastYearEnd);
  const lastYearMembershipFeesData = filterMembershipFeesByDateRange(lastYearStart, lastYearEnd);
  const lastYear = calculateTotals(lastYearRevenues, lastYearPayments, lastYearMembershipFeesData);

  // Calculate percentage change
  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  // Get percentage change for each period - Total Revenue
  const dailyChange = calculatePercentageChange(daily.total, yesterday.total);
  const weeklyChange = calculatePercentageChange(weekly.total, lastWeek.total);
  const monthlyChange = calculatePercentageChange(monthly.total, lastMonth.total);
  const yearlyChange = calculatePercentageChange(yearly.total, lastYear.total);

  // Get percentage change for Monthly Payments
  const dailyPaymentsChange = calculatePercentageChange(daily.monthlyPayments, yesterday.monthlyPayments);
  const weeklyPaymentsChange = calculatePercentageChange(weekly.monthlyPayments, lastWeek.monthlyPayments);
  const monthlyPaymentsChange = calculatePercentageChange(monthly.monthlyPayments, lastMonth.monthlyPayments);
  const yearlyPaymentsChange = calculatePercentageChange(yearly.monthlyPayments, lastYear.monthlyPayments);

  // Get percentage change for Membership Fees
  const dailyFeesChange = calculatePercentageChange(daily.membershipFees, yesterday.membershipFees);
  const weeklyFeesChange = calculatePercentageChange(weekly.membershipFees, lastWeek.membershipFees);
  const monthlyFeesChange = calculatePercentageChange(monthly.membershipFees, lastMonth.membershipFees);
  const yearlyFeesChange = calculatePercentageChange(yearly.membershipFees, lastYear.membershipFees);

  // Get percentage change for Expenses
  const dailyExpensesChange = calculatePercentageChange(daily.expenses, yesterday.expenses);
  const weeklyExpensesChange = calculatePercentageChange(weekly.expenses, lastWeek.expenses);
  const monthlyExpensesChange = calculatePercentageChange(monthly.expenses, lastMonth.expenses);
  const yearlyExpensesChange = calculatePercentageChange(yearly.expenses, lastYear.expenses);

  // Set active period
  const setPeriod = (period) => setActivePeriod(period);

  // Percentage change indicator component
  const PercentageIndicator = ({ change, comparisonLabel }) => {
    const isPositive = change >= 0;
    const formattedChange = Math.abs(change).toFixed(1);
    
    return (
      <div className="flex items-center gap-1 mt-1">
        <span className={`inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded ${
          isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {isPositive ? (
            <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
            </svg>
          ) : (
            <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
            </svg>
          )}
          {formattedChange}%
        </span>
        <span className="text-xs text-gray-400">{comparisonLabel}</span>
      </div>
    );
  };

  // Get comparison label based on active period
  const getComparisonLabel = () => {
    switch (activePeriod) {
      case 'weekly': return 'vs last week';
      case 'monthly': return 'vs last month';
      case 'yearly': return 'vs last year';
      case 'today':
      default: return 'vs yesterday';
    }
  };

  // Get percentage change based on active period
  const getActivePercentageChange = () => {
    switch (activePeriod) {
      case 'weekly': return weeklyChange;
      case 'monthly': return monthlyChange;
      case 'yearly': return yearlyChange;
      case 'today':
      default: return dailyChange;
    }
  };

  // Get percentage change for monthly payments based on active period
  const getActivePaymentsChange = () => {
    switch (activePeriod) {
      case 'weekly': return weeklyPaymentsChange;
      case 'monthly': return monthlyPaymentsChange;
      case 'yearly': return yearlyPaymentsChange;
      case 'today':
      default: return dailyPaymentsChange;
    }
  };

  // Get percentage change for membership fees based on active period
  const getActiveFeesChange = () => {
    switch (activePeriod) {
      case 'weekly': return weeklyFeesChange;
      case 'monthly': return monthlyFeesChange;
      case 'yearly': return yearlyFeesChange;
      case 'today':
      default: return dailyFeesChange;
    }
  };

  // Get percentage change for expenses based on active period
  const getActiveExpensesChange = () => {
    switch (activePeriod) {
      case 'weekly': return weeklyExpensesChange;
      case 'monthly': return monthlyExpensesChange;
      case 'yearly': return yearlyExpensesChange;
      case 'today':
      default: return dailyExpensesChange;
    }
  };

  // Expense indicator (inverted - lower expenses is good)
  const ExpenseIndicator = ({ change, comparisonLabel }) => {
    const isPositive = change <= 0; // For expenses, decrease is good
    const formattedChange = Math.abs(change).toFixed(1);
    
    return (
      <div className="flex items-center gap-1 mt-1">
        <span className={`inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded ${
          isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {change <= 0 ? (
            <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
            </svg>
          ) : (
            <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
            </svg>
          )}
          {formattedChange}%
        </span>
        <span className="text-xs text-gray-400">{comparisonLabel}</span>
      </div>
    );
  };

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
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl font-semibold text-gray-900 break-words">
                {formatCurrency(period.total)}
              </span>
            </div>
            <PercentageIndicator change={getActivePercentageChange()} comparisonLabel={getComparisonLabel()} />
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow transition-shadow min-h-[90px] flex flex-col justify-center">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Payments</div>
            <div className="text-xl font-semibold text-blue-600 mt-1 break-words">
              {formatCurrency(period.monthlyPayments)}
            </div>
            <PercentageIndicator change={getActivePaymentsChange()} comparisonLabel={getComparisonLabel()} />
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow transition-shadow min-h-[90px] flex flex-col justify-center">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Membership Fee Payments</div>
            <div className="text-xl font-semibold text-green-600 mt-1 break-words">
              {formatCurrency(period.membershipFees)}
            </div>
            <PercentageIndicator change={getActiveFeesChange()} comparisonLabel={getComparisonLabel()} />
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow transition-shadow min-h-[90px] flex flex-col justify-center">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Expenses</div>
            <div className="text-xl font-semibold text-red-600 mt-1 break-words">
              {formatCurrency(period.expenses)}
            </div>
            <ExpenseIndicator change={getActiveExpensesChange()} comparisonLabel={getComparisonLabel()} />
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
