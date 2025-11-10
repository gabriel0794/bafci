import { useState, useEffect } from 'react';
import { Category, TrendingUp, Error } from '@mui/icons-material';

export default function ProgramsList() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPrograms();
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

  if (loading) {
    return (
      <div className="h-full flex flex-col">
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
            <Error sx={{ fontSize: 40 }} />
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
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 rounded-lg">
            <Category className="h-4 w-4 text-blue-600" />
            <div className="text-right">
              <p className="text-[11px] text-gray-600">Total Programs</p>
              <p className="text-base font-semibold text-blue-600">{programs.length}</p>
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
            {programs.map((program, index) => (
              <div
                key={program.id}
                className="p-3 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-gray-900 truncate flex-1">
                    {program.name}
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {getBranchName(program)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
