# How to Get Your Auth Token

## Quick Methods

### Method 1: Using PowerShell (Recommended for Windows)

1. Open PowerShell in the project directory
2. Run the script:
```powershell
.\get-token.ps1
```
3. Enter your email and password
4. Copy the token displayed

### Method 2: Using Git Bash

1. Open Git Bash in the project directory
2. Make the script executable:
```bash
chmod +x get-token.sh
```
3. Run the script:
```bash
./get-token.sh
```
4. Enter your email and password
5. Copy the token displayed

### Method 3: Using curl directly

**In Git Bash:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}'
```

**In PowerShell:**
```powershell
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"your-email@example.com\",\"password\":\"your-password\"}'
```

### Method 4: Using Browser Console (Easiest!)

1. Open your BAFCI app in the browser (http://localhost:5173)
2. Log in normally
3. Open Developer Tools (F12)
4. Go to Console tab
5. Type:
```javascript
localStorage.getItem('token')
```
6. Copy the token (without quotes)

### Method 5: Using Browser DevTools - Application Tab

1. Open your BAFCI app in the browser
2. Log in normally
3. Press F12 to open Developer Tools
4. Go to **Application** tab
5. Expand **Local Storage** → **http://localhost:5173**
6. Find the **token** key
7. Copy the value

---

## Using the Token

Once you have your token, use it to test the SMS scheduler:

**Git Bash:**
```bash
curl -X POST http://localhost:5000/api/notifications/trigger-auto-sms \
  -H "x-auth-token: YOUR_TOKEN_HERE"
```

**PowerShell:**
```powershell
curl -X POST http://localhost:5000/api/notifications/trigger-auto-sms `
  -H "x-auth-token: YOUR_TOKEN_HERE"
```

**Or just use the NotificationPanel in the UI!**
- Open the app
- Click Notifications at bottom of sidebar
- Go to SMS Alerts tab
- Click "Send SMS to All" button

---

## Troubleshooting

### "Command not found: curl"
- **Git Bash**: curl should be available by default
- **PowerShell**: Use `Invoke-RestMethod` instead or install curl

### "Login failed"
- Check if server is running on port 5000
- Verify your email and password are correct
- Make sure you have an account in the system

### Token expires
- Tokens may expire after some time
- Just log in again to get a new token

---

## Quick Test Without Token

You can also test by using the UI:
1. Start the server: `npm run dev` (in server folder)
2. Start the client: `npm run dev` (in client folder)
3. Log in to the app
4. Open Notifications panel (bottom of sidebar)
5. Click "SMS Alerts" tab
6. Click "Send SMS to All" button

The UI handles authentication automatically!
