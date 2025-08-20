# Railway Environment Variables Configuration

## 🚨 URGENT: Backend Service 502 Error Fix

The backend service is returning 502 errors because essential environment variables are missing. Here are the variables that need to be configured in the Railway dashboard:

## Required Environment Variables for Backend Service

### 1. Core Application Settings
```
NODE_ENV=production
PORT=3000
API_VERSION=v1
```

### 2. Database Configuration
```
# DATABASE_URL is automatically provided by Railway PostgreSQL service
# No manual configuration needed
```

### 3. Redis Configuration (REQUIRED for Sessions and Caching)
```
# Get these values from your Railway Redis service
REDIS_URL=redis://default:your-redis-password@redis.railway.internal:6379
REDIS_PASSWORD=your-redis-password
```

**How to get Redis credentials:**
1. Go to Railway Dashboard → Your Project
2. Click on your **Redis service** (not backend)
3. Go to **Variables** tab
4. Copy `REDIS_URL` and `REDIS_PASSWORD` values
5. Add them to your **Backend service** variables

### 4. JWT Authentication (REQUIRED - Generated Secure Values)
```
JWT_SECRET=EEIvVim9Gfj1CbafVDGUL7IBigQNMq7FH5Ln+A6+7zEZJhkl5mTyMlHkpdvrf4Wt
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=PRzF2A+kEZF6G7AJa/sILee91ocBoUWbwcgqgYEQUk8Ts+gxA+0cSZWP3dBI8q5M
JWT_REFRESH_EXPIRES_IN=30d
```

### 5. Session Security (REQUIRED)
```
SESSION_SECRET=LqU/cQYx2pv/pOlYFtChl0K+Ay7G6b7JwaKpNgHGEJ8jdG5qaXCX5ovV0zoVi4+z
BCRYPT_ROUNDS=12
```

### 6. CORS Configuration (REQUIRED)
```
CORS_ORIGIN=https://miyzapis-frontend.up.railway.app,https://miyzapis-miniapp.up.railway.app,http://localhost:3000
```

### 7. Email Configuration (Gmail SMTP)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your-gmail-address@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM=your-gmail-address@gmail.com
```

### 8. Google OAuth Configuration (REQUIRED for Google Sign-In)
```
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_REDIRECT_URI=https://miyzapis-backend.up.railway.app/api/v1/auth-enhanced/google/callback
```

### 9. Rate Limiting & Security
```
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false
```

### 10. Logging Configuration
```
LOG_LEVEL=info
LOG_FILE_ENABLED=false
LOG_FILE_PATH=/tmp/logs
```

### 11. Optional: Telegram Bot (if configured)
```
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_WEBHOOK_URL=https://miyzapis-backend.up.railway.app/api/v1/telegram/webhook
TELEGRAM_WEBHOOK_SECRET=auto-generated-webhook-secret
```

## How to Configure in Railway Dashboard

### Method 1: Railway Dashboard (Recommended)
1. Go to [railway.app](https://railway.app) and open your project
2. Select the **Backend Service**
3. Go to **Variables** tab
4. Click **Add Variable** for each environment variable
5. Copy and paste the values from above

### Method 2: Railway CLI (if service linking works)
```bash
railway variables --set "JWT_SECRET=EEIvVim9Gfj1CbafVDGUL7IBigQNMq7FH5Ln+A6+7zEZJhkl5mTyMlHkpdvrf4Wt" --service backend
railway variables --set "JWT_REFRESH_SECRET=PRzF2A+kEZF6G7AJa/sILee91ocBoUWbwcgqgYEQUk8Ts+gxA+0cSZWP3dBI8q5M" --service backend
# ... continue for all variables
```

## Critical Variables for Immediate Fix

The **minimum variables** needed to fix the 502 error and Redis connection:

```
NODE_ENV=production
PORT=3000
JWT_SECRET=EEIvVim9Gfj1CbafVDGUL7IBigQNMq7FH5Ln+A6+7zEZJhkl5mTyMlHkpdvrf4Wt
JWT_REFRESH_SECRET=PRzF2A+kEZF6G7AJa/sILee91ocBoUWbwcgqgYEQUk8Ts+gxA+0cSZWP3dBI8q5M
SESSION_SECRET=LqU/cQYx2pv/pOlYFtChl0K+Ay7G6b7JwaKpNgHGEJ8jdG5qaXCX5ovV0zoVi4+z
EMAIL_FROM=noreply@miyzapis.com
CORS_ORIGIN=https://miyzapis-frontend.up.railway.app,http://localhost:3000
REDIS_URL=redis://default:your-redis-password@redis.railway.internal:6379
REDIS_PASSWORD=your-redis-password
```

**🔴 CRITICAL: Redis variables are required for:**
- User session storage
- Authentication token caching
- Google OAuth session management
- Logout functionality

## After Configuration

1. **Save all variables** in Railway dashboard
2. **Wait for automatic redeploy** (should take ~30 seconds)
3. **Test backend health**: Visit `https://miyzapis-backend.up.railway.app/health`
4. **Test authentication**: Try Google Sign-In from frontend

## Troubleshooting

If the backend still doesn't start:
1. Check Railway logs: Go to Backend Service → **Logs** tab
2. Look for specific error messages
3. Verify all required variables are set correctly
4. Ensure DATABASE_URL is automatically provided by PostgreSQL service

## Service URLs (Update these if different)
- Backend: `https://miyzapis-backend.up.railway.app`
- Frontend: `https://miyzapis-frontend.up.railway.app`
- Mini App: `https://miyzapis-miniapp.up.railway.app`

## Next Steps After Fix
1. Configure Gmail SMTP credentials for email functionality
2. Set up Google OAuth credentials for production
3. Configure Telegram Bot if needed
4. Update frontend environment variables to point to production backend