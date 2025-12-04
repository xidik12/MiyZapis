#!/usr/bin/env node
/**
 * Live Coinbase Commerce Payment Test
 * Tests payment creation with real API credentials
 */

// Dynamic import for node-fetch will be handled in the init function

const API_BASE = 'http://localhost:3030/api/v1';

// Test payment configuration
const TEST_PAYMENT = {
  amount: 1.00,
  currency: 'USD',
  name: 'Miyzapis Booking Deposit Test',
  description: 'Test booking deposit payment via Coinbase Commerce',
  metadata: {
    test: true,
    platform: 'miyzapis',
    timestamp: new Date().toISOString()
  }
};

async function testCoinbaseDirectly(fetch) {
  console.log('🪙 Testing Coinbase Commerce API directly...\n');

  const COINBASE_API_KEY = '054e60b6-6726-4f4d-90c7-f0f1f1ea9987';
  const COINBASE_API_URL = 'https://api.commerce.coinbase.com';

  try {
    const response = await fetch(`${COINBASE_API_URL}/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': COINBASE_API_KEY,
        'X-CC-Version': '2018-03-22'
      },
      body: JSON.stringify({
        name: TEST_PAYMENT.name,
        description: TEST_PAYMENT.description,
        local_price: {
          amount: TEST_PAYMENT.amount.toFixed(2),
          currency: TEST_PAYMENT.currency
        },
        pricing_type: 'fixed_price',
        metadata: TEST_PAYMENT.metadata
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Coinbase Commerce API Test Successful!');
      console.log('📋 Payment Details:');
      console.log(`   Charge ID: ${data.data.id}`);
      console.log(`   Charge Code: ${data.data.code}`);
      console.log(`   Amount: $${TEST_PAYMENT.amount} USD`);
      console.log(`   Payment URL: ${data.data.hosted_url}`);
      console.log(`   Expires: ${data.data.expires_at}`);
      console.log('');
      console.log('💡 You can now test the payment by visiting:');
      console.log(`   ${data.data.hosted_url}`);
      console.log('');
      console.log('🔗 For webhook testing, use ngrok:');
      console.log('   1. Install: npm install -g ngrok');
      console.log('   2. Run: ngrok http 3030');
      console.log('   3. Set webhook URL in Coinbase Commerce dashboard');
      console.log('   4. Webhook endpoint: /api/v1/crypto-payments/webhooks/coinbase');

      return data.data;
    } else {
      console.error('❌ Coinbase Commerce API Error:');
      console.error(JSON.stringify(data, null, 2));
      return null;
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return null;
  }
}

async function testServerHealth(fetch) {
  console.log('🏥 Testing server health...\n');

  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();

    if (response.ok) {
      console.log('✅ Server is healthy');
      console.log(`   Database: ${data.database}`);
      console.log(`   Uptime: ${Math.round(data.uptime)}s`);
      console.log('');
      return true;
    } else {
      console.error('❌ Server health check failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Cannot connect to server:', error.message);
    return false;
  }
}

async function testDepositConfig(fetch) {
  console.log('⚙️ Testing deposit configuration...\n');

  try {
    const response = await fetch(`${API_BASE}/crypto-payments/config/deposit`);
    const data = await response.json();

    if (response.ok) {
      console.log('✅ Deposit configuration retrieved:');
      console.log(`   Amount USD: $${data.data.amountUSD}`);
      console.log(`   Amount UAH: ₴${data.data.amountUAH}`);
      console.log(`   Currency: ${data.data.currency}`);
      console.log(`   Description: ${data.data.description}`);
      console.log('');
      return data.data;
    } else {
      console.error('❌ Deposit configuration failed:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return null;
  }
}

async function createTestUser(fetch) {
  console.log('👤 Creating test user...\n');

  const testUser = {
    email: 'testuser@miyzapis.com',
    password: 'Test123!@#',
    firstName: 'Test',
    lastName: 'User',
    userType: 'CUSTOMER',
    phoneNumber: '+380123456789'
  };

  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });

    const data = await response.json();

    if (response.ok || data.error?.code === 'USER_ALREADY_EXISTS') {
      console.log('✅ Test user ready (created or already exists)');
      console.log(`   Email: ${testUser.email}`);
      console.log('');

      // Try to login
      const loginResponse = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        })
      });

      const loginData = await loginResponse.json();

      if (loginResponse.ok) {
        console.log('✅ Login successful');
        console.log('   Access token obtained');
        console.log('');
        return loginData.tokens.accessToken;
      } else {
        console.log('⚠️ Login failed, but user creation succeeded');
        console.log('   You can manually test with these credentials');
        return null;
      }
    } else {
      console.error('❌ User creation failed:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return null;
  }
}

async function runLiveTests() {
  console.log('🚀 Miyzapis Coinbase Commerce Live Test');
  console.log('=====================================\n');

  // Import fetch dynamically
  let fetch;
  try {
    const { default: nodeFetch } = await import('node-fetch');
    fetch = nodeFetch;
  } catch (e) {
    console.log('❌ node-fetch not available. Install with: npm install node-fetch');
    return;
  }

  // Test server health
  const serverHealthy = await testServerHealth(fetch);
  if (!serverHealthy) {
    console.log('❌ Server is not healthy. Please check the backend.');
    return;
  }

  // Test deposit configuration
  const depositConfig = await testDepositConfig(fetch);
  if (!depositConfig) {
    console.log('❌ Cannot retrieve deposit configuration.');
    return;
  }

  // Test Coinbase Commerce API directly
  const paymentCharge = await testCoinbaseDirectly(fetch);
  if (!paymentCharge) {
    console.log('❌ Coinbase Commerce API test failed.');
    return;
  }

  // Create test user
  const authToken = await createTestUser(fetch);

  console.log('🎉 Live Test Results Summary:');
  console.log('============================');
  console.log(`✅ Server Health: OK`);
  console.log(`✅ Deposit Config: $${depositConfig.amountUSD} USD`);
  console.log(`✅ Coinbase API: Working`);
  console.log(`✅ Payment Created: ${paymentCharge.code}`);
  console.log(`${authToken ? '✅' : '⚠️'} Test User: ${authToken ? 'Authenticated' : 'Created (manual login needed)'}`);
  console.log('');
  console.log('🔗 Test Payment URL:');
  console.log(`   ${paymentCharge.hosted_url}`);
  console.log('');
  console.log('📋 Next Steps:');
  console.log('1. Visit the payment URL above to test with testnet crypto');
  console.log('2. Use testnet Bitcoin, Ethereum, or other supported currencies');
  console.log('3. Monitor the console for webhook events (if ngrok is set up)');
  console.log('4. Check the test page: http://localhost:8080/test-payment.html');
  console.log('');
  console.log('💡 For full webhook testing:');
  console.log('   1. Run: ngrok http 3030');
  console.log('   2. Copy the HTTPS URL');
  console.log('   3. Set webhook in Coinbase Commerce dashboard');
  console.log('   4. Webhook URL: https://your-ngrok-url.ngrok.io/api/v1/crypto-payments/webhooks/coinbase');
}

// Fetch will be imported dynamically in the runLiveTests function

runLiveTests().catch(console.error);