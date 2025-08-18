#!/usr/bin/env node

/**
 * Debug Login Issue - Focused investigation
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/v1';

async function debugLoginIssue() {
  console.log('🔍 Debugging Login Issue...\n');

  try {
    // Step 1: Test a successful registration first
    console.log('Step 1: Testing registration...');
    const regData = {
      email: `debug-${Date.now()}@test.com`,
      password: 'Test123456!',
      firstName: 'Debug',
      lastName: 'User',
      userType: 'CUSTOMER',
      phoneNumber: '+380501234567',
      language: 'uk'
    };

    const regResponse = await axios.post(`${API_BASE}/auth/register`, regData);
    console.log('✅ Registration Status:', regResponse.status);
    console.log('📦 Registration Response Structure:');
    console.log(JSON.stringify(regResponse.data, null, 2));

    // Step 2: Try to login with the same user
    console.log('\nStep 2: Testing login with registered user...');
    const loginData = {
      email: regData.email,
      password: regData.password
    };

    const loginResponse = await axios.post(`${API_BASE}/auth/login`, loginData);
    console.log('✅ Login Status:', loginResponse.status);
    console.log('📦 Login Response Structure:');
    console.log(JSON.stringify(loginResponse.data, null, 2));

    // Step 3: Analyze the token presence
    console.log('\n🔍 Token Analysis:');
    const regTokens = regResponse.data?.data?.tokens;
    const loginTokens = loginResponse.data?.data?.tokens;

    console.log('Registration tokens present:', !!regTokens);
    console.log('Login tokens present:', !!loginTokens);
    
    if (regTokens) {
      console.log('Registration token structure:', Object.keys(regTokens));
    }
    
    if (loginTokens) {
      console.log('Login token structure:', Object.keys(loginTokens));
    } else {
      console.log('❌ Login tokens are missing or null');
    }

    // Step 4: Test token usage if available
    if (regTokens?.accessToken) {
      console.log('\nStep 4: Testing protected endpoint with registration token...');
      try {
        const profileResponse = await axios.get(`${API_BASE}/users/profile`, {
          headers: {
            'Authorization': `Bearer ${regTokens.accessToken}`
          }
        });
        console.log('✅ Protected endpoint access with reg token:', profileResponse.status);
      } catch (error) {
        console.log('❌ Protected endpoint failed:', error.response?.status, error.response?.data?.error?.message);
      }
    }

    if (loginTokens?.accessToken) {
      console.log('\nStep 5: Testing protected endpoint with login token...');
      try {
        const profileResponse = await axios.get(`${API_BASE}/users/profile`, {
          headers: {
            'Authorization': `Bearer ${loginTokens.accessToken}`
          }
        });
        console.log('✅ Protected endpoint access with login token:', profileResponse.status);
      } catch (error) {
        console.log('❌ Protected endpoint failed:', error.response?.status, error.response?.data?.error?.message);
      }
    }

  } catch (error) {
    console.error('💥 Error during debugging:', error.response?.status, error.response?.data || error.message);
  }
}

// Test with existing user if available
async function testExistingUser() {
  console.log('\n🔍 Testing with existing user...');
  
  try {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'specialist@example.com',
      password: 'Test123456!'
    });
    
    console.log('✅ Existing user login status:', loginResponse.status);
    console.log('📦 Existing user response:');
    console.log(JSON.stringify(loginResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ Existing user login failed:', error.response?.status);
    console.log('Error details:', error.response?.data);
  }
}

// Main execution
async function main() {
  await debugLoginIssue();
  await testExistingUser();
}

main().catch(console.error);