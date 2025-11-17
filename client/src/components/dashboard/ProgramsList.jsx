import { useState, useEffect } from 'react';
import { Category, Error as ErrorIcon, Close } from '@mui/icons-material';
import { Dialog } from '@headlessui/react';

export default function ProgramsList() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [benefitsDialogOpen, setBenefitsDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [branches, setBranches] = useState([]);
  // Standard age bracket template - same for all programs
  const standardAgeBrackets = [
    { range: '18 - 25', minAge: 18, maxAge: 25, availment: '3 mons & 1 day' },
    { range: '26 - 30', minAge: 26, maxAge: 30, availment: '4 mons & 1 day' },
    { range: '31 - 35', minAge: 31, maxAge: 35, availment: '5 mons & 1 day' },
    { range: '36 - 40', minAge: 36, maxAge: 40, availment: '6 mons & 1 day' },
    { range: '41 - 45', minAge: 41, maxAge: 45, availment: '7 mons & 1 day' },
    { range: '46 - 50', minAge: 46, maxAge: 50, availment: '8 mons & 1 day' },
    { range: '51 - 55', minAge: 51, maxAge: 55, availment: '9 mons & 1 day' },
    { range: '56 - 60', minAge: 56, maxAge: 60, availment: '10 mons & 1 day' },
    { range: '61 - 65', minAge: 61, maxAge: 65, availment: '12 mons & 1 day' },
    { range: '66 - 70', minAge: 66, maxAge: 70, availment: '14 mons & 1 day' },
    { range: '71 - 75', minAge: 71, maxAge: 75, availment: '16 mons & 1 day' },
    { range: '76 - 80', minAge: 76, maxAge: 80, availment: '18 mons & 1 day' },
    { range: '81 - 85', minAge: 81, maxAge: 85, availment: '24 mons & 1 day' },
    { range: '86 - 90', minAge: 86, maxAge: 90, availment: '24 mons & 1 day' },
    { range: '91 - 95', minAge: 91, maxAge: 95, availment: '24 mons & 1 day' },
    { range: '96 - 101 UP', minAge: 96, maxAge: null, availment: '24 mons & 1 day' }
  ];

  const [formData, setFormData] = useState({
    name: '',
    benefits: '',
    branch_id: '',
    ageBrackets: standardAgeBrackets.map(bracket => ({
      ageRange: bracket.range,
      minAge: bracket.minAge,
      maxAge: bracket.maxAge,
      contributionAmount: '',
      availmentPeriod: bracket.availment
    }))
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPrograms();
    fetchBranches();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/programs', {
        headers: { 
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch programs');
      }

      const data = await response.json();
      setPrograms(data);
    } catch (err) {
      console.error('Error fetching programs:', err);
      setError('Failed to load programs');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/branches', {
        headers: { 
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBranches(data);
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  const handleAddProgram = () => {
    setFormData({ 
      name: '', 
      benefits: '',
      branch_id: '',
      ageBrackets: standardAgeBrackets.map(bracket => ({
        ageRange: bracket.range,
        minAge: bracket.minAge,
        maxAge: bracket.maxAge,
        contributionAmount: '',
        availmentPeriod: bracket.availment
      }))
    });
    setAddDialogOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProgramClick = (program) => {
    setSelectedProgram(program);
    setBenefitsDialogOpen(true);
  };

  const handleCloseBenefitsDialog = () => {
    setBenefitsDialogOpen(false);
    setSelectedProgram(null);
  };

  const handleAgeBracketChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      ageBrackets: prev.ageBrackets.map((bracket, i) => 
        i === index ? { ...bracket, contributionAmount: value } : bracket
      )
    }));
  };

  const handleSubmitProgram = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.branch_id) {
      alert('Please fill in all fields');
      return;
    }

    // Validate age brackets - only check contribution amounts
    const hasInvalidBracket = formData.ageBrackets.some(bracket => 
      !bracket.contributionAmount || isNaN(parseFloat(bracket.contributionAmount)) || parseFloat(bracket.contributionAmount) <= 0
    );

    if (hasInvalidBracket) {
      alert('Please enter valid contribution amounts for all age brackets');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      // Prepare age brackets data
      const ageBrackets = formData.ageBrackets.map(bracket => ({
        ageRange: bracket.ageRange,
        minAge: parseInt(bracket.minAge),
        maxAge: bracket.maxAge ? parseInt(bracket.maxAge) : null,
        contributionAmount: parseFloat(bracket.contributionAmount),
        availmentPeriod: bracket.availmentPeriod
      }));
      
      const response = await fetch('http://localhost:5000/api/programs', {
        method: 'POST',
        headers: { 
          'x-auth-token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          benefits: formData.benefits,
          branchId: parseInt(formData.branch_id),
          ageBrackets: ageBrackets
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create program');
      }

      await fetchPrograms();
      setAddDialogOpen(false);
      setFormData({ 
        name: '', 
        benefits: '',
        branch_id: '',
        ageBrackets: standardAgeBrackets.map(bracket => ({
          ageRange: bracket.range,
          minAge: bracket.minAge,
          maxAge: bracket.maxAge,
          contributionAmount: '',
          availmentPeriod: bracket.availment
        }))
      });
    } catch (err) {
      console.error('Error creating program:', err);
      alert(err.message || 'Failed to create program');
    } finally {
      setSubmitting(false);
    }
  };

  const getBranchName = (program) => {
    if (!program) return 'Unassigned';
    if (program.branch?.name) return program.branch.name;
    if (program.branchName) return program.branchName;
    if (program.branchId) return `Branch ${program.branchId}`;
    return 'Unassigned';
  };

  const getAgeBracketCount = (program) => {
    return program.ageBrackets?.length || 0;
  };

  const getTotalAgeBrackets = () => {
    return programs.reduce((sum, program) => sum + getAgeBracketCount(program), 0);
  };

  const programsByBranch = programs.reduce((acc, program) => {
    const rawBranchName = getBranchName(program) || 'Unassigned';
    const branchName = rawBranchName.trim() || 'Unassigned';

    if (!acc[branchName]) {
      acc[branchName] = [];
    }

    acc[branchName].push(program);
    return acc;
  }, {});

  const sortedProgramsByBranch = Object.keys(programsByBranch)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    .map((branch) => ({
      branch,
      programs: programsByBranch[branch]
        .slice()
        .sort((a, b) =>
          (a.name ?? '').localeCompare(b.name ?? '', undefined, {
            sensitivity: 'base',
          })
        ),
    }));

  if (loading) {
    return (
      <div className="h-full max-h-[90vh] flex flex-col">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Programs</h2>
          <p className="mt-1 text-sm text-gray-600">Available programs and age brackets</p>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
            <p className="text-sm text-gray-500">Loading programs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Programs</h2>
          <p className="mt-1 text-sm text-gray-600">Available programs</p>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3 text-red-600">
            <ErrorIcon sx={{ fontSize: 40 }} />
            <p className="text-sm">{error}</p>
            <button
              onClick={fetchPrograms}
              className="mt-2 px-4 py-2 text-sm bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Programs</h2>
            <p className="mt-1 text-xs text-gray-600">Available programs</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddProgram}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm font-medium"
              title="Add Program"
            >
              <span className="text-xl leading-none cursor-pointer">+</span>
            </button>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 rounded-lg">
              <Category className="h-4 w-4 text-blue-600" />
              <div className="text-right">
                <p className="text-[11px] text-gray-600">Total Programs</p>
                <p className="text-base font-semibold text-blue-600">{programs.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Programs List */}
      <div className="flex-1 overflow-y-auto">
        {programs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-gray-500">
            <Category sx={{ fontSize: 40 }} className="mb-2 opacity-50" />
            <p className="text-xs">No programs found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedProgramsByBranch.map(({ branch, programs: branchPrograms }) => (
              <div key={branch}>
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                  <span className="text-xs font-semibold text-gray-700">
                    {branch}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {branchPrograms.length}{' '}
                    {branchPrograms.length === 1 ? 'Program' : 'Programs'}
                  </span>
                </div>
                <div className="divide-y divide-gray-200">
                  {branchPrograms.map((program) => {
                    const ageBracketCount = getAgeBracketCount(program);
                    const programName = program.name || 'Untitled Program';

                    return (
                      <div
                        key={program.id ?? program._id ?? programName}
                        onClick={() => handleProgramClick(program)}
                        className="p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate flex-1">
                            {programName}
                          </h3>
                          <span className="text-xs text-gray-500">
                            Click to view benefits
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Benefits Dialog */}
      <Dialog open={benefitsDialogOpen} onClose={handleCloseBenefitsDialog} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-lg w-full bg-white rounded-xl shadow-xl">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                {selectedProgram?.name || 'Program'} - Benefits
              </Dialog.Title>
              <button
                onClick={handleCloseBenefitsDialog}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Close sx={{ fontSize: 24 }} />
              </button>
            </div>

            {/* Benefits Content */}
            <div className="p-6">
              {selectedProgram?.benefits ? (
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedProgram.benefits}</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Category sx={{ fontSize: 48 }} className="mb-3 opacity-50" />
                  <p className="text-sm">No benefits information available for this program.</p>
                </div>
              )}
            </div>

            {/* Dialog Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleCloseBenefitsDialog}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Add Program Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-xl shadow-xl">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                Add New Program
              </Dialog.Title>
              <button
                onClick={() => setAddDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Close sx={{ fontSize: 24 }} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitProgram} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Program Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter program name"
                  required
                />
              </div>

              <div>
                <label htmlFor="benefits" className="block text-sm font-medium text-gray-700 mb-1">
                  Benefits
                </label>
                <textarea
                  id="benefits"
                  name="benefits"
                  value={formData.benefits}
                  onChange={handleFormChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Enter program benefits (optional)"
                />
              </div>

              <div>
                <label htmlFor="branch_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Branch *
                </label>
                <select
                  id="branch_id"
                  name="branch_id"
                  value={formData.branch_id}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a branch</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Age Brackets Section */}
              <div className="border-t pt-4">
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age Brackets (Standard Template)
                  </label>
                  <p className="text-xs text-gray-500">
                    Enter the contribution amount for each age bracket. All other fields are pre-filled.
                  </p>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {formData.ageBrackets.map((bracket, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-3 gap-3 items-center">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Age Range
                          </label>
                          <input
                            type="text"
                            value={bracket.ageRange}
                            readOnly
                            className="w-full px-2 py-1.5 text-sm bg-gray-100 border border-gray-200 rounded text-gray-700 cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Availment Period
                          </label>
                          <input
                            type="text"
                            value={bracket.availmentPeriod}
                            readOnly
                            className="w-full px-2 py-1.5 text-sm bg-gray-100 border border-gray-200 rounded text-gray-700 cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Contribution Amount *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={bracket.contributionAmount}
                            onChange={(e) => handleAgeBracketChange(index, e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0.00"
                            min="0"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setAddDialogOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting ? 'Adding...' : 'Add Program'}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
