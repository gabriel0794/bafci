import express from 'express';
import models from '../models/index.js';
import { auth } from '../middleware/auth.js';

const { FieldWorker, Branch } = models;
const router = express.Router();

// @route   GET api/field-workers
// @desc    Get all field workers
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const fieldWorkers = await FieldWorker.findAll({
      order: [['name', 'ASC']],
      include: [
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name'],
        },
      ],
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

// @route   POST api/field-workers
// @desc    Create a new field worker
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { name, age, branch_id } = req.body;

    // Validate required fields
    if (!name || !age || !branch_id) {
      return res.status(400).json({ 
        message: 'Please provide name, age, and branch_id' 
      });
    }

    // Validate age
    if (age < 18 || age > 100) {
      return res.status(400).json({ 
        message: 'Age must be between 18 and 100' 
      });
    }

    // Check if branch exists
    const branch = await Branch.findByPk(branch_id);
    if (!branch) {
      return res.status(404).json({ 
        message: 'Branch not found' 
      });
    }

    // Create field worker (use branchId to match Sequelize model attribute)
    const fieldWorker = await FieldWorker.create({
      name,
      age,
      branchId: branch_id
    });

    // Fetch the created field worker with branch details
    const createdWorker = await FieldWorker.findByPk(fieldWorker.id, {
      include: [
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name'],
        },
      ],
    });

    res.status(201).json(createdWorker);
  } catch (error) {
    console.error('Error creating field worker:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
