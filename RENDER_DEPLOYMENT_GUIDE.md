# BAFCI System - Render Deployment Guide

## Prerequisites
- ✅ Render account (free tier works)
- ✅ Database URL (you already have this!)
- ✅ GitHub repository with your code

---

## Deployment Steps

### **Step 1: Push Your Code to GitHub**

If you haven't already, initialize a git repository and push to GitHub:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Prepare for Render deployment"

# Add remote (replace with your GitHub repo URL)
git remote add origin https://github.com/YOUR_USERNAME/bafci.git

# Push to GitHub
git push -u origin main
```

---

### **Step 2: Create a Web Service on Render**

1. **Go to Render Dashboard**: https://dashboard.render.com/
2. **Click "New +"** → Select **"Web Service"**
3. **Connect Your GitHub Repository**
   - Authorize Render to access your GitHub
   - Select your BAFCI repository

4. **Configure the Web Service**:
   - **Name**: `bafci-backend` (or any name you prefer)
   - **Region**: Choose closest to your users (e.g., Singapore for Asia)
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (or paid if you need better performance)

---

### **Step 3: Configure Environment Variables**

In the Render dashboard, scroll down to **"Environment Variables"** section and add the following:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `postgresql://newbafci_user:sCE7yEkVI8OLdj6HHsrwF82JM2AJCboE@dpg-d4dalachg0os73dfpjd0-a/newbafci` |
| `PORT` | `10000` |
| `JWT_SECRET` | `your_super_secret_jwt_key` |
| `PHILSMS_API_BASE_URL` | `https://app.philsms.com/api/v3` |
| `PHILSMS_API_TOKEN` | `3282|Y9htAe0wZDfKKsUObIykroAjI1akYAnDA5QhvCfk` |
| `PHILSMS_SENDER_ID` | `PhilSMS` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://bafci.onrender.com` (update after deploying frontend) |

**⚠️ IMPORTANT SECURITY NOTE**: 
- Consider changing your `JWT_SECRET` to a more secure random string
- Keep your API tokens private and never commit them to GitHub

---

### **Step 4: Deploy the Backend**

1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Start your server
3. Wait for deployment to complete (usually 2-5 minutes)
4. Your backend will be available at: `https://bafci-backend.onrender.com` (or your chosen name)

---

### **Step 5: Deploy the Frontend (Static Site)**

1. **Go back to Render Dashboard**
2. **Click "New +"** → Select **"Static Site"**
3. **Connect the same GitHub repository**
4. **Configure the Static Site**:
   - **Name**: `bafci-frontend`
   - **Branch**: `main`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

5. **Add Environment Variable for Frontend**:
   - Key: `VITE_API_URL`
   - Value: `https://bafci-backend.onrender.com` (your backend URL)

6. Click **"Create Static Site"**

---

### **Step 6: Update Frontend API Configuration**

After deployment, you need to update your frontend to use the production API URL.

The frontend will be available at: `https://bafci.onrender.com` (or your chosen name)

---

### **Step 7: Update Backend CORS Settings**

Go back to your backend service on Render:
1. Navigate to **Environment** tab
2. Update `FRONTEND_URL` to your actual frontend URL: `https://bafci.onrender.com`
3. Save changes (this will trigger a redeploy)

---

## Post-Deployment Checklist

- [ ] Backend is running and accessible
- [ ] Frontend is deployed and loads correctly
- [ ] Database connection is working
- [ ] Login/authentication works
- [ ] SMS notifications are functioning
- [ ] All API endpoints are accessible
- [ ] CORS is properly configured

---

## Troubleshooting

### **Backend won't start**
- Check the logs in Render dashboard
- Verify all environment variables are set correctly
- Ensure `DATABASE_URL` is correct

### **Frontend can't connect to backend**
- Check CORS configuration
- Verify `VITE_API_URL` is set correctly
- Check browser console for errors

### **Database connection errors**
- Verify your Render PostgreSQL database is running
- Check if the internal database URL is correct
- Ensure your database allows connections from Render IPs

### **SMS not working**
- Verify PhilSMS API credentials are correct
- Check if the cron job is running (Render free tier may sleep)
- Consider upgrading to paid tier for 24/7 uptime

---

## Important Notes

### **Free Tier Limitations**
- Services spin down after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds
- Cron jobs may not run reliably on free tier

### **Recommended for Production**
- Upgrade to paid tier ($7/month) for:
  - 24/7 uptime
  - Faster performance
  - Reliable cron jobs for SMS notifications
  - No cold starts

---

## Custom Domain (Optional)

To use a custom domain:
1. Go to your service settings
2. Click "Custom Domain"
3. Add your domain
4. Update DNS records as instructed by Render

---

## Monitoring

- **Logs**: Available in Render dashboard under "Logs" tab
- **Metrics**: View CPU, memory usage in "Metrics" tab
- **Events**: Check deployment history in "Events" tab

---

## Support

If you encounter issues:
- Check Render documentation: https://render.com/docs
- Review your application logs
- Verify environment variables
- Test database connectivity

---

**Your deployment URLs will be:**
- Backend: `https://bafci-backend.onrender.com`
- Frontend: `https://bafci.onrender.com`

Good luck with your deployment! 🚀
