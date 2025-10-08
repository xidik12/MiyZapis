# Fix PayPal Credentials - Step by Step

## 🔴 Problem Identified

The PayPal Client ID in Railway is **incomplete**. The dashboard shows:
```
AZUL7Va46o-Oq46aHXlCF...  ← The "..." means it's truncated!
```

This is why PayPal returns errors - the Client ID is only partial.

## ✅ Solution: Get Complete Credentials

### Step 1: Get Full Client ID from PayPal

1. **Go to PayPal Developer Dashboard:**
   - URL: https://developer.paypal.com/dashboard/
   - Login with your account

2. **Navigate to REST API Apps:**
   - Click on "Apps & Credentials" in left sidebar
   - Make sure you're in "Sandbox" mode (toggle at top)
   - Find your app: "Default Application"

3. **Reveal Full Client ID:**
   - You'll see: `AZUL7Va46o-Oq46aHXlCF...`
   - Click the "Show" button or copy icon next to it
   - This will reveal the COMPLETE Client ID (should be ~80 characters)
   - Example format: `AZUL7Va46o-Oq46aHXlCF_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

4. **Copy Complete Secret:**
   - The secret you have looks complete:
   ```
   EDIT-vTtpFihy3McNMDNY47SHIpIZMcbR1MKXVb3KD16HfNmiERgAYIkBrj2VP8tqQq6yKdSH3tc2grs
   ```
   - Verify it's the full secret (no `...` at the end)

### Step 2: Update Railway Environment Variables

1. **Go to Railway Dashboard:**
   - URL: https://railway.app
   - Select your project: MiyZapis backend

2. **Update Variables:**
   - Click on backend service
   - Go to "Variables" tab
   - Update these values:

   ```bash
   PAYPAL_CLIENT_ID=<PASTE_COMPLETE_CLIENT_ID_HERE>
   PAYPAL_CLIENT_SECRET=EDIT-vTtpFihy3McNMDNY47SHIpIZMcbR1MKXVb3KD16HfNmiERgAYIkBrj2VP8tqQq6yKdSH3tc2grs
   PAYPAL_MODE=sandbox
   ```

3. **Save and Deploy:**
   - Railway will automatically redeploy
   - Wait 2-3 minutes for deployment

### Step 3: Verify Credentials

**The complete Client ID should look like:**
```
Format: XXXX-XXXXXXXXXXXX_YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY

Example length: ~80 characters
Should have underscore (_) or hyphen (-) in it
No "..." at the end
```

**Check your secret:**
```
Should be exactly: EDIT-vTtpFihy3McNMDNY47SHIpIZMcbR1MKXVb3KD16HfNmiERgAYIkBrj2VP8tqQq6yKdSH3tc2grs
Length: 79 characters ✓
```

## 🧪 Test After Update

Once Railway redeploys with correct credentials:

### Option 1: Test via Browser
1. Go to https://miyzapis.com
2. Try to make a booking
3. Select PayPal payment
4. Should now create order successfully

### Option 2: Test via Script
```bash
# Get JWT token from browser (DevTools > Application > Local Storage > token)
export JWT_TOKEN='your-token'

# Run debug script
./debug-payment-errors.sh
```

### Expected Success Response:
```json
{
  "success": true,
  "data": {
    "id": "PAYPAL-ORDER-ID",
    "status": "CREATED",
    "approvalUrl": "https://www.sandbox.paypal.com/checkoutnow?token=..."
  }
}
```

## 📋 Checklist

- [ ] Login to PayPal Developer Dashboard
- [ ] Click "Show" to reveal full Client ID
- [ ] Copy complete Client ID (should be ~80 chars)
- [ ] Verify Secret is complete (79 chars)
- [ ] Update PAYPAL_CLIENT_ID in Railway
- [ ] Update PAYPAL_CLIENT_SECRET in Railway (if needed)
- [ ] Confirm PAYPAL_MODE=sandbox
- [ ] Wait for Railway to redeploy
- [ ] Test PayPal payment
- [ ] Verify WayForPay status
- [ ] Verify Coinbase Commerce works

## 🔍 How to Know If It's Fixed

### Before (Current - WRONG):
```
❌ Client ID: AZUL7Va46o-Oq46aHXlCF (incomplete - only 22 chars)
❌ Error: 500 Internal Server Error
❌ PayPal SDK fails to authenticate
```

### After (Should be - CORRECT):
```
✅ Client ID: AZUL7Va46o-Oq46aHXlCF_XXXXXXXXXXXXXXXXXXXXXXXX (complete - ~80 chars)
✅ Response: 200 OK with approval URL
✅ PayPal SDK authenticates successfully
```

## ❓ Still Not Working?

If you update credentials and it still fails:

1. **Check Railway Logs:**
   - Railway Dashboard → Backend Service → Logs
   - Look for PayPal errors
   - Share the error message

2. **Verify Credentials:**
   ```bash
   # In Railway dashboard, check the actual values
   # Make sure no extra spaces or newlines
   # Client ID should be ONE line, no breaks
   ```

3. **Test Credentials Directly:**
   - Try creating an order via PayPal's REST API directly
   - This verifies if credentials are valid

## 📞 Next Steps

1. Get the **complete** Client ID from PayPal dashboard
2. Update Railway with correct credentials
3. Wait for redeploy
4. Test payments
5. Report back if still issues

---

**Important:** The Client ID you have is definitely incomplete. The `...` in the dashboard means you need to click to see the full value!
