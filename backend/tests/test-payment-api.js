#!/usr/bin/env node
/**
 * Coinbase Commerce Payment API Test Script
 * This script demonstrates how to test the payment system
 */

const API_BASE = 'http://localhost:3030/api/v1';

// Test user credentials (you'll need to create a test user first)
const TEST_USER = {
  email: 'test@miyzapis.com',
  password: 'Test123!@#'
};

// Test scenarios
const PAYMENT_TESTS = [
  {
    name: 'Booking Deposit Payment',
    amount: 1.00,
    currency: 'USD',
    description: 'Test booking deposit - $1 USD',
    type: 'DEPOSIT'
  },
  {
    name: 'Subscription Payment',
    amount: 10.00,
    currency: 'USD',
    description: 'Test subscription - $10 USD monthly',
    type: 'SUBSCRIPTION'
  }
];

async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  console.log(`🔄 ${config.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    console.log(`${response.ok ? '✅' : '❌'} Status: ${response.status}`);
    console.log('📋 Response:', JSON.stringify(data, null, 2));
    console.log('─'.repeat(80));

    return { response, data };
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    console.log('─'.repeat(80));
    return { error };
  }
}

async function testAuthentication() {
  console.log('🔐 Testing Authentication...\n');

  // Try to login (this will fail if user doesn't exist)
  const { data } = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(TEST_USER)
  });

  if (data.tokens?.accessToken) {
    console.log('✅ Authentication successful!');
    return data.tokens.accessToken;
  } else {
    console.log('❌ Authentication failed. You need to create a test user first.');
    console.log('💡 To create a test user, register through the API or frontend.');
    return null;
  }
}

async function testPaymentEndpoints(authToken) {
  console.log('💰 Testing Payment Endpoints...\n');

  const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};

  // Test deposit configuration
  await makeRequest('/payments/deposit-configuration', { headers });

  // Test wallet balance
  await makeRequest('/payments/wallet/balance', { headers });

  // Test subscription plans
  await makeRequest('/payments/subscription/plans');
}

async function testCoinbaseIntegration() {
  console.log('🪙 Testing Coinbase Commerce Integration...\n');

  console.log('📋 Payment Test Scenarios:');
  PAYMENT_TESTS.forEach((test, index) => {
    console.log(`${index + 1}. ${test.name}`);
    console.log(`   Amount: $${test.amount} ${test.currency}`);
    console.log(`   Description: ${test.description}`);
    console.log('');
  });

  // Note: These would normally require authentication and proper setup
  console.log('💡 To test actual payments:');
  console.log('1. Add Coinbase Commerce API key to .env');
  console.log('2. Create authenticated user session');
  console.log('3. Use the payment creation endpoints');
  console.log('4. Test with testnet cryptocurrencies');
}

async function testWebhooks() {
  console.log('🔗 Testing Webhook Configuration...\n');

  console.log('📋 Webhook Setup Instructions:');
  console.log('1. Install ngrok: npm install -g ngrok');
  console.log('2. Expose local server: ngrok http 3030');
  console.log('3. Copy the HTTPS URL (e.g., https://abc123.ngrok.io)');
  console.log('4. Set in Coinbase Commerce: https://abc123.ngrok.io/api/v1/payments/coinbase-webhook');
  console.log('5. Test webhook with Coinbase Commerce dashboard');

  // Test webhook endpoint (without signature, will fail validation)
  const testWebhookData = {
    id: 'test-webhook-id',
    scheduled_for: new Date().toISOString(),
    attempt_number: 1,
    event: {
      id: 'test-event-id',
      resource: 'event',
      type: 'charge:created',
      api_version: '2018-03-22',
      created_at: new Date().toISOString(),
      data: {
        id: 'test-charge-id',
        code: 'TEST123',
        name: 'Test Payment',
        description: 'Test Description',
        hosted_url: 'https://commerce.coinbase.com/charges/TEST123',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        timeline: [],
        metadata: { test: true },
        pricing_type: 'fixed_price',
        pricing: {
          local: { amount: '1.00', currency: 'USD' }
        },
        payments: [],
        addresses: {}
      }
    }
  };

  await makeRequest('/payments/coinbase-webhook', {
    method: 'POST',
    headers: {
      'X-CC-Webhook-Signature': 'test-signature-will-fail'
    },
    body: JSON.stringify(testWebhookData)
  });
}

async function runTests() {
  console.log('🚀 Miyzapis Payment System Test Suite');
  console.log('=====================================\n');

  // Test server health
  await makeRequest('/health');

  // Test authentication
  const authToken = await testAuthentication();

  // Test payment endpoints
  await testPaymentEndpoints(authToken);

  // Test Coinbase integration
  await testCoinbaseIntegration();

  // Test webhooks
  await testWebhooks();

  console.log('🎉 Test suite completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Set up Coinbase Commerce test account');
  console.log('2. Add API credentials to .env file');
  console.log('3. Create test users through registration');
  console.log('4. Test full payment flow with testnet crypto');
  console.log('\n🔗 Test page available at: http://localhost:8080/test-payment.html');
}

// Add fetch polyfill for Node.js if needed
if (typeof fetch === 'undefined') {
  console.log('📦 Installing fetch for Node.js...');
  try {
    global.fetch = require('node-fetch');
  } catch (e) {
    console.log('❌ node-fetch not available. Install with: npm install node-fetch');
    console.log('Or run this script in a browser environment.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);