import cron from 'node-cron';
import { Op } from 'sequelize';
import { sendOverduePaymentNotification } from './smsService.js';

// Store for tracking sent SMS to avoid duplicates
const sentSMSLog = new Map();

/**
 * Check and send SMS to members with overdue payments (3+ months)
 */
const checkAndSendOverdueSMS = async () => {
  console.log('[SMS Scheduler] Running overdue payment check...');
  
  try {
    // Import models dynamically to avoid initialization issues
    const models = (await import('../models/index.js')).default;
    const { Payment, Member } = models;
    
    const monthsOverdue = 3;
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsOverdue);
    
    // Get all active members with phone numbers
    const allMembers = await Member.findAll({
      attributes: ['id', 'fullName', 'contactNumber', 'applicationNumber'],
      where: {
        status: 'Alive',
        contactNumber: {
          [Op.ne]: null,
          [Op.ne]: ''
        }
      }
    });

    const overdueMembers = [];
    
    // Check each member's payment history
    for (const member of allMembers) {
      const latestPayment = await Payment.findOne({
        where: { memberId: member.id },
        order: [['paymentDate', 'DESC']],
        attributes: ['paymentDate']
      });

      // If no payment or last payment was before cutoff date
      if (!latestPayment || new Date(latestPayment.paymentDate) < cutoffDate) {
        overdueMembers.push(member);
      }
    }

    console.log(`[SMS Scheduler] Found ${overdueMembers.length} overdue member(s)`);

    if (overdueMembers.length === 0) {
      console.log('[SMS Scheduler] No overdue members found. All members are up to date!');
      return;
    }

    // Send SMS to each overdue member
    let successCount = 0;
    let failureCount = 0;
    const today = new Date().toISOString().split('T')[0];

    for (const member of overdueMembers) {
      // Check if we already sent SMS to this member today
      const logKey = `${member.id}-${today}`;
      if (sentSMSLog.has(logKey)) {
        console.log(`[SMS Scheduler] Already sent SMS to ${member.fullName} today. Skipping...`);
        continue;
      }

      // Send SMS
      const result = await sendOverduePaymentNotification(member, monthsOverdue);
      
      if (result.success) {
        successCount++;
        sentSMSLog.set(logKey, Date.now());
        console.log(`[SMS Scheduler] ✓ SMS sent to ${member.fullName} (${member.contactNumber})`);
      } else {
        failureCount++;
        console.log(`[SMS Scheduler] ✗ Failed to send SMS to ${member.fullName}: ${result.error}`);
      }

      // Add delay between SMS to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`[SMS Scheduler] Completed: ${successCount} sent, ${failureCount} failed`);

    // Clean up old log entries (older than 24 hours)
    cleanupSMSLog();

  } catch (error) {
    console.error('[SMS Scheduler] Error checking overdue payments:', error);
  }
};

/**
 * Clean up SMS log entries older than 24 hours
 */
const cleanupSMSLog = () => {
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  for (const [key, timestamp] of sentSMSLog.entries()) {
    if (timestamp < oneDayAgo) {
      sentSMSLog.delete(key);
    }
  }
};

/**
 * Initialize the SMS scheduler
 * Runs every day at 9:00 AM
 */
export const initializeSMSScheduler = () => {
  console.log('[SMS Scheduler] Initializing automatic SMS scheduler...');
  
  // Schedule: Run every day at 9:00 AM
  // Cron format: minute hour day month weekday
  // '0 9 * * *' = At 9:00 AM every day
  cron.schedule('0 9 * * *', async () => {
    console.log('[SMS Scheduler] Triggered at 9:00 AM');
    await checkAndSendOverdueSMS();
  }, {
    timezone: 'Asia/Manila' // Adjust to your timezone
  });

  console.log('[SMS Scheduler] Scheduled to run daily at 9:00 AM (Asia/Manila timezone)');
  
  // Optional: Run immediately on startup for testing
  // Uncomment the line below to test immediately when server starts
  // checkAndSendOverdueSMS();
};

/**
 * Manual trigger for testing purposes
 */
export const triggerManualSMSCheck = async () => {
  console.log('[SMS Scheduler] Manual trigger initiated');
  await checkAndSendOverdueSMS();
};

export default {
  initializeSMSScheduler,
  triggerManualSMSCheck,
  checkAndSendOverdueSMS
};
