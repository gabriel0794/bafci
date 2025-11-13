import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import {
  Box, Button, TextField, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, DialogContentText, MenuItem, Grid, FormControl, InputLabel, Select
} from '@mui/material';
import CustomAlert from '../../components/common/CustomAlert';
import Navbar from '../../components/Navbar';
import { useNotifications } from '../../contexts/NotificationContext';

const SPECIAL_STATUSES = ['Deceased', 'Void', 'Kicked'];
const STATUS_VIEW_OPTIONS = ['Active', ...SPECIAL_STATUSES];
const PAYMENT_FILTER_OPTIONS = [
  { label: 'All Members', value: 'all' },
  { label: 'Paid', value: 'paid' },
  { label: 'Unpaid', value: 'unpaid' }
];

const MembersPage = () => {
  const { addNotification } = useNotifications();
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [baseFilteredMembers, setBaseFilteredMembers] = useState([]);
  const [periodData, setPeriodData] = useState({}); // To store period data keyed by member ID
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    ageBracket: '',
    program: '',
    branch: '',
    endorsedBy: ''
  });
  const [branches, setBranches] = useState([]);
  const [fieldWorkers, setFieldWorkers] = useState([]); 
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [viewOpen, setViewOpen] = useState(false);
  const [viewMember, setViewMember] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusView, setStatusView] = useState('Active');
  const [itemsPerPage] = useState(15);
  const [actionMenuOpenId, setActionMenuOpenId] = useState(null);
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Payment dialog state
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [confirmPaymentOpen, setConfirmPaymentOpen] = useState(false);
  const paymentFormRef = useRef(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [newPayment, setNewPayment] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: '',
    late_fee_percentage: '15' // Default to 15%
  });

  // Fullscreen image viewer state
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Alert state
  const [alert, setAlert] = useState({
    open: false,
    title: '',
    message: '',
    severity: 'info' // 'success', 'error', 'warning', 'info'
  });

  const STATUS_OPTIONS = ['Alive', 'Deceased', 'Void', 'Kicked'];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionMenuOpenId !== null && !event.target.closest('.member-actions-menu')) {
        setActionMenuOpenId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [actionMenuOpenId]);

  useEffect(() => {
    setCurrentPage(1);
    setActionMenuOpenId(null);
  }, [
    searchTerm,
    filters.ageBracket,
    filters.program,
    filters.branch,
    filters.endorsedBy,
    members.length,
    paymentFilter
  ]);

  useEffect(() => {
    const relevantMembers = filteredMembers.filter(member => {
      const status = member.status || 'Alive';
      if (statusView === 'Active') {
        return !SPECIAL_STATUSES.includes(status);
      }
      return status === statusView;
    });

    const totalPages = relevantMembers.length > 0 ? Math.ceil(relevantMembers.length / itemsPerPage) : 0;

    if (totalPages === 0) {
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
      return;
    }

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredMembers, itemsPerPage, currentPage, statusView]);

  const initialMemberState = {
    application_number: '',
    full_name: '',
    nickname: '',
    age: '',
    program: '',
    age_bracket: '',
    contribution_amount: '',
    availment_period: '',
    picture: '',
    date_applied: new Date().toISOString().split('T')[0],
    complete_address: '',
    provincial_address: '',
    date_of_birth: '',
    place_of_birth: '',
    sex: '',
    civil_status: '',
    spouse_name: '',
    spouse_dob: '',
    church_affiliation: '',
    education_attainment: '',
    present_employment: '',
    employer_name: '',
    contact_number: '',
    beneficiary_name: '',
    beneficiary_dob: '',
    beneficiary_age: '',
    beneficiary_relationship: '',
    date_paid: '',
    received_by: '',
    or_number: '',
    branch: '',
    fieldWorkerId: '',
    status: 'Alive'
  };

  const [currentMember, setCurrentMember] = useState(initialMemberState);

  // Handle picture upload
  const handlePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
      // Store the actual file object in state, not just the path
      setCurrentMember(prev => ({ ...prev, picture: file }));
    }
  };

  // Fetch programs based on selected branch
  const fetchProgramsByBranch = async (branchName) => {
    if (!branchName) {
      setPrograms([]);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/programs/branch/name/${encodeURIComponent(branchName)}`, {
        headers: { 'x-auth-token': token }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPrograms(data);
      } else {
        console.error('Failed to fetch programs for branch');
        setPrograms([]);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
      setPrograms([]);
    }
  };

  // Get age brackets for selected program, sorted by minAge
  const getAgeBrackets = () => {
    if (!currentMember.program) return [];
    
    const selectedProgram = programs.find(p => p.name === currentMember.program);
    if (selectedProgram && selectedProgram.ageBrackets) {
      // Create a copy of the array and sort by minAge
      return [...selectedProgram.ageBrackets]
        .sort((a, b) => a.minAge - b.minAge)
        .map(bracket => ({
          range: bracket.ageRange,
          amount: parseFloat(bracket.contributionAmount),
          availment: bracket.availmentPeriod,
          minAge: bracket.minAge  // Keep minAge for sorting
        }));
    }
    return [];
  };

  // Handle branch change
  const handleBranchChange = async (e) => {
    const branchName = e.target.value;
    setCurrentMember(prev => ({
      ...prev,
      branch: branchName,
      program: '',
      age_bracket: '',
      contribution_amount: '',
      availment_period: ''
    }));
    
    // Fetch programs for the selected branch
    await fetchProgramsByBranch(branchName);
  };

  // Handle program change
  const handleProgramChange = (e) => {
    const programName = e.target.value;
    const selectedProgram = programs.find(p => p.name === programName);
    
    if (selectedProgram && selectedProgram.ageBrackets && selectedProgram.ageBrackets.length > 0) {
      const firstBracket = selectedProgram.ageBrackets[0];
      setCurrentMember(prev => ({
        ...prev,
        program: programName,
        age_bracket: firstBracket.ageRange,
        contribution_amount: parseFloat(firstBracket.contributionAmount),
        availment_period: firstBracket.availmentPeriod
      }));
    } else {
      setCurrentMember(prev => ({
        ...prev,
        program: programName,
        age_bracket: '',
        contribution_amount: '',
        availment_period: ''
      }));
    }
  };

  // Fetch payment period data for all members
  const fetchPaymentPeriods = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/payments/member-periods', {
        headers: { 
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPeriodData(data);
      } else {
        console.error('Failed to fetch payment periods:', response.status);
      }
    } catch (error) {
      console.error('Error fetching payment periods:', error);
    }
  };

  // Fetch members data
  const fetchMembers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch members
      const response = await fetch('http://localhost:5000/api/members', {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }
      
      const data = await response.json();
      setMembers(data);
      setFilteredMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch branches data
  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/branches', {
        headers: { 'x-auth-token': token }
      });
      if (response.ok) {
        const data = await response.json();
        setBranches(data);
      } else {
        console.error('Failed to fetch branches');
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  // Fetch field workers data
  const fetchFieldWorkers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/field-workers', {
        headers: { 'x-auth-token': token }
      });
      if (response.ok) {
        const data = await response.json();
        setFieldWorkers(data);
      } else {
        console.error('Failed to fetch field workers');
      }
    } catch (error) {
      console.error('Error fetching field workers:', error);
    }
  };

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchBranches(),
          fetchFieldWorkers(),
          fetchMembers(),
          fetchPaymentPeriods()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Check for members with payments almost due (within 3 days)
  useEffect(() => {
    if (!members.length || !Object.keys(periodData).length) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    members.forEach(member => {
      const paymentInfo = periodData[member.id];
      if (!paymentInfo || !paymentInfo.next_payment) return;

      const nextPaymentDate = new Date(paymentInfo.next_payment);
      nextPaymentDate.setHours(0, 0, 0, 0);

      // Calculate days until due
      const daysUntilDue = Math.ceil((nextPaymentDate - today) / (1000 * 60 * 60 * 24));

      // Notify if payment is due within 3 days (but not overdue)
      if (daysUntilDue > 0 && daysUntilDue <= 3) {
        // Check if we already notified about this (to avoid duplicate notifications)
        const notificationKey = `payment_due_${member.id}_${paymentInfo.next_payment}`;
        const alreadyNotified = localStorage.getItem(notificationKey);
        
        if (!alreadyNotified) {
          addNotification({
            type: 'payment_due',
            message: `${member.full_name || 'Member'} has a payment due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`
          });
          // Mark as notified
          localStorage.setItem(notificationKey, 'true');
        }
      }
    });
  }, [members, periodData, addNotification]);

  // Filter members based on search term and filters
  useEffect(() => {
    let result = [...members];
    
    // Debug: Log member data to check field_worker values
    console.log('All members:', members.map(m => ({
      id: m.id,
      name: m.full_name,
      field_worker: m.field_worker,
      branch: m.branch
    })));
    
    // Apply search term filter
    if (searchTerm) {
      const lowercasedFilter = searchTerm.toLowerCase();
      result = result.filter(member => {
        return (
          (member.full_name && member.full_name.toLowerCase().includes(lowercasedFilter)) ||
          (member.program && member.program.toLowerCase().includes(lowercasedFilter)) ||
          (member.branch && member.branch.toLowerCase().includes(lowercasedFilter))
        );
      });
    }
    
    // Apply dropdown filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        result = result.filter(member => {
          // Handle age bracket filter specially
          if (key === 'ageBracket') {
            const bracket = getAgeBrackets().find(b => b.range === value);
            if (!bracket) return true;

            const age = parseInt(member.age || '0');
            const rangeParts = bracket.range.split(' - ');
            const minAge = parseInt(rangeParts[0]);
            const maxAgeStr = rangeParts[1];

            if (maxAgeStr && maxAgeStr.includes('UP')) {
              return age >= minAge;
            } else {
              const maxAge = parseInt(maxAgeStr);
              return age >= minAge && age <= maxAge;
            }
          }
          if (key === 'endorsedBy') {
            // Check the field_worker.name field
            const fieldWorkerName = member.field_worker?.name || '';
            const isMatch = fieldWorkerName.trim().toLowerCase() === value.trim().toLowerCase();
            console.log('Comparing:', {
              memberName: member.full_name,
              fieldWorkerName,
              filterValue: value,
              isMatch,
              memberData: member // Log full member data for debugging
            });
            return isMatch;
          }
          return member[key] === value;
        });
      }
    });

    // Save the base filtered list (without payment filter) for stable counts
    setBaseFilteredMembers(result);

    if (paymentFilter !== 'all') {
      const isMemberPaid = (member) => {
        const paymentInfo = periodData[member.id];
        if (!paymentInfo || !paymentInfo.next_payment) {
          return false;
        }

        const nextPaymentDate = new Date(paymentInfo.next_payment);
        if (Number.isNaN(nextPaymentDate.getTime())) {
          return false;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        nextPaymentDate.setHours(0, 0, 0, 0);

        return nextPaymentDate > today;
      };

      result = result.filter(member => {
        const isPaid = isMemberPaid(member);
        return paymentFilter === 'paid' ? isPaid : !isPaid;
      });
    }

    setFilteredMembers(result);
  }, [searchTerm, members, filters, paymentFilter, periodData]);
  
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };
  
  const clearFilters = () => {
    setFilters({
      ageBracket: '',
      program: '',
      branch: '',
      endorsedBy: ''
    });
    setPaymentFilter('all');
    setSearchTerm('');
  };

  const handleStatusViewChange = (view) => {
    setStatusView(view);
    setCurrentPage(1);
    setActionMenuOpenId(null);
  };

  // Fetch members from API
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found. Please log in again.');
        }

        const response = await axios.get('http://localhost:5000/api/members', {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        });
        
        setMembers(response.data);
        setFilteredMembers(response.data);
      } catch (error) {
        console.error('Error fetching members:', error);
        // Show error to user
        if (error.response) {
          showAlert(
            'Fetch Error',
            `Error ${error.response.status}: ${error.response.data.message || 'Failed to fetch members'}`,
            'error'
          );
        } else if (error.request) {
          showAlert(
            'Connection Error',
            'No response from server. Please check your connection and try again.',
            'error'
          );
        } else {
          showAlert('Request Error', `Error: ${error.message}`, 'error');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setEditing(false);
    setPreviewUrl('');
    setShowConfirmDialog(false);
    setShowConfirmDialog(false);
    setCurrentMember({
      application_number: '',
      full_name: '',
      nickname: '',
      age: '',
      program: '',
      age_bracket: '',
      contribution_amount: '',
      availment_period: '',
      picture: null,
      date_applied: '',
      complete_address: '',
      provincial_address: '',
      date_of_birth: '',
      place_of_birth: '',
      sex: '',
      civil_status: '',
      spouse_name: '',
      spouse_dob: '',
      church_affiliation: '',
      education_attainment: '',
      present_employment: '',
      employer_name: '',
      contact_number: '',
      beneficiary_name: '',
      beneficiary_dob: '',
      beneficiary_age: '',
      beneficiary_relationship: '',
      date_paid: '',
      received_by: '',
      or_number: '',
      endorsed_by: '',
      branch: '',
      status: 'Alive'
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentMember(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate required fields before showing confirmation
    if (!currentMember.full_name || !currentMember.program || !currentMember.age_bracket) {
      showAlert('Missing Information', 'Please fill in all required fields before submitting.', 'warning');
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmDialog(false);

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const formData = new FormData();

      // Append all form fields to formData
      Object.keys(currentMember).forEach(key => {
        // Ensure we don't append null or undefined values, except for the picture
        if (key === 'picture' && currentMember[key] instanceof File) {
          formData.append('picture', currentMember[key]);
        } else if (currentMember[key] !== null && currentMember[key] !== undefined) {
          formData.append(key, currentMember[key]);
        }
      });

      const url = editing ? `http://localhost:5000/api/members/${currentMember.id}` : 'http://localhost:5000/api/members';
      const method = editing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'x-auth-token': token
          // Do NOT set 'Content-Type': the browser will set it to 'multipart/form-data' automatically
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save member');
      }
      
      const savedMember = await response.json();
      
      // Fetch the updated members list to ensure we have all data
      const membersResponse = await fetch('http://localhost:5000/api/members', {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });
      
      if (membersResponse.ok) {
        const updatedMembers = await membersResponse.json();
        setMembers(updatedMembers);
        setFilteredMembers(updatedMembers);
      }
      
      // Show success message
      showAlert(
        'Success',
        `Member ${editing ? 'updated' : 'added'} successfully!`,
        'success'
      );

      // Add notification for new member (only if adding, not editing)
      if (!editing) {
        const currentUser = localStorage.getItem('username') || 'Staff';
        addNotification({
          type: 'new_member',
          message: `New member ${currentMember.full_name || 'added'} has been registered by ${currentUser}`
        });
      }

      handleClose();
      
    } catch (error) {
      console.error('Error saving member:', error);
      showAlert('Save Error', error.message || 'Failed to save member. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (member) => {
    setCurrentMember({ ...initialMemberState, ...member });
    if (member.picture) {
      // Construct the full URL for the existing picture
      setPreviewUrl(`http://localhost:5000/uploads/${member.picture}`);
    } else {
      setPreviewUrl('');
    }
    setEditing(true);
    setOpen(true);
  };

  const handleDelete = (applicationNumber) => {
    // TODO: Add confirmation dialog
    setMembers(members.filter(m => m.applicationNumber !== applicationNumber));
  };

  const handleStatusChange = async (member, status) => {
    setActionMenuOpenId(null);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const formData = new FormData();
      formData.append('status', status);

      const response = await fetch(`http://localhost:5000/api/members/${member.id}`, {
        method: 'PUT',
        headers: {
          'x-auth-token': token
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update status');
      }

      await fetchMembers();

      showAlert(
        'Status Updated',
        `${member.full_name || 'Member'} marked as ${status}.`,
        'success'
      );
    } catch (error) {
      console.error('Error updating member status:', error);
      showAlert('Update Error', error.message || 'Failed to update status. Please try again.', 'error');
    }
  };

  const handleMemberClick = (member) => {
    setViewMember(member);
    setViewOpen(true);
  };

  const handleViewClose = () => {
    setViewOpen(false);
    setViewMember(null);
  };

  // Payment dialog handlers
  const handlePaymentOpen = async (member) => {
    setPaymentLoading(true);
    
    // Auto-fill the payment amount with the member's contribution amount
    setNewPayment(prev => ({
      ...prev,
      amount: member.contribution_amount || ''
    }));
    
    setPaymentOpen(true);
    try {
      const token = localStorage.getItem('token');
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
    setPaymentHistory([]);
    setShowPaymentHistory(false);
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
    if (!viewMember) return;
    
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
      
      const paymentPayload = {
        member_id: viewMember.id,
        amount: parseFloat(newPayment.amount),
        payment_date: paymentDate,
        reference_number: newPayment.reference_number,
        notes: newPayment.notes
      };
      
      // Create the payment record
      await axios.post('http://localhost:5000/api/payments', paymentPayload, {
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': token 
        }
      });

      // Update the member's last payment date
      await axios.put(
        `http://localhost:5000/api/members/${viewMember.id}`,
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

      // Refresh the payment history
      const historyResponse = await axios.get(
        `http://localhost:5000/api/payments/history/${viewMember.id}`,
        { headers: { 'x-auth-token': token } }
      );
      setPaymentHistory(historyResponse.data);

      // Update the view member data
      setViewMember(prev => ({
        ...prev,
        last_payment_date: paymentDate,
        next_payment_date: nextPaymentDate.toISOString().split('T')[0]
      }));

      // Close the payment dialog and show success message
      handlePaymentClose();
      showAlert(
        'Payment Successful',
        `Payment of ₱${Number(newPayment.amount).toFixed(2)} has been recorded for ${viewMember.full_name || 'the member'}.`,
        'success'
      );

      // Add notification for payment made
      const currentUser = localStorage.getItem('username') || 'Staff';
      addNotification({
        type: 'payment_made',
        message: `Payment of ₱${Number(newPayment.amount).toFixed(2)} made by ${viewMember.full_name || 'Member'} (processed by ${currentUser})`
      });
      
      // Refresh the members list and period data
      await fetchMembers();
      await fetchPaymentPeriods();
    } catch (error) {
      console.error('Error in payment submission:', error);
      let errorMessage = 'Failed to record payment';
      
      if (error.response) {
        errorMessage = error.response.data.message || error.response.data.error || errorMessage;
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      showAlert('Payment Error', errorMessage, 'error');
    }
  };

  // Helper function to check if payment is due
  const isPaymentDue = () => {
    if (!paymentHistory || paymentHistory.length === 0) {
      return true;
    }

    const sortedPayments = [...paymentHistory].sort((a, b) => 
      new Date(b.payment_date) - new Date(a.payment_date)
    );
    const lastPayment = sortedPayments[0];

    if (!lastPayment || !lastPayment.payment_date) {
      return true;
    }

    const lastPaymentDate = new Date(lastPayment.payment_date);
    const today = new Date();
    
    lastPaymentDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const nextDueDate = new Date(lastPaymentDate);
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);

    return today >= nextDueDate;
  };

  // Generate PDF with compact single-page layout
  const handleGeneratePdf = async () => {
    if (!viewMember) return;
    
    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 10px; color: #000; background: #fff; }
          .page { padding: 15mm; max-width: 210mm; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 3px solid #6b7c5e; }
          .header h1 { font-size: 20px; color: #6b7c5e; margin-bottom: 5px; }
          .header-info { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
          .header-left { text-align: left; font-size: 9px; color: #666; }
          .photo-box { width: 100px; height: 100px; border: 2px solid #333; background: #f9f9f9; display: flex; align-items: center; justify-content: center; }
          .photo { width: 100%; height: 100%; object-fit: cover; }
          .photo-placeholder { font-size: 9px; color: #999; text-align: center; }
          
          .section { margin-bottom: 12px; }
          .section-header { background: #6b7c5e; color: white; padding: 4px 10px; font-weight: bold; font-size: 11px; margin-bottom: 8px; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
          td { padding: 5px 8px; border: 1px solid #ddd; vertical-align: top; }
          .label-cell { background: #f5f5f5; font-weight: bold; width: 25%; font-size: 9px; }
          .value-cell { width: 25%; font-size: 10px; }
          .label-cell-wide { background: #f5f5f5; font-weight: bold; width: 15%; font-size: 9px; }
          .value-cell-wide { width: 35%; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
          <h1>BAFCI</h1>
            <h1>Members Information</h1>
            <div class="header-info">
              <div class="header-left">
                Application #: ${viewMember.application_number || 'N/A'}<br>
                Generated: ${new Date().toLocaleDateString()}
              </div>
              <div class="photo-box">
                ${viewMember.picture ? 
                  `<img src="http://localhost:5000/uploads/${viewMember.picture}" class="photo" alt="Member Photo" />` : 
                  `<div class="photo-placeholder">No Photo<br>Available</div>`
                }
              </div>
            </div>
          </div>

          <!-- Personal Information -->
          <div class="section">
            <div class="section-header">Personal Information</div>
            <table>
              <tr>
                <td class="label-cell">Full Name:</td>
                <td class="value-cell">${viewMember.full_name || 'N/A'}</td>
                <td class="label-cell">Nickname:</td>
                <td class="value-cell">${viewMember.nickname || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label-cell">Date of Birth:</td>
                <td class="value-cell">${viewMember.date_of_birth ? new Date(viewMember.date_of_birth).toLocaleDateString() : 'N/A'}</td>
                <td class="label-cell">Age:</td>
                <td class="value-cell">${viewMember.age || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label-cell">Place of Birth:</td>
                <td class="value-cell">${viewMember.place_of_birth || 'N/A'}</td>
                <td class="label-cell">Sex:</td>
                <td class="value-cell">${viewMember.sex || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label-cell">Civil Status:</td>
                <td class="value-cell">${viewMember.civil_status || 'N/A'}</td>
                <td class="label-cell">Contact:</td>
                <td class="value-cell">${viewMember.contact_number || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label-cell">Complete Address:</td>
                <td class="value-cell" colspan="3">${viewMember.complete_address || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label-cell">Provincial Address:</td>
                <td class="value-cell" colspan="3">${viewMember.provincial_address || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label-cell">Church Affiliation:</td>
                <td class="value-cell">${viewMember.church_affiliation || 'N/A'}</td>
                <td class="label-cell">Education:</td>
                <td class="value-cell">${viewMember.education_attainment || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label-cell">Employment:</td>
                <td class="value-cell">${viewMember.present_employment || 'N/A'}</td>
                <td class="label-cell">Employer:</td>
                <td class="value-cell">${viewMember.employer_name || 'N/A'}</td>
              </tr>
              ${viewMember.spouse_name ? `
              <tr>
                <td class="label-cell">Spouse Name:</td>
                <td class="value-cell">${viewMember.spouse_name}</td>
                <td class="label-cell">Spouse DOB:</td>
                <td class="value-cell">${viewMember.spouse_dob ? new Date(viewMember.spouse_dob).toLocaleDateString() : 'N/A'}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <!-- Beneficiary Information -->
          ${viewMember.beneficiary_name ? `
          <div class="section">
            <div class="section-header">Beneficiary Information</div>
            <table>
              <tr>
                <td class="label-cell-wide">Name:</td>
                <td class="value-cell-wide">${viewMember.beneficiary_name}</td>
                <td class="label-cell-wide">Relationship:</td>
                <td class="value-cell-wide">${viewMember.beneficiary_relationship || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label-cell-wide">Date of Birth:</td>
                <td class="value-cell-wide">${viewMember.beneficiary_dob ? new Date(viewMember.beneficiary_dob).toLocaleDateString() : 'N/A'}</td>
                <td class="label-cell-wide">Age:</td>
                <td class="value-cell-wide">${viewMember.beneficiary_age || 'N/A'}</td>
              </tr>
            </table>
          </div>
          ` : ''}

          <!-- Membership Details -->
          <div class="section">
            <div class="section-header">Membership Details</div>
            <table>
              <tr>
                <td class="label-cell-wide">Program:</td>
                <td class="value-cell-wide">${viewMember.program || 'N/A'}</td>
                <td class="label-cell-wide">Branch:</td>
                <td class="value-cell-wide">${viewMember.branch || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label-cell-wide">Contribution Amount:</td>
                <td class="value-cell-wide">${viewMember.contribution_amount ? viewMember.contribution_amount + ' PHP' : 'N/A'}</td>
                <td class="label-cell-wide">Availment Period:</td>
                <td class="value-cell-wide">${viewMember.availment_period || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label-cell-wide">Date Paid:</td>
                <td class="value-cell-wide">${viewMember.date_paid ? new Date(viewMember.date_paid).toLocaleDateString() : 'N/A'}</td>
                <td class="label-cell-wide">O.R. Number:</td>
                <td class="value-cell-wide">${viewMember.or_number || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label-cell-wide">Received By:</td>
                <td class="value-cell-wide">${viewMember.received_by || 'N/A'}</td>
                <td class="label-cell-wide">Field Worker:</td>
                <td class="value-cell-wide">${viewMember.field_worker?.name || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label-cell-wide">Date Applied:</td>
                <td class="value-cell-wide">${viewMember.date_applied ? new Date(viewMember.date_applied).toLocaleDateString() : 'N/A'}</td>
                <td class="label-cell-wide">Last Contribution:</td>
                <td class="value-cell-wide">${viewMember.last_contribution_date ? new Date(viewMember.last_contribution_date).toLocaleDateString() : '--'}</td>
              </tr>
              <tr>
                <td class="label-cell-wide">Next Due Date:</td>
                <td class="value-cell-wide">${viewMember.next_due_date ? new Date(viewMember.next_due_date).toLocaleDateString() : '--'}</td>
                <td class="label-cell-wide"></td>
                <td class="value-cell-wide"></td>
              </tr>
            </table>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const element = document.createElement('div');
      element.innerHTML = pdfContent;
      
      const opt = {
        margin: 0,
        filename: `member-${viewMember.application_number || 'info'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' 
        }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Helper function to show alerts
  const showAlert = (title, message, severity = 'info') => {
    setAlert({
      open: true,
      title,
      message,
      severity
    });
  };

  // Handle alert close
  const handleAlertClose = () => {
    setAlert(prev => ({ ...prev, open: false }));
  };

  const uniqueEndorsedBy = [...new Set(members.map(member => member.endorsed_by))].filter(Boolean);
  const uniquePrograms = [...new Set(members.map(member => member.program))].filter(Boolean);
  const uniqueBranches = [...new Set(members.map(member => member.branch))].filter(Boolean);
  const ageBrackets = getAgeBrackets().map(bracket => bracket.range);

  const statusFilteredMembers = {
    Active: filteredMembers.filter(member => !SPECIAL_STATUSES.includes(member.status || 'Alive')),
    Deceased: filteredMembers.filter(member => (member.status || 'Alive') === 'Deceased'),
    Void: filteredMembers.filter(member => (member.status || 'Alive') === 'Void'),
    Kicked: filteredMembers.filter(member => (member.status || 'Alive') === 'Kicked')
  };

  const statusAllMembers = {
    Active: members.filter(member => !SPECIAL_STATUSES.includes(member.status || 'Alive')),
    Deceased: members.filter(member => (member.status || 'Alive') === 'Deceased'),
    Void: members.filter(member => (member.status || 'Alive') === 'Void'),
    Kicked: members.filter(member => (member.status || 'Alive') === 'Kicked')
  };

  const displayedMembers = statusFilteredMembers[statusView] || [];
  const totalGroupMembers = statusAllMembers[statusView] || [];
  const statusCounts = Object.fromEntries(
    STATUS_VIEW_OPTIONS.map(option => [option, statusFilteredMembers[option]?.length || 0])
  );

  const filteredCount = displayedMembers.length;
  const totalGroupCount = totalGroupMembers.length;
  const hasActiveFilters = Object.values(filters).some(Boolean) || paymentFilter !== 'all';
  const filtersApplied = Boolean(searchTerm || hasActiveFilters);
  const statusLabel = statusView === 'Active' ? 'active members' : `${statusView.toLowerCase()} members`;
  const statusViewLabel = statusView === 'Active' ? 'Active Members' : `${statusView} Members`;
  const columnCount = 9;
  const startIndex = filteredCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = filteredCount === 0 ? 0 : Math.min(currentPage * itemsPerPage, filteredCount);
  const totalPages = filteredCount > 0 ? Math.ceil(filteredCount / itemsPerPage) : 0;
  const paginationWindow = 5;
  const paginationStart = totalPages === 0 ? 0 : Math.max(0, Math.min(currentPage - 3, totalPages - paginationWindow));
  const paginationEnd = totalPages === 0 ? 0 : Math.min(totalPages, paginationStart + paginationWindow);
  const pageNumbers = totalPages === 0 ? [] : Array.from({ length: totalPages }, (_, i) => i + 1).slice(paginationStart, paginationEnd);
  const isFirstPage = currentPage <= 1;
  const isLastPage = totalPages === 0 || currentPage >= totalPages;
  const paginationSummary = filteredCount === 0
    ? (filtersApplied
        ? `No ${statusLabel} match your search criteria. Try different filters.`
        : `No ${statusLabel} to display.`)
    : `Showing ${startIndex}-${endIndex} of ${filteredCount} ${statusLabel}${filteredCount !== totalGroupCount ? ` (filtered from ${totalGroupCount})` : ''}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomAlert
        open={alert.open}
        onClose={handleAlertClose}
        title={alert.title}
        message={alert.message}
        severity={alert.severity}
      />
      <Navbar activePage="members" />
      <div className="py-6 px-2 sm:px-4">
        <div className="max-w-[99%] mx-auto">
          <div className="mb-6 px-2 sm:px-4">
            <h1 className="text-2xl font-bold text-gray-900">Members Management</h1>
            <p className="mt-1 text-sm text-gray-500">Add and manage members</p>
          </div>
          
          <div className="w-full">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-lg font-medium text-gray-900">
                Members List
                <span className="ml-2 text-sm font-normal text-gray-500">({statusViewLabel})</span>
              </h2>
                  <button
                    onClick={handleOpen}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 whitespace-nowrap"
                  >
                    + Add Member
                  </button>
                </div>
              </div>
              <div className="p-3 sm:p-4">
                <div className="mb-4 space-y-4">
                {/* Search Bar */}
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="focus:ring-green-500 focus:border-green-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md p-2 border"
                    placeholder="Search by name, program, or branch"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {(searchTerm || hasActiveFilters) && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 space-x-1">
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="text-gray-400 hover:text-gray-600"
                          title="Clear search"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="text-gray-400 hover:text-gray-600 text-xs"
                          title="Clear all filters"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Filter Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Age Bracket Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Age Bracket</label>
                    <select
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border"
                      value={filters.ageBracket}
                      onChange={(e) => handleFilterChange('ageBracket', e.target.value)}
                    >
                      <option value="">All Age Brackets</option>
                      {ageBrackets.map((bracket) => (
                        <option key={bracket} value={bracket}>
                          {bracket} years
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Program Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Program</label>
                    <select
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border"
                      value={filters.program}
                      onChange={(e) => handleFilterChange('program', e.target.value)}
                    >
                      <option value="">All Programs</option>
                      {uniquePrograms.map((program) => (
                        <option key={program} value={program}>
                          {program}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Branch Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Branch</label>
                    <select
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border"
                      value={filters.branch}
                      onChange={(e) => handleFilterChange('branch', e.target.value)}
                    >
                      <option value="">All Branches</option>
                      {uniqueBranches.map((branch) => (
                        <option key={branch} value={branch}>
                          {branch}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Endorsed By Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Endorsed By</label>
                    <select
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border"
                      value={filters.endorsedBy}
                      onChange={(e) => handleFilterChange('endorsedBy', e.target.value)}
                    >
                      <option value="">All Field Workers</option>
                      {fieldWorkers.map((worker) => (
                        <option key={worker.id} value={worker.name}>
                          {worker.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 mb-4 px-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {PAYMENT_FILTER_OPTIONS.map(option => {
                      // Calculate count for each filter option
                      let count = 0;
                      if (option.value === 'all') {
                        count = baseFilteredMembers.length;
                      } else {
                        const isMemberPaid = (member) => {
                          const paymentInfo = periodData[member.id];
                          if (!paymentInfo || !paymentInfo.next_payment) {
                            return false;
                          }
                          const nextPaymentDate = new Date(paymentInfo.next_payment);
                          if (Number.isNaN(nextPaymentDate.getTime())) {
                            return false;
                          }
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          nextPaymentDate.setHours(0, 0, 0, 0);
                          return nextPaymentDate > today;
                        };
                        
                        count = baseFilteredMembers.filter(member => {
                          const isPaid = isMemberPaid(member);
                          return option.value === 'paid' ? isPaid : !isPaid;
                        }).length;
                      }
                      
                      return (
                        <button
                          key={option.value}
                          onClick={() => setPaymentFilter(option.value)}
                          className={`px-3 py-1 rounded-md text-sm font-medium border transition ${
                            paymentFilter === option.value
                              ? 'bg-green-600 text-white border-green-600 shadow'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          {option.label} <span className="font-bold">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    {STATUS_VIEW_OPTIONS.map(option => (
                      <button
                        key={option}
                        onClick={() => handleStatusViewChange(option)}
                        className={`px-3 py-1 rounded-md text-sm font-medium border transition ${
                          statusView === option
                            ? 'bg-green-600 text-white border-green-600 shadow'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {option}
                        <span className={`ml-1 text-xs ${statusView === option ? 'text-green-100' : 'text-gray-500'}`}>
                          ({statusCounts[option] ?? 0})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div className="text-sm text-gray-600">
                    {paginationSummary}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={isFirstPage}
                      className={`px-3 py-1 rounded-md ${isFirstPage ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      Previous
                    </button>
                    {pageNumbers.map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-md ${currentPage === page ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={isLastPage}
                      className={`px-3 py-1 rounded-md ${isLastPage ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
              <div className="relative overflow-x-auto w-full">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <colgroup>
                      <col className="w-1/6" />
                      <col className="w-1/6" />
                      <col className="w-1/6" />
                      <col className="w-1/6" />
                      <col className="w-1/6" />
                      <col className="w-1/6" />
                      <col className="w-1/6" />
                      <col className="w-1/6" />
                      <col className="w-12" />
                    </colgroup>
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date Applied
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Program
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Endorsed By
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Branch
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Period Start
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Next Due Date
                        </th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan={columnCount} className="px-6 py-4 text-center text-sm text-gray-500">
                            Loading members...
                          </td>
                        </tr>
                      ) : filteredCount === 0 ? (
                        <tr>
                          <td colSpan={columnCount} className="px-6 py-4 text-center text-sm text-gray-500">
                            {filtersApplied 
                              ? `No ${statusLabel} match your search criteria. Try different filters.`
                              : `No ${statusLabel} found. ${statusView === 'Active' ? 'Click "Add Member" to create one.' : 'Switch to a different status view.'}`}
                          </td>
                        </tr>
                      ) : (
                        displayedMembers
                          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                          .map((member) => (
                          <tr 
                            key={member.id} 
                            className="group hover:bg-gray-50 w-full cursor-pointer transition-colors"
                            onClick={() => handleMemberClick(member)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  {member.picture ? (
                                    <img
                                      className="h-10 w-10 rounded-full object-cover border border-gray-200"
                                      src={`http://localhost:5000/uploads/${member.picture}`}
                                      alt={member.full_name || 'Member'}
                                    />
                                  ) : (
                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                      <span className="text-xs">No Photo</span>
                                    </div>
                                  )}
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                                    {member.full_name || 'N/A'}
                                    {(() => {
                                      const paymentInfo = periodData[member.id];
                                      if (!paymentInfo || !paymentInfo.next_payment) {
                                        return <span className="text-red-600 font-bold" title="Payment overdue">*</span>;
                                      }
                                      const nextPaymentDate = new Date(paymentInfo.next_payment);
                                      const today = new Date();
                                      today.setHours(0, 0, 0, 0);
                                      nextPaymentDate.setHours(0, 0, 0, 0);
                                      const isUnpaid = nextPaymentDate <= today;
                                      return isUnpaid ? <span className="text-red-600 font-bold" title="Payment overdue">*</span> : null;
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {member.contact_number || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {member.date_applied ? new Date(member.date_applied).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                member.program?.toLowerCase() === 'jacinth' 
                                  ? 'bg-green-100 text-green-800' 
                                  : member.program?.toLowerCase() === 'chalcedony'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {member.program || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {member.field_worker ? member.field_worker.name : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {member.branch || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {periodData[member.id]?.period_start ? new Date(periodData[member.id].period_start).toLocaleDateString() : '--'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {periodData[member.id]?.next_payment ? new Date(periodData[member.id].next_payment).toLocaleDateString() : '--'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="relative member-actions-menu inline-block text-left">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActionMenuOpenId(prev => prev === member.id ? null : member.id);
                                  }}
                                  className="rounded-full p-1 hover:bg-gray-100 text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM10 11.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM10 17a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                                  </svg>
                                </button>
                                {actionMenuOpenId === member.id && (
                                  <div className="absolute right-0 z-20 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                    <div className="py-1">
                                      {STATUS_OPTIONS.filter(option => option !== member.status).map((status) => (
                                        <button
                                          key={status}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleStatusChange(member, status);
                                          }}
                                          className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                          {status}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-4 px-2">
                <div className="text-sm text-gray-600">
                  {paginationSummary}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={isFirstPage}
                    className={`px-3 py-1 rounded-md ${isFirstPage ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    Previous
                  </button>
                  {pageNumbers.map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-md ${currentPage === page ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={isLastPage}
                    className={`px-3 py-1 rounded-md ${isLastPage ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Member Dialog */}
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="md" 
        fullWidth
        className="relative z-50"
        aria-labelledby="member-dialog-title"
      >
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <h3 className="text-base font-semibold leading-6 text-gray-900" id="member-dialog-title">
                    {editing ? 'Edit Member' : 'Add New Member'}
                  </h3>
                  <div className="mt-2">
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      // Validate required fields before showing confirmation
                      if (!currentMember.full_name || !currentMember.program || !currentMember.age_bracket) {
                        alert('Please fill in all required fields before submitting.');
                        return;
                      }
                      setShowConfirmDialog(true);
                    }}>
                      <div className="space-y-6">
                        <div className="border-b border-gray-200 pb-4 mb-4">
                          <div className="flex items-center space-x-6">
                            <div className="shrink-0">
                              {previewUrl ? (
                                <img
                                  className="h-24 w-24 object-cover rounded-full border-2 border-gray-300"
                                  src={previewUrl}
                                  alt="Member preview"
                                />
                              ) : (
                                <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                  <span className="text-sm">No photo</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <label className="block">
                                <span className="sr-only">Choose profile photo</span>
                                <input
                                  type="file"
                                  name="picture"
                                  onChange={handlePictureChange}
                                  accept="image/*"
                                  className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-md file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-green-50 file:text-green-700
                                    hover:file:bg-green-100"
                                />
                              </label>
                              <p className="mt-1 text-xs text-gray-500">JPG, GIF or PNG. Max size 2MB</p>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-4">Personal Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name *
                              </label>
                              <input
                                type="text"
                                name="full_name"
                                value={currentMember.full_name || ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-2 py-2"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nickname
                              </label>
                              <input
                                type="text"
                                name="nickname"
                                value={currentMember.nickname || ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-2 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Age *
                              </label>
                              <input
                                type="number"
                                name="age"
                                value={currentMember.age || ''}
                                onChange={handleChange}
                                min="0"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-2 py-2"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Contact Number
                              </label>
                              <input
                                type="tel"
                                name="contact_number"
                                value={currentMember.contact_number || ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-2 py-2"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Branch *
                              </label>
                              <FormControl fullWidth size="small" required>
                                <Select
                                  name="branch"
                                  value={currentMember.branch || ''}
                                  onChange={handleBranchChange}
                                  displayEmpty
                                  inputProps={{ 'aria-label': 'Select Branch' }}
                                  sx={{
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#d1d5db',
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#10b981',
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#10b981',
                                      borderWidth: '2px',
                                    },
                                    '& .MuiSelect-icon': {
                                      color: '#6b7280',
                                    },
                                    backgroundColor: 'white',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                  }}
                                >
                                  <MenuItem value="" disabled>
                                    <em>Select Branch...</em>
                                  </MenuItem>
                                  {branches.map((branch) => (
                                    <MenuItem 
                                      key={branch.id} 
                                      value={branch.name}
                                      disabled={!branch.isActive}
                                    >
                                      {branch.name}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </div>
                            
                            {/* Program Selection */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Program *
                              </label>
                              <FormControl fullWidth size="small" required disabled={!currentMember.branch}>
                                <Select
                                  name="program"
                                  value={currentMember.program || ''}
                                  onChange={handleProgramChange}
                                  displayEmpty
                                  inputProps={{ 'aria-label': 'Select Program' }}
                                  sx={{
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#d1d5db',
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                      borderColor: currentMember.branch ? '#10b981' : '#d1d5db',
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                      borderColor: currentMember.branch ? '#10b981' : '#d1d5db',
                                      borderWidth: '2px',
                                    },
                                    '& .MuiSelect-icon': {
                                      color: '#6b7280',
                                    },
                                    backgroundColor: currentMember.branch ? 'white' : '#f9fafb',
                                    color: !currentMember.branch ? '#9ca3af' : 'inherit',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                  }}
                                >
                                  <MenuItem value="">
                                    <em>{currentMember.branch ? 'Select Program...' : 'Select Branch First...'}</em>
                                  </MenuItem>
                                  {programs.map((program) => (
                                    <MenuItem 
                                      key={program.id} 
                                      value={program.name}
                                      disabled={!program.isActive}
                                    >
                                      {program.name}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </div>
                            
                            {/* Age Bracket Dropdown - Only shown when a program is selected */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Age Bracket *
                              </label>
                              <FormControl fullWidth size="small" required disabled={!currentMember.program}>
                                <Select
                                  name="age_bracket"
                                  value={currentMember.age_bracket || ''}
                                  onChange={(e) => {
                                    const selectedBracket = e.target.value;
                                    const selectedData = getAgeBrackets().find(bracket => bracket.range === selectedBracket);
                                    setCurrentMember({
                                      ...currentMember,
                                      age_bracket: selectedBracket,
                                      contribution_amount: selectedData ? selectedData.amount : '',
                                      availment_period: selectedData ? selectedData.availment : ''
                                    });
                                  }}
                                  displayEmpty
                                  inputProps={{ 'aria-label': 'Select Age Bracket' }}
                                  sx={{
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#d1d5db',
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                      borderColor: currentMember.program ? '#10b981' : '#d1d5db',
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                      borderColor: currentMember.program ? '#10b981' : '#d1d5db',
                                      borderWidth: '2px',
                                    },
                                    '& .MuiSelect-icon': {
                                      color: '#6b7280',
                                    },
                                    backgroundColor: currentMember.program ? 'white' : '#f9fafb',
                                    color: !currentMember.program ? '#9ca3af' : 'inherit',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                  }}
                                >
                                  <MenuItem value="">
                                    <em>Select Age Bracket...</em>
                                  </MenuItem>
                                  {getAgeBrackets().map((bracket) => (
                                    <MenuItem key={`bracket-${bracket.range}`} value={bracket.range}>
                                      {bracket.range} years
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </div>
                            
                            {/* Contribution Amount - Readonly */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Contribution Amount (Php)
                              </label>
                              <input
                                type="text"
                                name="contribution_amount"
                                value={currentMember.contribution_amount ? `${currentMember.contribution_amount} PHP` : ''}
                                readOnly
                                className="block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm px-2 py-2"
                              />
                            </div>
                            
                            {/* Availment Period - Readonly */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Availment Period
                              </label>
                              <input
                                type="text"
                                name="availment_period"
                                value={currentMember.availment_period || ''}
                                readOnly
                                className="block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm px-2 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date Applied *
                              </label>
                              <input
                                type="date"
                                name="date_applied"
                                value={currentMember.date_applied || ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-2 py-2"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Complete Address
                              </label>
                              <textarea
                                name="complete_address"
                                value={currentMember.complete_address || ''}
                                onChange={handleChange}
                                rows={2}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-2 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Provincial Address
                              </label>
                              <textarea
                                name="provincial_address"
                                value={currentMember.provincial_address || ''}
                                onChange={handleChange}
                                rows={2}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-2 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date of Birth
                              </label>
                              <input
                                type="date"
                                name="date_of_birth"
                                value={currentMember.date_of_birth || ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-2 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Place of Birth
                              </label>
                              <input
                                type="text"
                                name="place_of_birth"
                                value={currentMember.place_of_birth || ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-2 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sex
                              </label>
                              <FormControl fullWidth size="small" required>
                                <Select
                                  name="sex"
                                  value={currentMember.sex || ''}
                                  onChange={handleChange}
                                  displayEmpty
                                  inputProps={{ 'aria-label': 'Select Sex' }}
                                  sx={{
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#d1d5db',
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#10b981',
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#10b981',
                                      borderWidth: '2px',
                                    },
                                    '& .MuiSelect-icon': {
                                      color: '#6b7280',
                                    },
                                    backgroundColor: 'white',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                  }}
                                >
                                  <MenuItem value="">
                                    <em>Select...</em>
                                  </MenuItem>
                                  <MenuItem value="Male">Male</MenuItem>
                                  <MenuItem value="Female">Female</MenuItem>
                                </Select>
                              </FormControl>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Civil Status
                              </label>
                              <FormControl fullWidth size="small" required>
                                <Select
                                  name="civil_status"
                                  value={currentMember.civil_status || ''}
                                  onChange={handleChange}
                                  displayEmpty
                                  inputProps={{ 'aria-label': 'Select Civil Status' }}
                                  sx={{
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#d1d5db',
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#10b981',
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#10b981',
                                      borderWidth: '2px',
                                    },
                                    '& .MuiSelect-icon': {
                                      color: '#6b7280',
                                    },
                                    backgroundColor: 'white',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                  }}
                                >
                                  <MenuItem value="">
                                    <em>Select...</em>
                                  </MenuItem>
                                  <MenuItem value="Single">Single</MenuItem>
                                  <MenuItem value="Married">Married</MenuItem>
                                  <MenuItem value="Widowed">Widowed</MenuItem>
                                  <MenuItem value="Separated">Separated</MenuItem>
                                  <MenuItem value="Divorced">Divorced</MenuItem>
                                </Select>
                              </FormControl>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Name of Spouse (Optional)
                              </label>
                              <input
                                type="text"
                                name="spouse_name"
                                value={currentMember.spouse_name || ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-2 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Spouse Date of Birth
                              </label>
                              <input
                                type="date"
                                name="spouse_dob"
                                value={currentMember.spouse_dob || ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-2 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Church Affiliation
                              </label>
                              <input
                                type="text"
                                name="church_affiliation"
                                value={currentMember.church_affiliation || ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-2 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Education Attainment
                              </label>
                              <input
                                type="text"
                                name="education_attainment"
                                value={currentMember.education_attainment || ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-2 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Present Employment
                              </label>
                              <input
                                type="text"
                                name="present_employment"
                                value={currentMember.present_employment || ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-2 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Name of Employer
                              </label>
                              <input
                                type="text"
                                name="employer_name"
                                value={currentMember.employer_name || ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-2 py-2"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="sm:col-span-6">
                          <h4 className="text-sm font-medium text-gray-900 mb-4">Beneficiary Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="sm:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Beneficiary Name
                              </label>
                              <input
                                type="text"
                                name="beneficiary_name"
                                value={currentMember.beneficiary_name || ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-2 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Beneficiary Date of Birth
                              </label>
                              <input
                                type="date"
                                name="beneficiary_dob"
                                value={currentMember.beneficiary_dob || ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-2 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Beneficiary Age
                              </label>
                              <input
                                type="number"
                                name="beneficiary_age"
                                value={currentMember.beneficiary_age || ''}
                                onChange={handleChange}
                                min="0"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-2 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Relationship to Member
                              </label>
                              <input
                                type="text"
                                name="beneficiary_relationship"
                                value={currentMember.beneficiary_relationship || ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-2 py-2"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="sm:col-span-6">
                          <h4 className="text-sm font-medium text-gray-900 mb-4">Staff Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date Paid
                              </label>
                              <input
                                type="date"
                                name="date_paid"
                                value={currentMember.date_paid || ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-2 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Amount Paid (Php)
                              </label>
                              <input
                                type="number"
                                name="membership_fee_amount"
                                value={currentMember.membership_fee_amount || ''}
                                onChange={handleChange}
                                min="0"
                                step="1"
                                placeholder="600"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-2 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Received By
                              </label>
                              <input
                                type="text"
                                name="received_by"
                                value={currentMember.received_by || ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-2 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                O.R. Number
                              </label>
                              <input
                                type="text"
                                name="or_number"
                                value={currentMember.or_number || ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-2 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Endorsed By (Field Worker)
                              </label>
                              <FormControl fullWidth size="small">
                                <Select
                                  name="fieldWorkerId"
                                  value={currentMember.fieldWorkerId || ''}
                                  onChange={handleChange}
                                  displayEmpty
                                  inputProps={{ 'aria-label': 'Select Staff' }}
                                  sx={{
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#d1d5db',
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#10b981',
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#10b981',
                                      borderWidth: '1px',
                                    },
                                    '& .MuiSelect-icon': {
                                      color: '#6b7280',
                                    },
                                    backgroundColor: 'white',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                  }}
                                >
                                  <MenuItem value="">
                                    <em>Select staff</em>
                                  </MenuItem>
                                  {fieldWorkers.map((worker) => (
                                    <MenuItem key={worker.id} value={worker.id}>
                                      {worker.name}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                          onClick={handleClose}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 sm:col-start-2"
                        >
                          {editing ? 'Update' : 'Save'}
                        </button>
                      </div>
                    </form>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <h3 className="text-base font-semibold leading-6 text-gray-900" id="modal-title">
                Confirm Submission
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Are you sure you want to {editing ? 'update' : 'add'} this member? This action cannot be undone. Please review all the data entered.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          <button
            type="button"
            className="inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 sm:ml-3 sm:w-auto"
            onClick={handleConfirmSubmit}
          >
            {editing ? 'Update Member' : 'Add Member'}
          </button>
          <button
            type="button"
            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
            onClick={() => setShowConfirmDialog(false)}
          >
            Cancel
          </button>
        </div>
      </Dialog>



      {/* View Member Dialog */}
      <Dialog 
        open={viewOpen} 
        onClose={handleViewClose} 
        maxWidth="md" 
        fullWidth
        className="relative z-50 print:z-0"
        aria-labelledby="view-member-dialog-title"
      >
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" />
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6 print:shadow-none">
              <div className="print:p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Member Information</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Application #: {viewMember?.application_number || 'N/A'} | 
                      Date: {new Date().toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handlePaymentOpen(viewMember)}
                      className="hidden sm:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Pay
                    </button>
                    <button
                      onClick={handleGeneratePdf}
                      className="hidden sm:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Download PDF
                    </button>
                  </div>
                </div>

                {viewMember && (
                  <div className="space-y-6">
                    {/* Member Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex-shrink-0">
                          {viewMember.picture ? (
                            <img
                              className="h-32 w-32 rounded-full border-2 border-gray-300 object-cover cursor-pointer transition-transform hover:scale-105"
                              src={`http://localhost:5000/uploads/${viewMember.picture}`}
                              alt={viewMember.full_name || 'Member'}
                              onClick={() => setFullscreenImage(`http://localhost:5000/uploads/${viewMember.picture}`)}
                            />
                          ) : (
                            <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                              <span className="text-xs text-center px-1">No Photo</span>
                            </div>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{viewMember.full_name || 'N/A'}</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-500">Age:</span> {viewMember.age || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Contact:</span> {viewMember.contact_number || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Branch:</span> {viewMember.branch || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Program:</span>{' '}
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            viewMember.program?.toLowerCase() === 'jacinth' 
                              ? 'bg-green-100 text-green-800' 
                              : viewMember.program?.toLowerCase() === 'chalcedony'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {viewMember.program || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Date Applied:</span> {viewMember.date_applied ? new Date(viewMember.date_applied).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Personal Information */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div><span className="font-medium">Full Name:</span> {viewMember.full_name || 'N/A'}</div>
                            <div><span className="font-medium">Nickname:</span> {viewMember.nickname || 'N/A'}</div>
                            <div><span className="font-medium">Date of Birth:</span> {viewMember.date_of_birth ? new Date(viewMember.date_of_birth).toLocaleDateString() : 'N/A'}</div>
                            <div><span className="font-medium">Place of Birth:</span> {viewMember.place_of_birth || 'N/A'}</div>
                            <div><span className="font-medium">Sex:</span> {viewMember.sex || 'N/A'}</div>
                            <div><span className="font-medium">Civil Status:</span> {viewMember.civil_status || 'N/A'}</div>
                            <div><span className="font-medium">Spouse Name:</span> {viewMember.spouse_name || 'N/A'}</div>
                            <div><span className="font-medium">Spouse DOB:</span> {viewMember.spouse_dob ? new Date(viewMember.spouse_dob).toLocaleDateString() : 'N/A'}</div>
                          </div>
                          <div className="space-y-2">
                            <div><span className="font-medium">Complete Address:</span> {viewMember.complete_address || 'N/A'}</div>
                            <div><span className="font-medium">Provincial Address:</span> {viewMember.provincial_address || 'N/A'}</div>
                            <div><span className="font-medium">Church Affiliation:</span> {viewMember.church_affiliation || 'N/A'}</div>
                            <div><span className="font-medium">Education:</span> {viewMember.education_attainment || 'N/A'}</div>
                            <div><span className="font-medium">Employment:</span> {viewMember.present_employment || 'N/A'}</div>
                            <div><span className="font-medium">Employer:</span> {viewMember.employer_name || 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Beneficiary Information */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Beneficiary Information</h3>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div><span className="font-medium">Name:</span> {viewMember.beneficiary_name || 'N/A'}</div>
                          <div><span className="font-medium">Date of Birth:</span> {viewMember.beneficiary_dob ? new Date(viewMember.beneficiary_dob).toLocaleDateString() : 'N/A'}</div>
                          <div><span className="font-medium">Age:</span> {viewMember.beneficiary_age || 'N/A'}</div>
                          <div><span className="font-medium">Relationship:</span> {viewMember.beneficiary_relationship || 'N/A'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Staff Information */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Membership Details</h3>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div><span className="font-medium">Contribution Amount:</span> {viewMember.contribution_amount ? `${viewMember.contribution_amount} PHP` : 'N/A'}</div>
                          <div><span className="font-medium">Availment Period:</span> {viewMember.availment_period || 'N/A'}</div>
                          <div><span className="font-medium">Date Paid:</span> {viewMember.date_paid ? new Date(viewMember.date_paid).toLocaleDateString() : 'N/A'}</div>
                          <div><span className="font-medium">O.R. Number:</span> {viewMember.or_number || 'N/A'}</div>
                          <div><span className="font-medium">Received By:</span> {viewMember.received_by || 'N/A'}</div>
                          <div><span className="font-medium">Field Worker:</span> {viewMember.field_worker?.name || 'N/A'}</div>
                          <div><span className="font-medium">Membership Fee Amount:</span> {viewMember.membership_fee_amount ? `${viewMember.membership_fee_amount} PHP` : 'N/A'}</div>
                          <div><span className="font-medium">Membership Date Paid:</span> {viewMember.date_paid ? new Date(viewMember.date_paid).toLocaleDateString() : '--'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="mt-5 sm:mt-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                    onClick={handleViewClose}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Dialog>

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
                            <span className="font-medium text-gray-500">Name:</span> {viewMember?.full_name || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">Program:</span> {viewMember?.program || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">Age Bracket:</span> {viewMember?.age_bracket || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">Contribution:</span> 
                            {viewMember?.contribution_amount ? `₱${Number(viewMember.contribution_amount).toLocaleString()}` : 'N/A'}
                          </div>
                          <div className="sm:col-span-2">
                            <span className="font-medium text-gray-500">Availment Period:</span> {viewMember?.availment_period || 'N/A'}
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
                                Late Fee Percentage
                                {(() => {
                                  const paymentDate = new Date(newPayment.payment_date);
                                  const dayOfMonth = paymentDate.getDate();
                                  const isLate = dayOfMonth > 5;
                                  return isLate ? (
                                    <span className="ml-2 text-xs text-red-600 font-normal">(Payment is late)</span>
                                  ) : (
                                    <span className="ml-2 text-xs text-green-600 font-normal">(On-time, no fee)</span>
                                  );
                                })()}
                              </label>
                              <select
                                name="late_fee_percentage"
                                value={newPayment.late_fee_percentage}
                                onChange={handlePaymentChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2"
                              >
                                <option value="15">15%</option>
                                <option value="25">25%</option>
                                <option value="35">35%</option>
                                <option value="40">40%</option>
                              </select>
                              <p className="mt-1 text-xs text-gray-500">
                                Applied only if payment is made after the 5th
                              </p>
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
                              onClick={() => setConfirmPaymentOpen(true)}
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

      {/* Payment Confirmation Dialog */}
      <Dialog
        open={confirmPaymentOpen}
        onClose={() => setConfirmPaymentOpen(false)}
        aria-labelledby="payment-confirm-dialog-title"
        aria-describedby="payment-confirm-dialog-description"
      >
        <DialogTitle id="payment-confirm-dialog-title" className="bg-gray-50 px-6 py-4">
          <span className="text-lg font-medium text-gray-900">Confirm Payment</span>
        </DialogTitle>
        <DialogContent className="bg-white px-6 py-4">
          <DialogContentText id="payment-confirm-dialog-description" className="text-gray-700">
            Are you sure you want to record this payment?
          </DialogContentText>
        </DialogContent>
        <DialogActions className="bg-gray-50 px-6 py-4">
          <button
            onClick={() => setConfirmPaymentOpen(false)}
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setConfirmPaymentOpen(false);
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

      {/* Fullscreen Image Viewer */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setFullscreenImage(null)}
        >
          <img
            src={fullscreenImage}
            alt="Fullscreen Member Photo"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
          <button
            className="absolute top-4 right-6 text-white text-4xl font-bold hover:text-gray-300 transition-colors"
            onClick={() => setFullscreenImage(null)}
          >
            &times;
          </button>
        </div>
      )}
    </div>
  </div>
  )
};

export default MembersPage;