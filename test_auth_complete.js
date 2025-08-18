/**
 * Complete authentication test with x-platform header
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8000';
const API_URL = `${BASE_URL}/api/v1`;

// Test user data
const testUser = {
  email: 'test.user@example.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
  role: 'customer',
};

// Test configuration with x-platform header
const testConfig = {
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'x-platform': 'web',
    'Origin': 'http://localhost:3000',
  },
  validateStatus: function (status) {
    return status >= 200 && status < 600;
  }
};

/**
 * Test user registration with x-platform header
 */
async function testRegistration() {
  console.log('\n🔍 Testing user registration with x-platform header...');
  
  try {
    const response = await axios.post(`${API_URL}/auth/register`, testUser, testConfig);
    
    if (response.status === 201) {
      console.log('✅ Registration successful');
      console.log('User ID:', response.data.data?.user?.id);
      return { success: true, user: response.data.data?.user, tokens: response.data.data?.tokens };
    } else if (response.status === 409) {
      console.log('ℹ️ User already exists, continuing with login test');
      return { success: true, userExists: true };
    } else {
      console.log('❌ Registration failed');
      console.log('Status:', response.status);
      console.log('Response:', response.data);
      return { success: false };
    }
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('ℹ️ User already exists, continuing with login test');
      return { success: true, userExists: true };
    }
    
    console.log('❌ Registration error');
    console.log('Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', error.response.data);
    }
    return { success: false, error: error.message };
  }
}

/**
 * Test user login with x-platform header
 */
async function testLogin() {
  console.log('\n🔍 Testing user login with x-platform header...');
  
  try {
    const loginData = {
      email: testUser.email,
      password: testUser.password,
    };
    
    const response = await axios.post(`${API_URL}/auth/login`, loginData, testConfig);
    
    if (response.status === 200) {
      console.log('✅ Login successful');
      console.log('User ID:', response.data.data?.user?.id);
      console.log('Access Token:', response.data.data?.tokens?.accessToken ? '✅ Present' : '❌ Missing');
      console.log('Refresh Token:', response.data.data?.tokens?.refreshToken ? '✅ Present' : '❌ Missing');
      return { success: true, user: response.data.data?.user, tokens: response.data.data?.tokens };
    } else {
      console.log('❌ Login failed');
      console.log('Status:', response.status);
      console.log('Response:', response.data);
      return { success: false };
    }
  } catch (error) {
    console.log('❌ Login error');
    console.log('Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', error.response.data);
    }
    return { success: false, error: error.message };
  }
}

/**
 * Test protected endpoint with access token and x-platform header
 */
async function testProtectedEndpoint(accessToken) {
  console.log('\n🔍 Testing protected endpoint /auth/me with x-platform header...');
  
  try {
    const config = {
      ...testConfig,
      headers: {
        ...testConfig.headers,
        'Authorization': `Bearer ${accessToken}`,
      }
    };
    
    const response = await axios.get(`${API_URL}/auth/me`, config);
    
    if (response.status === 200) {
      console.log('✅ Protected endpoint access successful');
      console.log('User:', response.data.data?.user?.email);
      return { success: true, user: response.data.data?.user };
    } else {
      console.log('❌ Protected endpoint access failed');
      console.log('Status:', response.status);
      console.log('Response:', response.data);
      return { success: false };
    }
  } catch (error) {
    console.log('❌ Protected endpoint error');
    console.log('Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', error.response.data);
    }
    return { success: false, error: error.message };
  }
}

/**
 * Test CORS preflight for different endpoints
 */
async function testCORSForEndpoints() {
  console.log('\n🔍 Testing CORS preflight for various endpoints...');
  
  const endpoints = [
    '/auth/login',
    '/auth/register',
    '/auth/me',
  ];
  
  const results = {};
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.options(`${API_URL}${endpoint}`, {
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type,authorization,x-platform',
        },
        timeout: testConfig.timeout,
      });
      
      const allowedHeaders = response.headers['access-control-allow-headers'];
      const isPlatformAllowed = allowedHeaders && allowedHeaders.toLowerCase().includes('x-platform');
      
      results[endpoint] = {
        success: true,
        status: response.status,
        platformHeaderAllowed: isPlatformAllowed,
        allowedHeaders: allowedHeaders,
      };
      
      console.log(`✅ ${endpoint}: x-platform ${isPlatformAllowed ? 'allowed' : 'blocked'}`);
    } catch (error) {
      results[endpoint] = {
        success: false,
        error: error.message,
      };
      console.log(`❌ ${endpoint}: CORS preflight failed`);
    }
  }
  
  return results;
}

/**
 * Main test runner
 */
async function runCompleteAuthTest() {
  console.log('🚀 Starting complete authentication test with x-platform header...');
  console.log('Target:', API_URL);
  console.log('Origin:', 'http://localhost:3000');
  console.log('Platform Header:', 'x-platform: web');
  
  const results = {
    corsTests: {},
    registration: { success: false },
    login: { success: false },
    protectedEndpoint: { success: false },
  };

  // Test 1: CORS preflight for endpoints
  console.log('\n=== Phase 1: CORS Testing ===');
  results.corsTests = await testCORSForEndpoints();

  // Test 2: Registration
  console.log('\n=== Phase 2: User Registration ===');
  results.registration = await testRegistration();

  // Test 3: Login
  console.log('\n=== Phase 3: User Login ===');
  results.login = await testLogin();

  // Test 4: Protected endpoint (if login successful)
  if (results.login.success && results.login.tokens?.accessToken) {
    console.log('\n=== Phase 4: Protected Endpoint Access ===');
    results.protectedEndpoint = await testProtectedEndpoint(results.login.tokens.accessToken);
  } else {
    console.log('\n=== Phase 4: Skipped (Login failed) ===');
  }

  // Summary
  console.log('\n📊 Complete Test Results Summary:');
  console.log('=====================================');
  
  // CORS results
  console.log('\nCORS Tests:');
  Object.entries(results.corsTests).forEach(([endpoint, result]) => {
    const status = result.success && result.platformHeaderAllowed ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${endpoint}: ${status}`);
  });
  
  // Auth flow results
  console.log('\nAuthentication Flow:');
  console.log('  Registration:', results.registration.success ? '✅ PASS' : '❌ FAIL');
  console.log('  Login:', results.login.success ? '✅ PASS' : '❌ FAIL');
  console.log('  Protected Endpoint:', results.protectedEndpoint.success ? '✅ PASS' : '❌ FAIL');

  const allPassed = Object.values(results.corsTests).every(r => r.success && r.platformHeaderAllowed) &&
                   results.login.success &&
                   results.protectedEndpoint.success;

  if (allPassed) {
    console.log('\n🎉 All tests passed! CORS and authentication working correctly with x-platform header.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the details above.');
  }

  return results;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runCompleteAuthTest().catch(console.error);
}

module.exports = { runCompleteAuthTest, testRegistration, testLogin, testProtectedEndpoint, testCORSForEndpoints };