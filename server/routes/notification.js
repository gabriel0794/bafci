import express from 'express';
import { Op } from 'sequelize';
import models from '../models/index.js';
import { auth } from '../middleware/auth.js';
import { sendOverduePaymentNotification, sendBulkOverdueNotifications } from '../services/smsService.js';
import { triggerManualSMSCheck } from '../services/smsScheduler.js';

const { Payment, Member, sequelize } = models;
const router = express.Router();

/**
 * Get members with overdue payments (no payment in the last 3+ months)
 */
router.get('/overdue-members', auth, async (req, res) => {
  try {
    const { monthsOverdue = 3 } = req.query;
    
    // Calculate the cutoff date (3 months ago from today)
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - parseInt(monthsOverdue));
    
    // Get all active members (only 'Alive' status)
    const allMembers = await Member.findAll({
      attributes: ['id', 'fullName', 'contactNumber', 'applicationNumber'],
      where: {
        status: 'Alive' // Only include active/alive members
      }
    });

    // Find members with no payments in the last X months
    const overdueMembers = [];
    
    for (const member of allMembers) {
      // Get the latest payment for this member
      const latestPayment = await Payment.findOne({
        where: { memberId: member.id },
        order: [['paymentDate', 'DESC']],
        attributes: ['paymentDate', 'amount']
      });

      // If no payment exists or last payment was before cutoff date
      if (!latestPayment || new Date(latestPayment.paymentDate) < cutoffDate) {
        const monthsSinceLastPayment = latestPayment 
          ? Math.floor((new Date() - new Date(latestPayment.paymentDate)) / (1000 * 60 * 60 * 24 * 30))
          : null;
        
        overdueMembers.push({
          id: member.id,
          fullName: member.fullName,
          contactNumber: member.contactNumber,
          applicationNumber: member.applicationNumber,
          lastPaymentDate: latestPayment ? latestPayment.paymentDate : null,
          lastPaymentAmount: latestPayment ? latestPayment.amount : null,
          monthsSinceLastPayment: monthsSinceLastPayment
        });
      }
    }

    res.json({
      success: true,
      count: overdueMembers.length,
      cutoffDate: cutoffDate.toISOString().split('T')[0],
      monthsOverdue: parseInt(monthsOverdue),
      members: overdueMembers
    });

  } catch (error) {
    console.error('Error fetching overdue members:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching overdue members',
      error: error.message 
    });
  }
});

/**
 * Send SMS notification to a specific member about overdue payment
 */
router.post('/send-overdue-sms/:memberId', auth, async (req, res) => {
  try {
    const { memberId } = req.params;
    const { monthsOverdue = 3 } = req.body;

    // Get member details
    const member = await Member.findByPk(memberId, {
      attributes: ['id', 'fullName', 'contactNumber', 'applicationNumber']
    });

    if (!member) {
      return res.status(404).json({ 
        success: false,
        message: 'Member not found' 
      });
    }

    if (!member.contactNumber) {
      return res.status(400).json({ 
        success: false,
        message: 'Member does not have a contact number on file' 
      });
    }

    // Send SMS notification
    const result = await sendOverduePaymentNotification(member, monthsOverdue);

    if (result.success) {
      res.json({
        success: true,
        message: `SMS notification sent successfully to ${member.fullName}`,
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send SMS notification',
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error sending SMS notification:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while sending SMS notification',
      error: error.message 
    });
  }
});

/**
 * Send bulk SMS notifications to all overdue members
 */
router.post('/send-bulk-overdue-sms', auth, async (req, res) => {
  try {
    const { monthsOverdue = 3 } = req.body;
    
    // Calculate the cutoff date
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - parseInt(monthsOverdue));
    
    // Get all active members (only 'Alive' status)
    const allMembers = await Member.findAll({
      attributes: ['id', 'fullName', 'contactNumber', 'applicationNumber'],
      where: {
        status: 'Alive', // Only include active/alive members
        contactNumber: {
          [Op.ne]: null,
          [Op.ne]: ''
        }
      }
    });

    // Find members with overdue payments
    const overdueMembers = [];
    
    for (const member of allMembers) {
      const latestPayment = await Payment.findOne({
        where: { memberId: member.id },
        order: [['paymentDate', 'DESC']],
        attributes: ['paymentDate']
      });

      if (!latestPayment || new Date(latestPayment.paymentDate) < cutoffDate) {
        overdueMembers.push(member);
      }
    }

    if (overdueMembers.length === 0) {
      return res.json({
        success: true,
        message: 'No overdue members found',
        count: 0,
        results: []
      });
    }

    // Send bulk SMS notifications
    const results = await sendBulkOverdueNotifications(overdueMembers, monthsOverdue);

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.json({
      success: true,
      message: `Sent ${successCount} SMS notifications successfully. ${failureCount} failed.`,
      count: overdueMembers.length,
      successCount,
      failureCount,
      results
    });

  } catch (error) {
    console.error('Error sending bulk SMS notifications:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while sending bulk SMS notifications',
      error: error.message 
    });
  }
});

/**
 * Test SMS endpoint - send a test message to verify SMS service is working
 */
router.post('/test-sms', auth, async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and message are required'
      });
    }

    const { sendSMS } = await import('../services/smsService.js');
    const result = await sendSMS(phoneNumber, message);

    if (result.success) {
      res.json({
        success: true,
        message: 'Test SMS sent successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test SMS',
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error sending test SMS:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending test SMS',
      error: error.message
    });
  }
});

/**
 * Manual trigger for automatic SMS scheduler (for testing)
 */
router.post('/trigger-auto-sms', auth, async (req, res) => {
  try {
    console.log('Manual trigger for automatic SMS scheduler initiated by admin');
    
    // Trigger the scheduler manually
    triggerManualSMSCheck();
    
    res.json({
      success: true,
      message: 'Automatic SMS check triggered. Check server logs for results.'
    });

  } catch (error) {
    console.error('Error triggering automatic SMS:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while triggering automatic SMS',
      error: error.message
    });
  }
});

export default router;
