# Automatic SMS Scheduler - Setup Guide

## Overview
The BAFCI system now includes an **automatic SMS scheduler** that sends payment reminders to members with overdue payments (3+ months) without any manual intervention. This prevents forgetfulness and human errors.

## 🤖 How It Works

### Automatic Scheduling
- **Runs Daily**: Every day at **9:00 AM (Asia/Manila timezone)**
- **Checks Overdue Members**: Automatically identifies members who haven't paid in 3+ months
- **Sends SMS Reminders**: Sends payment reminder SMS to all overdue members
- **Prevents Duplicates**: Won't send multiple SMS to the same member on the same day
- **Logs Activity**: All actions are logged in the server console

### Smart Features
✅ **Duplicate Prevention** - Only sends one SMS per member per day  
✅ **Rate Limiting** - 1-second delay between SMS to avoid API throttling  
✅ **Status Filtering** - Only sends to members with 'Alive' status  
✅ **Phone Validation** - Skips members without valid phone numbers  
✅ **Error Handling** - Continues even if some SMS fail  
✅ **Automatic Cleanup** - Clears old logs after 24 hours  

## 📅 Schedule Configuration

The scheduler runs at **9:00 AM every day**. To change the schedule, edit `server/services/smsScheduler.js`:

```javascript
// Current schedule: 9:00 AM daily
cron.schedule('0 9 * * *', async () => {
  // SMS check logic
});
```

### Common Schedule Examples:
```javascript
'0 9 * * *'     // 9:00 AM every day
'0 8 * * 1'     // 8:00 AM every Monday
'0 10 * * 1-5'  // 10:00 AM Monday to Friday
'0 9 1 * *'     // 9:00 AM on the 1st of every month
'0 9 1,15 * *'  // 9:00 AM on 1st and 15th of every month
```

## 🚀 Installation & Setup

### 1. Install Dependencies
```bash
cd server
npm install
```

This will install `node-cron` which is required for the scheduler.

### 2. Start the Server
```bash
npm run dev
```

You should see:
```
Server started on port 5000
[SMS Scheduler] Initializing automatic SMS scheduler...
[SMS Scheduler] Scheduled to run daily at 9:00 AM (Asia/Manila timezone)
```

### 3. Verify PhilSMS Credits
⚠️ **Important**: Make sure your PhilSMS account has sufficient credits before the scheduler runs!

- Log in to https://app.philsms.com
- Check your SMS credit balance
- Add credits if needed

## 🧪 Testing the Scheduler

### Option 1: Manual Trigger via API
Test the scheduler without waiting for 9:00 AM:

```bash
POST http://localhost:5000/api/notifications/trigger-auto-sms
Headers: x-auth-token: YOUR_AUTH_TOKEN
```

### Option 2: Enable Immediate Run on Startup
Edit `server/services/smsScheduler.js` and uncomment this line:

```javascript
// Optional: Run immediately on startup for testing
checkAndSendOverdueSMS(); // ← Uncomment this line
```

Then restart the server. The scheduler will run immediately.

### Option 3: Check Server Logs
Monitor the server console for scheduler activity:

```
[SMS Scheduler] Running overdue payment check...
[SMS Scheduler] Found 3 overdue member(s)
[SMS Scheduler] ✓ SMS sent to John Doe (09171234567)
[SMS Scheduler] ✓ SMS sent to Jane Smith (09181234567)
[SMS Scheduler] ✗ Failed to send SMS to Bob Johnson: Insufficient credits
[SMS Scheduler] Completed: 2 sent, 1 failed
```

## 📊 Monitoring & Logs

### What Gets Logged
- Scheduler start time
- Number of overdue members found
- SMS sent successfully (with member name and phone)
- SMS failures (with error reason)
- Summary of results (success/failure counts)

### Example Log Output
```
[SMS Scheduler] Triggered at 9:00 AM
[SMS Scheduler] Running overdue payment check...
[SMS Scheduler] Found 5 overdue member(s)
[SMS Scheduler] ✓ SMS sent to Maria Santos (09171234567)
[SMS Scheduler] Already sent SMS to Juan Dela Cruz today. Skipping...
[SMS Scheduler] ✓ SMS sent to Pedro Reyes (09181234567)
[SMS Scheduler] ✗ Failed to send SMS to Ana Garcia: Insufficient credits
[SMS Scheduler] ✓ SMS sent to Carlos Lopez (09191234567)
[SMS Scheduler] Completed: 3 sent, 1 failed
```

## ⚙️ Configuration Options

### Change Timezone
Edit `server/services/smsScheduler.js`:

```javascript
cron.schedule('0 9 * * *', async () => {
  // ...
}, {
  timezone: 'Asia/Manila' // Change to your timezone
});
```

Common timezones:
- `Asia/Manila` - Philippines
- `Asia/Singapore` - Singapore
- `Asia/Tokyo` - Japan
- `America/New_York` - US Eastern
- `Europe/London` - UK

### Change Overdue Threshold
Currently set to 3 months. To change, edit the `monthsOverdue` variable in `smsScheduler.js`:

```javascript
const monthsOverdue = 3; // Change to 2, 4, etc.
```

### Adjust Rate Limiting
Change the delay between SMS sends:

```javascript
// Current: 1000ms (1 second)
await new Promise(resolve => setTimeout(resolve, 1000));

// Faster: 500ms
await new Promise(resolve => setTimeout(resolve, 500));

// Slower: 2000ms (2 seconds)
await new Promise(resolve => setTimeout(resolve, 2000));
```

## 🔧 Troubleshooting

### Scheduler Not Running
1. **Check server logs** - Look for initialization message
2. **Verify node-cron installed** - Run `npm list node-cron`
3. **Check timezone** - Ensure timezone is correct for your location
4. **Restart server** - Stop and start the server again

### SMS Not Sending
1. **Check PhilSMS credits** - Log in to PhilSMS dashboard
2. **Verify API credentials** - Check `.env` file has correct token
3. **Check member phone numbers** - Ensure members have valid phone numbers
4. **Review server logs** - Look for specific error messages

### Duplicate SMS Sent
The system prevents duplicates automatically, but if you're still seeing them:
1. **Check server restarts** - Each restart clears the duplicate log
2. **Verify date/time** - System uses server date/time for duplicate checking

### No Overdue Members Found
This is normal if all members are up to date! The scheduler will log:
```
[SMS Scheduler] No overdue members found. All members are up to date!
```

## 📱 SMS Message Format

Members receive this message:

```
Dear [Member Name],

This is a reminder from BAFCI that your monthly payment 
is past due for 3 month(s).

Please settle your payment at your earliest convenience 
to avoid further late fees.

Thank you for your cooperation.
```

## 💡 Best Practices

1. **Monitor Credits**: Check PhilSMS balance regularly
2. **Review Logs**: Check server logs daily for any issues
3. **Test First**: Use manual trigger to test before relying on automation
4. **Update Phone Numbers**: Keep member contact information current
5. **Adjust Schedule**: Set schedule based on your office hours
6. **Backup Manual Option**: Keep manual SMS option in NotificationPanel as backup

## 🔐 Security Notes

- Only authenticated admin users can trigger manual SMS checks
- API endpoints are protected with authentication middleware
- SMS logs are cleared automatically after 24 hours
- No sensitive data is stored in SMS logs

## 📞 Support

If you encounter issues:
1. Check server console logs for detailed error messages
2. Verify PhilSMS API status: https://app.philsms.com
3. Review this guide for troubleshooting steps
4. Check that all dependencies are installed: `npm install`

---

## Quick Reference

### Files Modified/Created
- `server/services/smsScheduler.js` - Main scheduler logic
- `server/server.js` - Scheduler initialization
- `server/routes/notification.js` - Manual trigger endpoint
- `server/package.json` - Added node-cron dependency

### API Endpoints
- `POST /api/notifications/trigger-auto-sms` - Manual trigger (requires auth)

### Environment Variables Required
```env
PHILSMS_API_BASE_URL=https://app.philsms.com/api/v3
PHILSMS_API_TOKEN=your_token_here
PHILSMS_SENDER_ID=PhilSMS
```

---

**Last Updated**: November 2025  
**Version**: 2.0.0 (Automatic Scheduler)
