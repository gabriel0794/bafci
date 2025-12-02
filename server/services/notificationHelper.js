import models from '../models/index.js';

const { Notification } = models;

/**
 * Create a notification in the database
 * @param {Object} params - Notification parameters
 * @param {string} params.type - Type of notification (new_member, payment_made, expense_added, etc.)
 * @param {string} params.message - Notification message
 * @param {number} [params.memberId] - Optional member ID related to the notification
 * @param {Object} [params.metadata] - Optional additional data
 */
export const createNotification = async ({ type, message, memberId = null, metadata = null }) => {
  try {
    await Notification.create({
      type,
      message,
      memberId,
      metadata,
      read: false
    });
  } catch (error) {
    // Log error but don't throw - notifications shouldn't break the main flow
    console.error('Error creating notification:', error);
  }
};

// Notification type constants
export const NOTIFICATION_TYPES = {
  NEW_MEMBER: 'new_member',
  PAYMENT_MADE: 'payment_made',
  EXPENSE_ADDED: 'expense_added',
  BARANGAY_MEMBER_ADDED: 'barangay_member_added',
  FIELD_WORKER_ADDED: 'field_worker_added',
  PROGRAM_ADDED: 'program_added',
  MEMBER_UPDATED: 'member_updated',
  GENERAL: 'general'
};

export default { createNotification, NOTIFICATION_TYPES };
