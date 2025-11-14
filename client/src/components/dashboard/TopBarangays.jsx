import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const TopBarangays = () => {
  const [topBarangays, setTopBarangays] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTopBarangays = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          throw new Error('Authentication token not found');
        }

        const response = await fetch('http://localhost:5000/api/barangay-members', {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch barangay members');
        }

        const data = await response.json();
        // Take only top 3 (already sorted by member count DESC from backend)
        setTopBarangays(data.slice(0, 3));
      } catch (error) {
        console.error('Error fetching top barangays:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopBarangays();
  }, []);

  const handleSeeAll = () => {
    navigate('/add-barangay-members');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={4}>
        <CircularProgress size={30} sx={{ color: '#15803d' }} />
      </Box>
    );
  }

  if (topBarangays.length === 0) {
    return (
      <Box py={2}>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          No barangay data available yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: '0.95rem' }}>
          Top Barangays
        </Typography>
        <Button
          size="small"
          endIcon={<ArrowForwardIcon sx={{ fontSize: '1rem' }} />}
          onClick={handleSeeAll}
          sx={{
            color: '#15803d',
            textTransform: 'none',
            fontSize: '0.8rem',
            padding: '2px 8px',
            '&:hover': {
              bgcolor: '#f0fdf4'
            }
          }}
        >
          See All
        </Button>
      </Box>

      <Box display="flex" gap={1} flexWrap="nowrap" overflow="hidden">
        {topBarangays.map((barangay, index) => (
          <Box
            key={barangay.id}
            sx={{
              flex: '1 1 0',
              minWidth: 0,
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: '#dcfce7',
                transform: 'translateY(-2px)',
                boxShadow: 2
              }
            }}
          >
            <Box display="flex" flexDirection="column" alignItems="flex-start" gap={0.5} width="100%">
              <Box display="flex" alignItems="center" gap={0.5} width="100%">
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: '#15803d',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 700
                  }}
                >
                  {index + 1}
                </Box>
                <Typography 
                  variant="caption" 
                  fontWeight={700} 
                  sx={{ 
                    color: '#15803d',
                    fontSize: '0.8rem',
                    textAlign: 'left',
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {barangay.barangayName}
                </Typography>
              </Box>
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ 
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  textAlign: 'left',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '100%'
                }}
              >
                {barangay.cityName}
              </Typography>
              <Box
                sx={{
                  mt: 0.5,
                  px: 1.5,
                  py: 0.3,
                  borderRadius: 1,
                  bgcolor: '#15803d',
                  color: 'white'
                }}
              >
                <Typography variant="body2" fontWeight={700} sx={{ fontSize: '1.5rem' }}>
                  {barangay.memberCount}
                </Typography>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default TopBarangays;
