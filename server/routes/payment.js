import express from 'express';
import models from '../models/index.js';
import { auth } from '../middleware/auth.js';

const { Payment, Member } = models;
const router = express.Router();

// Get all payments for a specific member
router.get('/members/:memberId/payments', auth, async (req, res) => {
  try {
    const { memberId } = req.params;
    
    // Check if member exists
    const member = await Member.findByPk(memberId);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const payments = await Payment.findAll({
      where: { memberId },
      order: [['payment_date', 'DESC']],
      attributes: [
        'id', 
        'amount', 
        'payment_date', 
        'reference_number', 
        'period_start',
        'next_payment',
        'notes', 
        'status', 
        'createdAt'
      ]
    });

    res.json(payments);
  } catch (error) {
    console.error('Error fetching member payments:', error);
    res.status(500).json({ 
      message: 'Server error while fetching payments',
      error: error.message 
    });
  }
});

// Create a new payment for a member
router.post('/payments', auth, async (req, res) => {
  try {
    const { memberId, member_id, amount, payment_date, reference_number, referenceNumber, notes } = req.body;
    
    // Use member_id if provided, otherwise use memberId (for backward compatibility)
    const effectiveMemberId = member_id || memberId;
    
    // Validate required fields
    if (!effectiveMemberId || !amount) {
      return res.status(400).json({ message: 'Member ID and amount are required' });
    }

    // Check if member exists
    const member = await Member.findByPk(effectiveMemberId);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const paymentDate = payment_date ? new Date(payment_date) : new Date();
    
    // Format payment date for database (YYYY-MM-DD)
    const formattedPaymentDate = paymentDate.toISOString().split('T')[0];
    
    // Calculate next payment date (1 month from payment date)
    const nextPaymentDate = new Date(paymentDate);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    const formattedNextPaymentDate = nextPaymentDate.toISOString().split('T')[0];

    try {
      // Create payment with periodStart and nextPayment dates
      const payment = await Payment.create({
        memberId: effectiveMemberId,
        amount: parseFloat(amount),
        paymentDate: formattedPaymentDate,
        periodStart: formattedPaymentDate, // Set periodStart same as paymentDate
        nextPayment: formattedNextPaymentDate,
        referenceNumber: referenceNumber || reference_number || null, // Support both camelCase and snake_case
        notes: notes || null,
        status: 'completed',
        createdBy: req.user.id
      });

      // Update member's last contribution date
      await member.update({
        lastContributionDate: formattedPaymentDate
      });

      res.status(201).json({
        message: 'Payment recorded successfully',
        payment,
        nextPaymentDate: formattedNextPaymentDate
      });
      
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }

  } catch (error) {
    console.error('Error creating payment:', {
      name: error.name,
      message: error.message,
      errors: error.errors?.map(e => ({
        message: e.message,
        type: e.type,
        path: e.path,
        value: e.value
      })),
      stack: error.stack
    });
    
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map(err => ({
        field: err.path,
        message: err.message,
        type: err.type,
        value: err.value
      }));
      return res.status(400).json({ 
        message: 'Validation error',
        error: 'Validation failed',
        details: errors 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error while processing payment',
      error: error.message 
    });
  }
});

export default router;
