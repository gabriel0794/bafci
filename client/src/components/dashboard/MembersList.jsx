import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog } from '@headlessui/react';
import html2pdf from 'html2pdf.js';

// Print-specific styles to handle color compatibility
const printStyles = `
  @media print {
    * {
      color: #000 !important;
      background-color: #fff !important;
      box-shadow: none !important;
      text-shadow: none !important;
    }
    .bg-gray-50 { background-color: #f9fafb !important; }
    .bg-green-100 { background-color: #d1fae5 !important; }
    .bg-yellow-100 { background-color: #fef3c7 !important; }
    .bg-gray-100 { background-color: #f3f4f6 !important; }
    .text-green-800 { color: #065f46 !important; }
    .text-yellow-800 { color: #92400e !important; }
    .text-gray-800 { color: #1f2937 !important; }
  }
`;

export default function MembersList() {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    program: '',
    branch: '',
    endorsedBy: ''
  });
  const [loading, setLoading] = useState(true);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewMember, setViewMember] = useState(null);
  const navigate = useNavigate();

  // View member dialog handlers
  const handleViewOpen = (member) => {
    setViewMember(member);
    setViewOpen(true);
  };

  const handleViewClose = () => {
    setViewOpen(false);
    setViewMember(null);
  };

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const membersRes = await fetch('http://localhost:5000/api/members?limit=5', { // Limit to 5 most recent members
          headers: { 
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        });

        const membersData = await membersRes.json();

        setMembers(membersData);
        setFilteredMembers(membersData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter members based on search and filters
  useEffect(() => {
    let result = [...members];
    
    if (searchTerm) {
      const lowercasedFilter = searchTerm.toLowerCase();
      result = result.filter(member => 
        (member.full_name?.toLowerCase().includes(lowercasedFilter)) ||
        (member.program?.toLowerCase().includes(lowercasedFilter)) ||
        (member.branch?.toLowerCase().includes(lowercasedFilter))
      );
    }
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        result = result.filter(member => {
          if (key === 'endorsedBy') {
            return member.field_worker?.name?.toLowerCase() === value.toLowerCase();
          }
          return member[key]?.toLowerCase() === value.toLowerCase();
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
      program: '',
      branch: '',
      endorsedBy: ''
    });
    setSearchTerm('');
  };

  const handleMemberClick = (member) => {
    handleViewOpen(member);
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

  const formatDate = (dateString, format = 'short') => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      const options = {
        year: 'numeric',
        month: format === 'short' ? 'short' : 'long',
        day: 'numeric'
      };
      
      return date.toLocaleDateString('en-PH', options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  // Get unique values for filters
  const uniquePrograms = [...new Set(members.map(member => member.program))].filter(Boolean);
  const uniqueBranches = [...new Set(members.map(member => member.branch))].filter(Boolean);
  const uniqueEndorsedBy = [...new Set(members.map(member => member.field_worker?.name))].filter(Boolean);
  
  return (
    <div className="px-6 py-6">
      <style>{printStyles}</style>
      
      {/* View Member Dialog */}
      <Dialog 
        open={viewOpen} 
        onClose={handleViewClose}
        className="relative z-50 print:z-0"
      >
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" />
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6 print:shadow-none">
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
                              onClick={() => window.open(`http://localhost:5000/uploads/${viewMember.picture}`, '_blank')}
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
                            <div><span className="font-medium">Date of Birth:</span> {formatDate(viewMember.date_of_birth)}</div>
                            <div><span className="font-medium">Place of Birth:</span> {viewMember.place_of_birth || 'N/A'}</div>
                            <div><span className="font-medium">Sex:</span> {viewMember.sex || 'N/A'}</div>
                            <div><span className="font-medium">Civil Status:</span> {viewMember.civil_status || 'N/A'}</div>
                            <div><span className="font-medium">Spouse Name:</span> {viewMember.spouse_name || 'N/A'}</div>
                            <div><span className="font-medium">Spouse DOB:</span> {formatDate(viewMember.spouse_dob)}</div>
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
                          <div><span className="font-medium">Date of Birth:</span> {formatDate(viewMember.beneficiary_dob)}</div>
                          <div><span className="font-medium">Age:</span> {viewMember.beneficiary_age || 'N/A'}</div>
                          <div><span className="font-medium">Relationship:</span> {viewMember.beneficiary_relationship || 'N/A'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Membership Details */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Membership Details</h3>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div><span className="font-medium">Contribution Amount:</span> {viewMember.contribution_amount ? `${viewMember.contribution_amount} PHP` : 'N/A'}</div>
                          <div><span className="font-medium">Availment Period:</span> {viewMember.availment_period || 'N/A'}</div>
                          <div><span className="font-medium">Date Paid:</span> {formatDate(viewMember.date_paid)}</div>
                          <div><span className="font-medium">O.R. Number:</span> {viewMember.or_number || 'N/A'}</div>
                          <div><span className="font-medium">Received By:</span> {viewMember.received_by || 'N/A'}</div>
                          <div><span className="font-medium">Field Worker:</span> {viewMember.field_worker?.name || 'N/A'}</div>
                          <div><span className="font-medium">Last Contribution:</span> {viewMember.last_contribution_date ? formatDate(viewMember.last_contribution_date) : '--'}</div>
                          <div><span className="font-medium">Next Due Date:</span> {viewMember.next_due_date ? formatDate(viewMember.next_due_date) : '--'}</div>
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
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Members List</h2>
          <p className="text-sm text-gray-500 mt-1">Recent member activities</p>
        </div>
        <button
          onClick={() => navigate('/members')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          View All Members
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-24 py-2.5 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
            placeholder="Search by name, program, or branch"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {(searchTerm || Object.values(filters).some(Boolean)) && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-2">
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-gray-400 hover:text-gray-600 p-1"
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
                  className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                  title="Clear all filters"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Program Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Program</label>
            <select
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm py-2 px-3 border"
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
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Branch</label>
            <select
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm py-2 px-3 border"
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
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Endorsed By</label>
            <select
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm py-2 px-3 border"
              value={filters.endorsedBy}
              onChange={(e) => handleFilterChange('endorsedBy', e.target.value)}
            >
              <option value="">All Field Workers</option>
              {uniqueEndorsedBy.map((worker) => (
                <option key={worker} value={worker}>
                  {worker}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
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
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                  </div>
                </td>
              </tr>
            ) : filteredMembers.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                  No members found
                </td>
              </tr>
            ) : (
              filteredMembers.slice(0, 5).map((member) => (
                <tr 
                  key={member.id} 
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
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
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {member.full_name || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{member.contact_number || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(member.date_applied)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
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
                    {member.field_worker?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.branch || 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
