import express from 'express';
import models from '../models/index.js';
import { auth } from '../middleware/auth.js';

const { Payment, Member, FieldWorker, sequelize } = models;
const router = express.Router();

// Get payment history for a specific member (payment history modal)
router.get('/history/:memberId', auth, async (req, res) => {
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
        'createdAt',
        'isLate',
        'lateFeePercentage',
        'lateFeeAmount',
        'totalAmount'
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
router.post('/', auth, async (req, res) => {
  try {
    const { memberId, member_id, amount, payment_date, reference_number, referenceNumber, notes, late_fee_percentage } = req.body;
    
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

    // Check if payment is late (made after the 5th of the month)
    const dayOfMonth = paymentDate.getDate();
    const isLate = dayOfMonth > 5;
    
    // Calculate late fee if payment is late
    // Use custom late fee percentage from request, or default to 15%
    const lateFeePercentage = late_fee_percentage ? parseFloat(late_fee_percentage) : 15;
    const baseAmount = parseFloat(amount);
    let lateFeeAmount = 0;
    let totalAmount = baseAmount;
    
    if (isLate) {
      lateFeeAmount = (baseAmount * lateFeePercentage) / 100;
      totalAmount = baseAmount + lateFeeAmount;
    }

    try {
      // Create payment with period_start, next_payment dates, and late fee information
      const payment = await Payment.create({
        memberId: effectiveMemberId,
        amount: baseAmount,
        paymentDate: formattedPaymentDate,
        periodStart: formattedPaymentDate, // Set period_start same as payment_date
        nextPayment: formattedNextPaymentDate, // Set next_payment to 1 month after payment_date
        referenceNumber: referenceNumber || reference_number || null,
        notes: notes || null,
        status: 'completed',
        createdBy: req.user.id,
        isLate: isLate,
        lateFeePercentage: isLate ? lateFeePercentage : 0,
        lateFeeAmount: lateFeeAmount,
        totalAmount: totalAmount
      });

      // Update member's last contribution date (but not the period fields)
      await member.update({
        lastContributionDate: formattedPaymentDate
      });

      // Update field worker's total monthly payment collection if member has a field worker
      if (member.fieldWorkerId) {
        const fieldWorker = await FieldWorker.findByPk(member.fieldWorkerId);
        if (fieldWorker) {
          const currentTotal = parseFloat(fieldWorker.totalMonthlyPaymentCollection) || 0;
          await fieldWorker.update({
            totalMonthlyPaymentCollection: currentTotal + totalAmount
          });
        }
      }

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

// Get latest payment period data for all members (for members list)
router.get('/member-periods', auth, async (req, res) => {
  try {
    // Using raw SQL to get the latest payment for each member
    const [results] = await sequelize.query(`
      SELECT DISTINCT ON (member_id) 
        member_id,
        period_start,
        next_payment,
        payment_date
      FROM payments
      WHERE period_start IS NOT NULL AND next_payment IS NOT NULL
      ORDER BY member_id, payment_date DESC
    `);

    // Format the response to be keyed by member_id for easy lookup
    const periodData = {};
    results.forEach(payment => {
      if (payment.member_id) {
        periodData[payment.member_id] = {
          period_start: payment.period_start,
          next_payment: payment.next_payment,
          last_payment_date: payment.payment_date
        };
      }
    });

    res.json(periodData);
  } catch (error) {
    console.error('Error fetching member payment periods:', error);
    res.status(500).json({ 
      message: 'Error fetching member payment periods',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
