import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/api';
import { apiURL } from '../../config/api.config';
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

// Pagination Component
const Pagination = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
      <div className="text-xs text-gray-700">
        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i + 1}
            onClick={() => onPageChange(i + 1)}
            className={`px-3 py-1 text-xs font-medium rounded-md ${
              currentPage === i + 1
                ? 'bg-green-600 text-white'
                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};

const RevenuePage = () => {
  const [revenues, setRevenues] = useState([]);
  const [branches, setBranches] = useState([]);
  const [memberPayments, setMemberPayments] = useState([]);
  const [membershipFeePayments, setMembershipFeePayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRevenueConfirm, setShowRevenueConfirm] = useState(false);
  const [showExpenseConfirm, setShowExpenseConfirm] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [archiveStartDate, setArchiveStartDate] = useState('');
  const [archiveEndDate, setArchiveEndDate] = useState('');
  const [membershipFeePage, setMembershipFeePage] = useState(1);
  const [expensesPage, setExpensesPage] = useState(1);
  const [monthlyPaymentsPage, setMonthlyPaymentsPage] = useState(1);
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: 'electric_bill',
    date: new Date().toISOString().split('T')[0],
    branchId: '',
    receipts: []
  });
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  
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

      const response = await fetch(`${apiURL}/branches`, {
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
      const membersResponse = await fetch(`${apiURL}/members`, {
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

      // Extract membership fee payments from members (one-time fees stored on member record)
      const membershipFees = members
        .filter(member => member.membership_fee_paid && member.membership_fee_paid_date)
        .map(member => ({
          id: `mf-${member.id}`,
          member_name: member.full_name,
          member_id: member.id,
          payment_date: member.membership_fee_paid_date,
          amount: member.membership_fee_amount || 500 // Default to 500 if not set
        }));
      setMembershipFeePayments(membershipFees);

      // Then fetch payment history for each member (monthly payments)
      const allPayments = [];
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
      const response = await fetch(`${apiURL}/revenue`, {
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

      // Create FormData to handle file upload
      const formDataToSend = new FormData();
      formDataToSend.append('amount', amount);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('date', formData.date);
      if (formData.branchId) {
        formDataToSend.append('branchId', formData.branchId);
      }
      
      // Add receipt files if they exist
      if (formData.receipts && formData.receipts.length > 0) {
        formData.receipts.forEach((file) => {
          formDataToSend.append('receipt', file);
        });
      }

      const response = await fetch(`${apiURL}/revenue`, {
        method: 'POST',
        headers: {
          'x-auth-token': token,
          // Don't set Content-Type - let browser set it with boundary for multipart/form-data
        },
        credentials: 'include',
        body: formDataToSend,
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
        category: 'electric_bill',
        date: new Date().toISOString().split('T')[0],
        branchId: '',
        receipts: []
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
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 px-2 sm:px-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Revenue Management</h1>
              <p className="mt-1 text-sm text-gray-500">View revenue and expenses</p>
            </div>
            <button
              onClick={() => setShowExpenseDialog(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Expense
            </button>
          </div>

          {/* Expense Dialog */}
          {showExpenseDialog && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Add Expense</h2>
                  <button
                    onClick={() => setShowExpenseDialog(false)}
                    className="text-gray-400 hover:text-gray-500 cursor-pointer"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
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
                  Expense Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-2 py-2 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                >
                  <option value="electric_bill">Electric Bill</option>
                  <option value="water_bill">Water Bill</option>
                  <option value="monthly_rent">Monthly Rent</option>
                  <option value="internet">Internet</option>
                </select>
              </div>

              <div>
                <label htmlFor="receipt" className="block text-sm font-medium text-gray-700">
                  Upload Receipt (Optional) <span className="text-gray-400 font-normal">- Max 5MB each</span>
                </label>
                {/* Display uploaded files */}
                {formData.receipts && formData.receipts.length > 0 && (
                  <div className="mt-1 space-y-2">
                    {formData.receipts.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-3 py-2">
                        <span className="text-sm text-green-700 truncate flex-1 mr-2">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              receipts: prev.receipts.filter((_, i) => i !== index)
                            }));
                          }}
                          className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove file"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Always show file input */}
                <div className="mt-1 flex items-center">
                  <input
                    type="file"
                    id="receipt"
                    name="receipt"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        // Check file size (max 5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          setError('File size must be less than 5MB');
                          e.target.value = '';
                          return;
                        }
                        setFormData(prev => ({ ...prev, receipts: [...prev.receipts, file] }));
                        setError('');
                        e.target.value = ''; // Reset input to allow selecting same file again
                      }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
                  />
                </div>
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

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleTransaction('expense')}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Add Expense
                </button>
              </div>

              {/* Confirmation Dialog */}
              <ConfirmationDialog
                isOpen={showExpenseConfirm}
                onClose={() => {
                  setShowExpenseConfirm(false);
                  setShowExpenseDialog(false);
                }}
                onConfirm={() => {
                  confirmTransaction('expense');
                  setShowExpenseDialog(false);
                }}
                title="Confirm Add Expense"
                message={`Are you sure you want to add an expense of ₱${formData.amount || '0.00'}?`}
                confirmText="Add Expense"
                confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
              />
            </form>
          </div>
        </div>
      )}

      {/* Receipt Viewer Modal */}
      {showReceiptModal && selectedExpense && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Expense Details</h2>
                <p className="text-sm text-gray-500">View expense information and receipt</p>
              </div>
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setSelectedExpense(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Expense Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-medium">Date</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(selectedExpense.date)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-medium">Amount</p>
                  <p className="text-sm font-semibold text-red-600">{formatCurrency(Math.abs(selectedExpense.amount))}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-medium">Category</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedExpense.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-medium">Description</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedExpense.description}</p>
                </div>
              </div>

              {/* Receipt Image */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Receipt</h3>
                {selectedExpense.receipt ? (
                  <div className="bg-gray-100 rounded-lg p-4">
                    <img 
                      src={`${apiURL.replace('/api', '')}/${selectedExpense.receipt}`}
                      alt="Expense Receipt"
                      className="max-w-full h-auto rounded-lg shadow-md mx-auto cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(`${apiURL.replace('/api', '')}/${selectedExpense.receipt}`, '_blank')}
                    />
                    <p className="text-xs text-gray-500 text-center mt-2">Click image to view full size</p>
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-lg p-8 text-center">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm text-gray-500">No receipt uploaded for this expense</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setSelectedExpense(null);
                }}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 border  rounded-md hover:bg-green-700 focus:outline-none cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Total Revenue Summary - At the Top */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-green-600 to-green-700 shadow-lg rounded-lg p-6">
          {(() => {
            const today = new Date().toISOString().split('T')[0];
            
            // Filter monthly payments based on date range
            const summaryMonthlyPayments = showArchive
              ? memberPayments.filter(p => {
                  const paymentDate = new Date(p.payment_date).toISOString().split('T')[0];
                  const isArchived = paymentDate !== today;
                  const afterStart = !archiveStartDate || paymentDate >= archiveStartDate;
                  const beforeEnd = !archiveEndDate || paymentDate <= archiveEndDate;
                  return isArchived && afterStart && beforeEnd;
                })
              : memberPayments.filter(p => new Date(p.payment_date).toISOString().split('T')[0] === today);

            // Filter membership fee payments based on date range
            const summaryMembershipFees = showArchive
              ? membershipFeePayments.filter(p => {
                  const paymentDate = new Date(p.payment_date).toISOString().split('T')[0];
                  const isArchived = paymentDate !== today;
                  const afterStart = !archiveStartDate || paymentDate >= archiveStartDate;
                  const beforeEnd = !archiveEndDate || paymentDate <= archiveEndDate;
                  return isArchived && afterStart && beforeEnd;
                })
              : membershipFeePayments.filter(p => new Date(p.payment_date).toISOString().split('T')[0] === today);

            // Filter expenses based on date range
            const summaryExpenses = showArchive
              ? revenues.filter(r => {
                  const entryDate = new Date(r.date).toISOString().split('T')[0];
                  const isArchived = entryDate !== today;
                  const afterStart = !archiveStartDate || entryDate >= archiveStartDate;
                  const beforeEnd = !archiveEndDate || entryDate <= archiveEndDate;
                  return isArchived && afterStart && beforeEnd;
                })
              : revenues.filter(r => new Date(r.date).toISOString().split('T')[0] === today);

            // Monthly payments total (using total_amount which includes late fees)
            const monthlyPaymentsTotal = summaryMonthlyPayments.reduce((sum, p) => 
              sum + parseFloat(p.total_amount || p.totalAmount || p.amount || 0), 0);
            
            // Membership fees total
            const membershipFeeTotal = summaryMembershipFees.reduce((sum, p) => 
              sum + parseFloat(p.amount || 0), 0);
            
            // Expenses total
            const expensesTotal = summaryExpenses.reduce((sum, r) => 
              sum + Math.abs(parseFloat(r.amount || 0)), 0);
            
            // Gross revenue (before expenses)
            const grossRevenue = monthlyPaymentsTotal + membershipFeeTotal;
            
            // Net revenue (after expenses)
            const netRevenue = grossRevenue - expensesTotal;

            return (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-green-100 text-sm font-medium">Monthly Payments</p>
                  <p className="text-white text-2xl font-bold">{formatCurrency(monthlyPaymentsTotal)}</p>
                </div>
                <div className="text-center">
                  <p className="text-green-100 text-sm font-medium">Membership Fees</p>
                  <p className="text-white text-2xl font-bold">{formatCurrency(membershipFeeTotal)}</p>
                </div>
                <div className="text-center">
                  <p className="text-red-200 text-sm font-medium">Expenses</p>
                  <p className="text-red-100 text-2xl font-bold">-{formatCurrency(expensesTotal)}</p>
                </div>
                <div className="text-center bg-white/20 rounded-lg p-3">
                  <p className="text-green-100 text-sm font-medium">Net Revenue</p>
                  <p className={`text-3xl font-bold ${netRevenue >= 0 ? 'text-white' : 'text-red-200'}`}>
                    {formatCurrency(netRevenue)}
                  </p>
                  <p className="text-green-200 text-xs mt-1">
                    {showArchive ? 'Selected Date Range' : 'Today'}
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Lists Stacked Vertically */}
      <div className="space-y-6">
        {/* Monthly Payments List */}
        <div>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-base font-medium text-gray-900">Monthly Payments</h3>
                <p className="text-xs text-gray-500 mt-1">Recurring member payments</p>
              </div>
              <button 
                onClick={() => setShowArchive(!showArchive)}
                className="text-xs font-medium text-green-600 hover:text-green-800 focus:outline-none"
              >
                {showArchive ? 'Show Today' : 'View Archives'}
              </button>
            </div>
            {showArchive && (
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="archiveStartDate" className="block text-xs font-medium text-gray-700">Start Date</label>
                    <input
                      type="date"
                      id="archiveStartDate"
                      name="archiveStartDate"
                      value={archiveStartDate}
                      onChange={(e) => setArchiveStartDate(e.target.value)}
                      className="mt-1 block w-full px-2 py-1 text-xs rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="archiveEndDate" className="block text-xs font-medium text-gray-700">End Date</label>
                    <input
                      type="date"
                      id="archiveEndDate"
                      name="archiveEndDate"
                      value={archiveEndDate}
                      onChange={(e) => setArchiveEndDate(e.target.value)}
                      className="mt-1 block w-full px-2 py-1 text-xs rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="overflow-y-auto max-h-[600px]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reference No.</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Late Fee</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    const today = new Date().toISOString().split('T')[0];
                    
                    // Filter monthly payments (all payments in memberPayments are monthly - membership fees are separate)
                    const filteredPayments = showArchive
                      ? memberPayments.filter(p => {
                          const paymentDate = new Date(p.payment_date).toISOString().split('T')[0];
                          const isArchived = paymentDate !== today;
                          const afterStart = !archiveStartDate || paymentDate >= archiveStartDate;
                          const beforeEnd = !archiveEndDate || paymentDate <= archiveEndDate;
                          return isArchived && afterStart && beforeEnd;
                        })
                      : memberPayments.filter(p => {
                          const paymentDate = new Date(p.payment_date).toISOString().split('T')[0];
                          return paymentDate === today;
                        });

                    const total = filteredPayments.reduce((sum, p) => sum + parseFloat(p.total_amount || p.totalAmount || p.amount || 0), 0);
                    
                    // Pagination
                    const startIndex = (monthlyPaymentsPage - 1) * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    const paginatedPayments = filteredPayments.slice(startIndex, endIndex);

                    return (
                      <>
                        {paginatedPayments.length > 0 ? (
                          paginatedPayments.map((payment) => {
                            const isLate = payment.is_late || payment.isLate;
                            const lateFeePercentage = payment.late_fee_percentage || payment.lateFeePercentage || 0;
                            const totalAmount = payment.total_amount || payment.totalAmount || payment.amount || 0;
                            return (
                              <tr key={`mp-${payment.id}`} className="hover:bg-blue-50">
                                <td className="px-3 py-2 text-xs text-gray-500">{formatDate(payment.payment_date)}</td>
                                <td className="px-3 py-2 text-xs text-gray-900">{payment.member_name}</td>
                                <td className="px-3 py-2 text-xs text-gray-500">{payment.reference_number || payment.referenceNumber || '-'}</td>
                                <td className="px-3 py-2 text-right text-xs font-medium text-blue-600">
                                  {formatCurrency(payment.amount)}
                                </td>
                                <td className="px-3 py-2 text-center text-xs">
                                  {isLate ? (
                                    <span className="text-red-600 font-medium">{lateFeePercentage}%</span>
                                  ) : (
                                    <span className="text-green-600">On-time</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-right text-xs font-bold text-gray-900">
                                  {formatCurrency(totalAmount)}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="6" className="px-3 py-4 text-center text-xs text-gray-500">
                              {showArchive ? 'No monthly payments in selected date range' : 'No monthly payments today'}
                            </td>
                          </tr>
                        )}
                        {filteredPayments.length > 0 && (
                          <tr className="bg-blue-100 font-semibold">
                            <td colSpan="5" className="px-3 py-2 text-xs text-gray-900">Total (All Pages)</td>
                            <td className="px-3 py-2 text-right text-xs font-bold text-blue-700">
                              {formatCurrency(total)}
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={monthlyPaymentsPage}
              totalItems={(() => {
                const today = new Date().toISOString().split('T')[0];
                return showArchive
                  ? memberPayments.filter(p => {
                      const paymentDate = new Date(p.payment_date).toISOString().split('T')[0];
                      const isArchived = paymentDate !== today;
                      const afterStart = !archiveStartDate || paymentDate >= archiveStartDate;
                      const beforeEnd = !archiveEndDate || paymentDate <= archiveEndDate;
                      return isArchived && afterStart && beforeEnd;
                    }).length
                  : memberPayments.filter(p => {
                      const paymentDate = new Date(p.payment_date).toISOString().split('T')[0];
                      return paymentDate === today;
                    }).length;
              })()}
              itemsPerPage={itemsPerPage}
              onPageChange={setMonthlyPaymentsPage}
            />
          </div>
        </div>

        {/* Membership Fee Payments List */}
        <div>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-4 border-b border-gray-200">
              <h3 className="text-base font-medium text-gray-900">Membership Fee Payments</h3>
              <p className="text-xs text-gray-500 mt-1">One-time membership fees</p>
            </div>
            <div className="overflow-y-auto max-h-[600px]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    const today = new Date().toISOString().split('T')[0];
                    // Filter membership fees paid today from the membershipFeePayments state
                    const todaysMembershipFees = membershipFeePayments.filter(p => {
                      const paymentDate = new Date(p.payment_date).toISOString().split('T')[0];
                      return paymentDate === today;
                    });

                    const total = todaysMembershipFees.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
                    
                    // Pagination
                    const startIndex = (membershipFeePage - 1) * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    const paginatedFees = todaysMembershipFees.slice(startIndex, endIndex);

                    return (
                      <>
                        {paginatedFees.length > 0 ? (
                          paginatedFees.map((payment) => (
                            <tr key={payment.id} className="hover:bg-green-50">
                              <td className="px-3 py-2 text-xs text-gray-500">{formatDate(payment.payment_date)}</td>
                              <td className="px-3 py-2 text-xs text-gray-900">{payment.member_name}</td>
                              <td className="px-3 py-2 text-right text-xs font-medium text-green-600">
                                {formatCurrency(payment.amount)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3" className="px-3 py-4 text-center text-xs text-gray-500">
                              No membership fee payments today
                            </td>
                          </tr>
                        )}
                        {todaysMembershipFees.length > 0 && (
                          <tr className="bg-green-100 font-semibold">
                            <td colSpan="2" className="px-3 py-2 text-xs text-gray-900">Total (All Pages)</td>
                            <td className="px-3 py-2 text-right text-xs font-bold text-green-700">
                              {formatCurrency(total)}
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={membershipFeePage}
              totalItems={membershipFeePayments.filter(p => {
                const today = new Date().toISOString().split('T')[0];
                const paymentDate = new Date(p.payment_date).toISOString().split('T')[0];
                return paymentDate === today;
              }).length}
              itemsPerPage={itemsPerPage}
              onPageChange={setMembershipFeePage}
            />
          </div>
        </div>

        {/* Expenses List */}
        <div>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-4 border-b border-gray-200">
              <h3 className="text-base font-medium text-gray-900">Expenses</h3>
              <p className="text-xs text-gray-500 mt-1">Utility and operational expenses</p>
            </div>
            <div className="overflow-y-auto max-h-[600px]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Receipt</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    const today = new Date().toISOString().split('T')[0];
                    const todayExpenses = revenues.filter(r => {
                      const entryDate = new Date(r.date).toISOString().split('T')[0];
                      return entryDate === today;
                    });

                    const total = todayExpenses.reduce((sum, r) => sum + Math.abs(parseFloat(r.amount)), 0);
                    
                    // Pagination
                    const startIndex = (expensesPage - 1) * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    const paginatedExpenses = todayExpenses.slice(startIndex, endIndex);

                    return (
                      <>
                        {paginatedExpenses.length > 0 ? (
                          paginatedExpenses.map((expense) => (
                            <tr 
                              key={`exp-${expense.id}`} 
                              className="hover:bg-red-50 cursor-pointer transition-colors"
                              onClick={() => {
                                setSelectedExpense(expense);
                                setShowReceiptModal(true);
                              }}
                            >
                              <td className="px-3 py-2 text-xs text-gray-500">{formatDate(expense.date)}</td>
                              <td className="px-3 py-2 text-xs text-gray-900">{expense.description}</td>
                              <td className="px-3 py-2 text-xs text-gray-500">
                                {expense.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </td>
                              <td className="px-3 py-2 text-right text-xs font-medium text-red-600">
                                {formatCurrency(Math.abs(expense.amount))}
                              </td>
                              <td className="px-3 py-2 text-center">
                                {expense.receipt ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Receipt
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-400">No receipt</span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="px-3 py-4 text-center text-xs text-gray-500">
                              No expenses today
                            </td>
                          </tr>
                        )}
                        {todayExpenses.length > 0 && (
                          <tr className="bg-red-100 font-semibold">
                            <td colSpan="4" className="px-3 py-2 text-xs text-gray-900">Total (All Pages)</td>
                            <td className="px-3 py-2 text-right text-xs font-bold text-red-700">
                              {formatCurrency(total)}
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={expensesPage}
              totalItems={revenues.filter(r => {
                const today = new Date().toISOString().split('T')[0];
                const entryDate = new Date(r.date).toISOString().split('T')[0];
                return entryDate === today;
              }).length}
              itemsPerPage={itemsPerPage}
              onPageChange={setExpensesPage}
            />
          </div>
        </div>
      </div>
      </div>
      </div>
    </div>
  );
};

export default RevenuePage;
