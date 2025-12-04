# PayPal Webhook Setup Guide

## Problem
PayPal payments are completing successfully, but bookings are not being created because PayPal is not sending webhook notifications to your server.

## Solution
You need to configure PayPal webhooks in the PayPal Developer Dashboard.

## Steps to Configure PayPal Webhooks

### 1. Go to PayPal Developer Dashboard
- **Sandbox**: https://developer.paypal.com/dashboard/applications/sandbox
- **Live**: https://developer.paypal.com/dashboard/applications/live

### 2. Select Your App
- Click on your PayPal app (the one with your Client ID)

### 3. Add Webhook URL
- Scroll down to "Webhooks" section
- Click "Add Webhook"
- Enter webhook URL: **`https://miyzapis-backend-production.up.railway.app/api/v1/payments/webhooks/paypal`**

### 4. Subscribe to These Events
You MUST subscribe to these specific events for bookings to work:

✅ **PAYMENT.CAPTURE.COMPLETED** - When payment is captured (most important!)
✅ **PAYMENT.CAPTURE.DENIED** - When payment fails
✅ **CHECKOUT.ORDER.APPROVED** - When user approves the order
✅ **CHECKOUT.ORDER.COMPLETED** - When order is completed

### 5. Save Webhook ID
After creating the webhook, PayPal will give you a **Webhook ID**. You need to add this to Railway:

1. Go to Railway dashboard
2. Select your backend service
3. Go to Variables tab
4. Add: `PAYPAL_WEBHOOK_ID=<your_webhook_id_here>`

### 6. Test the Webhook
After setup, make a test payment. You should see in Railway logs:

```
[PayPal] Webhook received: PAYMENT.CAPTURE.COMPLETED
[PayPal] Creating booking for payment...
✅ Booking created successfully
```

## Current Webhook Endpoint
Your backend is ready to receive webhooks at:
- **URL**: `https://miyzapis-backend-production.up.railway.app/api/v1/payments/webhooks/paypal`
- **Method**: POST
- **No authentication required** (PayPal handles verification)

## Why This Is Required
PayPal uses webhooks to notify your server when:
- A payment is completed
- A payment fails
- An order is approved

Without webhooks configured, PayPal completes the payment but never tells your server, so no booking is created.

## Verification
After setup, check Railway logs after making a payment. You should see:
1. PayPal webhook request logged
2. Booking creation logged
3. Email sent logged

If you don't see these, the webhook is not configured correctly in PayPal.
