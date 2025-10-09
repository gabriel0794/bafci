import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MembersList() {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    program: '',
    branch: '',
    endorsedBy: ''
  });
  const [branches, setBranches] = useState([]);
  const [fieldWorkers, setFieldWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const [branchesRes, fieldWorkersRes, membersRes] = await Promise.all([
          fetch('http://localhost:5000/api/branches', {
            headers: { 'x-auth-token': token }
          }),
          fetch('http://localhost:5000/api/field-workers', {
            headers: { 'x-auth-token': token }
          }),
          fetch('http://localhost:5000/api/members?limit=5', { // Limit to 5 most recent members
            headers: { 
              'x-auth-token': token,
              'Content-Type': 'application/json'
            }
          })
        ]);

        const [branchesData, fieldWorkersData, membersData] = await Promise.all([
          branchesRes.json(),
          fieldWorkersRes.json(),
          membersRes.json()
        ]);

        setBranches(branchesData);
        setFieldWorkers(fieldWorkersData);
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
    navigate(`/members/${member.id}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get unique values for filters
  const uniquePrograms = [...new Set(members.map(member => member.program))].filter(Boolean);
  const uniqueBranches = [...new Set(members.map(member => member.branch))].filter(Boolean);
  const uniqueEndorsedBy = [...new Set(members.map(member => member.field_worker?.name))].filter(Boolean);
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Members List</h2>
          <p className="text-sm text-gray-500 mt-1">Recent member activities</p>
        </div>
        <button
          onClick={() => navigate('/members')}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          View All Members
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-4 space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
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
                  className="text-xs text-gray-500 hover:text-gray-700"
                  title="Clear all filters"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Program Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Program</label>
            <select
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border text-sm"
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
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border text-sm"
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
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border text-sm"
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
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Contribution
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Next Due
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
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                        {member.full_name?.charAt(0) || '?'}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.last_contribution ? `₱${Number(member.last_contribution).toLocaleString()}` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      member.status === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {member.next_due_date ? formatDate(member.next_due_date) : 'N/A'}
                    </span>
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
