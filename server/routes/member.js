import express from 'express';
import models from '../models/index.js';
import { auth } from '../middleware/auth.js';

const { Member } = models;
const router = express.Router();

// Helper to convert object keys from snake_case to camelCase
const toCamelCase = (obj) => {
  const newObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      newObj[camelKey] = obj[key];
    }
  }
  return newObj;
};

// Create a new member
router.post('/', auth, async (req, res) => {
  try {
    // Get the current user ID from the auth middleware
    const userId = req.user.id;
    
    // Create member with the data from the request body
    const memberData = toCamelCase(req.body);

    const member = await Member.create({
      ...memberData,
      createdBy: userId,
      updatedBy: userId
    });

    res.status(201).json(member);
  } catch (error) {
    console.error('Error creating member:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error.errors && { errors: error.errors.map(e => ({
        message: e.message,
        type: e.type,
        path: e.path,
        value: e.value
      }))})
    });
    
    // Handle validation errors
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map(err => ({
        field: err.path,
        message: err.message,
        type: err.type,
        value: err.value
      }));
      return res.status(400).json({ 
        error: 'Validation Error',
        details: errors 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error',
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// Get all members
router.get('/', auth, async (req, res) => {
  try {
    const members = await Member.findAll({
      order: [['created_at', 'DESC']],
      attributes: [
        'id',
        'full_name',
        'nickname',
        'age',
        'program',
        'age_bracket',
        'contribution_amount',
        'availment_period',
        'date_applied',
        'complete_address',
        'provincial_address',
        'date_of_birth',
        'place_of_birth',
        'sex',
        'civil_status',
        'spouse_name',
        'spouse_dob',
        'church_affiliation',
        'education_attainment',
        'present_employment',
        'employer_name',
        'contact_number',
        'beneficiary_name',
        'beneficiary_dob',
        'beneficiary_age',
        'beneficiary_relationship',
        'date_paid',
        'received_by',
        'or_number',
        'field_worker_id',
        'branch',
        'created_at',
        'updated_at'
      ]
    });
    
    // Format dates for better display
    const formattedMembers = members.map(member => {
      const memberData = member.get({ plain: true });
      
      // Format dates to ISO string (YYYY-MM-DD) for consistent display
      const dateFields = ['date_applied', 'date_of_birth', 'spouse_dob', 'beneficiary_dob', 'date_paid'];
      dateFields.forEach(field => {
        if (memberData[field]) {
          memberData[field] = new Date(memberData[field]).toISOString().split('T')[0];
        }
      });
      
      // Sanitize null values to empty strings
      for (const key in memberData) {
        if (memberData[key] === null) {
          memberData[key] = '';
        }
      }
      
      return memberData;
    });
    
    res.json(formattedMembers);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message
    });
  }
});

// Update a member
router.put('/:id', auth, async (req, res) => {
  try {
    const member = await Member.findByPk(req.params.id);

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Filter out null or empty string values from req.body
    const incomingData = toCamelCase(req.body);
    const memberData = {};
    for (const key in incomingData) {
      if (incomingData[key] !== null && incomingData[key] !== '') {
        memberData[key] = incomingData[key];
      }
    }

    await member.update(memberData);

    res.json(member);
  } catch (error) {
    console.error('Error updating member:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;
