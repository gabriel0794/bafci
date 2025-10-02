import express from 'express';
import { Member } from '../models/index.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Create a new member
router.post('/', auth, async (req, res) => {
  try {
    // Get the current user ID from the auth middleware
    const userId = req.user.id;
    
    // Create member with the data from the request body
    const member = await Member.create({
      ...req.body,
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
        'endorsed_by',
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

export default router;
