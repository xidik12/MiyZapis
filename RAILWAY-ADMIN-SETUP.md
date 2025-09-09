# 🚂 Railway Admin Setup Guide

This guide will help you create an admin user for your Railway deployment.

## 🎯 Quick Setup (Recommended)

### Method 1: Using Railway CLI

1. **Install Railway CLI** (if not already installed):
```bash
npm install -g @railway/cli
```

2. **Login to Railway**:
```bash
railway login
```

3. **Connect to your project**:
```bash
railway link
```

4. **Run admin creation script**:
```bash
railway run npm run railway:create-admin
```

This will create an admin user with default credentials:
- **Email**: `admin@miyzapis.com`
- **Password**: `Admin123!@#Railway`

### Method 2: Using Environment Variables (Custom Admin)

1. **Set environment variables in Railway Dashboard**:
   - Go to your Railway project dashboard
   - Navigate to Variables tab
   - Add these variables:
     ```
     ADMIN_EMAIL=your-admin@example.com
     ADMIN_FIRST_NAME=Your
     ADMIN_LAST_NAME=Name
     ADMIN_PASSWORD=YourSecurePassword123!
     ```

2. **Deploy and run script**:
```bash
railway run npm run railway:create-admin
```
not deploy
### Method 3: Manual Database Script (Advanced)

1. **Connect to Railway shell**:
```bash
railway shell
```

2. **Run admin creation**:
```bash
npm run railway:create-admin
```

## 🔐 Login Instructions

After creating the admin user:

1. **Go to your website**: `https://your-app.railway.app/auth/login`
2. **Login with your admin credentials**
3. **You'll be automatically redirected to**: `/admin/dashboard`

## 🛡️ Default Admin Credentials

If you used the default setup:
- **Email**: `admin@miyzapis.com`  
- **Password**: `Admin123!@#Railway`

**⚠️ IMPORTANT**: Change the password immediately after first login!

## 🔧 Environment Variables (Optional)

You can customize the admin account by setting these in Railway:

| Variable | Description | Default |
|----------|-------------|---------|
| `ADMIN_EMAIL` | Admin email address | `admin@miyzapis.com` |
| `ADMIN_FIRST_NAME` | Admin first name | `System` |
| `ADMIN_LAST_NAME` | Admin last name | `Administrator` |
| `ADMIN_PASSWORD` | Admin password | `Admin123!@#Railway` |

## 🚨 Security Best Practices

1. **Change default password** after first login
2. **Delete the admin setup script** after use:
   ```bash
   railway shell
   rm src/scripts/railway-admin-setup.ts
   ```
3. **Use strong passwords** with special characters
4. **Monitor admin access** through logs
5. **Keep admin credentials secure** and don't share them

## 🔍 Troubleshooting

### Error: "Admin user already exists"
- The admin account is already created
- Use the existing credentials to login

### Error: "Cannot connect to database"  
- Check if `DATABASE_URL` environment variable is set
- Ensure your Railway database is running

### Error: "Permission denied"
- Make sure you have proper Railway access
- Try running `railway login` again

### Script not found
- Make sure you're in the backend directory
- Run `npm install` to ensure dependencies are installed

## 📱 Admin Dashboard Features

Once logged in as admin, you'll have access to:

- 📊 **Dashboard Statistics** - Platform metrics and analytics
- 👥 **User Management** - Activate, deactivate, or delete users  
- 📈 **Analytics** - User, booking, and financial analytics
- 🔧 **System Health** - Monitor platform performance
- 📋 **Audit Logs** - Track admin actions and changes

## 🆘 Need Help?

If you encounter issues:

1. Check Railway logs: `railway logs`
2. Verify database connection: `railway shell` → `npm run railway:migrate`
3. Contact support with error details

---

**Happy administrating! 🎉**