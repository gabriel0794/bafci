# 🌱 How to Seed Your Production Database

## Quick Summary

I've created a seed script that will create an admin user in your database. You can run this script to populate **both local and production** databases.

---

## Step 1: Fix Your Local .env File First! ⚠️

**IMPORTANT**: Before running anything, you MUST fix your local `.env` file.

### Open: `server/.env`

Find this line:
```env
DATABASE_URL=postgresql://newbafci_user:sCE7yEkVI8OLdj6HHsrwF82JM2AJCboE@dpg-d4dalachg0os73dfpjd0-a/newbafci
```

**Comment it out or delete it:**
```env
# DATABASE_URL is ONLY for Render - DO NOT use locally!
# DATABASE_URL=postgresql://newbafci_user:sCE7yEkVI8OLdj6HHsrwF82JM2AJCboE@dpg-d4dalachg0os73dfpjd0-a/newbafci
```

**Save the file!**

---

## Step 2: Seed Your Production Database

### Option A: Run Seed Script Locally (Pointing to Production)

Temporarily set the DATABASE_URL to point to production and run the seed:

```bash
cd c:\Users\gabby\Desktop\Projects\Bafci\server

# Set DATABASE_URL for this command only (Windows PowerShell)
$env:DATABASE_URL="postgresql://newbafci_user:sCE7yEkVI8OLdj6HHsrwF82JM2AJCboE@dpg-d4dalachg0os73dfpjd0-a/newbafci"; node scripts/seedAdmin.js

# Or for Command Prompt (cmd)
set DATABASE_URL=postgresql://newbafci_user:sCE7yEkVI8OLdj6HHsrwF82JM2AJCboE@dpg-d4dalachg0os73dfpjd0-a/newbafci && node scripts/seedAdmin.js
```

### Option B: Add Seed Script to Render (Recommended)

1. **Push the seed script to GitHub:**
   ```bash
   cd c:\Users\gabby\Desktop\Projects\Bafci
   git add server/scripts/seedAdmin.js
   git commit -m "Add database seed script for admin user"
   git push origin main
   ```

2. **Run it on Render:**
   - Go to your Render backend service dashboard
   - Click on "Shell" tab (or "Console")
   - Run this command:
     ```bash
     node scripts/seedAdmin.js
     ```

---

## Step 3: Test Your Production Login

After seeding, you can login to your production site with:

**Login Credentials:**
- **Username**: `admin`
- **Password**: `admin123`

**⚠️ IMPORTANT**: Change this password immediately after first login!

---

## What the Seed Script Does

The script will:
1. ✅ Connect to the database (local or production based on environment)
2. ✅ Check if admin user already exists
3. ✅ If not, create an admin user with:
   - Name: Administrator
   - Username: admin
   - Password: admin123 (hashed with bcrypt)
   - Role: 1 (admin - full access)
   - Email: admin@bafci.com
   - Phone: 09123456789
   - Address: BAFCI Main Office

4. ✅ Can be run multiple times safely (won't create duplicates)

---

## Troubleshooting

### "User already exists"
This is normal! It means the admin user is already in the database. You can login with the credentials above.

### "Cannot connect to database"
- **Local**: Make sure your local PostgreSQL is running
- **Production**: Check that your DATABASE_URL is correct

### "Module not found"
Make sure you're in the `server` directory when running the script.

---

## After Seeding

### For Local Development:
1. Make sure `DATABASE_URL` is removed/commented from your `.env`
2. Run `npm run dev`
3. Login at http://localhost:5173

### For Production:
1. Visit your Render frontend URL
2. Login with admin/admin123
3. **Change the password immediately!**

---

## Adding More Users

Once you have admin access, you can:
1. Login to the system
2. Use the signup/user management features to add more staff
3. Or create additional seed scripts for other initial data

---

## Summary

**To seed production database:**

**Quick Method (PowerShell):**
```powershell
cd c:\Users\gabby\Desktop\Projects\Bafci\server
$env:DATABASE_URL="postgresql://newbafci_user:sCE7yEkVI8OLdj6HHsrwF82JM2AJCboE@dpg-d4dalachg0os73dfpjd0-a/newbafci"; node scripts/seedAdmin.js
```

**Or via Render Shell:**
1. Push script to GitHub
2. Open Render Shell
3. Run: `node scripts/seedAdmin.js`

**Login credentials:**
- Username: `admin`
- Password: `admin123`

---

**Need help? Let me know!** 🚀
