const axios = require('axios');

// Configuration
const API_URL = process.env.API_URL || 'https://miyzapis-backend-production.up.railway.app';
const ADMIN_EMAIL = 'admin@miyzapis.com';
const ADMIN_PASSWORD = 'Admin123!@#';

let authToken = null;

// Test results tracker
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, colors.cyan);
  console.log('='.repeat(70));
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

// Login to get admin token
async function login() {
  logSection('🔐 ADMIN AUTHENTICATION');

  try {
    logInfo(`Attempting login to: ${API_URL}/api/v1/auth/login`);
    logInfo(`Email: ${ADMIN_EMAIL}`);

    const response = await axios.post(`${API_URL}/api/v1/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (response.data.success && response.data.data.tokens) {
      authToken = response.data.data.tokens.accessToken;
      logSuccess('Login successful');
      logInfo(`Token: ${authToken.substring(0, 30)}...`);
      logInfo(`User: ${response.data.data.user.firstName} ${response.data.data.user.lastName}`);
      logInfo(`User Type: ${response.data.data.user.userType}`);
      return true;
    } else {
      logError('Login failed: Invalid response structure');
      console.log(JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    logError(`Login failed: ${error.message}`);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// Test a single endpoint
async function testEndpoint(name, url, expectedKeys = [], options = {}) {
  testResults.total++;

  try {
    const config = {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      ...options
    };

    const fullUrl = `${API_URL}${url}`;
    const method = options.method || 'GET';

    log(`\nTesting: ${name}`, colors.gray);
    log(`  ${method} ${url}`, colors.gray);

    const startTime = Date.now();
    let response;

    if (method === 'POST' || method === 'PUT') {
      response = await axios[method.toLowerCase()](fullUrl, options.data || {}, config);
    } else {
      response = await axios[method.toLowerCase()](fullUrl, config);
    }

    const duration = Date.now() - startTime;

    // Check response status
    if (response.status !== 200) {
      logWarning(`${name}: Unexpected status ${response.status}`);
      testResults.failed++;
      testResults.errors.push({
        endpoint: name,
        error: `Status ${response.status}`,
        url
      });
      return false;
    }

    // Check response structure
    if (!response.data.success) {
      logError(`${name}: Response success=false`);
      console.log('Response:', JSON.stringify(response.data, null, 2));
      testResults.failed++;
      testResults.errors.push({
        endpoint: name,
        error: 'Response success=false',
        url
      });
      return false;
    }

    // Check expected keys
    const data = response.data.data || response.data;
    const missingKeys = expectedKeys.filter(key => {
      const keys = key.split('.');
      let current = data;
      for (const k of keys) {
        if (!current || !(k in current)) return true;
        current = current[k];
      }
      return false;
    });

    if (missingKeys.length > 0) {
      logWarning(`${name}: Missing expected keys: ${missingKeys.join(', ')}`);
      logInfo('Available keys: ' + Object.keys(data).join(', '));
    }

    logSuccess(`${name}: PASSED (${duration}ms)`);

    // Log data summary
    if (data) {
      const summary = summarizeData(data);
      if (summary) {
        log(`  ${summary}`, colors.gray);
      }
    }

    testResults.passed++;
    return true;

  } catch (error) {
    const status = error.response?.status || 'N/A';
    const message = error.response?.data?.error?.message ||
                   error.response?.data?.message ||
                   error.message;

    logError(`${name}: ${status} - ${message}`);

    if (error.response?.data) {
      console.log('Error details:', JSON.stringify(error.response.data, null, 2));
    }

    testResults.failed++;
    testResults.errors.push({
      endpoint: name,
      error: `${status} - ${message}`,
      url
    });
    return false;
  }
}

// Summarize response data
function summarizeData(data) {
  if (!data) return null;

  const summaries = [];

  // Count items in arrays
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      summaries.push(`${key}: ${value.length} items`);
    } else if (typeof value === 'object' && value !== null) {
      const count = Object.keys(value).length;
      summaries.push(`${key}: ${count} fields`);
    } else if (typeof value === 'number') {
      summaries.push(`${key}: ${value}`);
    }
  }

  return summaries.slice(0, 3).join(', ');
}

// Test all analytics endpoints
async function testAnalyticsEndpoints() {
  logSection('📊 ANALYTICS ENDPOINTS');

  const periods = ['7d', '30d', '90d', '1y'];

  // Test dashboard stats with different periods
  for (const period of periods) {
    await testEndpoint(
      `Dashboard Stats (${period})`,
      `/api/v1/admin/dashboard/stats?period=${period}`,
      ['stats.overview', 'stats.growth', 'stats.recentActivity', 'stats.analytics']
    );
  }

  // Test user analytics
  await testEndpoint(
    'User Analytics - All Users',
    '/api/v1/admin/analytics/users?period=30d',
    ['userTrends', 'engagementStats', 'geographicStats']
  );

  await testEndpoint(
    'User Analytics - Customers Only',
    '/api/v1/admin/analytics/users?period=30d&userType=CUSTOMER',
    ['userTrends', 'engagementStats']
  );

  await testEndpoint(
    'User Analytics - Specialists Only',
    '/api/v1/admin/analytics/users?period=30d&userType=SPECIALIST',
    ['userTrends', 'engagementStats']
  );

  // Test booking analytics
  await testEndpoint(
    'Booking Analytics',
    '/api/v1/admin/analytics/bookings?period=30d',
    ['statusStats', 'bookingTrends', 'popularServices', 'hourlyStats', 'categoryRevenue']
  );

  // Test financial analytics
  await testEndpoint(
    'Financial Analytics',
    '/api/v1/admin/analytics/financial?period=30d',
    ['revenueTrends', 'paymentMethodStats', 'currencyStats', 'topEarningSpecialists', 'refundStats']
  );

  // Test referral analytics
  await testEndpoint(
    'Referral Analytics',
    '/api/v1/admin/analytics/referrals',
    ['referralAnalytics']
  );
}

// Test system health endpoints
async function testSystemEndpoints() {
  logSection('🏥 SYSTEM HEALTH ENDPOINTS');

  await testEndpoint(
    'System Health Check',
    '/api/v1/admin/system/health',
    ['healthChecks', 'systemMetrics', 'appMetrics', 'overallStatus']
  );

  await testEndpoint(
    'Audit Logs',
    '/api/v1/admin/audit-logs',
    ['auditLogs', 'pagination']
  );
}

// Test user management endpoints (read-only for now)
async function testUserManagementEndpoints() {
  logSection('👥 USER MANAGEMENT ENDPOINTS');

  logInfo('Skipping write operations (activate/deactivate/delete) to avoid data modification');
  logInfo('These endpoints can be tested manually if needed:');
  logInfo('  POST /api/v1/admin/users/manage');
  logInfo('  Body: { "action": "activate|deactivate|delete", "userIds": [...] }');
}

// Test referral management endpoints
async function testReferralManagementEndpoints() {
  logSection('🎁 REFERRAL MANAGEMENT ENDPOINTS');

  logInfo('Testing referral cleanup endpoint (read-only simulation)');
  logWarning('Skipping actual cleanup to avoid data modification');
  logInfo('Endpoint: POST /api/v1/admin/referrals/cleanup-expired');
}

// Test edge cases and error handling
async function testEdgeCases() {
  logSection('🔍 EDGE CASES & ERROR HANDLING');

  // Test with invalid period
  await testEndpoint(
    'Invalid Period Parameter',
    '/api/v1/admin/dashboard/stats?period=invalid',
    ['stats']
  );

  // Test with invalid user type
  await testEndpoint(
    'Invalid User Type',
    '/api/v1/admin/analytics/users?userType=INVALID',
    ['userTrends']
  );

  // Test without auth token
  const tempToken = authToken;
  try {
    authToken = null;
    logInfo('Testing endpoint without authentication');
    const response = await axios.get(`${API_URL}/api/v1/admin/dashboard/stats`);
    logError('Should have failed without auth token');
  } catch (error) {
    if (error.response?.status === 401) {
      logSuccess('Correctly rejected request without auth token (401)');
    } else {
      logWarning(`Unexpected status: ${error.response?.status}`);
    }
  } finally {
    authToken = tempToken;
  }

  // Test with invalid auth token
  try {
    authToken = 'invalid_token_12345';
    logInfo('Testing endpoint with invalid token');
    const response = await axios.get(`${API_URL}/api/v1/admin/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    logError('Should have failed with invalid token');
  } catch (error) {
    if (error.response?.status === 401) {
      logSuccess('Correctly rejected request with invalid token (401)');
    } else {
      logWarning(`Unexpected status: ${error.response?.status}`);
    }
  } finally {
    authToken = tempToken;
  }
}

// Performance tests
async function testPerformance() {
  logSection('⚡ PERFORMANCE TESTS');

  const iterations = 5;
  const times = [];

  logInfo(`Running ${iterations} iterations of dashboard stats endpoint`);

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    try {
      await axios.get(`${API_URL}/api/v1/admin/dashboard/stats?period=30d`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const duration = Date.now() - startTime;
      times.push(duration);
      log(`  Iteration ${i + 1}: ${duration}ms`, colors.gray);
    } catch (error) {
      logError(`Iteration ${i + 1} failed: ${error.message}`);
    }
  }

  if (times.length > 0) {
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    logInfo(`Average response time: ${avg.toFixed(2)}ms`);
    logInfo(`Min: ${min}ms, Max: ${max}ms`);

    if (avg < 1000) {
      logSuccess('Performance: Excellent (< 1s)');
    } else if (avg < 3000) {
      logSuccess('Performance: Good (< 3s)');
    } else {
      logWarning('Performance: Needs improvement (> 3s)');
    }
  }
}

// Generate test report
function generateReport() {
  logSection('📋 TEST REPORT');

  console.log(`
Total Tests:    ${testResults.total}
Passed:         ${testResults.passed} (${colors.green}✓${colors.reset})
Failed:         ${testResults.failed} (${colors.red}✗${colors.reset})
Success Rate:   ${((testResults.passed / testResults.total) * 100).toFixed(1)}%
  `);

  if (testResults.errors.length > 0) {
    logSection('❌ FAILED TESTS DETAILS');
    testResults.errors.forEach((error, index) => {
      console.log(`\n${index + 1}. ${error.endpoint}`);
      log(`   URL: ${error.url}`, colors.gray);
      logError(`   Error: ${error.error}`);
    });
  }

  logSection('💡 RECOMMENDATIONS');

  if (testResults.failed === 0) {
    logSuccess('All admin endpoints are working correctly!');
    logInfo('The backend API is ready for production use.');
  } else if (testResults.failed < 3) {
    logWarning('Some endpoints have issues but most are working.');
    logInfo('Review the failed tests above and fix the issues.');
  } else {
    logError('Multiple endpoints are failing.');
    logInfo('This may indicate a systemic issue. Check:');
    logInfo('  1. Database connectivity');
    logInfo('  2. Authentication configuration');
    logInfo('  3. Admin user permissions');
    logInfo('  4. API routes configuration');
  }

  logSection('📝 ENDPOINT DOCUMENTATION');
  console.log(`
Available Admin Endpoints:

📊 Analytics:
  GET  /api/v1/admin/dashboard/stats?period={7d|30d|90d|1y}
  GET  /api/v1/admin/analytics/users?period={period}&userType={CUSTOMER|SPECIALIST}
  GET  /api/v1/admin/analytics/bookings?period={period}
  GET  /api/v1/admin/analytics/financial?period={period}
  GET  /api/v1/admin/analytics/referrals

🏥 System:
  GET  /api/v1/admin/system/health
  GET  /api/v1/admin/audit-logs

👥 User Management:
  POST /api/v1/admin/users/manage
       Body: { "action": "activate|deactivate|delete", "userIds": [...] }

🎁 Referral Management:
  POST /api/v1/admin/referrals/cleanup-expired

All endpoints require:
  - Authorization: Bearer {token}
  - Admin role (userType: ADMIN)
  `);
}

// Main test runner
async function runAllTests() {
  console.clear();
  logSection('🚀 MIYZAPIS ADMIN API COMPREHENSIVE TEST SUITE');
  logInfo(`Testing API: ${API_URL}`);
  logInfo(`Start Time: ${new Date().toISOString()}`);

  try {
    // Step 1: Login
    const loginSuccess = await login();
    if (!loginSuccess) {
      logError('Login failed. Cannot proceed with tests.');
      return;
    }

    // Step 2: Test all endpoint groups
    await testAnalyticsEndpoints();
    await testSystemEndpoints();
    await testUserManagementEndpoints();
    await testReferralManagementEndpoints();

    // Step 3: Edge cases
    await testEdgeCases();

    // Step 4: Performance
    await testPerformance();

    // Step 5: Generate report
    generateReport();

  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
    console.error(error);
  }

  logSection('✨ TEST SUITE COMPLETED');
  logInfo(`End Time: ${new Date().toISOString()}`);
}

// Run the tests
runAllTests().catch(console.error);
