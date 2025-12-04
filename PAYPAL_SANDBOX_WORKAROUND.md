# PayPal Sandbox Webhook Issue & Workaround

## Problem
PayPal Sandbox webhooks are notoriously unreliable:
- They can be delayed by minutes or hours
- Sometimes they don't fire at all
- This is a known PayPal sandbox limitation

## What's Working
✅ PayPal order creation
✅ Payment processing
✅ Payment record in database
✅ Webhook endpoint ready and tested
✅ Booking creation logic (when webhook fires)

## What's NOT Working
❌ PayPal sandbox not sending webhooks for real payments

## Solutions

### Option 1: Use PayPal Webhook Simulator (RECOMMENDED)
1. Go to https://developer.paypal.com/dashboard/webhooks
2. Click on your webhook
3. Click "Webhook Events Simulator"
4. Select event: `PAYMENT.CAPTURE.COMPLETED`
5. Fill in the order ID from your recent payment
6. Click "Send Test"

This will manually trigger the webhook with real data.

### Option 2: Manual Webhook Trigger Script
After making a payment, get the PayPal order ID from the logs and run:

```bash
# Replace ORDER_ID with actual PayPal order ID from logs
curl -X POST https://miyzapis-backend-production.up.railway.app/api/v1/payments/webhooks/paypal \
  -H "Content-Type: application/json" \
  -d '{
  "id": "WH-MANUAL",
  "event_type": "PAYMENT.CAPTURE.COMPLETED",
  "resource": {
    "id": "CAPTURE123",
    "status": "COMPLETED",
    "supplementary_data": {
      "related_ids": {
        "order_id": "ORDER_ID_HERE"
      }
    }
  }
}'
```

### Option 3: Switch to Live Mode (BEST for Production)
PayPal **LIVE** webhooks are much more reliable:
1. Get live PayPal credentials
2. Update Railway environment variables:
   - `PAYPAL_MODE=live`
   - `PAYPAL_CLIENT_ID=<live_client_id>`
   - `PAYPAL_CLIENT_SECRET=<live_client_secret>`
3. Update webhook URL in PayPal Live Dashboard
4. Live webhooks fire consistently within seconds

### Option 4: Polling Fallback (Alternative)
If webhooks continue to fail, we can add a fallback:
- After payment, poll PayPal API every 10 seconds
- Check if payment is captured
- Create booking when capture is confirmed
- This is less efficient but more reliable in sandbox

## Next Steps

**For Testing in Sandbox:**
1. Make a payment
2. Note the PayPal order ID from logs (e.g., `5YG91581DF7694014`)
3. Use Option 1 or 2 above to manually trigger webhook

**For Production:**
1. Use live PayPal credentials
2. Webhooks will work reliably
3. No manual intervention needed

## Current Status
- ✅ All code is working and tested
- ✅ Webhook endpoint processes events correctly
- ✅ Booking creation works when webhook fires
- ❌ Only issue: PayPal sandbox not sending webhooks automatically

## Verification
To verify everything works, we successfully tested:
1. Manual webhook → ✅ Processed correctly
2. Booking creation logic → ✅ Works
3. Payment matching → ✅ Works (with correct order ID)

**The ONLY issue is PayPal sandbox webhook delivery reliability.**
