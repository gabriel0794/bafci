import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import { Link, useLocation } from 'react-router-dom';

const RevenuePage = () => {
  const [revenues, setRevenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: 'other',
    date: new Date().toISOString().split('T')[0]
  });
  
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    fetchRevenues();
  }, []);

  const fetchRevenues = async () => {
    try {
      setLoading(true);
      const token = authService.getAuthToken();
      
      if (!token) {
        console.error('No authentication token found');
        setError('Authentication required. Please log in again.');
        return;
      }

      console.log('Fetching revenues from /api/revenue');
      const response = await fetch('http://localhost:5000/api/revenue', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        credentials: 'include',
      });

      console.log('Response status:', response.status);
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Expected JSON but got:', text.substring(0, 200));
        throw new Error(`Invalid content type: ${contentType}`);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(errorData.message || 'Failed to fetch revenues');
      }

      const data = await response.json();
      console.log('Received revenue data:', data);
      setRevenues(data);
      setError(null);
    } catch (err) {
      console.error('Error in fetchRevenues:', err);
      setError(err.message || 'Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTransaction = async (type) => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    try {
      const token = authService.getAuthToken();
      const amount = type === 'expense' 
        ? -Math.abs(parseFloat(formData.amount)) 
        : Math.abs(parseFloat(formData.amount));

      const response = await fetch('http://localhost:5000/api/revenue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          amount: amount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process transaction');
      }

      // Refresh the list
      fetchRevenues();
      // Reset form
      setFormData({
        amount: '',
        description: '',
        category: 'other',
        date: new Date().toISOString().split('T')[0],
      });
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Error processing transaction:', err);
      setError(err.message || 'Failed to process transaction');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
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

  const handleLogout = () => {
    authService.setAuthToken(null);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">BAFCI</h1>
              </div>
            </div>

            <div className="flex items-center space-x-8">
              <div className="hidden sm:flex sm:space-x-8">
                <Link
                  to="/dashboard"
                  className={`${isActive('/dashboard') ? 'border-green-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/revenue"
                  className={`${isActive('/revenue') ? 'border-green-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Revenue
                </Link>
                <a
                  href="#"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Members
                </a>
                <a
                  href="#"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Payments
                </a>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Revenue Management</h1>
        <p className="mt-1 text-sm text-gray-500">Add and manage revenue entries</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Revenue Form */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Manage Revenue</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Amount (₱)
                </label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₱</span>
                  </div>
                  <input
                    type="text"
                    id="amount"
                    name="amount"
                    inputMode="decimal"
                    required
                    value={formData.amount}
                    onChange={(e) => {
                      // Allow numbers, decimal point, and backspace
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      // Only update if it's a valid number or empty
                      if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                        handleInputChange({
                          target: {
                            name: 'amount',
                            value: value
                          }
                        });
                      }
                    }}
                    onBlur={(e) => {
                      // Format the number to 2 decimal places when input loses focus
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) {
                        handleInputChange({
                          target: {
                            name: 'amount',
                            value: value.toFixed(2)
                          }
                        });
                      }
                    }}
                    placeholder="0.00"
                    className="block w-full pl-7 pr-12 py-2 rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description/Purpose
                </label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-2 py-2 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-2 py-2 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                >
                  <option value="membership">Membership</option>
                  <option value="training">Training</option>
                  <option value="merchandise">Merchandise</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  value={formData.date}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-2 py-2 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                />
              </div>

              <div className="pt-2 grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleTransaction('revenue')}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Add Revenue
                </button>
                <button
                  type="button"
                  onClick={() => handleTransaction('expense')}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Revenue List */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Revenue Entries</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added By
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {revenues.length > 0 ? (
                    revenues.map((revenue) => (
                      <tr key={revenue.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(revenue.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {revenue.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {revenue.category.charAt(0).toUpperCase() + revenue.category.slice(1)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {revenue.user?.name || 'System'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <span className={`${revenue.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(revenue.amount)}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                        No revenue entries found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Revenue Summary */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Revenue Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Revenue */}
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm font-medium text-gray-500">Total Revenue</div>
                  <div className="mt-1 text-2xl font-semibold text-gray-900">
                    {formatCurrency(
                      revenues.reduce((sum, rev) => sum + parseFloat(rev.amount), 0)
                    )}
                  </div>
                </div>
                
                {/* Added Revenue */}
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm font-medium text-gray-500">Total Added</div>
                  <div className="mt-1 text-2xl font-semibold text-green-600">
                    {formatCurrency(
                      revenues
                        .filter(rev => parseFloat(rev.amount) > 0)
                        .reduce((sum, rev) => sum + parseFloat(rev.amount), 0)
                    )}
                  </div>
                </div>
                
                {/* Minused Revenue */}
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm font-medium text-gray-500">Total Expenses</div>
                  <div className="mt-1 text-2xl font-semibold text-red-600">
                    {formatCurrency(
                      Math.abs(
                        revenues
                          .filter(rev => parseFloat(rev.amount) < 0)
                          .reduce((sum, rev) => sum + parseFloat(rev.amount), 0)
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default RevenuePage;
