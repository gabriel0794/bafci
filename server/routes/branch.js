import express from 'express';
import Branch from '../models/branch.model.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get all active branches
router.get('/', auth, async (req, res) => {
  try {
    const branches = await Branch.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });
    
    res.json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new branch (Admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 1) { // 1 is admin role
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Branch name is required' });
    }

    const branch = await Branch.create({
      name,
      isActive: true
    });

    res.status(201).json(branch);
  } catch (error) {
    console.error('Error adding branch:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Branch name already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update branch (Admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 1) { // 1 is admin role
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const { name, isActive } = req.body;

    const branch = await Branch.findByPk(id);
    
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    if (name !== undefined) branch.name = name;
    if (isActive !== undefined) branch.isActive = isActive;

    await branch.save();

    res.json(branch);
  } catch (error) {
    console.error('Error updating branch:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Branch name already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete/Deactivate branch (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 1) { // 1 is admin role
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;

    const branch = await Branch.findByPk(id);
    
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Soft delete by setting isActive to false
    branch.isActive = false;
    await branch.save();

    res.json({ message: 'Branch deactivated successfully' });
  } catch (error) {
    console.error('Error deleting branch:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
