import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { authService } from '../../services/api';

// Register all ChartJS components
ChartJS.register(...registerables);

const RevenueChart = ({ timeRange, onTimeRangeChange }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch revenue data based on time range
  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setLoading(true);
        const token = authService.getAuthToken();
        const response = await fetch('http://localhost:5000/api/revenue', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch revenue data');
        }

        const revenues = await response.json();
        
        // Process and format the data for the chart
        const processedData = processRevenueData(revenues);
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

    fetchRevenueData();
  }, [timeRange]); // Re-fetch when time range changes

  // Process revenue data for the chart
  const processRevenueData = (revenues) => {
    if (!revenues || revenues.length === 0) return generateSampleData();
    
    // Process and group data by date
    const groupedData = {};
    const today = new Date();
    
    // Initialize with today only
    const todayStr = today.toLocaleDateString();
    
    // Ensure we have an entry for today
    groupedData[todayStr] = 0;
    
    // Add actual data
    revenues.forEach(item => {
      const date = new Date(item.date).toLocaleDateString();
      if (!groupedData[date]) {
        groupedData[date] = 0;
      }
      groupedData[date] += parseFloat(item.amount);
    });

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



  const options = {
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
        text: 'Revenue Over Time (₱)',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      x: {
        // Remove reverse to show dates in natural order (left to right)
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
          callback: function(value, index, values) {
            const date = new Date(this.getLabelForValue(value));
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            if (date.toDateString() === today.toDateString()) return 'Today';
            
            return date.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            });
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
            // For the reference style, we'll show shorter currency format
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
  };

  // Time range buttons
  const timeRanges = [
    { id: '1D', label: '1D' },
    { id: '5D', label: '5D' },
    { id: '1M', label: '1M', active: true },
    { id: '1Y', label: '1Y' },
    { id: '5Y', label: '5Y' },
    { id: 'MAX', label: 'Max' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-md font-medium text-gray-900">Revenue Chart</h2>
        </div>
        <div className="flex space-x-1">
          {timeRanges.map((range) => (
            <button
              key={range.id}
              onClick={() => onTimeRangeChange(range.id)}
              className={`px-3 py-1 text-xs rounded-md ${
                timeRange === range.id || (range.active && !timeRange)
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-400 hover:bg-green-200'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 w-full relative" style={{ height: 'calc(100% - 40px)' }}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <div className="text-red-500 mb-2">{error}</div>
            <div className="text-sm text-gray-400">Showing sample data</div>
            <Line data={chartData} options={options} />
          </div>
        ) : (
          <Line data={chartData} options={options} />
        )}
      </div>
    </div>
  );
};

export default RevenueChart;
