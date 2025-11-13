import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, MenuItem, FormControl, InputLabel, Select, Paper, CircularProgress } from '@mui/material';
import Navbar from '../../components/Navbar';

const AddBarangayMembers = () => {
  const [region, setRegion] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [barangay, setBarangay] = useState('');
  const [memberCount, setMemberCount] = useState('');
  
  // Data states
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  
  // Loading states
  const [loadingRegions, setLoadingRegions] = useState(true);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingBarangays, setLoadingBarangays] = useState(false);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    // Later: send to backend
    alert(`Added ${memberCount} member(s) to ${barangay}, ${city}, ${province}, ${region}`);
    setRegion('');
    setProvince('');
    setCity('');
    setBarangay('');
    setMemberCount('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={4} pt={4} px={{ xs: 1, md: 6 }}>
        {/* Input Form Side */}
        <Box flex={{ xs: 'unset', md: '0 0 320px' }} minWidth={0}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <h1 className='text-2xl font-bold text-gray-900'>Add Members to Barangay</h1>
            <form onSubmit={handleSubmit}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Region</InputLabel>
                <Select
                  value={region}
                  label="Region"
                  onChange={e => {
                    setRegion(e.target.value);
                    setProvince('');
                    setCity('');
                    setBarangay('');
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
                    setProvince(e.target.value);
                    setCity('');
                    setBarangay('');
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
                    setCity(e.target.value);
                    setBarangay('');
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
                  onChange={e => setBarangay(e.target.value)}
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
              />
              <button
                type="submit"
                className="w-full px-4 py-2 rounded-md text-sm font-medium border transition mt-4 bg-green-600 text-white border-green-600 shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Add
              </button>
            </form>
          </Paper>
        </Box>
        {/* Barangay List Side */}
        <Box flex={1}>
          <Typography variant="h6" mb={2} fontWeight={600}>Barangay Member List</Typography>
          <Box display="flex" flexWrap="wrap" gap={2}>
            <Paper elevation={2} sx={{ p: 3, width: '100%', textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Barangay member data will be displayed here once added to the database.
              </Typography>
            </Paper>
          </Box>
        </Box>
      </Box>
    </div>
  );
};

export default AddBarangayMembers;
