import dotenv from 'dotenv';

dotenv.config();

const PHILSMS_API_BASE_URL = process.env.PHILSMS_API_BASE_URL;
const PHILSMS_API_TOKEN = process.env.PHILSMS_API_TOKEN;
const PHILSMS_SENDER_ID = process.env.PHILSMS_SENDER_ID;

/**
 * Send SMS notification using PhilSMS API
 * @param {string} phoneNumber - Recipient's phone number
 * @param {string} message - SMS message content
 * @returns {Promise<Object>} - API response
 */
export const sendSMS = async (phoneNumber, message) => {
  try {
    // Validate environment variables
    if (!PHILSMS_API_BASE_URL || !PHILSMS_API_TOKEN || !PHILSMS_SENDER_ID) {
      throw new Error('PhilSMS API credentials are not configured properly');
    }

    // Format phone number (remove spaces, dashes, etc.)
    const formattedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');

    // Prepare request payload
    const payload = {
      sender_id: PHILSMS_SENDER_ID,
      recipient: formattedPhone,
      message: message
    };

    // Make API request to PhilSMS
    const response = await fetch(`${PHILSMS_API_BASE_URL}/sms/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PHILSMS_API_TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`PhilSMS API error: ${data.message || response.statusText}`);
    }

    console.log(`SMS sent successfully to ${formattedPhone}`);
    return {
      success: true,
      data: data,
      phoneNumber: formattedPhone
    };

  } catch (error) {
    console.error('Error sending SMS:', error.message);
    return {
      success: false,
      error: error.message,
      phoneNumber: phoneNumber
    };
  }
};

/**
 * Send overdue payment notification to a member
 * @param {Object} member - Member object with contact details
 * @param {number} monthsOverdue - Number of months payment is overdue
 * @returns {Promise<Object>} - SMS send result
 */
export const sendOverduePaymentNotification = async (member, monthsOverdue) => {
  const message = `Dear ${member.fullName || member.full_name},

This is a reminder from BAFCI that your monthly payment is past due for ${monthsOverdue} month(s). 

Please settle your payment at your earliest convenience to avoid further late fees.

Thank you for your cooperation.`;

  return await sendSMS(member.contactNumber || member.contact_number, message);
};

/**
 * Send bulk SMS notifications to multiple members
 * @param {Array} members - Array of member objects
 * @param {number} monthsOverdue - Number of months payment is overdue
 * @returns {Promise<Array>} - Array of SMS send results
 */
export const sendBulkOverdueNotifications = async (members, monthsOverdue) => {
  const results = [];
  
  for (const member of members) {
    const result = await sendOverduePaymentNotification(member, monthsOverdue);
    results.push({
      memberId: member.id,
      memberName: member.fullName || member.full_name,
      phoneNumber: member.contactNumber || member.contact_number,
      ...result
    });
    
    // Add a small delay between SMS sends to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
};
