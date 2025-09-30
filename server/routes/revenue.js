import express from 'express';
import Revenue from '../models/revenue.model.js';
import User from '../authentication/user.js';
import { auth } from '../middleware/auth.js';
import sequelize from '../config/db.js';

const router = express.Router();

// Add new revenue entry (Staff only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 2) { // 2 is staff role
      return res.status(403).json({ message: 'Access denied. Staff only.' });
    }

    const revenue = await Revenue.create({
      ...req.body,
      userId: req.user.id,  // Changed from staffId to userId
    });

    res.status(201).json(revenue);
  } catch (error) {
    console.error('Error adding revenue:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all revenue entries (Staff and Admin only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 2 && req.user.role !== 1) { // 1 is admin, 2 is staff
      return res.status(403).json({ message: 'Access denied. Staff or Admin only.' });
    }

    const revenues = await Revenue.findAll({
      order: [['date', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    res.json(revenues);
  } catch (error) {
    console.error('Error fetching revenues:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get revenue summary by period (Staff and Admin only)
router.get('/summary/:period', auth, async (req, res) => {
  try {
    if (req.user.role !== 2 && req.user.role !== 1) { // 1 is admin, 2 is staff
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
          [Sequelize.Op.gte]: startDate,
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
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
