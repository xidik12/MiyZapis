#!/usr/bin/env node

/**
 * Manual PayPal Webhook Test
 * This simulates what PayPal would send when a payment is captured
 */

const BACKEND_URL = 'https://miyzapis-backend-production.up.railway.app';
const PAYPAL_ORDER_ID = '70029653ED601371N'; // From your logs

// Simulate PAYMENT.CAPTURE.COMPLETED webhook
const webhookPayload = {
  "event_type": "PAYMENT.CAPTURE.COMPLETED",
  "resource_type": "capture",
  "resource": {
    "id": "TEST_CAPTURE_" + Date.now(),
    "amount": {
      "currency_code": "USD",
      "value": "1.00"
    },
    "status": "COMPLETED",
    "supplementary_data": {
      "related_ids": {
        "order_id": PAYPAL_ORDER_ID
      }
    }
  },
  "create_time": new Date().toISOString()
};

console.log('🧪 Testing PayPal Webhook Manually...\n');
console.log('Payload:', JSON.stringify(webhookPayload, null, 2));
console.log('\nSending to:', `${BACKEND_URL}/api/v1/payments/webhooks/paypal`);

fetch(`${BACKEND_URL}/api/v1/payments/webhooks/paypal`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // Note: This will fail signature verification, but we can see if webhook endpoint is reachable
    'PAYPAL-TRANSMISSION-ID': 'test-transmission-' + Date.now(),
    'PAYPAL-TRANSMISSION-TIME': new Date().toISOString(),
    'PAYPAL-CERT-URL': 'https://api.sandbox.paypal.com/cert',
    'PAYPAL-AUTH-ALGO': 'SHA256withRSA',
    'PAYPAL-TRANSMISSION-SIG': 'test-signature'
  },
  body: JSON.stringify(webhookPayload)
})
.then(res => {
  console.log('\n✅ Response Status:', res.status);
  return res.text();
})
.then(text => {
  console.log('Response Body:', text);
  console.log('\n💡 Check Railway logs for webhook processing details');
})
.catch(err => {
  console.error('\n❌ Error:', err.message);
});
