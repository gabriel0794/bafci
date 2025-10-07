import express from 'express';
import models from '../models/index.js';
import { auth } from '../middleware/auth.js';
import sequelize from '../config/db.js';

const { Revenue, User, Branch } = models;
const router = express.Router();

// Add new revenue entry (Staff only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 2) { // 2 is staff role
      return res.status(403).json({ message: 'Access denied. Staff only.' });
    }

    const revenue = await Revenue.create({
      ...req.body,
      userId: req.user.id,
    });

    // Include user and branch data in the response
    const revenueWithDetails = await Revenue.findByPk(revenue.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: Branch, as: 'branch', attributes: ['id', 'name'] }
      ]
    });

    res.status(201).json(revenueWithDetails);
  } catch (error) {
    console.error('Error adding revenue:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all revenue entries (Staff and Admin only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 1 && req.user.role !== 2) { // 1 is admin, 2 is staff
      return res.status(403).json({ message: 'Access denied. Staff or admin only.' });
    }

    const revenues = await Revenue.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: Branch, as: 'branch', attributes: ['id', 'name'], required: false }
      ],
      order: [['date', 'DESC']]
    });

    res.json(revenues);
  } catch (error) {
    console.error('Error fetching revenues:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get revenue summary by period (Staff and Admin only)
router.get('/summary/:period', auth, async (req, res) => {
  try {
    if (req.user.role !== 1 && req.user.role !== 2) { // 1 is admin, 2 is staff
      return res.status(403).json({ message: 'Access denied. Staff or Admin only.' });
    }

    const { period } = req.params;
    const validPeriods = ['daily', 'weekly', 'monthly', 'yearly'];
    
    if (!validPeriods.includes(period)) {
      return res.status(400).json({ message: 'Invalid period. Use daily, weekly, monthly, or yearly.' });
    }

    // Get current date components
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'daily':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'weekly':
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        startDate = new Date(now.setDate(diff));
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const revenues = await Revenue.findAll({
      where: {
        date: {
          [sequelize.Op.gte]: startDate,
        },
      },
      order: [['date', 'DESC']],
    });

    const total = revenues.reduce((sum, rev) => sum + parseFloat(rev.amount), 0);
    
    res.json({
      period,
      startDate,
      total: total.toFixed(2),
      count: revenues.length,
      revenues,
    });
  } catch (error) {
    console.error('Error fetching revenue summary:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
