# Google Maps API Key Security - Action Required

## 🔴 CRITICAL: API Key Exposed

**Status**: API key is publicly visible in client-side code
**Risk Level**: Medium
**Exposed Key**: `AIzaSyACmrsklDHqWOyecVinPsEa-VMC3jsZMs0`

---

## Why This Matters

While Google Maps API keys are **designed to be used client-side**, without proper restrictions an attacker can:

1. **Use your quota** (you pay for their usage)
2. **Abuse it for their own projects**
3. **Rack up unexpected charges** on your Google Cloud account

---

## Current Implementation Status ✅

**Good News**: Your code is implemented correctly!

- ✅ API key is stored in environment variables (`VITE_GOOGLE_MAPS_API_KEY`)
- ✅ Not hardcoded in source files
- ✅ Properly loaded via `import.meta.env`
- ✅ `.env` files are gitignored

**The Issue**: The key is visible in the browser (this is normal for client-side APIs), but it needs restrictions in Google Cloud Console.

### Code Implementation (Correct)

```typescript
// frontend/src/config/environment.ts (Line 20)
GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,

// frontend/src/components/LocationPicker.tsx (Line 48-58)
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

if (!apiKey) {
  console.warn('Google Maps API key not found. Map functionality disabled.');
  setMapError(true);
  return;
}

// Load API dynamically
const script = document.createElement('script');
script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
```

---

## 🔧 Required Actions

### 1. Restrict the API Key in Google Cloud Console (URGENT)

Go to: [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)

#### A. Add HTTP Referrer Restrictions

**Why**: Prevents the key from being used on other domains

**Steps**:
1. Find the API key: `AIzaSyACmrsklDHqWOyecVinPsEa-VMC3jsZMs0`
2. Click "Edit API key"
3. Under "Application restrictions":
   - Select **"HTTP referrers (websites)"**
   - Add these referrers:
     ```
     https://miyzapis.com/*
     https://www.miyzapis.com/*
     https://miyzapis-frontend-production.up.railway.app/*
     http://localhost:3000/*
     http://localhost:5173/*
     ```
   - Add any other domains/subdomains you use

#### B. Restrict API Access

**Why**: Prevents the key from being used for APIs you don't need

**Steps**:
1. Under "API restrictions":
   - Select **"Restrict key"**
   - Select **only these APIs**:
     - ☑️ Maps JavaScript API
     - ☑️ Places API
     - ☑️ Geocoding API
   - **Deselect** all others

#### C. Set Usage Quotas (Recommended)

**Why**: Prevents unexpected charges

**Steps**:
1. Go to: [APIs & Services → Quotas](https://console.cloud.google.com/apis/api/maps-backend.googleapis.com/quotas)
2. For each API, set reasonable limits:
   - **Maps JavaScript API**: 25,000 loads/day (should be enough for most apps)
   - **Places API**: 100,000 requests/day
   - **Geocoding API**: 100,000 requests/day

#### D. Enable Billing Alerts

**Steps**:
1. Go to: [Billing → Budgets & alerts](https://console.cloud.google.com/billing)
2. Create budget alerts:
   - Alert at $50, $100, $200
   - Email alerts to your team

---

### 2. Rotate the API Key (Recommended)

Since the current key is already exposed publicly, you should:

1. **Create a new API key** in Google Cloud Console
2. **Apply all restrictions** (above) to the new key
3. **Update environment variables**:
   - Railway production: Update `VITE_GOOGLE_MAPS_API_KEY`
   - Local `.env` files: Update with new key
4. **Delete the old key** after 24 hours (to allow time for cached builds to expire)

---

### 3. Monitor Usage

**Set up monitoring**:
1. Go to: [APIs & Services → Dashboard](https://console.cloud.google.com/apis/dashboard)
2. Monitor daily usage for:
   - Maps JavaScript API
   - Places API
   - Geocoding API
3. Look for unusual spikes

**Expected Usage** (rough estimates):
- **Maps JavaScript API**: 100-500 loads/day (normal usage)
- **Places API**: 50-200 requests/day (autocomplete + details)
- **Geocoding API**: 20-100 requests/day (address lookups)

---

## ✅ Verification Checklist

After applying restrictions:

- [ ] Test your app - maps still work on production domain
- [ ] Test localhost - maps still work in development
- [ ] Try using the key on a different domain - should be blocked
- [ ] Check Google Cloud Console quotas page - restrictions are active
- [ ] Set up billing alerts
- [ ] Monitor usage for 1 week

---

## 📋 Technical Details

### Why Client-Side API Keys Are Different

Unlike backend API keys (Stripe, AWS, database credentials), Google Maps API keys are **meant to be exposed** in client-side code because:

1. The Maps JavaScript API runs in the browser
2. API calls go directly from user's browser to Google
3. No way to hide it completely

**The solution**: Restrictions, not secrecy.

### What We're Using

| API | Purpose | Used In |
|-----|---------|---------|
| **Maps JavaScript API** | Display interactive map | `LocationPicker.tsx` |
| **Places API** | Autocomplete address search | `LocationPicker.tsx` (autocomplete) |
| **Geocoding API** | Convert coordinates to addresses | `LocationPicker.tsx` (reverse geocode) |

---

## 🚨 If You Suspect Abuse

**Signs of quota theft**:
- Sudden spike in API usage
- High bills from Google Maps
- Quota exceeded errors when you're not using the app heavily

**Immediate actions**:
1. **Regenerate the API key immediately**
2. **Apply all restrictions**
3. **Check billing reports** for unusual charges
4. **Contact Google Cloud Support** if charges seem wrong

---

## 📚 Additional Resources

- [Google Maps API Security Best Practices](https://developers.google.com/maps/api-security-best-practices)
- [Restricting API Keys](https://cloud.google.com/docs/authentication/api-keys#api_key_restrictions)
- [Google Maps Platform Billing](https://developers.google.com/maps/billing-and-pricing/billing)

---

## ✅ Code Security Assessment

**Current code implementation**: ✅ **SECURE**

| Check | Status | Notes |
|-------|--------|-------|
| Hardcoded keys | ✅ None | All keys use environment variables |
| `.env` in git | ✅ Ignored | `.gitignore` properly configured |
| `.env.production` committed | ⚠️ Yes, but empty | Only contains public URLs (OK) |
| Secret keys exposed | ✅ None | Stripe, DB, JWT keys not exposed |
| API key restrictions | ❌ **TODO** | Need to add in Google Cloud Console |

---

## Summary

**What you need to do** (15 minutes):

1. ⚡ **Go to Google Cloud Console** → Credentials
2. ⚡ **Restrict the key** by HTTP referrer (your domain only)
3. ⚡ **Restrict the key** to only Maps/Places/Geocoding APIs
4. 📊 **Set up billing alerts**
5. 🔄 **Consider rotating** the key (create new, delete old)

**Priority**: HIGH - Do this today to prevent quota theft.

---

**Questions?** Contact your Google Cloud admin or refer to the [official documentation](https://developers.google.com/maps/api-security-best-practices).
