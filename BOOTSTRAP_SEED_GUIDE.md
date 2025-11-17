# 🚀 Bootstrap Endpoint - Seed Production Database

## What I've Created

I've created a **secure, temporary API endpoint** that will seed your production database with an admin user. This works without needing Render Shell access.

### Files Created:
1. ✅ `server/scripts/seedAdminRunner.js` - Reusable seed logic
2. ✅ `server/routes/bootstrap.js` - Secure API endpoint
3. ✅ Updated `server/server.js` - Registered the bootstrap route

---

## Step-by-Step Instructions

### **Step 1: Add Secret Token to Render Environment Variables**

1. Go to https://dashboard.render.com/
2. Click on your **backend service** (bafci-backend)
3. Click **"Environment"** tab
4. Click **"Add Environment Variable"**
5. Add:
   - **Key**: `ADMIN_SEED_TOKEN`
   - **Value**: `bafci-secret-seed-2025` (or any secret string you want)
6. Click **"Save Changes"**

Render will automatically redeploy with this new variable.

---

### **Step 2: Push Code to GitHub**

```bash
cd c:\Users\gabby\Desktop\Projects\Bafci

# Add all new files
git add server/scripts/seedAdminRunner.js
git add server/routes/bootstrap.js
git add server/server.js

# Commit
git commit -m "Add bootstrap endpoint for seeding production database"

# Push
git push origin main
```

---

### **Step 3: Wait for Render to Deploy**

After pushing, Render will automatically redeploy. Wait **2-3 minutes** for deployment to complete.

You can check the deployment status in Render Dashboard → Your backend service → "Events" tab.

---

### **Step 4: Call the Bootstrap Endpoint**

Once deployed, use one of these methods to call the endpoint:

#### **Option A: Using PowerShell (Windows)**

```powershell
$headers = @{
    "x-seed-token" = "bafci-secret-seed-2025"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "https://bafci-backend.onrender.com/api/bootstrap/seed-admin" -Method POST -Headers $headers
```

Replace `https://bafci-backend.onrender.com` with your actual backend URL.

#### **Option B: Using curl (if you have it)**

```bash
curl -X POST https://bafci-backend.onrender.com/api/bootstrap/seed-admin \
  -H "x-seed-token: bafci-secret-seed-2025"
```

#### **Option C: Using Browser Extension (Postman, Thunder Client, etc.)**

- **Method**: POST
- **URL**: `https://bafci-backend.onrender.com/api/bootstrap/seed-admin`
- **Headers**:
  - Key: `x-seed-token`
  - Value: `bafci-secret-seed-2025`

---

### **Step 5: Verify Success**

You should get a response like:

```json
{
  "success": true,
  "message": "Admin user created successfully",
  "username": "admin",
  "role": 3,
  "alreadyExists": false
}
```

If the user already exists:

```json
{
  "success": true,
  "message": "Admin user already exists",
  "username": "admin",
  "alreadyExists": true
}
```

---

### **Step 6: Login to Production**

1. Visit your Render frontend URL (e.g., `https://bafci.onrender.com`)
2. Login with:
   - **Username**: `admin`
   - **Password**: `admin12345`
3. **Success!** 🎉

---

### **Step 7: Remove the Bootstrap Endpoint (IMPORTANT!)**

After successfully seeding, you should **remove this endpoint** for security:

1. **Edit `server/server.js`**:
   - Remove the line: `import bootstrapRoutes from './routes/bootstrap.js';`
   - Remove the line: `app.use('/api/bootstrap', bootstrapRoutes);`

2. **Delete the files** (optional but recommended):
   - `server/routes/bootstrap.js`

3. **Remove the environment variable** from Render:
   - Go to Render Dashboard → Environment tab
   - Delete `ADMIN_SEED_TOKEN`

4. **Commit and push**:
   ```bash
   git add server/server.js
   git commit -m "Remove bootstrap endpoint after seeding"
   git push origin main
   ```

---

## Security Features

✅ **Token-based authentication** - Requires secret token from environment variables  
✅ **No hardcoded secrets** - Token is stored in Render's secure environment  
✅ **Idempotent** - Can be called multiple times safely (won't create duplicates)  
✅ **Temporary** - Should be removed after use  

---

## Troubleshooting

### "ADMIN_SEED_TOKEN not configured"
- Make sure you added the environment variable in Render
- Wait for the deployment to complete after adding it

### "Invalid or missing seed token"
- Check that the token in your request matches the one in Render environment variables
- Make sure the header name is exactly `x-seed-token`

### "Cannot connect to database"
- Check Render logs to see if the database connection is working
- Verify your DATABASE_URL is correct in Render environment variables

### 403 Forbidden
- Your token doesn't match
- Double-check the `x-seed-token` header value

---

## Admin User Details

After seeding, you'll have:

- **Name**: Administrator
- **Username**: `admin`
- **Password**: `admin12345`
- **Email**: admin@bafci.com
- **Phone**: 09123456789
- **Role**: `3` (Account Manager - can create staff accounts)

**Note**: If you need full admin access (role 1), let me know and I'll update the script before you deploy.

---

## Quick Reference

**Your Backend URL**: `https://bafci-backend.onrender.com` (replace with actual)  
**Endpoint**: `POST /api/bootstrap/seed-admin`  
**Header**: `x-seed-token: bafci-secret-seed-2025`  

**PowerShell Command**:
```powershell
$headers = @{"x-seed-token" = "bafci-secret-seed-2025"}
Invoke-RestMethod -Uri "https://bafci-backend.onrender.com/api/bootstrap/seed-admin" -Method POST -Headers $headers
```

---

**Follow the steps above and you'll have your production database seeded!** 🚀
