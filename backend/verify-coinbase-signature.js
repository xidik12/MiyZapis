/**
 * Coinbase Webhook Signature Verification Diagnostic Tool
 *
 * This script helps verify that the webhook secret is configured correctly
 * by showing exactly how Coinbase signatures are calculated.
 *
 * Usage:
 * 1. Get a webhook payload from Railway logs (the raw JSON body)
 * 2. Get the X-CC-Webhook-Signature header value from the same request
 * 3. Run: COINBASE_COMMERCE_WEBHOOK_SECRET="your-secret" node verify-coinbase-signature.js
 */

const crypto = require('crypto');

// Your webhook secret from Railway environment variable
const webhookSecret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;

if (!webhookSecret) {
  console.error('❌ Error: COINBASE_COMMERCE_WEBHOOK_SECRET environment variable not set');
  console.log('\nUsage:');
  console.log('  COINBASE_COMMERCE_WEBHOOK_SECRET="your-secret" node verify-coinbase-signature.js');
  process.exit(1);
}

console.log('🔐 Coinbase Webhook Signature Verification Tool\n');
console.log('Webhook Secret (first 20 chars):', webhookSecret.substring(0, 20) + '...');
console.log('Webhook Secret length:', webhookSecret.length);
console.log('Webhook Secret full value:', webhookSecret);
console.log('\n---\n');

// Example payload - replace with actual payload from your Railway logs
const examplePayload = JSON.stringify({
  "event": {
    "id": "test-event-id",
    "type": "charge:confirmed"
  }
});

console.log('Example payload:', examplePayload);
console.log('\nCalculating HMAC-SHA256 signature...\n');

// Calculate signature exactly as backend does
const expectedSignature = crypto
  .createHmac('sha256', webhookSecret)
  .update(examplePayload, 'utf8')
  .digest('hex');

console.log('Expected signature:', expectedSignature);
console.log('Signature length:', expectedSignature.length);

console.log('\n---\n');
console.log('📋 Instructions to verify with real webhook:');
console.log('1. Check Railway logs for the most recent Coinbase webhook');
console.log('2. Copy the entire request body (the JSON payload)');
console.log('3. Copy the X-CC-Webhook-Signature header value');
console.log('4. Replace examplePayload in this script with the real payload');
console.log('5. Run the script again and compare signatures');
console.log('\n---\n');

// Test with the actual secret you provided earlier
const providedSecret = 'bmH6oZ9tnRe6LeucqN9k0AacudflPHs33d7i4H2RLih7IBWTswg6KlUiEgbx3hErFWFffWpezynkr50s6gwsTA==';
console.log('🔍 Testing with the secret you mentioned earlier:');
console.log('Secret:', providedSecret);

const testSignature = crypto
  .createHmac('sha256', providedSecret)
  .update(examplePayload, 'utf8')
  .digest('hex');

console.log('Signature with provided secret:', testSignature);
console.log('\n✅ If the signature in Railway logs matches this, your webhook secret is correct');
console.log('❌ If they don\'t match, you need to update COINBASE_COMMERCE_WEBHOOK_SECRET in Railway');
