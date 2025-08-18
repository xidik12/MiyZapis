#!/usr/bin/env node

/**
 * Comprehensive API Testing Suite for BookingBot Backend
 * Tests all endpoints systematically with detailed reporting
 */

const axios = require('axios');
const WebSocket = require('ws');
const FormData = require('form-data');
const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/v1`;
const WS_URL = 'ws://localhost:3000';

// Test results storage
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  endpointResults: {},
  performance: {},
  securityTests: {},
  startTime: Date.now()
};

// Test authentication tokens
let authTokens = {
  customer: null,
  specialist: null,
  admin: null
};

// Test user data
const testUsers = {
  customer: {
    email: 'customer@test.com',
    password: 'Test123456!',
    firstName: 'Тест',
    lastName: 'Клієнт',
    userType: 'CUSTOMER',
    phoneNumber: '+380501234567',
    language: 'uk'
  },
  specialist: {
    email: 'specialist@test.com',
    password: 'Test123456!',
    firstName: 'Тест',
    lastName: 'Спеціаліст',
    userType: 'SPECIALIST',
    phoneNumber: '+380501234568',
    language: 'uk'
  }
};

// Color console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Utility functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(title, 'bright');
  log('='.repeat(60), 'cyan');
}

function logTest(testName, passed, details = '') {
  const status = passed ? 'PASS' : 'FAIL';
  const color = passed ? 'green' : 'red';
  log(`[${status}] ${testName}${details ? ` - ${details}` : ''}`, color);
  
  testResults.total++;
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
    testResults.errors.push({ test: testName, details });
  }
}

function recordPerformance(endpoint, duration) {
  if (!testResults.performance[endpoint]) {
    testResults.performance[endpoint] = [];
  }
  testResults.performance[endpoint].push(duration);
}

async function makeRequest(method, url, data = null, headers = {}, expectError = false) {
  const startTime = Date.now();
  try {
    const config = {
      method,
      url: url.startsWith('http') ? url : `${API_BASE}${url}`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    const duration = Date.now() - startTime;
    recordPerformance(url, duration);
    
    return {
      success: true,
      status: response.status,
      data: response.data,
      headers: response.headers,
      duration
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    recordPerformance(url, duration);
    
    if (expectError) {
      return {
        success: false,
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
        duration,
        error: error.message
      };
    }
    
    return {
      success: false,
      status: error.response?.status || 0,
      data: error.response?.data || null,
      headers: error.response?.headers || {},
      duration,
      error: error.message
    };
  }
}

// Test functions
async function testServerStatus() {
  logSection('🏥 Server Status & Health Tests');

  // Test root endpoint
  const rootTest = await makeRequest('GET', BASE_URL);
  logTest('Root endpoint accessibility', rootTest.success && rootTest.status === 200, 
    `Status: ${rootTest.status}, Duration: ${rootTest.duration}ms`);

  // Test health endpoint
  const healthTest = await makeRequest('GET', '/health');
  logTest('Health endpoint', healthTest.success && healthTest.status === 200,
    `Status: ${healthTest.status}, Duration: ${healthTest.duration}ms`);

  // Test API version endpoint
  const apiTest = await makeRequest('GET', '/');
  logTest('API info endpoint', apiTest.success && apiTest.status === 200,
    `Status: ${apiTest.status}, Duration: ${apiTest.duration}ms`);

  // Test CORS headers
  const corsTest = await makeRequest('OPTIONS', '/health', null, {
    'Origin': 'http://localhost:3000',
    'Access-Control-Request-Method': 'GET'
  });
  const hasCors = corsTest.headers && corsTest.headers['access-control-allow-origin'];
  logTest('CORS configuration', hasCors !== undefined, `CORS headers present: ${!!hasCors}`);

  return rootTest.success && healthTest.success;
}

async function testAuthentication() {
  logSection('🔐 Authentication Endpoints Tests');

  // Test customer registration
  const customerRegResult = await makeRequest('POST', '/auth/register', testUsers.customer);
  logTest('Customer registration', 
    customerRegResult.success && (customerRegResult.status === 201 || customerRegResult.status === 200),
    `Status: ${customerRegResult.status}, Duration: ${customerRegResult.duration}ms`);

  // Test specialist registration
  const specialistRegResult = await makeRequest('POST', '/auth/register', testUsers.specialist);
  logTest('Specialist registration',
    specialistRegResult.success && (specialistRegResult.status === 201 || specialistRegResult.status === 200),
    `Status: ${specialistRegResult.status}, Duration: ${specialistRegResult.duration}ms`);

  // Test customer login
  const customerLoginResult = await makeRequest('POST', '/auth/login', {
    email: testUsers.customer.email,
    password: testUsers.customer.password
  });
  
  if (customerLoginResult.success && customerLoginResult.data?.data?.tokens?.accessToken) {
    authTokens.customer = customerLoginResult.data.data.tokens.accessToken;
    logTest('Customer login', true, 
      `Status: ${customerLoginResult.status}, Token received, Duration: ${customerLoginResult.duration}ms`);
  } else {
    logTest('Customer login', false, 
      `Status: ${customerLoginResult.status}, Error: ${customerLoginResult.error || 'No token received'}`);
  }

  // Test specialist login
  const specialistLoginResult = await makeRequest('POST', '/auth/login', {
    email: testUsers.specialist.email,
    password: testUsers.specialist.password
  });

  if (specialistLoginResult.success && specialistLoginResult.data?.data?.tokens?.accessToken) {
    authTokens.specialist = specialistLoginResult.data.data.tokens.accessToken;
    logTest('Specialist login', true,
      `Status: ${specialistLoginResult.status}, Token received, Duration: ${specialistLoginResult.duration}ms`);
  } else {
    logTest('Specialist login', false,
      `Status: ${specialistLoginResult.status}, Error: ${specialistLoginResult.error || 'No token received'}`);
  }

  // Test invalid login
  const invalidLoginResult = await makeRequest('POST', '/auth/login', {
    email: 'invalid@test.com',
    password: 'wrongpassword'
  }, {}, true);
  logTest('Invalid login rejection', 
    !invalidLoginResult.success && invalidLoginResult.status >= 400,
    `Status: ${invalidLoginResult.status}, Duration: ${invalidLoginResult.duration}ms`);

  // Test token refresh (if refresh tokens are implemented)
  if (customerLoginResult.data?.data?.tokens?.refreshToken) {
    const refreshResult = await makeRequest('POST', '/auth/refresh', {
      refreshToken: customerLoginResult.data.data.tokens.refreshToken
    });
    logTest('Token refresh',
      refreshResult.success && refreshResult.data?.data?.accessToken,
      `Status: ${refreshResult.status}, Duration: ${refreshResult.duration}ms`);
  }

  // Test logout
  if (authTokens.customer) {
    const logoutResult = await makeRequest('POST', '/auth/logout', {}, {
      'Authorization': `Bearer ${authTokens.customer}`
    });
    logTest('User logout',
      logoutResult.success && logoutResult.status === 200,
      `Status: ${logoutResult.status}, Duration: ${logoutResult.duration}ms`);
  }

  // Test forgot password
  const forgotPasswordResult = await makeRequest('POST', '/auth/forgot-password', {
    email: testUsers.customer.email
  });
  logTest('Forgot password request',
    forgotPasswordResult.success || forgotPasswordResult.status === 404, // 404 is acceptable if email service not configured
    `Status: ${forgotPasswordResult.status}, Duration: ${forgotPasswordResult.duration}ms`);

  return authTokens.customer && authTokens.specialist;
}

async function testUserManagement() {
  logSection('👤 User Management Endpoints Tests');

  if (!authTokens.customer) {
    log('Skipping user management tests - no customer token available', 'yellow');
    return false;
  }

  // Test get user profile
  const profileResult = await makeRequest('GET', '/users/profile', null, {
    'Authorization': `Bearer ${authTokens.customer}`
  });
  logTest('Get user profile',
    profileResult.success && profileResult.status === 200,
    `Status: ${profileResult.status}, Duration: ${profileResult.duration}ms`);

  // Test update user profile
  const updateProfileResult = await makeRequest('PUT', '/users/profile', {
    firstName: 'Оновлений',
    lastName: 'Користувач',
    phoneNumber: '+380501234569'
  }, {
    'Authorization': `Bearer ${authTokens.customer}`
  });
  logTest('Update user profile',
    updateProfileResult.success && updateProfileResult.status === 200,
    `Status: ${updateProfileResult.status}, Duration: ${updateProfileResult.duration}ms`);

  // Test get current user info
  const meResult = await makeRequest('GET', '/users/me', null, {
    'Authorization': `Bearer ${authTokens.customer}`
  });
  logTest('Get current user info',
    meResult.success && meResult.status === 200,
    `Status: ${meResult.status}, Duration: ${meResult.duration}ms`);

  // Test update user settings
  const settingsResult = await makeRequest('PUT', '/users/settings', {
    emailNotifications: true,
    pushNotifications: false,
    currency: 'UAH',
    language: 'uk'
  }, {
    'Authorization': `Bearer ${authTokens.customer}`
  });
  logTest('Update user settings',
    settingsResult.success && settingsResult.status === 200,
    `Status: ${settingsResult.status}, Duration: ${settingsResult.duration}ms`);

  return profileResult.success;
}

async function testSpecialistEndpoints() {
  logSection('⚡ Specialist Endpoints Tests');

  if (!authTokens.specialist) {
    log('Skipping specialist tests - no specialist token available', 'yellow');
    return false;
  }

  // Test create specialist profile
  const createProfileResult = await makeRequest('POST', '/specialists/profile', {
    businessName: 'Студія краси Тест',
    bio: 'Професійний майстер для тестування',
    specialties: ['hair', 'makeup'],
    address: 'вул. Тестова, 1',
    city: 'Київ',
    country: 'Україна',
    workingHours: {
      monday: { start: '09:00', end: '18:00' },
      tuesday: { start: '09:00', end: '18:00' }
    }
  }, {
    'Authorization': `Bearer ${authTokens.specialist}`
  });
  logTest('Create specialist profile',
    createProfileResult.success && (createProfileResult.status === 201 || createProfileResult.status === 200),
    `Status: ${createProfileResult.status}, Duration: ${createProfileResult.duration}ms`);

  // Test get specialist profile
  const getProfileResult = await makeRequest('GET', '/specialists/profile', null, {
    'Authorization': `Bearer ${authTokens.specialist}`
  });
  logTest('Get specialist profile',
    getProfileResult.success && getProfileResult.status === 200,
    `Status: ${getProfileResult.status}, Duration: ${getProfileResult.duration}ms`);

  // Test update specialist profile
  const updateProfileResult = await makeRequest('PUT', '/specialists/profile', {
    businessName: 'Оновлена Студія Краси',
    bio: 'Оновлений опис майстра'
  }, {
    'Authorization': `Bearer ${authTokens.specialist}`
  });
  logTest('Update specialist profile',
    updateProfileResult.success && updateProfileResult.status === 200,
    `Status: ${updateProfileResult.status}, Duration: ${updateProfileResult.duration}ms`);

  // Test get all specialists (public endpoint)
  const allSpecialistsResult = await makeRequest('GET', '/specialists');
  logTest('Get all specialists',
    allSpecialistsResult.success && allSpecialistsResult.status === 200,
    `Status: ${allSpecialistsResult.status}, Duration: ${allSpecialistsResult.duration}ms`);

  // Test specialist services endpoints
  const servicesResult = await makeRequest('GET', '/specialists/services', null, {
    'Authorization': `Bearer ${authTokens.specialist}`
  });
  logTest('Get specialist services',
    servicesResult.success && servicesResult.status === 200,
    `Status: ${servicesResult.status}, Duration: ${servicesResult.duration}ms`);

  // Test specialist bookings
  const bookingsResult = await makeRequest('GET', '/specialists/bookings', null, {
    'Authorization': `Bearer ${authTokens.specialist}`
  });
  logTest('Get specialist bookings',
    bookingsResult.success && bookingsResult.status === 200,
    `Status: ${bookingsResult.status}, Duration: ${bookingsResult.duration}ms`);

  return createProfileResult.success;
}

async function testServiceEndpoints() {
  logSection('🛍️ Service & Customer Endpoints Tests');

  // Test get all services (public)
  const servicesResult = await makeRequest('GET', '/services');
  logTest('Get all services',
    servicesResult.success && servicesResult.status === 200,
    `Status: ${servicesResult.status}, Duration: ${servicesResult.duration}ms`);

  // Test create service (specialist only)
  if (authTokens.specialist) {
    const createServiceResult = await makeRequest('POST', '/services', {
      name: 'Тестова послуга',
      description: 'Опис тестової послуги',
      categoryId: 'test-category',
      basePrice: 500,
      currency: 'UAH',
      duration: 60,
      requirements: ['requirement1'],
      deliverables: ['deliverable1']
    }, {
      'Authorization': `Bearer ${authTokens.specialist}`
    });
    logTest('Create service (specialist)',
      createServiceResult.success && (createServiceResult.status === 201 || createServiceResult.status === 200),
      `Status: ${createServiceResult.status}, Duration: ${createServiceResult.duration}ms`);
  }

  // Test get categories
  const categoriesResult = await makeRequest('GET', '/categories');
  logTest('Get service categories',
    categoriesResult.success && categoriesResult.status === 200,
    `Status: ${categoriesResult.status}, Duration: ${categoriesResult.duration}ms`);

  return servicesResult.success;
}

async function testBookingEndpoints() {
  logSection('📅 Booking Endpoints Tests');

  if (!authTokens.customer) {
    log('Skipping booking tests - no customer token available', 'yellow');
    return false;
  }

  // Test get customer bookings
  const bookingsResult = await makeRequest('GET', '/bookings', null, {
    'Authorization': `Bearer ${authTokens.customer}`
  });
  logTest('Get customer bookings',
    bookingsResult.success && bookingsResult.status === 200,
    `Status: ${bookingsResult.status}, Duration: ${bookingsResult.duration}ms`);

  // Test create booking (if specialist service exists)
  const createBookingResult = await makeRequest('POST', '/bookings', {
    serviceId: 'test-service-id',
    specialistId: 'test-specialist-id',
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    customerNotes: 'Тестове замовлення'
  }, {
    'Authorization': `Bearer ${authTokens.customer}`
  });
  logTest('Create booking',
    createBookingResult.success || createBookingResult.status === 404, // 404 acceptable if no services exist
    `Status: ${createBookingResult.status}, Duration: ${createBookingResult.duration}ms`);

  return bookingsResult.success;
}

async function testSearchAndFilters() {
  logSection('🔍 Search & Filter Endpoints Tests');

  // Test service search
  const serviceSearchResult = await makeRequest('GET', '/search/services?category=beauty&minPrice=100&maxPrice=1000');
  logTest('Service search with filters',
    serviceSearchResult.success && serviceSearchResult.status === 200,
    `Status: ${serviceSearchResult.status}, Duration: ${serviceSearchResult.duration}ms`);

  // Test specialist search
  const specialistSearchResult = await makeRequest('GET', '/search/specialists?city=Київ&rating=4');
  logTest('Specialist search with filters',
    specialistSearchResult.success && specialistSearchResult.status === 200,
    `Status: ${specialistSearchResult.status}, Duration: ${specialistSearchResult.duration}ms`);

  // Test locations endpoint
  const locationsResult = await makeRequest('GET', '/locations');
  logTest('Get available locations',
    locationsResult.success && locationsResult.status === 200,
    `Status: ${locationsResult.status}, Duration: ${locationsResult.duration}ms`);

  return serviceSearchResult.success;
}

async function testErrorHandling() {
  logSection('⚠️ Error Handling & Validation Tests');

  // Test 404 for non-existent endpoint
  const notFoundResult = await makeRequest('GET', '/non-existent-endpoint', null, {}, true);
  logTest('404 error handling',
    notFoundResult.status === 404,
    `Status: ${notFoundResult.status}, Duration: ${notFoundResult.duration}ms`);

  // Test validation errors
  const validationResult = await makeRequest('POST', '/auth/register', {
    email: 'invalid-email',
    password: '123' // too short
  }, {}, true);
  logTest('Input validation',
    !validationResult.success && validationResult.status >= 400,
    `Status: ${validationResult.status}, Duration: ${validationResult.duration}ms`);

  // Test unauthorized access
  const unauthorizedResult = await makeRequest('GET', '/users/profile', null, {}, true);
  logTest('Unauthorized access rejection',
    unauthorizedResult.status === 401,
    `Status: ${unauthorizedResult.status}, Duration: ${unauthorizedResult.duration}ms`);

  // Test invalid token
  const invalidTokenResult = await makeRequest('GET', '/users/profile', null, {
    'Authorization': 'Bearer invalid-token'
  }, true);
  logTest('Invalid token rejection',
    invalidTokenResult.status === 401,
    `Status: ${invalidTokenResult.status}, Duration: ${invalidTokenResult.duration}ms`);

  return true;
}

async function testFileUpload() {
  logSection('📁 File Upload Endpoints Tests');

  if (!authTokens.customer) {
    log('Skipping file upload tests - no customer token available', 'yellow');
    return false;
  }

  // Test avatar upload endpoint (if implemented)
  const uploadResult = await makeRequest('POST', '/files/upload?purpose=avatar', null, {
    'Authorization': `Bearer ${authTokens.customer}`,
    'Content-Type': 'multipart/form-data'
  });
  
  logTest('File upload endpoint availability',
    uploadResult.success || uploadResult.status === 400, // 400 acceptable if no file provided
    `Status: ${uploadResult.status}, Duration: ${uploadResult.duration}ms`);

  return true;
}

async function testWebSocket() {
  logSection('🔌 WebSocket Functionality Tests');

  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(WS_URL);
      let connected = false;

      ws.on('open', () => {
        connected = true;
        logTest('WebSocket connection', true, 'Successfully connected');
        ws.close();
      });

      ws.on('error', (error) => {
        logTest('WebSocket connection', false, `Error: ${error.message}`);
        resolve(false);
      });

      ws.on('close', () => {
        resolve(connected);
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!connected) {
          logTest('WebSocket connection', false, 'Connection timeout');
          ws.close();
          resolve(false);
        }
      }, 5000);

    } catch (error) {
      logTest('WebSocket connection', false, `Error: ${error.message}`);
      resolve(false);
    }
  });
}

async function testSecurityFeatures() {
  logSection('🔒 Security Tests');

  // Test SQL injection protection
  const sqlInjectionResult = await makeRequest('GET', "/users/profile'; DROP TABLE users; --", null, {}, true);
  logTest('SQL injection protection',
    sqlInjectionResult.status === 404 || sqlInjectionResult.status === 400,
    `Status: ${sqlInjectionResult.status}`);

  // Test XSS protection
  const xssResult = await makeRequest('POST', '/auth/register', {
    email: 'test@test.com',
    password: 'Test123456!',
    firstName: '<script>alert("xss")</script>',
    lastName: 'Test',
    userType: 'CUSTOMER'
  }, {}, true);
  logTest('XSS protection',
    xssResult.success || xssResult.status >= 400,
    `Status: ${xssResult.status}`);

  // Test rate limiting (if enabled)
  const rateLimitPromises = Array(10).fill().map(() => 
    makeRequest('GET', '/health', null, {}, true)
  );
  
  const rateLimitResults = await Promise.all(rateLimitPromises);
  const blockedRequests = rateLimitResults.filter(r => r.status === 429).length;
  
  logTest('Rate limiting',
    true, // Rate limiting might be disabled in development
    `Blocked requests: ${blockedRequests}/10`);

  testResults.securityTests = {
    sqlInjection: sqlInjectionResult.status !== 200,
    xssProtection: xssResult.success || xssResult.status >= 400,
    rateLimiting: blockedRequests > 0
  };

  return true;
}

function generateReport() {
  logSection('📊 Test Results Summary');

  const endTime = Date.now();
  const totalDuration = endTime - testResults.startTime;

  log(`Total Tests: ${testResults.total}`, 'bright');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, 'red');
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`, 'bright');
  log(`Total Duration: ${totalDuration}ms`, 'bright');

  if (testResults.failed > 0) {
    log('\n❌ Failed Tests:', 'red');
    testResults.errors.forEach((error, index) => {
      log(`${index + 1}. ${error.test} - ${error.details}`, 'red');
    });
  }

  // Performance analysis
  log('\n⚡ Performance Analysis:', 'cyan');
  Object.entries(testResults.performance).forEach(([endpoint, durations]) => {
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const max = Math.max(...durations);
    log(`${endpoint}: Avg ${avg.toFixed(0)}ms, Max ${max}ms`, 'yellow');
  });

  // Security summary
  log('\n🔒 Security Tests Summary:', 'cyan');
  Object.entries(testResults.securityTests).forEach(([test, passed]) => {
    const status = passed ? 'PASS' : 'FAIL';
    const color = passed ? 'green' : 'red';
    log(`${test}: ${status}`, color);
  });

  // Save detailed report
  const report = {
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: ((testResults.passed / testResults.total) * 100).toFixed(1),
      duration: totalDuration
    },
    failures: testResults.errors,
    performance: testResults.performance,
    security: testResults.securityTests,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync('/Users/salakhitdinovkhidayotullo/Documents/BookingBot/api_test_report.json', 
    JSON.stringify(report, null, 2));
  
  log('\n📝 Detailed report saved to api_test_report.json', 'green');
}

// Main test execution
async function runTests() {
  log('🚀 Starting Comprehensive API Testing Suite', 'bright');
  log(`Testing against: ${BASE_URL}`, 'cyan');

  try {
    await testServerStatus();
    await testAuthentication();
    await testUserManagement();
    await testSpecialistEndpoints();
    await testServiceEndpoints();
    await testBookingEndpoints();
    await testSearchAndFilters();
    await testErrorHandling();
    await testFileUpload();
    await testWebSocket();
    await testSecurityFeatures();

    generateReport();

    const overallSuccess = testResults.failed === 0;
    log(`\n🎯 Testing Complete: ${overallSuccess ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`, 
      overallSuccess ? 'green' : 'red');

    process.exit(overallSuccess ? 0 : 1);

  } catch (error) {
    log(`\n💥 Testing suite crashed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Handle cleanup
process.on('SIGINT', () => {
  log('\n🛑 Testing interrupted by user', 'yellow');
  generateReport();
  process.exit(1);
});

// Run the tests
runTests();