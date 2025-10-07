import express from 'express';
import models from '../models/index.js';
import { auth } from '../middleware/auth.js';

const { FieldWorker } = models;
const router = express.Router();

// @route   GET api/field-workers
// @desc    Get all field workers
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const fieldWorkers = await FieldWorker.findAll({
      order: [['name', 'ASC']],
    });
    res.json(fieldWorkers);
  } catch (error) {
    console.error('Error fetching field workers:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
