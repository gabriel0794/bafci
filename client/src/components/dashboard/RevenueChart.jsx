import React, { useState, useEffect, useMemo } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { authService } from '../../services/api';

// Register all ChartJS components
ChartJS.register(...registerables);

const RevenueChart = ({ timeRange, onTimeRangeChange }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [memberPayments, setMemberPayments] = useState([]);
  const [showArchive, setShowArchive] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [allRevenues, setAllRevenues] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [viewMode, setViewMode] = useState('daily'); // 'daily', 'monthly', 'yearly'
  
  // Fetch revenue data and member payments based on time range
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = authService.getAuthToken();
        
        // Fetch revenue data
        const revenueResponse = await fetch('http://localhost:5000/api/revenue', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!revenueResponse.ok) {
          throw new Error('Failed to fetch revenue data');
        }

        const revenues = await revenueResponse.json();

        // Fetch member payments
        const membersResponse = await fetch('http://localhost:5000/api/members', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'x-auth-token': token,
          },
        });

        let allPayments = [];
        if (membersResponse.ok) {
          const members = await membersResponse.json();
          
          // Fetch payment history for each member
          for (const member of members) {
            try {
              const paymentResponse = await fetch(
                `http://localhost:5000/api/payments/history/${member.id}`,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                  },
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
        setAllRevenues(revenues);
        setAllPayments(allPayments);
        
        let processedData;
        
        if (viewMode === 'monthly') {
          // Show total revenue per month for all months
          processedData = processMonthlyComparisonData(revenues, allPayments);
        } else if (viewMode === 'yearly') {
          // Show total revenue per year for all years
          processedData = processYearlyComparisonData(revenues, allPayments);
        } else {
          // Filter data for current month only by default (daily view)
          const filteredRevenues = filterDataForMonth(revenues, selectedMonth);
          const filteredPayments = filterDataForMonth(allPayments, selectedMonth, true);
          
          // Process and format the data for the chart (including member payments)
          processedData = processRevenueData(filteredRevenues, filteredPayments);
        }
        
        setChartData(processedData);
        setError(null);
      } catch (err) {
        console.error('Error fetching revenue data:', err);
        setError('Failed to load revenue data');
        setChartData(generateSampleData()); // Fallback to sample data
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange, selectedMonth, viewMode]); // Re-fetch when time range, selected month, or view mode changes

  // Filter data to show only the specified month (or current month if none selected)
  const filterDataForMonth = (data, month = null, isPayment = false) => {
    if (!data || data.length === 0) return [];
    
    const now = new Date();
    const targetYear = month ? month.year : now.getFullYear();
    const targetMonth = month ? month.month : now.getMonth();
    
    return data.filter(item => {
      const dateField = isPayment ? item.payment_date : item.date;
      if (!dateField) return false;
      
      const itemDate = new Date(dateField);
      return itemDate.getFullYear() === targetYear && itemDate.getMonth() === targetMonth;
    });
  };

  // Process monthly comparison data - one point per month showing total revenue
  const processMonthlyComparisonData = (revenues, payments = []) => {
    if ((!revenues || revenues.length === 0) && (!payments || payments.length === 0)) {
      return generateSampleData();
    }

    const monthlyTotals = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Aggregate revenues by month
    if (revenues && revenues.length > 0) {
      revenues.forEach(item => {
        if (!item.date) return;
        const date = new Date(item.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        const displayKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        
        if (!monthlyTotals[monthKey]) {
          monthlyTotals[monthKey] = { total: 0, displayKey, date };
        }
        monthlyTotals[monthKey].total += parseFloat(item.amount || 0);
      });
    }

    // Aggregate member payments by month
    if (payments && payments.length > 0) {
      payments.forEach(payment => {
        if (!payment.payment_date) return;
        const date = new Date(payment.payment_date);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        const displayKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        
        if (!monthlyTotals[monthKey]) {
          monthlyTotals[monthKey] = { total: 0, displayKey, date };
        }
        monthlyTotals[monthKey].total += parseFloat(payment.amount || 0);
      });
    }

    // Convert to arrays and sort by date (oldest to newest)
    const sortedEntries = Object.entries(monthlyTotals)
      .sort(([keyA, dataA], [keyB, dataB]) => dataA.date - dataB.date);

    const labels = sortedEntries.map(([_, data]) => data.displayKey);
    const values = sortedEntries.map(([_, data]) => data.total);

    return formatChartData(labels, values);
  };

  // Process yearly comparison data - one point per year showing total revenue
  const processYearlyComparisonData = (revenues, payments = []) => {
    if ((!revenues || revenues.length === 0) && (!payments || payments.length === 0)) {
      return generateSampleData();
    }

    const yearlyTotals = {};

    // Aggregate revenues by year
    if (revenues && revenues.length > 0) {
      revenues.forEach(item => {
        if (!item.date) return;
        const date = new Date(item.date);
        const yearKey = `${date.getFullYear()}`;

        if (!yearlyTotals[yearKey]) {
          yearlyTotals[yearKey] = { total: 0, year: date.getFullYear() };
        }
        yearlyTotals[yearKey].total += parseFloat(item.amount || 0);
      });
    }

    // Aggregate member payments by year
    if (payments && payments.length > 0) {
      payments.forEach(payment => {
        if (!payment.payment_date) return;
        const date = new Date(payment.payment_date);
        const yearKey = `${date.getFullYear()}`;

        if (!yearlyTotals[yearKey]) {
          yearlyTotals[yearKey] = { total: 0, year: date.getFullYear() };
        }
        yearlyTotals[yearKey].total += parseFloat(payment.amount || 0);
      });
    }

    const sortedEntries = Object.entries(yearlyTotals)
      .sort(([_, dataA], [__, dataB]) => dataA.year - dataB.year);

    const labels = sortedEntries.map(([year]) => year);
    const values = sortedEntries.map(([_, data]) => data.total);

    return formatChartData(labels, values);
  };

  // Process revenue data for the chart
  const processRevenueData = (revenues, payments = []) => {
    if ((!revenues || revenues.length === 0) && (!payments || payments.length === 0)) {
      return generateSampleData();
    }
    
    // Process and group data by date
    const groupedData = {};
    const today = new Date();
    
    // Initialize with today only
    const todayStr = today.toLocaleDateString();
    
    // Ensure we have an entry for today
    groupedData[todayStr] = 0;
    
    // Add revenue entries
    if (revenues && revenues.length > 0) {
      revenues.forEach(item => {
        const date = new Date(item.date).toLocaleDateString();
        if (!groupedData[date]) {
          groupedData[date] = 0;
        }
        groupedData[date] += parseFloat(item.amount);
      });
    }

    // Add member payments
    if (payments && payments.length > 0) {
      payments.forEach(payment => {
        const date = new Date(payment.payment_date).toLocaleDateString();
        if (!groupedData[date]) {
          groupedData[date] = 0;
        }
        groupedData[date] += parseFloat(payment.amount || 0);
      });
    }

    // Convert to arrays and sort in chronological order (oldest to newest)
    const sortedEntries = Object.entries(groupedData)
      .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB));
      
    const labels = sortedEntries.map(([date]) => date);
    const values = sortedEntries.map(([_, amount]) => amount);

    return formatChartData(labels, values);
  };
  
  // Format data for Chart.js
  const formatChartData = (labels, values) => ({
    labels,
    datasets: [{
      label: 'Revenue',
      data: values,
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: '#10B981',
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 2,
    }]
  });
  
  // Generate sample data for demo purposes
  const generateSampleData = () => {
    const sampleData = [];
    const today = new Date();
    
    // Generate 7 days of sample data with larger values
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Generate random values between 100,000 and 1,000,000
      sampleData.push({
        date: date.toISOString().split('T')[0],
        amount: Math.floor(Math.random() * 900000) + 100000
      });
    }
    return formatChartData(Object.keys(groupedSampleData(sampleData)), Object.values(groupedSampleData(sampleData)));
  };

  const groupedSampleData = (data) => {
    const groupedData = {};
    data.forEach(item => {
      const date = new Date(item.date).toLocaleDateString();
      if (!groupedData[date]) {
        groupedData[date] = 0;
      }
      groupedData[date] += parseFloat(item.amount);
    });
    return groupedData;
  };



  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#9CA3AF',
        bodyColor: '#F9FAFB',
        borderColor: '#374151',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return new Intl.NumberFormat('en-PH', {
              style: 'currency',
              currency: 'PHP',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }).format(context.parsed.y);
          },
          title: function(context) {
            return context[0].label;
          }
        },
        cornerRadius: 6,
        titleFont: {
          size: 12,
          weight: 'normal'
        },
        bodyFont: {
          size: 14,
          weight: 'bold'
        },
        padding: {
          top: 8,
          right: 12,
          bottom: 8,
          left: 12
        },
        yAlign: 'bottom',
        xAlign: 'center',
        caretSize: 0,
        caretPadding: 8
      },
      title: {
        display: true,
        text: viewMode === 'daily'
          ? 'Revenue Over Time (₱)'
          : viewMode === 'monthly'
            ? 'Monthly Revenue Comparison (₱)'
            : 'Yearly Revenue Comparison (₱)',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 10,
            family: 'Inter, system-ui, -apple-system, sans-serif'
          },
          padding: 2,
          callback: function(value) {
            const label = this.getLabelForValue(value);
            if (viewMode === 'daily') {
              const date = new Date(label);
              const today = new Date();
              if (!isNaN(date) && date.toDateString() === today.toDateString()) {
                return 'Today';
              }
              return !isNaN(date)
                ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : label;
            }
            return label;
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(229, 231, 235, 0.8)',
          drawBorder: false,
          drawTicks: false,
          borderDash: [2, 2],
          tickLength: 0,
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 9,
            family: 'Inter, system-ui, -apple-system, sans-serif'
          },
          padding: 2,
          maxTicksLimit: 5,
          callback: function(value) {
            if (value >= 1000000) {
              return '₱' + (value / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
              return '₱' + (value / 1000).toFixed(0) + 'K';
            }
            return '₱' + value;
          }
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    elements: {
      line: {
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
      },
      point: {
        radius: 0,
        hoverRadius: 6,
        hoverBorderWidth: 2,
        hoverBackgroundColor: '#10B981',
        hoverBorderColor: '#fff',
      },
    },
    layout: {
      padding: {
        top: 2,
        right: 2,
        bottom: 2,
        left: 2,
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart',
    },
  }), [viewMode]);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (mode !== 'daily') {
      setShowArchive(false);
      setSelectedMonth(null);
    }
  };


  // Get available past months from all data
  const getAvailablePastMonths = () => {
    const months = new Set();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Get months from revenues
    allRevenues.forEach(rev => {
      if (rev.date) {
        const date = new Date(rev.date);
        const month = date.getMonth();
        const year = date.getFullYear();
        // Only include past months (not current month)
        if (year < currentYear || (year === currentYear && month < currentMonth)) {
          months.add(`${year}-${month}`);
        }
      }
    });

    // Get months from member payments
    allPayments.forEach(payment => {
      if (payment.payment_date) {
        const date = new Date(payment.payment_date);
        const month = date.getMonth();
        const year = date.getFullYear();
        // Only include past months (not current month)
        if (year < currentYear || (year === currentYear && month < currentMonth)) {
          months.add(`${year}-${month}`);
        }
      }
    });

    // Convert to array and sort by date (newest first)
    return Array.from(months)
      .map(key => {
        const [year, month] = key.split('-').map(Number);
        return { year, month, key };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
  };

  // Handle archive month selection
  const handleMonthSelect = (monthData) => {
    setSelectedMonth(monthData);
    setShowArchive(false);
  };

  // Handle back to current month
  const handleBackToCurrent = () => {
    setSelectedMonth(null);
  };

  const availablePastMonths = getAvailablePastMonths();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Get display name for current view
  const getDisplayMonthName = () => {
    if (selectedMonth) {
      return `${monthNames[selectedMonth.month]} ${selectedMonth.year}`;
    }
    const now = new Date();
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  };

  // Time range buttons removed per user request

  const headerSubtitle = viewMode === 'daily'
    ? getDisplayMonthName()
    : viewMode === 'monthly'
      ? 'Monthly Comparison'
      : 'Yearly Comparison';

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-3">
          <h2 className="text-md font-medium text-gray-900">Revenue Chart</h2>
          <span className="text-sm text-gray-600">({headerSubtitle})</span>
          
          {/* Archive controls - only show in daily view */}
          {viewMode === 'daily' && (
            <div className="flex items-center space-x-2">
              {selectedMonth ? (
                <button
                  onClick={handleBackToCurrent}
                  className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                >
                  ← Back to Current
                </button>
              ) : availablePastMonths.length > 0 ? (
                <button
                  onClick={() => setShowArchive(!showArchive)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                >
                  {showArchive ? 'Hide Archive' : 'Show Archive'}
                </button>
              ) : null}
            </div>
          )}
        </div>
        
        {/* View mode toggle button */}
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewModeChange('daily')}
            className={`px-3 py-1 text-xs rounded-md ${
              viewMode === 'daily'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Daily View
          </button>
          <button
            onClick={() => handleViewModeChange('monthly')}
            className={`px-3 py-1 text-xs rounded-md ${
              viewMode === 'monthly'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Compare Months
          </button>
          <button
            onClick={() => handleViewModeChange('yearly')}
            className={`px-3 py-1 text-xs rounded-md ${
              viewMode === 'yearly'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Compare Years
          </button>
        </div>
      </div>

      {/* Archive month selector dropdown */}
      {viewMode === 'daily' && showArchive && !selectedMonth && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-xs font-medium text-gray-700 mb-2">Select Archived Month:</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {availablePastMonths.map((monthData) => {
              const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              return (
                <button
                  key={monthData.key}
                  onClick={() => handleMonthSelect(monthData)}
                  className="px-2 py-1.5 text-xs bg-white border border-gray-300 rounded-md hover:bg-indigo-50 hover:border-indigo-400 transition-colors"
                >
                  {shortMonthNames[monthData.month]} {monthData.year}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div
        className="flex-1 w-full relative"
        style={{ height: viewMode === 'daily' && showArchive ? 'calc(100% - 120px)' : 'calc(100% - 40px)' }}
      >
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <div className="text-red-500 mb-2">{error}</div>
            <div className="text-sm text-gray-400">Showing sample data</div>
            <Line data={chartData} options={chartOptions} />
          </div>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>
    </div>
  );
};

export default RevenueChart;
