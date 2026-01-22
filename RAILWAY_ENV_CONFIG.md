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
CORS_ORIGIN=https://panhaha.com,https://www.panhaha.com,https://panhaha-website-production.up.railway.app,http://localhost:3000
```

### 7. File Upload Storage (choose one)

#### Option A: Railway volume at `/app/uploads` (lovely-volume)
```
ENABLE_S3_STORAGE=false
FORCE_LOCAL_STORAGE=true
FILE_STORAGE=local
UPLOAD_DIR=/app/uploads
RAILWAY_VOLUME_MOUNT_PATH=/app/uploads
RAILWAY_PUBLIC_DOMAIN=huddle-backend-production.up.railway.app
```

#### Option B: AWS S3
```
# Enable S3 (set to false to force local storage)
ENABLE_S3_STORAGE=true
FORCE_LOCAL_STORAGE=false
FILE_STORAGE=s3

# S3 Credentials
AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_S3_BUCKET=your-bookingbot-bucket
AWS_S3_URL=https://your-bookingbot-bucket.s3.ap-southeast-2.amazonaws.com

# Optional: legacy bucket for existing files
AWS_S3_LEGACY_BUCKET=your-legacy-bucket
AWS_S3_LEGACY_URL=https://your-legacy-bucket.s3.ap-southeast-2.amazonaws.com
AWS_S3_LEGACY_REGION=ap-southeast-2
# If legacy bucket uses different credentials
AWS_S3_LEGACY_ACCESS_KEY_ID=your-legacy-access-key-id
AWS_S3_LEGACY_SECRET_ACCESS_KEY=your-legacy-secret-access-key

# Optional: mirror S3 uploads to local volume and serve from local if available
ENABLE_LOCAL_MIRROR=true
ENABLE_LOCAL_FALLBACK=true
RAILWAY_VOLUME_MOUNT_PATH=/app/uploads

# Optional: public domain used for absolute URLs
RAILWAY_PUBLIC_DOMAIN=huddle-backend-production.up.railway.app
```

### 7.1 Data Migration (legacy bucket -> new bucket)
Run after you copy objects or decide to rewrite DB URLs.
```
# Dry run first
DRY_RUN=true UPDATE_URLS=true AWS_S3_BUCKET=panhaha-storage AWS_S3_URL=https://panhaha-storage.s3.ap-southeast-2.amazonaws.com AWS_S3_LEGACY_BUCKET=miyzapis-storage AWS_S3_LEGACY_URL=https://miyzapis-storage.s3.ap-southeast-2.amazonaws.com npm run migrate:file-storage

# Apply changes
DRY_RUN=false UPDATE_URLS=true AWS_S3_BUCKET=panhaha-storage AWS_S3_URL=https://panhaha-storage.s3.ap-southeast-2.amazonaws.com AWS_S3_LEGACY_BUCKET=miyzapis-storage AWS_S3_LEGACY_URL=https://miyzapis-storage.s3.ap-southeast-2.amazonaws.com npm run migrate:file-storage
```

### 8. Email Configuration (Gmail SMTP)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your-gmail-address@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM=your-gmail-address@gmail.com
```

### 9. Google OAuth Configuration (REQUIRED for Google Sign-In)
```
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_REDIRECT_URI=https://huddle-backend-production.up.railway.app/api/v1/auth-enhanced/google/callback
```

### 10. Rate Limiting & Security
```
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false
```

### 11. Logging Configuration
```
LOG_LEVEL=info
LOG_FILE_ENABLED=false
LOG_FILE_PATH=/tmp/logs
```

### 12. Optional: Telegram Bot (if configured)
```
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_WEBHOOK_URL=https://huddle-backend-production.up.railway.app/api/v1/telegram/webhook
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
EMAIL_FROM=noreply@panhaha.com
CORS_ORIGIN=https://panhaha.com,https://www.panhaha.com,https://panhaha-website-production.up.railway.app,http://localhost:3000
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
3. **Test backend health**: Visit `https://huddle-backend-production.up.railway.app/health`
4. **Test authentication**: Try Google Sign-In from frontend

## Troubleshooting

If the backend still doesn't start:
1. Check Railway logs: Go to Backend Service → **Logs** tab
2. Look for specific error messages
3. Verify all required variables are set correctly
4. Ensure DATABASE_URL is automatically provided by PostgreSQL service

## Service URLs (Update these if different)
- Backend: `https://huddle-backend-production.up.railway.app`
- Frontend: `https://panhaha-website-production.up.railway.app`

## Next Steps After Fix
1. Configure Gmail SMTP credentials for email functionality
2. Set up Google OAuth credentials for production
3. Configure Telegram Bot if needed
4. Update frontend environment variables to point to production backend
