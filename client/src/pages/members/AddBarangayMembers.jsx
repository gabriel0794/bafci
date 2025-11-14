import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import Navbar from '../../components/Navbar';

const AddBarangayMembers = () => {
  const [region, setRegion] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [barangay, setBarangay] = useState('');
  const [memberCount, setMemberCount] = useState('');
  const [regionName, setRegionName] = useState('');
  const [provinceName, setProvinceName] = useState('');
  const [cityName, setCityName] = useState('');
  const [barangayName, setBarangayName] = useState('');
  
  // Data states
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [barangayMembers, setBarangayMembers] = useState([]);
  
  // Loading states
  const [loadingRegions, setLoadingRegions] = useState(true);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingBarangays, setLoadingBarangays] = useState(false);
  const [loadingBarangayMembers, setLoadingBarangayMembers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [adjustingRowId, setAdjustingRowId] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // 3x3 grid

  const [alertState, setAlertState] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const showAlert = useCallback((message, severity = 'success') => {
    setAlertState({ open: true, message, severity });
  }, []);

  const handleAlertClose = (_, reason) => {
    if (reason === 'clickaway') return;
    setAlertState(prev => ({ ...prev, open: false }));
  };

  // Fetch regions on component mount
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        setLoadingRegions(true);
        const response = await fetch('https://psgc.gitlab.io/api/regions/');
        const data = await response.json();
        setRegions(data);
      } catch (error) {
        console.error('Error fetching regions:', error);
      } finally {
        setLoadingRegions(false);
      }
    };
    fetchRegions();
  }, []);

  // Fetch provinces when region changes
  useEffect(() => {
    if (!region) {
      setProvinces([]);
      setProvince('');
      setProvinceName('');
      setCity('');
      setCityName('');
      setBarangay('');
      setBarangayName('');
      return;
    }
    
    const fetchProvinces = async () => {
      try {
        setLoadingProvinces(true);
        const response = await fetch(`https://psgc.gitlab.io/api/regions/${region}/provinces/`);
        const data = await response.json();
        setProvinces(data);
      } catch (error) {
        console.error('Error fetching provinces:', error);
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, [region]);

  // Fetch cities/municipalities when province changes
  useEffect(() => {
    if (!province) {
      setCities([]);
      setCity('');
      setCityName('');
      setBarangay('');
      setBarangayName('');
      return;
    }
    
    const fetchCities = async () => {
      try {
        setLoadingCities(true);
        const response = await fetch(`https://psgc.gitlab.io/api/provinces/${province}/cities-municipalities/`);
        const data = await response.json();
        setCities(data);
      } catch (error) {
        console.error('Error fetching cities:', error);
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, [province]);

  // Fetch barangays when city changes
  useEffect(() => {
    if (!city) {
      setBarangays([]);
      setBarangay('');
      setBarangayName('');
      return;
    }
    
    const fetchBarangays = async () => {
      try {
        setLoadingBarangays(true);
        const response = await fetch(`https://psgc.gitlab.io/api/cities-municipalities/${city}/barangays/`);
        const data = await response.json();
        setBarangays(data);
      } catch (error) {
        console.error('Error fetching barangays:', error);
      } finally {
        setLoadingBarangays(false);
      }
    };
    fetchBarangays();
  }, [city]);

  const fetchBarangayMembers = useCallback(async () => {
    try {
      setLoadingBarangayMembers(true);
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const response = await fetch('http://localhost:5000/api/barangay-members', {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to load barangay members');
      }

      const data = await response.json();
      setBarangayMembers(data);
    } catch (error) {
      console.error('Error loading barangay members:', error);
      showAlert(error.message || 'Failed to load barangay members', 'error');
    } finally {
      setLoadingBarangayMembers(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchBarangayMembers();
  }, [fetchBarangayMembers]);

  const sendAdjustRequest = async (payload) => {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }

    const response = await fetch('http://localhost:5000/api/barangay-members/adjust', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update barangay member count');
    }

    return response.json();
  };

  const handleAdjustMembers = async (mode) => {
    if (!region || !province || !city || !barangay) {
      showAlert('Please complete the location selection before submitting.', 'warning');
      return;
    }

    if (!regionName || !provinceName || !cityName || !barangayName) {
      showAlert('Location details are incomplete. Please re-select the location.', 'warning');
      return;
    }

    const parsedCount = parseInt(memberCount, 10);

    if (Number.isNaN(parsedCount) || parsedCount <= 0) {
      showAlert('Please enter a positive number of members.', 'warning');
      return;
    }

    const delta = mode === 'reduce' ? -Math.abs(parsedCount) : Math.abs(parsedCount);

    const payload = {
      regionCode: region,
      regionName,
      provinceCode: province,
      provinceName,
      cityCode: city,
      cityName,
      barangayCode: barangay,
      barangayName,
      delta
    };

    try {
      setSubmitting(true);
      await sendAdjustRequest(payload);
      const actionWord = delta > 0 ? 'added' : 'reduced';
      showAlert(`Successfully ${actionWord} member(s) for ${barangayName}.`, 'success');
      setMemberCount('');
      await fetchBarangayMembers();
    } catch (error) {
      console.error('Error adjusting barangay members:', error);
      showAlert(error.message || 'Failed to update barangay members.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAdjust = async (entry, delta) => {
    try {
      setAdjustingRowId(entry.id);
      await sendAdjustRequest({
        regionCode: entry.regionCode,
        regionName: entry.regionName,
        provinceCode: entry.provinceCode,
        provinceName: entry.provinceName,
        cityCode: entry.cityCode,
        cityName: entry.cityName,
        barangayCode: entry.barangayCode,
        barangayName: entry.barangayName,
        delta
      });

      const actionWord = delta > 0 ? 'added' : 'reduced';
      showAlert(`Successfully ${actionWord} ${Math.abs(delta)} member(s) for ${entry.barangayName}.`, 'success');
      await fetchBarangayMembers();
    } catch (error) {
      console.error('Error adjusting barangay member count:', error);
      showAlert(error.message || 'Failed to adjust barangay member count.', 'error');
    } finally {
      setAdjustingRowId(null);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleAdjustMembers('add');
  };

  // Pagination logic
  const totalPages = Math.ceil(barangayMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageMembers = barangayMembers.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset to page 1 when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [barangayMembers.length]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar activePage="add-barangay-members" />
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={4} pt={4} px={{ xs: 1, md: 6 }}>
        {/* Input Form Side */}
        <Box flex={{ xs: 'unset', md: '0 0 320px' }} minWidth={0}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <h1 className='text-2xl font-bold text-gray-900'>Add Members to Barangay</h1>
            <form onSubmit={handleFormSubmit}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Region</InputLabel>
                <Select
                  value={region}
                  label="Region"
                  onChange={e => {
                    const selectedCode = e.target.value;
                    setRegion(selectedCode);
                    const selectedRegion = regions.find(r => r.code === selectedCode);
                    setRegionName(selectedRegion?.name || '');
                    setProvince('');
                    setProvinceName('');
                    setCity('');
                    setCityName('');
                    setBarangay('');
                    setBarangayName('');
                  }}
                  required
                  disabled={loadingRegions}
                >
                  {loadingRegions ? (
                    <MenuItem disabled>Loading regions...</MenuItem>
                  ) : (
                    regions.map(r => (
                      <MenuItem key={r.code} value={r.code}>{r.name}</MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal" disabled={!region || loadingProvinces}>
                <InputLabel>Province</InputLabel>
                <Select
                  value={province}
                  label="Province"
                  onChange={e => {
                    const selectedCode = e.target.value;
                    setProvince(selectedCode);
                    const selectedProvince = provinces.find(p => p.code === selectedCode);
                    setProvinceName(selectedProvince?.name || '');
                    setCity('');
                    setCityName('');
                    setBarangay('');
                    setBarangayName('');
                  }}
                  required
                >
                  {loadingProvinces ? (
                    <MenuItem disabled>Loading provinces...</MenuItem>
                  ) : (
                    provinces.map(p => (
                      <MenuItem key={p.code} value={p.code}>{p.name}</MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal" disabled={!province || loadingCities}>
                <InputLabel>City/Municipality</InputLabel>
                <Select
                  value={city}
                  label="City/Municipality"
                  onChange={e => {
                    const selectedCode = e.target.value;
                    setCity(selectedCode);
                    const selectedCity = cities.find(c => c.code === selectedCode);
                    setCityName(selectedCity?.name || '');
                    setBarangay('');
                    setBarangayName('');
                  }}
                  required
                >
                  {loadingCities ? (
                    <MenuItem disabled>Loading cities/municipalities...</MenuItem>
                  ) : (
                    cities.map(c => (
                      <MenuItem key={c.code} value={c.code}>{c.name}</MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal" disabled={!city || loadingBarangays}>
                <InputLabel>Barangay</InputLabel>
                <Select
                  value={barangay}
                  label="Barangay"
                  onChange={e => {
                    const selectedCode = e.target.value;
                    setBarangay(selectedCode);
                    const selectedBarangay = barangays.find(b => b.code === selectedCode);
                    setBarangayName(selectedBarangay?.name || '');
                  }}
                  required
                >
                  {loadingBarangays ? (
                    <MenuItem disabled>Loading barangays...</MenuItem>
                  ) : (
                    barangays.map(b => (
                      <MenuItem key={b.code} value={b.code}>{b.name}</MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Number of Members"
                type="number"
                value={memberCount}
                onChange={e => setMemberCount(e.target.value)}
                margin="normal"
                inputProps={{ min: 1 }}
                required
                disabled={submitting}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mt={2}>
                <Button
                  type="submit"
                  variant="contained"
                  color="success"
                  fullWidth
                  disabled={submitting}
                >
                  Add Members
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  color="error"
                  fullWidth
                  disabled={submitting}
                  onClick={() => handleAdjustMembers('reduce')}
                >
                  Reduce Members
                </Button>
              </Stack>
              {submitting && (
                <Box mt={2} display="flex" justifyContent="center">
                  <CircularProgress size={24} />
                </Box>
              )}
            </form>
          </Paper>
        </Box>
        {/* Barangay List Side */}
        <Box flex={1}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={2} gap={1.5}>
            <Typography variant="h6" fontWeight={600}>Barangay Member List</Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={fetchBarangayMembers}
              disabled={loadingBarangayMembers}
            >
              Refresh
            </Button>
          </Stack>
          {loadingBarangayMembers ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={6}>
              <CircularProgress />
            </Box>
          ) : barangayMembers.length === 0 ? (
            <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No barangay member records yet. Use the form to add members.
              </Typography>
            </Paper>
          ) : (
            <>
            <Box display="flex" flexWrap="wrap" gap={2}>
              {currentPageMembers.map(entry => (
                <Paper
                  key={entry.id}
                  elevation={3}
                  sx={{
                    p: 2,
                    width: { xs: '100%', sm: 'calc(50% - 8px)', lg: 'calc(33.333% - 11px)' },
                    maxWidth: { xs: '100%', sm: 'calc(50% - 8px)', lg: 'calc(33.333% - 11px)' },
                    minWidth: 0,
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6
                    }
                  }}
                >
                  {/* Status Badge */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      bgcolor: entry.isActive ? 'success.main' : 'grey.400',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    {entry.isActive ? 'Active' : 'Inactive'}
                  </Box>

                  {/* Location Info */}
                  <Box mb={1.5} pr={6}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#15803d', fontSize: '1.1rem' }} gutterBottom>
                      {entry.barangayName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.3 }}>
                      <strong>City:</strong> {entry.cityName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.3 }}>
                      <strong>Province:</strong> {entry.provinceName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      <strong>Region:</strong> {entry.regionName}
                    </Typography>
                  </Box>

                  {/* Member Count Display */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: '#dcfce7',
                      borderRadius: 2,
                      py: 1,
                      mb: 1.5
                    }}
                  >
                    <Typography variant="h5" fontWeight={700} sx={{ color: '#15803d' }}>
                      {entry.memberCount}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#15803d', ml: 1 }}>
                      {entry.memberCount === 1 ? 'Member' : 'Members'}
                    </Typography>
                  </Box>

                  {/* Quick Adjust Buttons */}
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      disabled={adjustingRowId === entry.id || entry.memberCount === 0}
                      onClick={() => handleQuickAdjust(entry, -1)}
                      sx={{ flex: 1 }}
                    >
                      -1
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      disabled={adjustingRowId === entry.id}
                      onClick={() => handleQuickAdjust(entry, 1)}
                      sx={{ 
                        flex: 1,
                        bgcolor: '#15803d',
                        '&:hover': {
                          bgcolor: '#166534'
                        }
                      }}
                    >
                      +1
                    </Button>
                  </Stack>
                  
                  {adjustingRowId === entry.id && (
                    <Box display="flex" justifyContent="center" mt={1}>
                      <CircularProgress size={20} />
                    </Box>
                  )}
                </Paper>
              ))}
            </Box>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" alignItems="center" mt={3} gap={1}>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  sx={{ minWidth: '80px' }}
                >
                  Previous
                </Button>
                
                <Box display="flex" gap={0.5}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => handlePageChange(page)}
                      sx={{
                        minWidth: '40px',
                        ...(currentPage === page && {
                          bgcolor: '#15803d',
                          '&:hover': {
                            bgcolor: '#166534'
                          }
                        })
                      }}
                    >
                      {page}
                    </Button>
                  ))}
                </Box>
                
                <Button
                  variant="outlined"
                  size="small"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  sx={{ minWidth: '80px' }}
                >
                  Next
                </Button>
              </Box>
            )}
            </>
          )}
        </Box>
      </Box>
      <Snackbar
        open={alertState.open}
        autoHideDuration={6000}
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleAlertClose} severity={alertState.severity} sx={{ width: '100%' }}>
          {alertState.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default AddBarangayMembers;
