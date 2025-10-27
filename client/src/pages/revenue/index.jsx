import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/api';
import Navbar from '../../components/Navbar';

// Confirmation Dialog Component
const ConfirmationDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText = 'Cancel' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const RevenuePage = () => {
  const [revenues, setRevenues] = useState([]);
  const [branches, setBranches] = useState([]);
  const [memberPayments, setMemberPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRevenueConfirm, setShowRevenueConfirm] = useState(false);
  const [showExpenseConfirm, setShowExpenseConfirm] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [archiveStartDate, setArchiveStartDate] = useState('');
  const [archiveEndDate, setArchiveEndDate] = useState('');
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: 'other',
    date: new Date().toISOString().split('T')[0],
    branchId: ''
  });
  
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    fetchRevenues();
    fetchBranches();
    fetchMemberPayments();
  }, []);

  const fetchBranches = async () => {
    try {
      const token = authService.getAuthToken();
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch('http://localhost:5000/api/branches', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setBranches(data);
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  const fetchMemberPayments = async () => {
    try {
      const token = authService.getAuthToken();
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      // First, fetch all members
      const membersResponse = await fetch('http://localhost:5000/api/members', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        credentials: 'include',
      });

      if (!membersResponse.ok) {
        console.error('Failed to fetch members');
        return;
      }

      const members = await membersResponse.json();

      // Then fetch payment history for each member
      const allPayments = [];
      for (const member of members) {
        try {
          const paymentResponse = await fetch(
            `http://localhost:5000/api/payments/history/${member.id}`,
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
            // Add member info to each payment for reference
            const paymentsWithMember = payments.map(payment => ({
              ...payment,
              member_name: member.full_name,
              member_id: member.id
            }));
            allPayments.push(...paymentsWithMember);
          }
        } catch (error) {
          console.error(`Error fetching payments for member ${member.id}:`, error);
        }
      }

      setMemberPayments(allPayments);
    } catch (err) {
      console.error('Error fetching member payments:', err);
    }
  };

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

    if (type === 'revenue') {
      setShowRevenueConfirm(true);
    } else if (type === 'expense') {
      setShowExpenseConfirm(true);
    }
  };

  const confirmTransaction = async (type) => {
    // Close the appropriate dialog
    setShowRevenueConfirm(false);
    setShowExpenseConfirm(false);

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
        branchId: ''
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar activePage="revenue" />

      <div className="py-6 px-2 sm:px-4">
        <div className="max-w-[99%] mx-auto">
          <div className="mb-6 px-2 sm:px-4">
            <h1 className="text-2xl font-bold text-gray-900">Revenue Management</h1>
            <p className="mt-1 text-sm text-gray-500">Add and manage revenue entries</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
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
                <label htmlFor="branchId" className="block text-sm font-medium text-gray-700">
                  Branch
                </label>
                <select
                  id="branchId"
                  name="branchId"
                  required
                  value={formData.branchId}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-2 py-2 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                >
                  <option value="">Select a branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
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

              {/* Confirmation Dialogs */}
              <ConfirmationDialog
                isOpen={showRevenueConfirm}
                onClose={() => setShowRevenueConfirm(false)}
                onConfirm={() => confirmTransaction('revenue')}
                title="Confirm Add Revenue"
                message={`Are you sure you want to add ₱${formData.amount || '0.00'} as revenue?`}
                confirmText="Add Revenue"
              />
              <ConfirmationDialog
                isOpen={showExpenseConfirm}
                onClose={() => setShowExpenseConfirm(false)}
                onConfirm={() => confirmTransaction('expense')}
                title="Confirm Add Expense"
                message={`Are you sure you want to add an expense of ₱${formData.amount || '0.00'}?`}
                confirmText="Add Expense"
                confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
              />
            </form>
          </div>
        </div>

        {/* Revenue List */}
        <div className="lg:col-span-2 w-full">
          <div className="bg-white shadow rounded-lg overflow-hidden w-full">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  {showArchive ? 'Archived Entries' : 'Recent Revenue Entries'}
                </h3>
                <button 
                  onClick={() => setShowArchive(!showArchive)}
                  className="text-sm font-medium text-green-600 hover:text-green-800 focus:outline-none"
                >
                  {showArchive ? 'Show Recent' : 'View Archives'}
                </button>
              </div>
              {showArchive && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="archiveStartDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input
                      type="date"
                      id="archiveStartDate"
                      name="archiveStartDate"
                      value={archiveStartDate}
                      onChange={(e) => setArchiveStartDate(e.target.value)}
                      className="mt-1 block w-full px-2 py-2 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="archiveEndDate" className="block text-sm font-medium text-gray-700">End Date</label>
                    <input
                      type="date"
                      id="archiveEndDate"
                      name="archiveEndDate"
                      value={archiveEndDate}
                      onChange={(e) => setArchiveEndDate(e.target.value)}
                      className="mt-1 block w-full px-2 py-2 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Date
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Branch
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                      Category
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Added By
                    </th>
                    <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    const today = new Date().toISOString().split('T')[0];
                    let displayedRevenues = [];

                    if (showArchive) {
                      displayedRevenues = revenues.filter(r => {
                        const entryDate = new Date(r.date).toISOString().split('T')[0];
                        const isArchived = entryDate !== today;
                        const afterStart = !archiveStartDate || entryDate >= archiveStartDate;
                        const beforeEnd = !archiveEndDate || entryDate <= archiveEndDate;
                        return isArchived && afterStart && beforeEnd;
                      });

                      const groupedByDate = displayedRevenues.reduce((acc, revenue) => {
                        const date = new Date(revenue.date).toISOString().split('T')[0];
                        if (!acc[date]) {
                          acc[date] = [];
                        }
                        acc[date].push(revenue);
                        return acc;
                      }, {});

                      const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));

                      if (sortedDates.length === 0) {
                        return (
                          <tr>
                            <td colSpan="6" className="px-3 py-4 text-center text-sm text-gray-500">
                              No archived entries found for the selected date range.
                            </td>
                          </tr>
                        );
                      }

                      return sortedDates.flatMap(date => [
                        <tr key={date} className="bg-gray-100">
                          <td colSpan="6" className="px-3 py-2 text-left text-sm font-semibold text-gray-800">
                            {formatDate(date)}
                          </td>
                        </tr>,
                        ...groupedByDate[date].map(revenue => (
                          <tr key={revenue.id}>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500"></td>
                            <td className="px-3 py-3 text-sm font-medium text-gray-900 max-w-xs truncate">
                              {revenue.description}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              {revenue.branch?.name || 'N/A'}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              {revenue.category.charAt(0).toUpperCase() + revenue.category.slice(1)}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              {revenue.user?.name || 'System'}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                              <span className={`${revenue.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(revenue.amount)}
                              </span>
                            </td>
                          </tr>
                        ))
                      ]);

                    } else {
                      displayedRevenues = revenues.filter(r => new Date(r.date).toISOString().split('T')[0] === today);
                      if (displayedRevenues.length > 0) {
                        return displayedRevenues.map((revenue) => (
                          <tr key={revenue.id}>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(revenue.date)}
                            </td>
                            <td className="px-3 py-3 text-sm font-medium text-gray-900 max-w-xs truncate">
                              {revenue.description}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              {revenue.branch?.name || 'N/A'}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              {revenue.category.charAt(0).toUpperCase() + revenue.category.slice(1)}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              {revenue.user?.name || 'System'}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                              <span className={`${revenue.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(revenue.amount)}
                              </span>
                            </td>
                          </tr>
                        ));
                      } else {
                        return (
                          <tr>
                            <td colSpan="6" className="px-3 py-4 text-center text-sm text-gray-500">
                              No revenue entries found for today
                            </td>
                          </tr>
                        );
                      }
                    }
                  })()}
                </tbody>
              </table>
            </div>
            
            {/* Revenue Summary */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Summary for this View</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(() => {
                    const today = new Date().toISOString().split('T')[0];
                    const summaryRevenues = showArchive
                      ? revenues.filter(r => {
                          const entryDate = new Date(r.date).toISOString().split('T')[0];
                          const isArchived = entryDate !== today;
                          const afterStart = !archiveStartDate || entryDate >= archiveStartDate;
                          const beforeEnd = !archiveEndDate || entryDate <= archiveEndDate;
                          return isArchived && afterStart && beforeEnd;
                        })
                      : revenues.filter(r => new Date(r.date).toISOString().split('T')[0] === today);

                    // Filter member payments based on the same date range
                    const summaryPayments = showArchive
                      ? memberPayments.filter(p => {
                          const paymentDate = new Date(p.payment_date).toISOString().split('T')[0];
                          const isArchived = paymentDate !== today;
                          const afterStart = !archiveStartDate || paymentDate >= archiveStartDate;
                          const beforeEnd = !archiveEndDate || paymentDate <= archiveEndDate;
                          return isArchived && afterStart && beforeEnd;
                        })
                      : memberPayments.filter(p => new Date(p.payment_date).toISOString().split('T')[0] === today);

                    const revenueTotal = summaryRevenues.reduce((sum, rev) => sum + parseFloat(rev.amount), 0);
                    const added = summaryRevenues.filter(rev => parseFloat(rev.amount) > 0).reduce((sum, rev) => sum + parseFloat(rev.amount), 0);
                    const expenses = summaryRevenues.filter(rev => parseFloat(rev.amount) < 0).reduce((sum, rev) => sum + parseFloat(rev.amount), 0);
                    
                    // Calculate member payments total
                    const memberPaymentsTotal = summaryPayments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
                    
                    // Total revenue including member payments
                    const totalRevenue = revenueTotal + memberPaymentsTotal;

                    return (
                      <>
                        {/* Total Revenue (including member payments) */}
                        <div className="bg-white p-4 rounded-lg shadow">
                          <div className="text-sm font-medium text-gray-500">Total Revenue</div>
                          <div className="mt-1 text-2xl font-semibold text-gray-900">
                            {formatCurrency(totalRevenue)}
                          </div>
                          <div className="mt-1 text-xs text-gray-400">
                            Includes member payments
                          </div>
                        </div>

                        {/* Member Payments */}
                        <div className="bg-white p-4 rounded-lg shadow">
                          <div className="text-sm font-medium text-gray-500">Member Payments</div>
                          <div className="mt-1 text-2xl font-semibold text-blue-600">
                            {formatCurrency(memberPaymentsTotal)}
                          </div>
                          <div className="mt-1 text-xs text-gray-400">
                            {summaryPayments.length} {summaryPayments.length === 1 ? 'payment' : 'payments'}
                          </div>
                        </div>
                        
                        {/* Added Revenue */}
                        <div className="bg-white p-4 rounded-lg shadow">
                          <div className="text-sm font-medium text-gray-500">Other Revenue</div>
                          <div className="mt-1 text-2xl font-semibold text-green-600">
                            {formatCurrency(added)}
                          </div>
                          <div className="mt-1 text-xs text-gray-400">
                            From revenue entries
                          </div>
                        </div>
                        
                        {/* Expenses */}
                        <div className="bg-white p-4 rounded-lg shadow">
                          <div className="text-sm font-medium text-gray-500">Total Expenses</div>
                          <div className="mt-1 text-2xl font-semibold text-red-600">
                            {formatCurrency(Math.abs(expenses))}
                          </div>
                          <div className="mt-1 text-xs text-gray-400">
                            From revenue entries
                          </div>
                        </div>
                      </>
                    );
                })()}
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
