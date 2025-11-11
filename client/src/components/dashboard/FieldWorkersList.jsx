import { useState, useEffect } from 'react';
import { People, TrendingUp, Error, Close } from '@mui/icons-material';
import { Dialog } from '@headlessui/react';

export default function FieldWorkersList() {
  const [fieldWorkers, setFieldWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [workerMembers, setWorkerMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchFieldWorkers();
  }, []);

  const fetchFieldWorkers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/field-workers', {
        headers: { 
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch field workers');
      }

      const data = await response.json();
      setFieldWorkers(data);
    } catch (err) {
      console.error('Error fetching field workers:', err);
      setError('Failed to load field workers');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkerMembers = async (workerId) => {
    try {
      setLoadingMembers(true);
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

      const allMembers = await response.json();
      // Filter members by field worker ID
      const filteredMembers = allMembers.filter(member => member.field_worker_id === workerId);
      setWorkerMembers(filteredMembers);
    } catch (err) {
      console.error('Error fetching worker members:', err);
      setWorkerMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleWorkerClick = async (worker) => {
    setSelectedWorker(worker);
    setDialogOpen(true);
    await fetchWorkerMembers(worker.id);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedWorker(null);
    setWorkerMembers([]);
  };

  const getTotalMembers = () => {
    return fieldWorkers.reduce((sum, worker) => sum + (worker.memberCount || 0), 0);
  };

  const getPercentage = (count) => {
    const total = getTotalMembers();
    return total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
  };

  const getBranchName = (worker) => {
    if (!worker) return 'Unassigned';
    if (worker.branch?.name) return worker.branch.name;
    if (worker.branchName) return worker.branchName;
    if (worker.branchId) return `Branch ${worker.branchId}`;
    return 'Unassigned';
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Field Workers</h2>
          <p className="mt-1 text-sm text-gray-600">Active field workers and their performance</p>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
            <p className="text-sm text-gray-500">Loading field workers...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Field Workers</h2>
          <p className="mt-1 text-sm text-gray-600">Active field workers and their performance</p>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3 text-red-600">
            <Error sx={{ fontSize: 40 }} />
            <p className="text-sm">{error}</p>
            <button
              onClick={fetchFieldWorkers}
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
    <div className="h-full max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200 bg-green-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Field Workers</h2>
            <p className="mt-1 text-xs text-white">Active field workers and their performance</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white shadow-lg rounded-lg">
            <People className="h-4 w-4 text-black" />
            <div className="text-right">
              <p className="text-[11px] text-black">Total Workers</p>
              <p className="text-base font-semibold text-black">{fieldWorkers.length}</p>
            </div>
          </div>
        </div>
      </div>


      {/* Field Workers List */}
      <div className="flex-1 overflow-y-auto">
        {fieldWorkers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-gray-500">
            <People sx={{ fontSize: 40 }} className="mb-2 opacity-50" />
            <p className="text-xs">No field workers found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {fieldWorkers.map((worker, index) => (
              <div
                key={worker.id}
                onClick={() => handleWorkerClick(worker)}
                className="p-3 sm:p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Worker Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {worker.name}
                        </p>
                        {index === 0 && worker.memberCount > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-yellow-100 text-yellow-800">
                            Top Performer
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Age: {worker.age} • Branch: {getBranchName(worker)}
                      </p>
                    </div>
                  </div>

                  {/* Member Count Badge */}
                  <div className="flex-shrink-0 ml-4">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 rounded-lg">
                        <People sx={{ fontSize: 14 }} className="text-green-700" />
                        <span className="text-base font-bold text-green-700">
                          {worker.memberCount || 0}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">members</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Worker Details Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-xl max-h-[80vh] flex flex-col">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                {selectedWorker && (
                  <>
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold">
                      {selectedWorker.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-gray-900">
                        {selectedWorker.name}
                      </Dialog.Title>
                      <p className="text-sm text-gray-500">
                        Age: {selectedWorker.age} • Branch: {getBranchName(selectedWorker)}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={handleCloseDialog}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Close sx={{ fontSize: 24 }} />
              </button>
            </div>


            {/* Members List */}
            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Members List ({workerMembers.length})
              </h3>
              
              {loadingMembers ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <p className="text-sm text-gray-500">Loading members...</p>
                  </div>
                </div>
              ) : workerMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <People sx={{ fontSize: 48 }} className="mb-3 opacity-50" />
                  <p className="text-sm">No members found for this field worker</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {workerMembers.map((member, index) => (
                    <div
                      key={member.id || index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate ml-2">
                            {member.full_name || 'Unknown Member'}
                          </p>
                          {member.program && (
                            <p className="text-xs text-gray-500 truncate ml-2">
                              {member.program}
                            </p>
                          )}
                        </div>
                      </div>
                      {member.date_applied && (
                        <div className="flex-shrink-0 ml-3">
                          <p className="text-xs text-gray-500">
                            {new Date(member.date_applied).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dialog Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleCloseDialog}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
