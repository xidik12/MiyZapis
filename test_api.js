const axios = require('axios');

const BASE_URL = 'http://localhost:8000/api/v1';

async function testHealth() {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('Health check:', response.data);
    return true;
  } catch (error) {
    console.error('Health check failed:', error.message);
    return false;
  }
}

async function testRegistration() {
  try {
    const userData = {
      email: 'test@example.com',
      password: 'Test123abc',
      firstName: 'Test',
      lastName: 'User',
      userType: 'CUSTOMER'
    };
    
    const response = await axios.post(`${BASE_URL}/auth/register`, userData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    console.log('Registration successful:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Registration failed:', error.response.data);
    } else if (error.request) {
      console.error('Registration request failed:', error.message);
    } else {
      console.error('Registration error:', error.message);
    }
    return null;
  }
}

async function testLogin() {
  try {
    const loginData = {
      email: 'test@example.com',
      password: 'Test123abc'
    };
    
    const response = await axios.post(`${BASE_URL}/auth/login`, loginData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    console.log('Login successful:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Login failed:', error.response.data);
    } else {
      console.error('Login error:', error.message);
    }
    return null;
  }
}

async function runTests() {
  console.log('Testing BookingBot API endpoints...\n');
  
  // Test health endpoint
  console.log('1. Testing health endpoint...');
  const healthOk = await testHealth();
  
  if (!healthOk) {
    console.log('Backend is not accessible. Stopping tests.');
    return;
  }
  
  console.log('\n2. Testing registration endpoint...');
  const registrationResult = await testRegistration();
  
  console.log('\n3. Testing login endpoint...');
  const loginResult = await testLogin();
  
  console.log('\n=== API Test Results ===');
  console.log('Health check: ✓ PASSED');
  console.log('Registration:', registrationResult ? '✓ PASSED' : '✗ FAILED');
  console.log('Login:', loginResult ? '✓ PASSED' : '✗ FAILED');
}

runTests();