# 🔧 CORS Fix for Production

## Problem

Your frontend (`https://bafci-client.onrender.com`) is being blocked by CORS because the backend only allowed `https://bafci.onrender.com`.

## Solution Applied ✅

I've updated `server/server.js` to include your actual frontend URLs:

```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'https://bafci.onrender.com',
  'https://bafci-client.onrender.com',  // ← Added
  'https://bafci-testing.onrender.com', // ← Added
  process.env.FRONTEND_URL
].filter(Boolean);
```

---

## What You Need to Do

### **Step 1: Commit and Push**

```bash
cd c:\Users\gabby\Desktop\Projects\Bafci

git add server/server.js
git commit -m "Fix CORS: Add production frontend URLs to allowed origins"
git push origin main
```

### **Step 2: Wait for Render to Redeploy**

- Go to Render Dashboard → Your backend service
- Wait 2-3 minutes for deployment to complete
- Check "Events" tab for "Deploy live" status

### **Step 3: Test Login Again**

Once deployed, try logging in again at:
- `https://bafci-client.onrender.com`

With credentials:
- **Username**: `admin`
- **Password**: `admin12345`

---

## Optional: Use Environment Variable

For better flexibility, you can also set the `FRONTEND_URL` environment variable in Render:

1. Go to Render Dashboard → Backend service → Environment tab
2. Update or add:
   - **Key**: `FRONTEND_URL`
   - **Value**: `https://bafci-client.onrender.com`

This way, the CORS configuration will automatically use the correct URL.

---

## After This Works

Once login works, remember to:
1. ✅ Remove the bootstrap endpoint (for security)
2. ✅ Change your admin password
3. ✅ Test all features

---

**Push the code now and wait for deployment!** 🚀
