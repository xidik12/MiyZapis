# Google API Setup Guide 🔐

## Overview

Your Panhaha app uses these Google APIs:

1. **Google OAuth 2.0** - For "Sign in with Google" (REQUIRED for login)
2. **Google Maps API** - For location features (OPTIONAL)

## Current Setup

From your error logs, I can see:
- **Google Client ID**: `173408809843-mlv9rn3c95rlf1n4bumk937nqvqk3md0.apps.googleusercontent.com`
- **Error**: "The given origin is not allowed for the given client ID"

This means your Google OAuth is partially set up but missing authorized domains.

---

## Part 1: Google OAuth 2.0 Setup (REQUIRED)

### What You Need

**Frontend Environment Variable:**
```bash
VITE_GOOGLE_CLIENT_ID=173408809843-mlv9rn3c95rlf1n4bumk937nqvqk3md0.apps.googleusercontent.com
```

**Backend Environment Variables:**
```bash
GOOGLE_CLIENT_ID=173408809843-mlv9rn3c95rlf1n4bumk937nqvqk3md0.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### Step-by-Step Setup

#### Step 1: Go to Google Cloud Console

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Select your project (or create a new one if needed)

#### Step 2: Enable Google+ API

1. In the left sidebar, click **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"** or **"Google Identity"**
3. Click on it and press **"Enable"**

#### Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** (unless you have a Google Workspace)
3. Click **"Create"**
4. Fill in required fields:
   - **App name**: `Panhaha` or `МійЗапис`
   - **User support email**: Your email
   - **App logo**: Upload your logo (optional)
   - **Application home page**: `https://panhaha-website-production.up.railway.app`
   - **Authorized domains**: Add these:
     - `panhaha-website-production.up.railway.app`
     - `railway.app`
     - Your custom domain if you have one
   - **Developer contact**: Your email
5. Click **"Save and Continue"**
6. **Scopes**: Click "Add or Remove Scopes" and select:
   - `email`
   - `profile`
   - `openid`
7. Click **"Save and Continue"**
8. **Test users**: Add your email for testing
9. Click **"Save and Continue"**

#### Step 4: Create or Update OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Find your existing OAuth 2.0 Client ID or click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
3. Select **"Web application"**
4. Configure:

**Application name**: `Panhaha Web App`

**Authorized JavaScript origins** - Add ALL these:
```
http://localhost:3000
http://localhost:5173
https://panhaha-website-production.up.railway.app
https://panhaha.com
https://www.panhaha.com
```

**Authorized redirect URIs** - Add ALL these:
```
http://localhost:3000/auth/callback
http://localhost:3000
https://panhaha-website-production.up.railway.app/auth/callback
https://panhaha-website-production.up.railway.app
https://panhaha.com/auth/callback
https://panhaha.com
```

5. Click **"Create"** or **"Save"**

#### Step 5: Get Your Credentials

After creating/updating:
1. You'll see a popup with **Client ID** and **Client Secret**
2. Copy both values (you'll need them for Railway)
3. If you closed the popup, click on your OAuth 2.0 Client ID to view credentials again

---

## Part 2: Google Maps API Setup (OPTIONAL)

Only needed if you want location/map features.

### Step 1: Enable Google Maps APIs

1. Go to **"APIs & Services"** → **"Library"**
2. Enable these APIs:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API**

### Step 2: Create API Key

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"API Key"**
3. Copy the API key

### Step 3: Restrict API Key (Recommended)

1. Click on your new API key
2. Under **"Application restrictions"**:
   - Select **"HTTP referrers (web sites)"**
   - Add these referrers:
     ```
     http://localhost:3000/*
     http://localhost:5173/*
     https://panhaha-website-production.up.railway.app/*
     https://panhaha.com/*
     ```
3. Under **"API restrictions"**:
   - Select **"Restrict key"**
   - Choose the Maps APIs you enabled
4. Click **"Save"**

---

## Part 3: Set Environment Variables in Railway

### Frontend Service Variables

Go to Railway → **Frontend Service** → **Variables** → Add:

```bash
# Google OAuth (REQUIRED for "Sign in with Google")
VITE_GOOGLE_CLIENT_ID=173408809843-mlv9rn3c95rlf1n4bumk937nqvqk3md0.apps.googleusercontent.com

# Google Maps (OPTIONAL - only if you want maps)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### Backend Service Variables

Go to Railway → **Backend Service** → **Variables** → Add:

```bash
# Google OAuth (REQUIRED for "Sign in with Google")
GOOGLE_CLIENT_ID=173408809843-mlv9rn3c95rlf1n4bumk937nqvqk3md0.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_actual_secret_here

# Google Maps (OPTIONAL - only if you want maps)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**⚠️ Important:**
- Replace `GOCSPX-your_actual_secret_here` with your actual Google Client Secret from Step 5
- Replace `your_google_maps_api_key_here` with your actual Maps API key (if using maps)

---

## Part 4: Verification

### Test Google OAuth

1. Deploy both frontend and backend with new variables
2. Go to your Panhaha website
3. Click "Sign in with Google" button
4. You should see Google's consent screen (not a 403 error)
5. After signing in with Google, you should be logged into Panhaha

### Common Errors and Fixes

#### Error: "The given origin is not allowed"
**Solution:**
- Verify you added `https://panhaha-website-production.up.railway.app` to Authorized JavaScript origins
- Wait 5-10 minutes for Google changes to propagate
- Clear browser cache and try again

#### Error: "redirect_uri_mismatch"
**Solution:**
- Add the exact redirect URI shown in the error to Authorized redirect URIs
- Common URIs needed:
  - `https://panhaha-website-production.up.railway.app`
  - `https://panhaha-website-production.up.railway.app/auth/callback`

#### Error: "invalid_client"
**Solution:**
- Check that `GOOGLE_CLIENT_ID` matches in both frontend and backend
- Verify `GOOGLE_CLIENT_SECRET` is correct in backend
- Make sure there are no extra spaces or quotes in the values

---

## Quick Reference: Where to Find What

### Google Cloud Console
- **URL**: https://console.cloud.google.com/
- **OAuth Settings**: APIs & Services → Credentials → OAuth 2.0 Client IDs
- **Consent Screen**: APIs & Services → OAuth consent screen
- **API Keys**: APIs & Services → Credentials → API Keys

### Railway Dashboard
- **URL**: https://railway.app/
- **Frontend Variables**: Your Project → Frontend Service → Variables
- **Backend Variables**: Your Project → Backend Service → Variables

---

## Summary: What Variables Are Needed?

### Minimum Required (for Google OAuth only):

**Frontend Railway Variables:**
```bash
VITE_GOOGLE_CLIENT_ID=173408809843-mlv9rn3c95rlf1n4bumk937nqvqk3md0.apps.googleusercontent.com
```

**Backend Railway Variables:**
```bash
GOOGLE_CLIENT_ID=173408809843-mlv9rn3c95rlf1n4bumk937nqvqk3md0.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

### Optional (if using Google Maps):

**Frontend Railway Variables:**
```bash
VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key
```

**Backend Railway Variables:**
```bash
GOOGLE_MAPS_API_KEY=your_maps_api_key
```

---

## Important Notes

1. **Google Client Secret** is ONLY for backend - never expose it in frontend
2. **API Keys** can be in frontend but should be restricted by domain
3. Changes to Google OAuth settings take **5-10 minutes** to propagate
4. Always add both localhost AND production domains for testing
5. Railway will auto-redeploy when you add/change environment variables

---

## Still Having Issues?

If Google OAuth still doesn't work:

1. Check Google Cloud Console → OAuth consent screen is published
2. Verify all domains are added to Authorized JavaScript origins
3. Check Railway logs for "invalid_client" or "unauthorized" errors
4. Try in incognito/private browsing mode
5. Wait full 10 minutes after making Google Console changes
6. Check that environment variables are set correctly in Railway (no typos)

## Testing Checklist

- [ ] Google Client ID matches in frontend and backend
- [ ] Google Client Secret is set in backend
- [ ] Authorized origins include panhaha-website-production.up.railway.app
- [ ] Authorized redirect URIs include your callback URLs
- [ ] OAuth consent screen is configured
- [ ] Frontend and backend redeployed with variables
- [ ] Waited 10 minutes after Google changes
- [ ] Cleared browser cache
- [ ] Tested "Sign in with Google" button
