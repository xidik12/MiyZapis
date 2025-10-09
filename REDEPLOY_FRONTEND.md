# Frontend Redeployment Required

## Problem
The frontend on Railway is serving OLD JavaScript bundles that don't include the PayPal payment capture handler added in commit `d77e909`.

**Evidence from HAR file:**
- Bundled file: `BookingFlow-ChjbHGb2.js` (old hash)
- No `/api/v1/payments/paypal/capture-order` requests
- No PayPal callback handling

## Required Action

### Option 1: Railway Dashboard (Recommended)
1. Go to https://railway.app
2. Select "MiyZapis" service (frontend)
3. Go to "Deployments" tab
4. Find the latest deployment
5. Click "Redeploy" button

### Option 2: Railway CLI
```bash
cd /Users/salakhitdinovkhidayotullo/Documents/BookingBot
railway link
railway service  # Select "MiyZapis" (frontend)
railway up
```

### Option 3: Force Push
```bash
git commit --allow-empty -m "chore: force frontend redeploy"
git push origin development
```

## What Should Happen After Redeploy

1. **New bundle hash** - `BookingFlow-XXXXXXXX.js` will have a different hash
2. **PayPal capture works** - After PayPal redirect, frontend will automatically:
   - Detect `?token=ORDER_ID&PayerID=PAYER_ID` in URL
   - Call `POST /api/v1/payments/paypal/capture-order`
   - Backend captures payment
   - PayPal sends `PAYMENT.CAPTURE.COMPLETED` webhook
   - Backend creates booking
   - WebSocket notifies frontend

## Verification Steps

After redeployment:

1. Clear browser cache or use incognito mode
2. Open DevTools → Network tab
3. Make a PayPal payment
4. After PayPal redirect, you should see:
   ```
   POST /api/v1/payments/paypal/capture-order
   Status: 200
   ```
5. Check Railway backend logs:
   ```
   [PayPal] Capturing PayPal order
   [PayPal] Order captured successfully
   [PayPal] Webhook received
   [PayPal] Payment captured
   Booking created successfully
   ```

## Files Changed (Need Deployment)
- `frontend/src/pages/booking/BookingFlow.tsx` - Added PayPal capture handler
- `frontend/src/services/paypal.service.ts` - Already had capture method

## Current Status
- ❌ Frontend NOT deployed with latest code
- ✅ Backend deployed with Coinbase fix
- ⏳ Waiting for frontend redeploy
