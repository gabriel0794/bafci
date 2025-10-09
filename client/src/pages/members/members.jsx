import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Button, TextField, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, MenuItem, Grid, FormControl, InputLabel, Select
} from '@mui/material';
import Navbar from '../../components/Navbar';

const MembersPage = () => {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    ageBracket: '',
    program: '',
    branch: '',
    endorsedBy: ''
  });
  const [branches, setBranches] = useState([]);
  const [fieldWorkers, setFieldWorkers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [viewOpen, setViewOpen] = useState(false);
  const [viewMember, setViewMember] = useState(null);
  
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
    fieldWorkerId: ''
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
      handleChange(e);
    }
  };

  // Program data
  const programData = {
    JACINTH: {
      name: 'JACINTH',
      ageBrackets: [
        { range: '18 - 25', amount: 55, availment: '3 mons & 1 day' },
        { range: '26 - 30', amount: 75, availment: '4 mons & 1 day' },
        { range: '31 - 35', amount: 97, availment: '5 mons & 1 day' },
        { range: '36 - 40', amount: 115, availment: '6 mons & 1 day' },
        { range: '41 - 45', amount: 120, availment: '7 mons & 1 day' },
        { range: '46 - 50', amount: 135, availment: '8 mons & 1 day' },
        { range: '51 - 55', amount: 145, availment: '9 mons & 1 day' },
        { range: '56 - 60', amount: 160, availment: '10 mons & 1 day' },
        { range: '61 - 65', amount: 185, availment: '12 mons & 1 day' },
        { range: '66 - 70', amount: 195, availment: '14 mons & 1 day' },
        { range: '71 - 75', amount: 210, availment: '16 mons & 1 day' },
        { range: '76 - 80', amount: 235, availment: '18 mons & 1 day' },
        { range: '81 - 85', amount: 260, availment: '24 mons & 1 day' },
        { range: '86 - 90', amount: 285, availment: '24 mons & 1 day' },
        { range: '91 - 95', amount: 350, availment: '24 mons & 1 day' },
        { range: '96 - 101 UP', amount: 395, availment: '24 mons & 1 day' }
      ]
    },
    CHALCEDONY: {
      name: 'CHALCEDONY',
      ageBrackets: [
        { range: '18 - 25', amount: 80, availment: '3 mons & 1 day' },
        { range: '26 - 30', amount: 105, availment: '4 mons & 1 day' },
        { range: '31 - 35', amount: 130, availment: '5 mons & 1 day' },
        { range: '36 - 40', amount: 145, availment: '6 mons & 1 day' },
        { range: '41 - 45', amount: 150, availment: '7 mons & 1 day' },
        { range: '46 - 50', amount: 165, availment: '8 mons & 1 day' },
        { range: '51 - 55', amount: 180, availment: '9 mons & 1 day' },
        { range: '56 - 60', amount: 195, availment: '10 mons & 1 day' },
        { range: '61 - 65', amount: 225, availment: '12 mons & 1 day' },
        { range: '66 - 70', amount: 240, availment: '14 mons & 1 day' },
        { range: '71 - 75', amount: 265, availment: '16 mons & 1 day' },
        { range: '76 - 80', amount: 290, availment: '18 mons & 1 day' },
        { range: '81 - 85', amount: 325, availment: '24 mons & 1 day' },
        { range: '86 - 90', amount: 360, availment: '24 mons & 1 day' },
        { range: '91 - 95', amount: 415, availment: '24 mons & 1 day' },
        { range: '96 - 101 UP', amount: 450, availment: '24 mons & 1 day' }
      ]
    }
  };

  const programOptions = ['JACINTH', 'CHALCEDONY'];

  // Get age brackets for the selected program
  const getAgeBrackets = () => {
    if (!currentMember.program || !programData[currentMember.program]) return [];
    return programData[currentMember.program].ageBrackets;
  };

  // Handle program change
  const handleProgramChange = (e) => {
    const program = e.target.value;
    const ageBrackets = programData[program] ? programData[program].ageBrackets : [];
    const defaultBracket = ageBrackets.length > 0 ? ageBrackets[0].range : '';
    const defaultAmount = ageBrackets.length > 0 ? ageBrackets[0].amount : '';
    const defaultAvailment = ageBrackets.length > 0 ? ageBrackets[0].availment : '';

    setCurrentMember(prev => ({
      ...prev,
      program,
      age_bracket: defaultBracket,
      contribution_amount: defaultAmount,
      availment_period: defaultAvailment
    }));
  };

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/branches', {
          headers: {
            'x-auth-token': token,
          },
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

    const fetchFieldWorkers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/field-workers', {
          headers: {
            'x-auth-token': token,
          },
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

    const fetchMembers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
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
        // Optionally show error to user
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
    fetchMembers();
    fetchFieldWorkers();
  }, []);

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
            return age >= bracket.minAge && age <= bracket.maxAge;
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
    
    setFilteredMembers(result);
  }, [searchTerm, members, filters]);
  
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
    setSearchTerm('');
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
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
          console.error('Response headers:', error.response.headers);
          alert(`Error ${error.response.status}: ${error.response.data.message || 'Failed to fetch members'}`);
        } else if (error.request) {
          // The request was made but no response was received
          console.error('No response received:', error.request);
          alert('No response from server. Please check your connection and try again.');
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Error setting up request:', error.message);
          alert(`Error: ${error.message}`);
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
      branch: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentMember(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Format dates to YYYY-MM-DD format for the API
      const formattedMember = {
        ...currentMember,
        date_applied: currentMember.date_applied || new Date().toISOString().split('T')[0],
        date_of_birth: currentMember.date_of_birth || null,
        spouse_dob: currentMember.spouse_dob || null,
        beneficiary_dob: currentMember.beneficiary_dob || null,
        date_paid: currentMember.date_paid || null,
        age: currentMember.age ? parseInt(currentMember.age) : null,
        beneficiary_age: currentMember.beneficiary_age ? parseInt(currentMember.beneficiary_age) : null,
        contribution_amount: currentMember.contribution_amount ? parseFloat(currentMember.contribution_amount) : null
      };
      
      const response = await fetch('http://localhost:5000/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(formattedMember)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save member');
      }
      
      const savedMember = await response.json();
      
      // Update the UI with the saved member (including the server-generated fields)
      if (editing) {
        setMembers(members.map(m => 
          m.id === savedMember.id ? savedMember : m
        ));
      } else {
        setMembers([savedMember, ...members]);
      }
      
      // Show success message
      alert(`Member ${editing ? 'updated' : 'added'} successfully!`);
      handleClose();
      
    } catch (error) {
      console.error('Error saving member:', error);
      alert(error.message || 'Failed to save member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (member) => {
    // Merge the fetched member data with the initial state to ensure all fields are defined
    setCurrentMember({ ...initialMemberState, ...member });
    setEditing(true);
    setOpen(true);
  };

  const handleDelete = (applicationNumber) => {
    // TODO: Add confirmation dialog
    setMembers(members.filter(m => m.applicationNumber !== applicationNumber));
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
    setPaymentMember(member);
    setPaymentOpen(true);
    setPaymentLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await axios.get(`http://localhost:5000/api/members/${member.id}/payments`, {
        headers: { 
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });
      
      setPaymentHistory(response.data);
      
      // Set default amount from member's contribution amount
      setNewPayment(prev => ({
        ...prev,
        amount: member.contribution_amount || ''
      }));
    } catch (error) {
      console.error('Error fetching payment history:', error);
      
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        alert(`Error ${error.response.status}: ${error.response.data.message || 'Failed to fetch payment history'}`);
      } else if (error.request) {
        console.error('No response received:', error.request);
        alert('No response from server. Please check your connection and try again.');
      } else {
        console.error('Error setting up request:', error.message);
        alert(`Error: ${error.message}`);
      }
      
      // Close the dialog on error
      setPaymentOpen(false);
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
    setNewPayment(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentMember) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
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
      
      await axios.post('http://localhost:5000/api/payments', paymentData, {
        headers: { 
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });
      
      // Show success message
      alert('Payment recorded successfully!');
      
      // Refresh payment history
      await handlePaymentOpen(paymentMember);
      
      // Reset form but keep the amount for next payment
      setNewPayment({
        amount: paymentMember.contribution_amount || '',
        payment_date: new Date().toISOString().split('T')[0],
        reference_number: '',
        notes: ''
      });
      
    } catch (error) {
      console.error('Error recording payment:', error);
      
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        alert(`Error ${error.response.status}: ${error.response.data.message || 'Failed to record payment'}`);
      } else if (error.request) {
        console.error('No response received:', error.request);
        alert('No response from server. Please check your connection and try again.');
      } else {
        console.error('Error setting up request:', error.message);
        alert(`Error: ${error.message}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar activePage="members" />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  // Unique values for filters
  const uniquePrograms = [...new Set(members.map(member => member.program))].filter(Boolean);
  const uniqueBranches = [...new Set(members.map(member => member.branch))].filter(Boolean);
  const uniqueEndorsedBy = [...new Set(members.map(member => member.endorsed_by))].filter(Boolean);
  const ageBrackets = getAgeBrackets().map(bracket => bracket.range);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar activePage="members" />
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Members Management</h1>
            <p className="mt-1 text-sm text-gray-500">Add and manage members</p>
          </div>
          
          <div className="grid grid-cols-1 gap-8">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Members List</h2>
                  <button
                    onClick={handleOpen}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    + Add Member
                  </button>
                </div>
              </div>
              <div className="p-6">
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
                    {(searchTerm || Object.values(filters).some(Boolean)) && (
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
                        {Object.values(filters).some(Boolean) && (
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
                            Last Contribution Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Next Due Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                          <tr>
                            <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                              Loading members...
                            </td>
                          </tr>
                        ) : filteredMembers.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                              {searchTerm || Object.values(filters).some(Boolean) 
                                ? 'No members match your search criteria. Try different filters.' 
                                : 'No members found. Click "Add Member" to create one.'}
                            </td>
                          </tr>
                        ) : (
                          filteredMembers.map((member) => (
                            <tr 
                              key={member.id} 
                              className="group hover:bg-gray-50 w-full cursor-pointer transition-colors"
                              onClick={() => handleMemberClick(member)}
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 group-hover:bg-gray-50">
                                {member.full_name || 'N/A'}
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
                                {member.last_contribution_date ? new Date(member.last_contribution_date).toLocaleDateString() : '--'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {member.next_due_date ? new Date(member.next_due_date).toLocaleDateString() : '--'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
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
                    <form onSubmit={handleSubmit}>
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
                                  onChange={handleChange}
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
                              <FormControl fullWidth size="small" required>
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
                                    <em>Select Program...</em>
                                  </MenuItem>
                                  {programOptions.map((option) => (
                                    <MenuItem key={option} value={option}>
                                      {option}
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
                                  {getAgeBrackets().map((bracket, index) => (
                                    <MenuItem key={index} value={bracket.range}>
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
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
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
                    {viewMember?.picture && (
                      <img
                        className="h-16 w-16 object-cover rounded-full border-2 border-gray-300"
                        src={viewMember.picture}
                        alt="Member"
                      />
                    )}
                    <button
                      onClick={() => handlePaymentOpen(viewMember)}
                      className="hidden sm:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 print:hidden"
                    >
                      Payment
                    </button>
                    <button
                      onClick={window.print}
                      className="hidden sm:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 print:hidden"
                    >
                      Print / Save as PDF
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
                              className="h-32 w-32 rounded-full border-2 border-gray-300 object-cover"
                              src={viewMember.picture}
                              alt={viewMember.full_name || 'Member'}
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
                          <div><span className="font-medium">Last Contribution:</span> {viewMember.last_contribution_date ? new Date(viewMember.last_contribution_date).toLocaleDateString() : '--'}</div>
                          <div><span className="font-medium">Next Due Date:</span> {viewMember.next_due_date ? new Date(viewMember.next_due_date).toLocaleDateString() : '--'}</div>
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
    </div>
  );
};

export default MembersPage;