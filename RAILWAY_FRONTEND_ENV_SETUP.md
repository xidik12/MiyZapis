# Railway Frontend Environment Variables Setup

## Critical: Fix Malformed API URL Issue

The frontend is trying to make requests to:
```
https://panhaha-website-production.up.railway.app/auth/panhaha-backend-production.up.railway.app/api/v1/...
```

This is wrong! It should be:
```
https://panhaha-backend-production.up.railway.app/api/v1/...
```

## Root Cause

The production frontend build doesn't have the `VITE_API_URL` environment variable set in Railway, so it's falling back to relative paths which get resolved against the frontend domain.

## Fix: Set Environment Variables in Railway

Go to your **Frontend** Railway service (panhaha-website-production) and set these environment variables:

### Required Variables

```bash
# Backend API URL - CRITICAL
VITE_API_URL=https://panhaha-backend-production.up.railway.app/api/v1

# WebSocket URL for real-time features
VITE_WS_URL=wss://panhaha-backend-production.up.railway.app

# App Configuration
VITE_APP_NAME=Panhaha
VITE_APP_VERSION=1.0.0
VITE_APP_URL=https://panhaha-website-production.up.railway.app

# Feature Flags
VITE_ENABLE_PWA=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_TELEGRAM_INTEGRATION=true
VITE_DEBUG=false

# Telegram Configuration
VITE_TELEGRAM_BOT_USERNAME=@miyzapis_bot
VITE_TELEGRAM_MINI_APP_URL=https://miyzapis-telegram-mini.up.railway.app
```

### Optional (Add when ready)

```bash
# Google Maps API Key (for location features)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Stripe Publishable Key (for payments)
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
```

## Steps to Apply

1. **Go to Railway Dashboard**
   - Navigate to your project
   - Select the **Frontend** service (panhaha-website-production)

2. **Open Variables Tab**
   - Click on "Variables" in the service menu

3. **Add Each Variable**
   - Click "New Variable"
   - Enter variable name (exactly as shown above)
   - Enter variable value
   - Click "Add"

4. **Redeploy**
   - After adding all variables, Railway will automatically trigger a redeploy
   - Or manually click "Deploy" to rebuild with new environment variables

5. **Verify**
   - Once deployed, check browser console
   - Should see requests going to `https://panhaha-backend-production.up.railway.app/api/v1/...`
   - Registration should work!

## Important Notes

- **VITE_ prefix is required** - Vite only exposes environment variables starting with `VITE_` to the browser
- Variables are **build-time**, not runtime - you must redeploy after changing them
- Set `VITE_DEBUG=false` in production (currently we have it as `false` above)
- All URLs should use `https://` for production

## Backend Environment Variables (Already Set?)

Just to confirm, your **Backend** service should have these set:

```bash
DATABASE_URL=postgresql://postgres:hNAJSsKnZmhQDAKZJbvZmKIvEVnVbACA@yamabiko.proxy.rlwy.net:22742/railway
REDIS_URL=redis://default:SPfDOFacFwXrYWFIPqwcFzTlWAWPKhFP@switchback.proxy.rlwy.net:59070
```

Plus any other backend-specific variables you have.
