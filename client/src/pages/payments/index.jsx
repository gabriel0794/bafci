import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Button, TextField, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog
} from '@mui/material';
import CustomAlert from '../../components/common/CustomAlert';
import Navbar from '../../components/Navbar';

const PaymentsPage = () => {
  const [allMembers, setAllMembers] = useState([]);
  const [unpaidMembers, setUnpaidMembers] = useState([]);
  const [paidMembers, setPaidMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Payment dialog state
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMember, setPaymentMember] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
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
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = allMembers.filter(item => {
      return Object.keys(item).some(key =>
        item[key] && item[key].toString().toLowerCase().includes(lowercasedFilter)
      );
    });
    
    // Separate into paid and unpaid members
    const unpaid = [];
    const paid = [];
    
    filteredData.forEach(member => {
      if (member.last_payment_date) {
        paid.push(member);
      } else {
        unpaid.push(member);
      }
    });
    
    setUnpaidMembers(unpaid);
    setPaidMembers(paid);
  }, [searchTerm, allMembers]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/members', {
        headers: { 'x-auth-token': token }
      });
      setAllMembers(response.data);
      
      // Separate into paid and unpaid members
      const unpaid = [];
      const paid = [];
      
      response.data.forEach(member => {
        if (member.last_payment_date) {
          paid.push(member);
        } else {
          unpaid.push(member);
        }
      });
      
      setUnpaidMembers(unpaid);
      setPaidMembers(paid);
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
    setPaymentOpen(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/payments/${member.application_number}`, {
        headers: { 'x-auth-token': token }
      });
      setPaymentHistory(response.data);
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
        // First, create the payment record
        const paymentResponse = await axios.post('http://localhost:5000/api/payments', paymentPayload, {
          headers: { 
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        });
        
        // Then update the member's last payment dates
        const updateData = {
          last_payment_date: paymentDate,
          next_payment_date: nextPaymentDate.toISOString().split('T')[0]
        };
        
        const response = await axios.put(`http://localhost:5000/api/members/${paymentMember.id}`, updateData, {
          headers: { 
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        });
        
        // Update local state with the server's response
        if (response.data) {
          // Map the server's camelCase properties to our snake_case format
          const updatedMember = {
            ...response.data,
            full_name: response.data.fullName || response.data.full_name,
            application_number: response.data.applicationNumber || response.data.application_number,
            last_payment_date: response.data.lastPaymentDate || response.data.last_payment_date,
            next_payment_date: response.data.nextPaymentDate || response.data.next_payment_date,
            payment_history: response.data.paymentHistory || response.data.payment_history || []
          };
          
          // Update the payment member data
          setPaymentMember(prev => ({
            ...prev,
            ...updatedMember,
            last_payment_date: paymentDate,
            next_payment_date: nextPaymentDate.toISOString().split('T')[0]
          }));
          
          // Refresh the payment history
          const historyResponse = await axios.get(`http://localhost:5000/api/payments/history/${paymentMember.id}`, {
            headers: { 'x-auth-token': token }
          });
          setPaymentHistory(historyResponse.data);
          
          // Show success message
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
        }
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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Record Payments</h1>
          
          <Paper sx={{ p: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Search Members"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Paper>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Unpaid Members Column */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-red-100 p-4 border-b border-red-200">
                <h2 className="text-lg font-semibold text-red-800">Unpaid Members ({unpaidMembers.length})</h2>
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
                      unpaidMembers.map(member => (
                        <TableRow key={member.application_number}>
                          <TableCell>{member.full_name}</TableCell>
                          <TableCell>{member.program}</TableCell>
                          <TableCell>
                            <Button 
                              variant="contained" 
                              color="primary" 
                              size="small"
                              onClick={() => handlePaymentOpen(member)}
                            >
                              Pay
                            </Button>
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
                <h2 className="text-lg font-semibold text-green-800">Paid Members ({paidMembers.length})</h2>
              </div>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Last Payment</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center">Loading...</TableCell>
                      </TableRow>
                    ) : paidMembers.length > 0 ? (
                      paidMembers.map(member => (
                        <TableRow key={member.application_number}>
                          <TableCell>{member.full_name}</TableCell>
                          <TableCell>
                            {member.last_payment_date ? 
                              new Date(member.last_payment_date).toLocaleDateString() : 
                              'N/A'}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outlined" 
                              color="primary" 
                              size="small"
                              onClick={() => handlePaymentOpen(member)}
                            >
                              View
                            </Button>
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
                      <form onSubmit={handlePaymentSubmit}>
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
                                  onChange={handlePaymentChange}
                                  className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-green-500 focus:ring-green-500 sm:text-sm p-2"
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
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-700">Payment History</h4>
                            <span className="text-xs text-gray-500">
                              {paymentHistory.length} {paymentHistory.length === 1 ? 'record' : 'records'} found
                            </span>
                          </div>
                          
                          {paymentHistory.length > 0 ? (
                            <div className="overflow-hidden border border-gray-200 rounded-lg">
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
                                  {paymentHistory.map((payment) => (
                                    <tr key={payment.id}>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                        {new Date(payment.payment_date).toLocaleDateString()}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                        ₱{Number(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                        {payment.reference_number || '—'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-center py-4 text-sm text-gray-500 bg-gray-50 rounded-lg">
                              No payment history found for this member.
                            </div>
                          )}
                        </div>

                        {/* Form Actions */}
                        <div className="mt-6 flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={handlePaymentClose}
                            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="inline-flex justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                          >
                            Record Payment
                          </button>
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
    </div>
  );
};

export default PaymentsPage;
