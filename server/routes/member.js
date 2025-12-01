import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import models from '../models/index.js';
import { auth } from '../middleware/auth.js';

// Multer configuration for file uploads
const uploadDir = 'uploads/';
fs.ensureDirSync(uploadDir); // Ensure the upload directory exists

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

const { Member, FieldWorker } = models;
const router = express.Router();

// Helper to convert object keys from snake_case to camelCase
const toSnakeCase = (str) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

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

// Helper function to normalize date fields for UTC+8 timezone (Philippines/Singapore)
// This ensures dates are stored correctly without timezone conversion issues
const normalizeDateForUTC8 = (dateString) => {
  if (!dateString) return dateString;
  
  // If it's already in YYYY-MM-DD format, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // Parse the date and ensure it's interpreted in UTC+8
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  // Get the date components in UTC+8
  const utc8Date = new Date(date.getTime() + (8 * 60 * 60 * 1000));
  const year = utc8Date.getUTCFullYear();
  const month = String(utc8Date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(utc8Date.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

// Helper function to normalize date fields in member data
const normalizeMemberDates = (memberData) => {
  const dateFields = ['dateApplied', 'dateOfBirth', 'spouseDob', 'beneficiaryDob', 'datePaid'];
  
  dateFields.forEach(field => {
    if (memberData[field]) {
      memberData[field] = normalizeDateForUTC8(memberData[field]);
    }
  });
  
  return memberData;
};

// Create a new member
router.post('/', auth, upload.single('picture'), async (req, res) => {
  try {
    // Get the current user ID from the auth middleware
    const userId = req.user.id;
    
    // Create member with the data from the request body
    let memberData = toCamelCase(req.body);
    
    // Normalize date fields for UTC+8 timezone
    memberData = normalizeMemberDates(memberData);

    // If a picture is uploaded, add its filename to the data
    if (req.file) {
      memberData.picture = req.file.filename;
    }

    // Auto-set membershipFeePaidDate to today if membershipFeePaid is true and date not provided
    if (memberData.membershipFeePaid !== false && !memberData.membershipFeePaidDate) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      memberData.membershipFeePaidDate = `${year}-${month}-${day}`;
    }

    const member = await Member.create({
      ...memberData,
      createdBy: userId,
      updatedBy: userId
    });

    // Update field worker's total membership fee collection if member has a field worker and membership fee is paid
    if (member.fieldWorkerId && member.membershipFeePaid) {
      const fieldWorker = await FieldWorker.findByPk(member.fieldWorkerId);
      if (fieldWorker) {
        const membershipFeeAmount = parseFloat(member.membershipFeeAmount) || 600;
        const currentTotal = parseFloat(fieldWorker.totalMembershipFeeCollection) || 0;
        await fieldWorker.update({
          totalMembershipFeeCollection: currentTotal + membershipFeeAmount
        });
      }
    }

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
      include: [{
        model: FieldWorker,
        as: 'fieldWorker',
        attributes: ['name'],
      }],
    });
    
    // Format dates for better display
    const formattedMembers = members.map(member => {
      const memberData = member.get({ plain: true });
      const snakeCaseMember = {};

      for (const key in memberData) {
        if (key === 'fieldWorker' && memberData[key]) {
          snakeCaseMember['field_worker'] = {
            name: memberData[key].name || ''
          };
        } else {
          const snakeKey = toSnakeCase(key);
          let value = memberData[key];

          // Format dates
          const dateFields = ['dateApplied', 'dateOfBirth', 'spouseDob', 'beneficiaryDob', 'datePaid', 'createdAt', 'updatedAt'];
          if (dateFields.includes(key) && value) {
            value = new Date(value).toISOString().split('T')[0];
          }
          
          // Sanitize nulls
          snakeCaseMember[snakeKey] = value === null ? '' : value;
        }
      }
      return snakeCaseMember;
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
router.put('/:id', auth, upload.single('picture'), async (req, res) => {
  try {
    const member = await Member.findByPk(req.params.id);

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Filter out null or empty string values from req.body
    const incomingData = toCamelCase(req.body);
    let memberData = {};
    for (const key in incomingData) {
      if (incomingData[key] !== null && incomingData[key] !== '') {
        memberData[key] = incomingData[key];
      }
    }
    
    // Normalize date fields for UTC+8 timezone
    memberData = normalizeMemberDates(memberData);

    // If a new picture is uploaded, add its filename to the data
    if (req.file) {
      memberData.picture = req.file.filename;
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
