#!/usr/bin/env node

/**
 * Test script to verify wallet API endpoints
 */

const axios = require('axios');

// Test locally first, then switch to production after deployment
const LOCAL_URL = 'http://localhost:3002';
const PRODUCTION_URL = 'https://miyzapis-backend-production.up.railway.app';
const API_BASE = `${PRODUCTION_URL}/api/v1`; // Using PRODUCTION_URL for testing

class WalletEndpointTester {
  constructor() {
    this.authToken = null;
    this.userId = null;
  }

  async runTests() {
    console.log('🧪 Starting Wallet Endpoint Tests...\n');

    try {
      // Step 1: Try to login or register a test user
      await this.authenticateTestUser();

      if (!this.authToken) {
        console.error('❌ Failed to authenticate test user');
        return;
      }

      // Step 2: Test wallet balance endpoint
      await this.testWalletBalance();

      // Step 3: Test wallet transactions endpoint
      await this.testWalletTransactions();

      console.log('\n✅ All tests completed successfully!');

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      if (error.response) {
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        console.error('Response status:', error.response.status);
      }
    }
  }

  async authenticateTestUser() {
    console.log('🔐 Attempting to authenticate test user...');

    try {
      // Try to register a test user first
      const registerData = {
        email: `test_wallet_${Date.now()}@example.com`,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        userType: 'CUSTOMER'
      };

      console.log('📝 Registering test user...');
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, registerData);

      if (registerResponse.data.success) {
        this.authToken = registerResponse.data.data.tokens.accessToken;
        this.userId = registerResponse.data.data.user.id;
        console.log('✅ Test user registered and authenticated successfully');
        console.log(`📱 User ID: ${this.userId}`);
        return;
      }
    } catch (error) {
      console.log('📝 Registration failed:', error.response?.data || error.message);
      console.log('📝 Trying to login existing user...');
      // If registration fails, try with a known test email
    }

    try {
      // Try to login with a test user
      const loginData = {
        email: 'test@example.com',
        password: 'TestPassword123!'
      };

      console.log('🔑 Attempting login...');
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, loginData);

      if (loginResponse.data.success) {
        this.authToken = loginResponse.data.data.tokens.accessToken;
        this.userId = loginResponse.data.data.user.id;
        console.log('✅ Login successful');
        console.log(`📱 User ID: ${this.userId}`);
      }
    } catch (error) {
      console.error('❌ Login failed:', error.response?.data || error.message);
      throw new Error('Could not authenticate test user');
    }
  }

  async testWalletBalance() {
    console.log('\n💰 Testing wallet balance endpoint...');

    const config = {
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      }
    };

    try {
      const response = await axios.get(`${API_BASE}/payments/wallet/balance`, config);

      console.log('✅ Wallet balance endpoint successful');
      console.log('📊 Response:', JSON.stringify(response.data, null, 2));

      // Verify response structure
      if (response.data.success && response.data.data) {
        const { balance, currency, userId } = response.data.data;
        console.log(`💵 Balance: ${balance} ${currency}`);
        console.log(`👤 User ID: ${userId}`);
      }
    } catch (error) {
      console.error('❌ Wallet balance endpoint failed');
      console.error('Status:', error.response?.status);
      console.error('Data:', JSON.stringify(error.response?.data, null, 2));
      throw error;
    }
  }

  async testWalletTransactions() {
    console.log('\n📋 Testing wallet transactions endpoint...');

    const config = {
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      }
    };

    try {
      const response = await axios.get(`${API_BASE}/payments/wallet/transactions?page=1&limit=10`, config);

      console.log('✅ Wallet transactions endpoint successful');
      console.log('📊 Response:', JSON.stringify(response.data, null, 2));

      // Verify response structure
      if (response.data.success && response.data.data) {
        const { transactions, pagination, totalBalance } = response.data.data;
        console.log(`📝 Transactions count: ${transactions.length}`);
        console.log(`💰 Total balance: ${totalBalance}`);
        console.log(`📄 Pagination:`, pagination);
      }
    } catch (error) {
      console.error('❌ Wallet transactions endpoint failed');
      console.error('Status:', error.response?.status);
      console.error('Data:', JSON.stringify(error.response?.data, null, 2));
      throw error;
    }
  }
}

// Run the tests
const tester = new WalletEndpointTester();
tester.runTests().catch(console.error);