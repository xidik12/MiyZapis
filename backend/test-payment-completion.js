#!/usr/bin/env node

/**
 * Test script to verify payment completion detection flow
 *
 * This script simulates the full payment flow:
 * 1. Creates a crypto payment intent
 * 2. Simulates webhook reception from Coinbase Commerce
 * 3. Verifies Socket.io events are emitted
 * 4. Tests that booking confirmation is sent
 */

const axios = require('axios');
const io = require('socket.io-client');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:3002';
const API_BASE = `${BASE_URL}/api/v1`;
const WS_URL = `${BASE_URL}`;

// Test configuration
const TEST_CONFIG = {
  // You'll need to replace these with actual test values
  TEST_USER_TOKEN: 'your_test_jwt_token_here',
  TEST_SERVICE_ID: 'your_test_service_id_here',
  COINBASE_WEBHOOK_SECRET: 'your_coinbase_webhook_secret_here',
};

class PaymentCompletionTester {
  constructor() {
    this.socket = null;
    this.receivedEvents = [];
    this.testResults = {
      paymentIntentCreated: false,
      websocketConnected: false,
      webhookProcessed: false,
      paymentCompletionReceived: false,
      bookingConfirmationReceived: false,
    };
  }

  async runTests() {
    console.log('🧪 Starting Payment Completion Detection Tests...\n');

    try {
      // Step 1: Setup WebSocket connection
      await this.setupWebSocketConnection();

      // Step 2: Create payment intent
      const paymentIntent = await this.createPaymentIntent();

      // Step 3: Simulate Coinbase webhook
      await this.simulateWebhook(paymentIntent);

      // Step 4: Wait for events and verify
      await this.waitForEvents();

      // Step 5: Display results
      this.displayResults();

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      console.error('Stack trace:', error.stack);
    } finally {
      if (this.socket) {
        this.socket.close();
      }
    }
  }

  async setupWebSocketConnection() {
    console.log('📡 Setting up WebSocket connection...');

    return new Promise((resolve, reject) => {
      this.socket = io(WS_URL, {
        auth: {
          token: TEST_CONFIG.TEST_USER_TOKEN
        },
        transports: ['websocket']
      });

      this.socket.on('connect', () => {
        console.log('✅ WebSocket connected successfully');
        this.testResults.websocketConnected = true;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection failed:', error.message);
        reject(error);
      });

      // Listen for payment completion events
      this.socket.on('notification', (data) => {
        console.log('📨 Received notification:', JSON.stringify(data, null, 2));
        this.receivedEvents.push({ type: 'notification', data });

        if (data.type === 'PAYMENT_COMPLETED') {
          this.testResults.paymentCompletionReceived = true;
        }
      });

      // Listen for booking update events
      this.socket.on('booking_updated', (data) => {
        console.log('📋 Received booking update:', JSON.stringify(data, null, 2));
        this.receivedEvents.push({ type: 'booking_updated', data });

        if (data.type === 'BOOKING_CONFIRMED') {
          this.testResults.bookingConfirmationReceived = true;
        }
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!this.socket.connected) {
          reject(new Error('WebSocket connection timeout'));
        }
      }, 10000);
    });
  }

  async createPaymentIntent() {
    console.log('💰 Creating payment intent...');

    const paymentData = {
      serviceId: TEST_CONFIG.TEST_SERVICE_ID,
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      duration: 60, // 1 hour
      customerNotes: 'Test booking for payment completion detection',
      useWalletFirst: false, // Force crypto payment
      paymentMethod: 'CRYPTO_ONLY',
    };

    try {
      const response = await axios.post(`${API_BASE}/crypto-payments/intent`, paymentData, {
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.TEST_USER_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.success) {
        console.log('✅ Payment intent created successfully');
        console.log(`   Payment ID: ${response.data.data.paymentId}`);
        console.log(`   Payment URL: ${response.data.data.paymentUrl}`);
        this.testResults.paymentIntentCreated = true;
        return response.data.data;
      } else {
        throw new Error(`Failed to create payment intent: ${response.data.error}`);
      }
    } catch (error) {
      if (error.response) {
        console.error('❌ Payment intent creation failed:', error.response.data);
        throw new Error(`HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`);
      } else {
        throw error;
      }
    }
  }

  async simulateWebhook(paymentIntent) {
    console.log('🎣 Simulating Coinbase Commerce webhook...');

    // Create mock webhook payload
    const webhookPayload = {
      id: `webhook-${Date.now()}`,
      scheduled_for: new Date().toISOString(),
      attempt_number: 1,
      event: {
        id: `event-${Date.now()}`,
        resource: 'charge',
        type: 'charge:confirmed',
        api_version: '2018-03-22',
        created_at: new Date().toISOString(),
        data: {
          id: paymentIntent.cryptoPayment?.id || `charge-${Date.now()}`,
          code: `CHARGE-${Date.now()}`,
          name: 'Test Booking Deposit',
          description: 'Test payment for completion detection',
          hosted_url: paymentIntent.paymentUrl,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          confirmed_at: new Date().toISOString(),
          pricing_type: 'fixed_price',
          pricing: {
            local: {
              amount: '25.00',
              currency: 'USD'
            }
          },
          metadata: {
            serviceId: TEST_CONFIG.TEST_SERVICE_ID,
            paymentFor: 'booking_deposit'
          },
          timeline: [
            {
              time: new Date().toISOString(),
              status: 'COMPLETED'
            }
          ],
          payments: [{
            value: {
              crypto: {
                amount: '0.0001',
                currency: 'BTC'
              }
            }
          }],
          addresses: {}
        }
      }
    };

    // Create webhook signature
    const signature = crypto
      .createHmac('sha256', TEST_CONFIG.COINBASE_WEBHOOK_SECRET)
      .update(JSON.stringify(webhookPayload), 'utf8')
      .digest('hex');

    try {
      const response = await axios.post(`${API_BASE}/crypto-payments/webhooks/coinbase`, webhookPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-CC-Webhook-Signature': signature,
          'User-Agent': 'Coinbase-Webhook/1.0'
        },
      });

      if (response.status === 200) {
        console.log('✅ Webhook processed successfully');
        this.testResults.webhookProcessed = true;
      } else {
        throw new Error(`Webhook processing failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      if (error.response) {
        console.error('❌ Webhook processing failed:', error.response.data);
        throw new Error(`HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`);
      } else {
        throw error;
      }
    }
  }

  async waitForEvents() {
    console.log('⏰ Waiting for WebSocket events...');

    return new Promise((resolve) => {
      // Wait 5 seconds for events to be received
      setTimeout(() => {
        console.log(`📊 Received ${this.receivedEvents.length} events during test`);
        resolve();
      }, 5000);
    });
  }

  displayResults() {
    console.log('\n📋 Test Results:');
    console.log('================');

    const results = [
      { name: 'Payment Intent Created', status: this.testResults.paymentIntentCreated },
      { name: 'WebSocket Connected', status: this.testResults.websocketConnected },
      { name: 'Webhook Processed', status: this.testResults.webhookProcessed },
      { name: 'Payment Completion Event Received', status: this.testResults.paymentCompletionReceived },
      { name: 'Booking Confirmation Event Received', status: this.testResults.bookingConfirmationReceived },
    ];

    results.forEach(result => {
      const icon = result.status ? '✅' : '❌';
      console.log(`${icon} ${result.name}`);
    });

    const passedTests = results.filter(r => r.status).length;
    const totalTests = results.length;

    console.log(`\n🏆 Overall Result: ${passedTests}/${totalTests} tests passed`);

    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! Payment completion detection is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Check the configuration and server logs.');
    }

    // Display received events
    if (this.receivedEvents.length > 0) {
      console.log('\n📨 Events Received:');
      this.receivedEvents.forEach((event, index) => {
        console.log(`${index + 1}. ${event.type}: ${JSON.stringify(event.data, null, 2)}`);
      });
    } else {
      console.log('\n📭 No WebSocket events were received during the test.');
    }
  }
}

// Configuration check
function checkConfiguration() {
  const requiredFields = [
    'TEST_USER_TOKEN',
    'TEST_SERVICE_ID',
    'COINBASE_WEBHOOK_SECRET'
  ];

  const missingFields = requiredFields.filter(field =>
    !TEST_CONFIG[field] || TEST_CONFIG[field] === `your_${field.toLowerCase()}_here`
  );

  if (missingFields.length > 0) {
    console.error('❌ Missing test configuration:');
    missingFields.forEach(field => {
      console.error(`   - ${field}`);
    });
    console.error('\nPlease update the TEST_CONFIG object in this script with actual values.');
    console.error('You can get these values from:');
    console.error('- TEST_USER_TOKEN: Login to your app and copy the JWT token from localStorage');
    console.error('- TEST_SERVICE_ID: Create a service in your app and copy its ID');
    console.error('- COINBASE_WEBHOOK_SECRET: From your Coinbase Commerce webhook settings');
    return false;
  }

  return true;
}

// Run the test
if (require.main === module) {
  if (checkConfiguration()) {
    const tester = new PaymentCompletionTester();
    tester.runTests().catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
}

module.exports = PaymentCompletionTester;