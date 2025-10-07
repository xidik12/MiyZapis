# Payment Gateway Setup Guide

## Current Status

✅ **Coinbase Commerce (Crypto)** - Working
❌ **PayPal** - Not configured (500 errors)
❌ **WayForPay** - Not configured (500 errors)

## Why PayPal and WayForPay Are Failing

The 500 errors occur because these payment providers **require valid API credentials** that are not currently set in Railway environment variables. The code is trying to call their APIs with missing or invalid credentials.

## Required Environment Variables

### PayPal Configuration

You need to get these from [PayPal Developer Dashboard](https://developer.paypal.com/):

```bash
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_WEBHOOK_ID=your_webhook_id  # Optional for webhooks
PAYPAL_MODE=sandbox  # or 'live' for production
```

**Steps to get PayPal credentials:**
1. Go to https://developer.paypal.com/dashboard/
2. Create a new app or use existing one
3. Copy the Client ID and Secret
4. Set these in Railway environment variables

### WayForPay Configuration

You need to get these from [WayForPay Merchant Portal](https://wayforpay.com/):

```bash
WAYFORPAY_MERCHANT_ACCOUNT=your_merchant_account
WAYFORPAY_MERCHANT_SECRET=your_merchant_secret_key
WAYFORPAY_MERCHANT_DOMAIN=yourdomain.com
```

**Steps to get WayForPay credentials:**
1. Register at https://wayforpay.com/
2. Complete merchant verification
3. Get your merchant account and secret key
4. Set these in Railway environment variables

## How to Set Environment Variables in Railway

1. Go to your Railway project
2. Click on your backend service
3. Go to "Variables" tab
4. Add the required environment variables above
5. Railway will automatically redeploy with new variables

## Alternative: Disable Unused Payment Methods

If you only want to use Coinbase Commerce (crypto), you can:

1. Remove PayPal and WayForPay from the frontend payment options
2. Or properly handle the 503 "Service Unavailable" response in the frontend

## Testing After Setup

Once credentials are configured:

1. Railway will redeploy automatically
2. Test each payment method:
   - PayPal should create orders successfully
   - WayForPay should create invoices
   - Coinbase Commerce already works

## Current Fixes Applied

✅ Validation schemas fixed (accept temporary booking IDs)
✅ Amount display fixed ($1.00 instead of $0.02)
✅ Currency conversion fixed (USD to UAH for WayForPay)
✅ Configuration checks improved (detect empty credentials)
✅ Payment-first flow supported

## Next Steps

1. **If you want PayPal and WayForPay:**
   - Get API credentials from their platforms
   - Add them to Railway environment variables
   - Test the payment flow

2. **If you only want Coinbase Commerce:**
   - Update frontend to hide/disable PayPal and WayForPay options
   - Or show a message that these methods are temporarily unavailable
