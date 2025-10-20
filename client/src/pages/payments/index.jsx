import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Box, Button, TextField, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogActions, DialogContent, DialogContentText
} from '@mui/material';
import CustomAlert from '../../components/common/CustomAlert';
import Navbar from '../../components/Navbar';

const PaymentsPage = () => {
  const [allMembers, setAllMembers] = useState([]);
  const [unpaidMembers, setUnpaidMembers] = useState([]);
  const [paidMembers, setPaidMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTermUnpaid, setSearchTermUnpaid] = useState('');
  const [searchTermPaid, setSearchTermPaid] = useState('');

  // Payment dialog state
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [paymentMember, setPaymentMember] = useState(null);
  const paymentFormRef = useRef(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [newPayment, setNewPayment] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: ''
  });

  // Alert state
  const [alert, setAlert] = useState({
    open: false,
    title: '',
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (!allMembers.length) return;
    
    // Filter unpaid members
    const filteredUnpaid = allMembers.filter(member => {
      if (member.isPaid) return false;
      
      if (searchTermUnpaid) {
        const searchLower = searchTermUnpaid.toLowerCase();
        return (
          member.full_name?.toLowerCase().includes(searchLower) ||
          member.application_number?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
    
    // Filter paid members
    const filteredPaid = allMembers.filter(member => {
      if (!member.isPaid) return false;
      
      if (searchTermPaid) {
        const searchLower = searchTermPaid.toLowerCase();
        return (
          member.full_name?.toLowerCase().includes(searchLower) ||
          member.application_number?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });

    // Sort paid members by most recent payment date (descending - newest first)
    const sortedPaid = filteredPaid.sort((a, b) => {
      const dateA = a.last_payment_date ? new Date(a.last_payment_date) : new Date(0);
      const dateB = b.last_payment_date ? new Date(b.last_payment_date) : new Date(0);
      return dateB - dateA; // Descending order (most recent first)
    });
    
    setUnpaidMembers(filteredUnpaid);
    setPaidMembers(sortedPaid);
  }, [allMembers, searchTermUnpaid, searchTermPaid]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch members
      const membersResponse = await axios.get('http://localhost:5000/api/members', {
        headers: { 'x-auth-token': token }
      });
      
      // Get current month and year for payment verification
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // Months are 1-indexed for the API
      const currentYear = currentDate.getFullYear();
      
      // For local date comparisons (0-indexed months)
      const localCurrentMonth = currentDate.getMonth();

      // Fetch all payments for the current month to check status
      const currentMonthPayments = await Promise.all(
        membersResponse.data.map(async (member) => {
          try {
            const paymentResponse = await axios.get(
              `http://localhost:5000/api/payments/history/${member.id}`,
              { headers: { 'x-auth-token': token } }
            );
            
            // Find the most recent payment with status 'completed'
            const latestPayment = paymentResponse.data
              .filter(payment => payment.status === 'completed' && payment.payment_date)
              .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))[0];
            
            return {
              memberId: member.id,
              hasPaid: !!latestPayment,
              paymentDate: latestPayment?.payment_date,
              nextPaymentDate: latestPayment?.next_payment // Get the next_payment from the payment record
            };
          } catch (error) {
            console.error(`Error fetching payment history for member ${member.id}:`, error);
            return { memberId: member.id, hasPaid: false };
          }
        })
      );
      
      // Create a map of member IDs to their payment status and next payment date
      const paymentStatusMap = new Map();
      currentMonthPayments.forEach(({ memberId, hasPaid, paymentDate, nextPaymentDate }) => {
        paymentStatusMap.set(memberId, { 
          hasPaid, 
          paymentDate,
          nextPaymentDate: nextPaymentDate || (() => {
            // Fallback: if no next_payment in the payment record, calculate it
            if (!paymentDate) return null;
            const nextDate = new Date(paymentDate);
            nextDate.setMonth(nextDate.getMonth() + 1);
            return nextDate.toISOString().split('T')[0];
          })()
        });
      });
      
      // Update members with their payment status and next payment date
      const membersWithStatus = membersResponse.data.map(member => {
        const paymentStatus = paymentStatusMap.get(member.id) || { 
          hasPaid: false,
          nextPaymentDate: null
        };
        
        return {
          ...member,
          isPaid: paymentStatus.hasPaid,
          last_payment_date: paymentStatus.paymentDate || member.last_payment_date,
          next_payment_date: paymentStatus.nextPaymentDate || member.next_payment_date
        };
      });
      
      setAllMembers(membersWithStatus);
      
      // Separate into paid and unpaid members
      const unpaid = [];
      const paid = [];
      
      membersWithStatus.forEach(member => {
        if (member.isPaid) {
          paid.push(member);
        } else {
          unpaid.push(member);
        }
      });
      
      // Sort paid members by last_payment_date in descending order (most recent first)
      const sortedPaid = [...paid].sort((a, b) => {
        const dateA = a.last_payment_date ? new Date(a.last_payment_date) : new Date(0);
        const dateB = b.last_payment_date ? new Date(b.last_payment_date) : new Date(0);
        return dateB - dateA; // Sort in descending order (most recent first)
      });
      
      setUnpaidMembers(unpaid);
      setPaidMembers(sortedPaid);
    } catch (error) {
      console.error('Error fetching members:', error);
      showAlert('Error', 'Failed to fetch members.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Payment dialog handlers
  const handlePaymentOpen = async (member) => {
    setPaymentMember(member);
    setPaymentLoading(true);
    
    // Auto-fill the payment amount with the member's contribution amount
    setNewPayment(prev => ({
      ...prev,
      amount: member.contribution_amount || ''
    }));
    
    setPaymentOpen(true);
    try {
      const token = localStorage.getItem('token');
      // Use the correct endpoint format: /api/payments/history/:memberId
      const response = await axios.get(`http://localhost:5000/api/payments/history/${member.id}`, {
        headers: { 'x-auth-token': token }
      });
      setPaymentHistory(response.data || []);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      setPaymentHistory([]);
      showAlert('Error', 'Failed to fetch payment history.', 'error');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePaymentClose = () => {
    setPaymentOpen(false);
    setPaymentMember(null);
    setPaymentHistory([]);
    setNewPayment({
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      reference_number: '',
      notes: ''
    });
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setNewPayment(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentMember) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      // Validate payment data
      if (!newPayment.amount || isNaN(parseFloat(newPayment.amount)) || parseFloat(newPayment.amount) <= 0) {
        throw new Error('Please enter a valid payment amount');
      }

      const paymentDate = newPayment.payment_date || new Date().toISOString().split('T')[0];
      const nextPaymentDate = new Date(paymentDate);
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      
      const paymentData = {
        ...newPayment,
        member_id: paymentMember.id,
        amount: parseFloat(newPayment.amount),
        status: 'completed',
        payment_date: paymentDate,
        period_start: paymentDate, // Set period_start same as payment_date
        next_payment: nextPaymentDate.toISOString().split('T')[0] // Set next_payment to 1 month after payment_date
      };
      
      if (isNaN(paymentData.amount) || paymentData.amount <= 0) {
        throw new Error('Please enter a valid payment amount');
      }
      
      // Prepare payment payload
      const paymentPayload = {
        member_id: paymentMember.id,
        amount: paymentData.amount,
        payment_date: paymentDate,
        reference_number: paymentData.reference_number,
        notes: paymentData.notes
      };
      
      try {
        // Create the payment record
        const response = await axios.post('http://localhost:5000/api/payments', paymentPayload, {
          headers: { 
            'Content-Type': 'application/json',
            'x-auth-token': token 
          }
        });

        // Update the member's last payment date
        const updateResponse = await axios.put(
          `http://localhost:5000/api/members/${paymentMember.id}`,
          {
            last_payment_date: paymentDate,
            next_payment_date: nextPaymentDate.toISOString().split('T')[0]
          },
          {
            headers: { 
              'Content-Type': 'application/json',
              'x-auth-token': token 
            }
          }
        );

        // Update the member's isPaid status in the local state
        setAllMembers(prevMembers => 
          prevMembers.map(member => 
            member.id === paymentMember.id 
              ? { 
                  ...member, 
                  isPaid: true,
                  last_payment_date: paymentDate,
                  next_payment_date: nextPaymentDate.toISOString().split('T')[0]
                } 
              : member
          )
        );
        
        // Update the paid and unpaid lists
        setPaidMembers(prev => [
          ...prev.filter(m => m.id !== paymentMember.id),
          { 
            ...paymentMember, 
            isPaid: true,
            last_payment_date: paymentDate,
            next_payment_date: nextPaymentDate.toISOString().split('T')[0]
          }
        ]);
        setUnpaidMembers(prev => prev.filter(m => m.id !== paymentMember.id));

        // Refresh the payment history
        const historyResponse = await axios.get(
          `http://localhost:5000/api/payments/history/${paymentMember.id}`,
          { headers: { 'x-auth-token': token } }
        );
        setPaymentHistory(historyResponse.data);

        // Close the payment dialog and show success message
        handlePaymentClose();
        showAlert(
          'Payment Successful',
          `Payment of ₱${Number(newPayment.amount).toFixed(2)} has been recorded for ${paymentMember.full_name || 'the member'}.`,
          'success'
        );
          
        // Reset form but keep the amount for next payment
        setNewPayment({
          amount: paymentMember.contribution_amount || '',
          payment_date: new Date().toISOString().split('T')[0],
          reference_number: '',
          notes: ''
        });
          
        // Refresh the members list to update the UI
        fetchMembers();
      } catch (error) {
        console.error('Error in payment process:', error);
        let errorMessage = 'Failed to record payment';
        
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('Error response data:', error.response.data);
          errorMessage = error.response.data.message || error.response.data.error || errorMessage;
        } else if (error.request) {
          // The request was made but no response was received
          console.error('No response received:', error.request);
          errorMessage = 'No response from server. Please check your connection.';
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Error setting up request:', error.message);
          errorMessage = error.message || errorMessage;
        }
        
        showAlert('Payment Error', errorMessage, 'error');
      }
    } catch (error) {
      console.error('Error in payment submission:', error);
      showAlert(
        'Error', 
        error.message || 'An error occurred while processing your payment. Please try again.',
        'error'
      );
    }
  };

  // Helper function to check if payment is due
  const isPaymentDue = () => {
    if (!paymentHistory || paymentHistory.length === 0) {
      // No payment history, payment is due
      return true;
    }

    // Get the most recent payment
    const sortedPayments = [...paymentHistory].sort((a, b) => 
      new Date(b.payment_date) - new Date(a.payment_date)
    );
    const lastPayment = sortedPayments[0];

    if (!lastPayment || !lastPayment.payment_date) {
      return true;
    }

    // Calculate if one month has passed since last payment
    const lastPaymentDate = new Date(lastPayment.payment_date);
    const today = new Date();
    
    // Set both dates to start of day for accurate comparison
    lastPaymentDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    // Calculate the next due date (1 month after last payment)
    const nextDueDate = new Date(lastPaymentDate);
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);

    // Payment is due if today is on or after the next due date
    return today >= nextDueDate;
  };

  // Alert handlers
  const showAlert = (title, message, severity = 'info') => {
    setAlert({ open: true, title, message, severity });
  };

  const handleAlertClose = () => {
    setAlert({ ...alert, open: false });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar activePage="payments" />
      <CustomAlert 
        open={alert.open} 
        onClose={handleAlertClose} 
        title={alert.title} 
        message={alert.message} 
        severity={alert.severity} 
      />
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-6">
            <Typography variant="h6" className="mb-4">Member Payments</Typography>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Unpaid Members Column */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-red-100 p-4 border-b border-red-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-red-800">Unpaid Members ({unpaidMembers.length})</h2>
                  <TextField
                    label="Search Unpaid"
                    variant="outlined"
                    size="small"
                    value={searchTermUnpaid}
                    onChange={(e) => setSearchTermUnpaid(e.target.value)}
                    className="bg-white w-64"
                  />
                </div>
              </div>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Program</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center">Loading...</TableCell>
                      </TableRow>
                    ) : unpaidMembers.length > 0 ? (
                      unpaidMembers.map((member, index) => (
                        <TableRow key={`unpaid-${member.id || member.application_number || index}`}>
                          <TableCell>{member.full_name || 'N/A'}</TableCell>
                          <TableCell>{member.program || 'N/A'}</TableCell>
                          <TableCell>
                            <button 
                              className="cursor-pointer inline-flex justify-center rounded-md w-full px-3 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-500 shadow-sm focus-visible:outline-offset-2"
                              onClick={() => handlePaymentOpen(member)}
                            >
                              Pay
                            </button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} align="center" className="text-gray-500">No unpaid members found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>

            {/* Paid Members Column */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-green-100 p-4 border-b border-green-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-green-800">Paid Members ({paidMembers.length})</h2>
                  <TextField
                    label="Search Paid"
                    variant="outlined"
                    size="small"
                    value={searchTermPaid}
                    onChange={(e) => setSearchTermPaid(e.target.value)}
                    className="bg-white w-64"
                  />
                </div>
              </div>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Next Payment</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center">Loading...</TableCell>
                      </TableRow>
                    ) : paidMembers.length > 0 ? (
                      paidMembers.map((member, index) => (
                        <TableRow key={`paid-${member.id || member.application_number || index}`}>
                          <TableCell>{member.full_name || 'N/A'}</TableCell>
                          <TableCell>
                            {member.next_payment_date ? 
                              new Date(member.next_payment_date).toLocaleDateString() : 
                              'N/A'}
                          </TableCell>
                          <TableCell>
                          <button 
                              className="cursor-pointer inline-flex justify-center rounded-md w-full px-3 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-500 shadow-sm focus-visible:outline-offset-2"
                              onClick={() => handlePaymentOpen(member)}
                            >
                              View
                            </button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} align="center" className="text-gray-500">No paid members found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog
        open={paymentOpen}
        onClose={handlePaymentClose}
        maxWidth="md"
        fullWidth
        className="relative z-50"
        aria-labelledby="payment-dialog-title"
      >
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" />
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                  <h3 className="text-xl font-semibold leading-6 text-gray-900 mb-4" id="payment-dialog-title">
                    Record Payment
                  </h3>
                  {paymentLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-b-green-500"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Member Info */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Member Information</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-500">Name:</span> {paymentMember?.full_name || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">Program:</span> {paymentMember?.program || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">Age Bracket:</span> {paymentMember?.age_bracket || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">Contribution:</span> 
                            {paymentMember?.contribution_amount ? `₱${Number(paymentMember.contribution_amount).toLocaleString()}` : 'N/A'}
                          </div>
                          <div className="sm:col-span-2">
                            <span className="font-medium text-gray-500">Availment Period:</span> {paymentMember?.availment_period || 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Payment Form */}
                      <form ref={paymentFormRef} onSubmit={handlePaymentSubmit} className="space-y-6">
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-gray-700">Payment Details</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Amount
                              </label>
                              <div className="relative rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                  <span className="text-gray-500 sm:text-sm">₱</span>
                                </div>
                                <input
                                  type="number"
                                  name="amount"
                                  value={newPayment.amount}
                                  readOnly
                                  className="block w-full rounded-md border-gray-300 pl-7 pr-12 bg-gray-50 text-gray-700 cursor-not-allowed sm:text-sm p-2"
                                  placeholder="0.00"
                                  step="0.01"
                                  min="0"
                                  required
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Date
                              </label>
                              <input
                                type="date"
                                name="payment_date"
                                value={newPayment.payment_date}
                                onChange={handlePaymentChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Reference Number (Optional)
                              </label>
                              <input
                                type="text"
                                name="reference_number"
                                value={newPayment.reference_number}
                                onChange={handlePaymentChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2"
                                placeholder="OR #, Receipt #, etc."
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes (Optional)
                              </label>
                              <input
                                type="text"
                                name="notes"
                                value={newPayment.notes}
                                onChange={handlePaymentChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2"
                                placeholder="Additional notes"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Payment History */}
                        <div className="mt-6">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-medium text-gray-700">Payment Summary</h4>
                              <span className="text-xs text-gray-500">
                                {paymentHistory.length} {paymentHistory.length === 1 ? 'payment' : 'payments'}
                              </span>
                            </div>
                            
                            {paymentHistory.length > 0 ? (
                              <>
                                <div className="flex items-center justify-between py-2">
                                  <span className="text-sm font-medium text-gray-600">Total Amount Paid:</span>
                                  <span className="text-lg font-bold text-green-600">
                                    ₱{paymentHistory.reduce((sum, payment) => sum + Number(payment.amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                
                                <button
                                  type="button"
                                  onClick={() => setShowPaymentHistory(!showPaymentHistory)}
                                  className="text-sm text-green-600 hover:text-green-700 font-medium mt-2 flex items-center"
                                >
                                  {showPaymentHistory ? (
                                    <>
                                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                      </svg>
                                      Hide Payment History
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                      Show Payment History
                                    </>
                                  )}
                                </button>

                                {showPaymentHistory && (
                                  <div className="mt-4 overflow-hidden border border-gray-200 rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-200">
                                      <thead className="bg-gray-50">
                                        <tr>
                                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                          </th>
                                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Amount
                                          </th>
                                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Reference
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-gray-200">
                                        {paymentHistory.map((payment, index) => (
                                          <tr key={`payment-${payment.id || 'no-id'}-${payment.payment_date || index}`}>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                              {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                              {payment.amount ? `₱${Number(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'N/A'}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                              {payment.reference_number || '—'}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="text-center py-2 text-sm text-gray-500">
                                No payment history found for this member.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Form Actions */}
                        <div className="mt-6">
                          {!isPaymentDue() && paymentHistory.length > 0 && (
                            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                              <div className="flex">
                                <svg className="h-5 w-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <div className="text-sm text-yellow-700">
                                  <p className="font-medium">Payment not due yet</p>
                                  <p className="mt-1">
                                    Last payment: {new Date(paymentHistory.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))[0].payment_date).toLocaleDateString()}
                                    {' • '}
                                    Next due: {(() => {
                                      const lastDate = new Date(paymentHistory.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))[0].payment_date);
                                      lastDate.setMonth(lastDate.getMonth() + 1);
                                      return lastDate.toLocaleDateString();
                                    })()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="flex justify-end space-x-3">
                            <button
                              type="button"
                              onClick={handlePaymentClose}
                              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmOpen(true)}
                              disabled={!isPaymentDue()}
                              className={`inline-flex justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm focus-visible:outline-offset-2 ${
                                isPaymentDue()
                                  ? 'bg-green-600 text-white hover:bg-green-500 focus-visible:outline-green-600 cursor-pointer'
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                              title={!isPaymentDue() ? 'Payment is not due yet' : 'Record payment'}
                            >
                              Record Payment
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title" className="bg-gray-50 px-6 py-4">
          <span className="text-lg font-medium text-gray-900">Confirm Payment</span>
        </DialogTitle>
        <DialogContent className="bg-white px-6 py-4">
          <DialogContentText id="alert-dialog-description" className="text-gray-700">
            Are you sure you want to record this payment?
          </DialogContentText>
        </DialogContent>
        <DialogActions className="bg-gray-50 px-6 py-4">
          <button
            onClick={() => setConfirmOpen(false)}
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setConfirmOpen(false);
              // Use the form's submit method directly
              if (paymentFormRef.current) {
                paymentFormRef.current.dispatchEvent(
                  new Event('submit', { cancelable: true, bubbles: true })
                );
              }
            }}
            className="inline-flex justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
            autoFocus
          >
            Confirm
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default PaymentsPage;
