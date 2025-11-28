import express from 'express';

const router = express.Router();

// Proxy for PSGC API to avoid CORS issues
const PSGC_BASE_URL = 'https://psgc.gitlab.io/api';

// GET /api/psgc/regions
router.get('/regions', async (req, res) => {
  try {
    const response = await fetch(`${PSGC_BASE_URL}/regions.json`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({ error: 'Failed to fetch regions' });
  }
});

// GET /api/psgc/regions/:regionCode/provinces
router.get('/regions/:regionCode/provinces', async (req, res) => {
  try {
    const { regionCode } = req.params;
    const response = await fetch(`${PSGC_BASE_URL}/regions/${regionCode}/provinces.json`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching provinces:', error);
    res.status(500).json({ error: 'Failed to fetch provinces' });
  }
});

// GET /api/psgc/provinces/:provinceCode/cities-municipalities
router.get('/provinces/:provinceCode/cities-municipalities', async (req, res) => {
  try {
    const { provinceCode } = req.params;
    const response = await fetch(`${PSGC_BASE_URL}/provinces/${provinceCode}/cities-municipalities.json`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching cities/municipalities:', error);
    res.status(500).json({ error: 'Failed to fetch cities/municipalities' });
  }
});

// GET /api/psgc/cities-municipalities/:cityCode/barangays
router.get('/cities-municipalities/:cityCode/barangays', async (req, res) => {
  try {
    const { cityCode } = req.params;
    const response = await fetch(`${PSGC_BASE_URL}/cities-municipalities/${cityCode}/barangays.json`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching barangays:', error);
    res.status(500).json({ error: 'Failed to fetch barangays' });
  }
});

export default router;
