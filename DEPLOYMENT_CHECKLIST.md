# 🚀 BAFCI Render Deployment - Quick Checklist

## ✅ Pre-Deployment Preparation (COMPLETED)

- [x] Updated CORS configuration to support production URLs
- [x] Created centralized API configuration system
- [x] Created environment variable files (.env.example, .env.production)
- [x] Updated main API service to use environment-based URLs

## 📋 What You Need to Do Next

### **1. Update Remaining Frontend Files** ⚠️

Your frontend still has **hardcoded localhost URLs** in multiple files. You have two options:

#### **Option A: Quick Fix (Recommended for now)**
Just deploy as-is and manually update the backend URL in `.env.production` file:
- The main API calls in `api.js` are already fixed
- Other files will need updating later for full production readiness

#### **Option B: Complete Fix (Better for production)**
Update all files to use the centralized API config. I can help you with this if needed.

---

### **2. Push Code to GitHub** 📤

```bash
# Navigate to your project
cd c:\Users\gabby\Desktop\Projects\Bafci

# Check git status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Prepare for Render deployment - Update API config and CORS"

# Push to GitHub (create repo first if needed)
git push origin main
```

**Don't have a GitHub repo yet?**
1. Go to https://github.com/new
2. Create a new repository named "bafci" (or any name)
3. Follow GitHub's instructions to push your code

---

### **3. Deploy Backend to Render** 🖥️

1. **Go to**: https://dashboard.render.com/
2. **Click**: "New +" → "Web Service"
3. **Connect**: Your GitHub repository
4. **Configure**:
   - **Name**: `bafci-backend`
   - **Region**: Singapore (or closest to Philippines)
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (or paid for 24/7 uptime)

5. **Environment Variables** (Click "Advanced" → "Add Environment Variable"):

   ```
   DATABASE_URL = postgresql://newbafci_user:sCE7yEkVI8OLdj6HHsrwF82JM2AJCboE@dpg-d4dalachg0os73dfpjd0-a/newbafci
   PORT = 10000
   JWT_SECRET = your_super_secret_jwt_key
   PHILSMS_API_BASE_URL = https://app.philsms.com/api/v3
   PHILSMS_API_TOKEN = 3282|Y9htAe0wZDfKKsUObIykroAjI1akYAnDA5QhvCfk
   PHILSMS_SENDER_ID = PhilSMS
   NODE_ENV = production
   ```

6. **Click**: "Create Web Service"
7. **Wait**: 2-5 minutes for deployment
8. **Copy**: Your backend URL (e.g., `https://bafci-backend.onrender.com`)

---

### **4. Deploy Frontend to Render** 🌐

1. **Go back to**: Render Dashboard
2. **Click**: "New +" → "Static Site"
3. **Connect**: Same GitHub repository
4. **Configure**:
   - **Name**: `bafci` or `bafci-frontend`
   - **Branch**: `main`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

5. **Environment Variables**:
   ```
   VITE_API_BASE_URL = https://bafci-backend.onrender.com
   ```
   ⚠️ **IMPORTANT**: Replace with your actual backend URL from step 3!

6. **Click**: "Create Static Site"
7. **Wait**: 3-5 minutes for deployment
8. **Copy**: Your frontend URL (e.g., `https://bafci.onrender.com`)

---

### **5. Update Backend CORS** 🔄

1. Go to your **backend service** on Render
2. Click **"Environment"** tab
3. **Add new environment variable**:
   ```
   FRONTEND_URL = https://bafci.onrender.com
   ```
   ⚠️ Use your actual frontend URL from step 4!
4. **Save** (this will trigger a redeploy)

---

### **6. Test Your Deployment** 🧪

1. **Open your frontend URL** in a browser
2. **Try to login** with your credentials
3. **Check if**:
   - [ ] Login works
   - [ ] Dashboard loads
   - [ ] Members page works
   - [ ] Payments can be recorded
   - [ ] SMS notifications are configured

---

## 🔧 Troubleshooting

### Backend won't start
- Check logs in Render dashboard
- Verify DATABASE_URL is correct
- Ensure all environment variables are set

### Frontend can't connect to backend
- Check browser console (F12)
- Verify VITE_API_BASE_URL is correct
- Check CORS settings in backend

### Database connection fails
- Verify your Render PostgreSQL database is running
- Check if internal database URL is correct
- Test connection from Render logs

### SMS not working
- Free tier services sleep after 15 min inactivity
- Cron jobs may not run reliably on free tier
- Consider upgrading to paid tier ($7/month)

---

## 💡 Important Notes

### **Free Tier Limitations**
- ⏰ Services sleep after 15 minutes of inactivity
- 🐌 First request after sleep takes 30-60 seconds
- 📅 Cron jobs (SMS scheduler) may not run reliably

### **For Production Use**
Consider upgrading to **paid tier** ($7/month per service):
- ✅ 24/7 uptime
- ✅ No cold starts
- ✅ Reliable cron jobs for SMS
- ✅ Better performance

---

## 📞 Need Help?

If you encounter issues:
1. Check the detailed guide: `RENDER_DEPLOYMENT_GUIDE.md`
2. Review Render logs in the dashboard
3. Verify all environment variables
4. Check browser console for errors

---

## 🎉 Success!

Once deployed, your URLs will be:
- **Backend**: `https://bafci-backend.onrender.com`
- **Frontend**: `https://bafci.onrender.com`

**Next Steps After Deployment**:
1. Update remaining frontend files to use API config (optional)
2. Set up custom domain (optional)
3. Monitor logs and performance
4. Consider upgrading to paid tier for production

---

**Good luck with your deployment! 🚀**
