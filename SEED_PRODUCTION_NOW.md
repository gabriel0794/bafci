# 🚀 Seed Production Database - Quick Guide

## Your Custom Admin User

The seed script will create:
- **Username**: `admin`
- **Password**: `admin12345`
- **Role**: `3` (Account Manager - can create staff accounts)
- **Name**: Administrator
- **Email**: admin@bafci.com
- **Phone**: 09123456789
- **Address**: BAFCI Main Office

---

## How to Run the Seed Script

### **Option 1: Run from Your Computer (Recommended)**

Open PowerShell and run:

```powershell
cd c:\Users\gabby\Desktop\Projects\Bafci\server

$env:DATABASE_URL="postgresql://newbafci_user:sCE7yEkVI8OLdj6HHsrwF82JM2AJCboE@dpg-d4dalachg0os73dfpjd0-a/newbafci"
node scripts/seedAdmin.js
```

**Or if using Command Prompt (cmd):**

```cmd
cd c:\Users\gabby\Desktop\Projects\Bafci\server

set DATABASE_URL=postgresql://newbafci_user:sCE7yEkVI8OLdj6HHsrwF82JM2AJCboE@dpg-d4dalachg0os73dfpjd0-a/newbafci
node scripts/seedAdmin.js
```

---

### **Option 2: Via Render Shell**

1. **Push the script to GitHub first:**
   ```bash
   cd c:\Users\gabby\Desktop\Projects\Bafci
   git add server/scripts/seedAdmin.js
   git commit -m "Update seed script with custom admin credentials"
   git push origin main
   ```

2. **Go to Render Dashboard:**
   - Open your backend service
   - Click on "Shell" tab
   - Run: `node scripts/seedAdmin.js`

---

## Expected Output

When successful, you'll see:

```
🌱 Starting database seed...
Environment: production
Using DATABASE_URL: true
✅ Database connection established
✅ Admin user created successfully!

📋 Login Credentials:
   Username: admin
   Password: admin12345

⚠️  IMPORTANT: Change this password after first login!
```

---

## After Seeding

1. **Visit your Render frontend URL**
2. **Login with:**
   - Username: `admin`
   - Password: `admin12345`
3. **You're in!** 🎉

---

## Important Notes

### If You See "Admin user already exists"
This means the user is already in the database. You can login with the credentials above.

### Role 3 = Account Manager
According to your User model:
- Role 1 = Admin (full access)
- Role 2 = Staff (regular user)
- Role 3 = Account Manager (can only create staff accounts)

If you need full admin access (role 1), let me know and I'll update the script.

---

## Troubleshooting

### "Cannot connect to database"
- Make sure the DATABASE_URL is correct
- Check that your Render PostgreSQL database is running

### "Module not found"
- Make sure you're in the `server` directory
- Run `npm install` first if needed

---

## Quick Command (Copy & Paste)

**PowerShell:**
```powershell
cd c:\Users\gabby\Desktop\Projects\Bafci\server; $env:DATABASE_URL="postgresql://newbafci_user:sCE7yEkVI8OLdj6HHsrwF82JM2AJCboE@dpg-d4dalachg0os73dfpjd0-a/newbafci"; node scripts/seedAdmin.js
```

**Command Prompt:**
```cmd
cd c:\Users\gabby\Desktop\Projects\Bafci\server && set DATABASE_URL=postgresql://newbafci_user:sCE7yEkVI8OLdj6HHsrwF82JM2AJCboE@dpg-d4dalachg0os73dfpjd0-a/newbafci && node scripts/seedAdmin.js
```

---

**Run the command above and you'll be able to login to your production site!** 🚀
