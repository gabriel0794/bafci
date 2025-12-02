import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import models from '../models/index.js';
import { auth } from '../middleware/auth.js';
import sequelize from '../config/db.js';
import { createNotification, NOTIFICATION_TYPES } from '../services/notificationHelper.js';

const { Revenue, User, Branch } = models;
const router = express.Router();

// Multer configuration for receipt uploads
const uploadDir = 'uploads/receipts/';

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `receipt-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter to accept only JPEG and PNG
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG and PNG images are allowed'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Add new revenue entry (Staff only)
router.post('/', auth, upload.single('receipt'), async (req, res) => {
  try {
    if (req.user.role !== 2) { // 2 is staff role
      return res.status(403).json({ message: 'Access denied. Staff only.' });
    }

    // Prepare revenue data
    const revenueData = {
      ...req.body,
      userId: req.user.id,
    };

    // Add receipt path if file was uploaded
    if (req.file) {
      revenueData.receipt = req.file.path;
    }

    const revenue = await Revenue.create(revenueData);

    // Include user and branch data in the response
    const revenueWithDetails = await Revenue.findByPk(revenue.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: Branch, as: 'branch', attributes: ['id', 'name'] }
      ]
    });

    // Create notification for expense
    const categoryLabel = req.body.category ? req.body.category.replace(/_/g, ' ') : 'expense';
    const branchName = revenueWithDetails.branch ? revenueWithDetails.branch.name : '';
    const branchText = branchName ? ` for ${branchName}` : '';
    await createNotification({
      type: NOTIFICATION_TYPES.EXPENSE_ADDED,
      message: `New expense added: ₱${Math.abs(parseFloat(req.body.amount)).toFixed(2)} - ${categoryLabel}${branchText}`,
      metadata: { 
        revenueId: revenue.id, 
        category: req.body.category,
        amount: req.body.amount,
        description: req.body.description
      }
    });

    res.status(201).json(revenueWithDetails);
  } catch (error) {
    console.error('Error adding revenue:', error);
    
    // Delete uploaded file if there was an error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    
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
