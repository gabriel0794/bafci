# SMS Notification - Quick Start Guide

## What's New?
You can now send SMS notifications to members whose monthly payments are overdue for 3+ months using PhilSMS API.

## Quick Access
1. Navigate to **Notifications** in the sidebar
2. View all overdue members automatically
3. Send individual or bulk SMS reminders

## How to Send SMS

### Option 1: Individual Member
1. Find the member in the overdue list
2. Click the **Send** icon (✉️) next to their name
3. Confirm and send

### Option 2: All Overdue Members
1. Click **"Send SMS to All"** button
2. Review the list of recipients
3. Confirm and send

## Message Template
```
Dear [Member Name],

This is a reminder from BAFCI that your monthly payment 
is past due for [X] month(s).

Please settle your payment at your earliest convenience 
to avoid further late fees.

Thank you for your cooperation.
```

## Important Notes
- ✅ Only sends to members with valid phone numbers
- ✅ Excludes inactive members automatically
- ✅ 500ms delay between bulk SMS to prevent rate limiting
- ⚠️ Each SMS consumes PhilSMS credits
- ⚠️ Ensure PhilSMS account has sufficient balance

## API Endpoints (for testing)

### Get Overdue Members
```bash
GET http://localhost:5000/api/notifications/overdue-members?monthsOverdue=3
```

### Send Test SMS
```bash
POST http://localhost:5000/api/notifications/test-sms
Content-Type: application/json

{
  "phoneNumber": "09171234567",
  "message": "Test message from BAFCI"
}
```

### Send to Specific Member
```bash
POST http://localhost:5000/api/notifications/send-overdue-sms/:memberId
Content-Type: application/json

{
  "monthsOverdue": 3
}
```

### Send Bulk SMS
```bash
POST http://localhost:5000/api/notifications/send-bulk-overdue-sms
Content-Type: application/json

{
  "monthsOverdue": 3
}
```

## Configuration Check
Verify your `.env` file has these settings:
```env
PHILSMS_API_BASE_URL=https://app.philsms.com/api/v3
PHILSMS_API_TOKEN=3282|Y9htAe0wZDfKKsUObIykroAjI1akYAnDA5QhvCfk
PHILSMS_SENDER_ID=PhilSMS
```

## Testing the System
1. Start the server: `npm run dev` (in server folder)
2. Start the client: `npm run dev` (in client folder)
3. Navigate to http://localhost:5173/notifications
4. Test with a single member first before bulk sending

---
✨ **Ready to use!** No additional dependencies needed.
