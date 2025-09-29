import express from 'express';
import { adminAuth, staffAuth } from '../middleware/auth.js';

const router = express.Router();

// @route   GET api/protected/admin
// @desc    Admin-only route
// @access  Private (Admin)
router.get('/admin', adminAuth, (req, res) => {
  res.json({ msg: 'Welcome, Admin! You have access to this protected data.' });
});

// @route   GET api/protected/staff
// @desc    Staff-only route
// @access  Private (Staff or Admin)
router.get('/staff', staffAuth, (req, res) => {
  res.json({ msg: 'Welcome, Staff! You have access to this data.' });
});

export default router;
