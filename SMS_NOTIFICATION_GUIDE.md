# SMS Notification System - User Guide

## Overview
The SMS notification system allows BAFCI staff to send automated payment reminders to members whose monthly payments are overdue for 3 or more months. The system uses PhilSMS API to deliver text messages directly to members' registered phone numbers.

## Features

### 1. **Overdue Member Detection**
- Automatically identifies members who haven't made payments in the last 3+ months
- Displays detailed information including:
  - Member name and application number
  - Contact number
  - Last payment date and amount
  - Number of months since last payment

### 2. **Individual SMS Notifications**
- Send payment reminders to specific members
- One-click SMS sending from the member list
- Real-time delivery status feedback

### 3. **Bulk SMS Notifications**
- Send payment reminders to all overdue members at once
- Batch processing with rate limiting to prevent API throttling
- Comprehensive delivery report showing success/failure status

### 4. **Customizable Overdue Period**
- Adjust the overdue threshold (default: 3 months)
- Filter members based on different payment delay periods

## How to Use

### Accessing the Notifications Page
1. Log in to the BAFCI system
2. Click on **"Notifications"** in the sidebar navigation
3. The system will automatically load all members with overdue payments

### Sending Individual SMS
1. Review the list of overdue members
2. Locate the member you want to notify
3. Click the **Send icon** (paper plane) in the Action column
4. Review the message preview in the confirmation dialog
5. Click **"Send SMS"** to deliver the notification
6. Wait for the success confirmation

### Sending Bulk SMS
1. Review the complete list of overdue members
2. Adjust the "Months Overdue" filter if needed (e.g., 3, 4, 5 months)
3. Click **"Send SMS to All"** button at the top
4. Review the confirmation dialog showing:
   - Total number of recipients
   - Message preview
5. Click **"Send SMS"** to send to all members
6. Wait for the bulk operation to complete
7. Review the delivery report showing success/failure counts

### Refreshing the List
- Click the **"Refresh List"** button to reload overdue members
- Useful after sending notifications or when new payments are recorded

## SMS Message Format

The automated message sent to members includes:

```
Dear [Member Name],

This is a reminder from BAFCI that your monthly payment is past due for [X] month(s).

Please settle your payment at your earliest convenience to avoid further late fees.

Thank you for your cooperation.
```

## API Endpoints

### Backend Routes (for developers)

#### Get Overdue Members
```
GET /api/notifications/overdue-members?monthsOverdue=3
```
Returns a list of members with no payments in the specified period.

#### Send Individual SMS
```
POST /api/notifications/send-overdue-sms/:memberId
Body: { monthsOverdue: 3 }
```
Sends SMS notification to a specific member.

#### Send Bulk SMS
```
POST /api/notifications/send-bulk-overdue-sms
Body: { monthsOverdue: 3 }
```
Sends SMS notifications to all overdue members.

#### Test SMS (for testing)
```
POST /api/notifications/test-sms
Body: { phoneNumber: "09171234567", message: "Test message" }
```
Sends a test SMS to verify the service is working.

## Configuration

### Environment Variables
The SMS service requires the following environment variables in `.env`:

```env
PHILSMS_API_BASE_URL=https://app.philsms.com/api/v3
PHILSMS_API_TOKEN=your_api_token_here
PHILSMS_SENDER_ID=PhilSMS
```

### Phone Number Format
- The system automatically formats phone numbers
- Accepts formats like: 09171234567, +639171234567, (0917) 123-4567
- Removes spaces, dashes, and parentheses automatically

## Important Notes

### Rate Limiting
- The system includes a 500ms delay between each SMS in bulk operations
- This prevents API rate limiting and ensures reliable delivery

### Member Requirements
- Members must have a valid contact number on file
- Members without phone numbers will be skipped (shown with "No Phone" badge)
- Inactive members are automatically excluded from the overdue list

### Cost Considerations
- Each SMS sent consumes credits from your PhilSMS account
- Monitor your SMS credit balance regularly
- Consider the cost before sending bulk notifications

### Best Practices
1. **Regular Monitoring**: Check for overdue members weekly
2. **Timely Notifications**: Send reminders as soon as members become overdue
3. **Follow-up**: Track which members respond after receiving SMS
4. **Update Contact Info**: Ensure member phone numbers are current
5. **Test First**: Use the test SMS feature before bulk operations

## Troubleshooting

### SMS Not Sending
1. Verify PhilSMS API credentials in `.env` file
2. Check if member has a valid phone number
3. Ensure sufficient SMS credits in PhilSMS account
4. Review server logs for error messages

### Member Not Appearing in List
1. Check if member has made a recent payment
2. Verify member status is not "inactive"
3. Adjust the "Months Overdue" filter
4. Click "Refresh List" to reload data

### Bulk SMS Partially Failed
1. Review the delivery report for specific failures
2. Check failed members' phone numbers for validity
3. Retry sending to individual failed members
4. Contact PhilSMS support if issues persist

## Technical Details

### Files Created/Modified

#### Backend
- `server/services/smsService.js` - SMS sending logic
- `server/routes/notification.js` - API endpoints
- `server/server.js` - Route registration

#### Frontend
- `client/src/pages/notifications/Notifications.jsx` - Main UI component
- `client/src/router.jsx` - Route configuration
- `client/src/components/Navbar.jsx` - Navigation link

### Dependencies
- **Backend**: Uses native `fetch` API (no additional packages needed)
- **Frontend**: Material-UI components for the interface

## Support

For technical issues or questions:
1. Check server logs: `server/logs` (if logging is enabled)
2. Review PhilSMS API documentation: https://app.philsms.com/docs
3. Contact your system administrator
4. Verify database connectivity and payment records

---

**Last Updated**: November 2025  
**Version**: 1.0.0
