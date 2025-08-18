/**
 * Test script to verify CORS configuration and x-platform header support
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8000';
const API_URL = `${BASE_URL}/api/v1`;

// Test configuration
const testConfig = {
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'x-platform': 'web', // This is the header causing the CORS issue
  },
};

/**
 * Test CORS preflight request for login endpoint
 */
async function testCORSPreflight() {
  console.log('\n🔍 Testing CORS preflight request...');
  
  try {
    // Make OPTIONS request to simulate preflight
    const response = await axios.options(`${API_URL}/auth/login`, {
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,x-platform',
      },
      timeout: testConfig.timeout,
    });

    console.log('✅ CORS preflight succeeded');
    console.log('Status:', response.status);
    const allowedHeaders = response.headers['access-control-allow-headers'];
    console.log('Access-Control-Allow-Headers:', allowedHeaders);
    console.log('Access-Control-Allow-Origin:', response.headers['access-control-allow-origin']);
    console.log('Access-Control-Allow-Methods:', response.headers['access-control-allow-methods']);
    
    // Check if x-platform is in allowed headers
    const isPlatformHeaderAllowed = allowedHeaders && allowedHeaders.toLowerCase().includes('x-platform');
    console.log('x-platform header allowed:', isPlatformHeaderAllowed ? '✅ YES' : '❌ NO');
    
    return isPlatformHeaderAllowed;
  } catch (error) {
    console.log('❌ CORS preflight failed');
    console.log('Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Headers:', error.response.headers);
    }
    return false;
  }
}

/**
 * Test login endpoint with x-platform header
 */
async function testLoginWithPlatformHeader() {
  console.log('\n🔍 Testing login endpoint with x-platform header...');
  
  try {
    // First test with XMLHttpRequest-like behavior (should trigger preflight)
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000',
        'x-platform': 'web',
      },
      timeout: testConfig.timeout,
      validateStatus: function (status) {
        // Accept any status code for testing purposes
        return status >= 200 && status < 600;
      }
    };

    console.log('Sending request with headers:', config.headers);
    
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'testpassword',
    }, config);

    console.log('✅ Login request succeeded (CORS-wise)');
    console.log('Status:', response.status);
    console.log('Response data:', response.data);
    
    return true;
  } catch (error) {
    console.log('❌ Login request failed');
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response headers:', error.response.headers);
      console.log('Response data:', error.response.data);
    }
    
    // Check if it's a CORS-related error
    if (error.code === 'ERR_NETWORK' || 
        error.message.includes('CORS') || 
        error.message.includes('blocked') ||
        (error.response && error.response.status === 0)) {
      console.log('🚨 This appears to be a CORS-related error');
      return false;
    } else {
      console.log('✅ Request succeeded (CORS-wise), but got expected auth error');
      return true;
    }
  }
}

/**
 * Test basic server connectivity
 */
async function testServerConnectivity() {
  console.log('\n🔍 Testing server connectivity...');
  
  try {
    const response = await axios.get(`${BASE_URL}/`, {
      timeout: testConfig.timeout,
      headers: {
        'Origin': 'http://localhost:3000',
      }
    });

    console.log('✅ Server is running');
    console.log('Status:', response.status);
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Server connection failed');
    console.log('Error:', error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Starting CORS and x-platform header tests...');
  console.log('Target:', API_URL);
  console.log('Origin:', 'http://localhost:3000');
  
  const results = {
    serverConnectivity: false,
    corsPreflight: false,
    loginWithPlatformHeader: false,
  };

  // Test 1: Server connectivity
  results.serverConnectivity = await testServerConnectivity();
  
  if (!results.serverConnectivity) {
    console.log('\n❌ Server is not running. Please start the backend server first.');
    return results;
  }

  // Test 2: CORS preflight
  results.corsPreflight = await testCORSPreflight();

  // Test 3: Login with x-platform header
  results.loginWithPlatformHeader = await testLoginWithPlatformHeader();

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('=======================');
  console.log('Server Connectivity:', results.serverConnectivity ? '✅ PASS' : '❌ FAIL');
  console.log('CORS Preflight:', results.corsPreflight ? '✅ PASS' : '❌ FAIL');
  console.log('Login with x-platform:', results.loginWithPlatformHeader ? '✅ PASS' : '❌ FAIL');

  if (!results.corsPreflight || !results.loginWithPlatformHeader) {
    console.log('\n💡 Issue detected: x-platform header is not allowed in CORS configuration');
    console.log('Solution: Add "x-platform" to allowedHeaders in CORS configuration');
  } else {
    console.log('\n🎉 All CORS tests passed! x-platform header is properly configured.');
  }

  return results;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testCORSPreflight, testLoginWithPlatformHeader, testServerConnectivity };