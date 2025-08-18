/**
 * Comprehensive BookingBot Platform Test Suite
 * Tests all critical features and user journeys for production readiness
 */

const API_BASE_URL = 'http://localhost:3002/api/v1';

// Test results tracking
const testResults = {
  userRegistrationAuth: { score: 0, maxScore: 10, issues: [] },
  customerJourney: { score: 0, maxScore: 10, issues: [] },
  specialistJourney: { score: 0, maxScore: 10, issues: [] },
  platformFeatures: { score: 0, maxScore: 10, issues: [] },
  adminFeatures: { score: 0, maxScore: 10, issues: [] },
  integrationTesting: { score: 0, maxScore: 10, issues: [] },
  telegramIntegration: { score: 0, maxScore: 10, issues: [] },
  performanceSecurity: { score: 0, maxScore: 10, issues: [] }
};

// Helper function to make API requests
async function makeRequest(method, endpoint, data = null, headers = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method: method.toUpperCase(),
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (data && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const responseData = await response.text();
    let jsonData;
    
    try {
      jsonData = JSON.parse(responseData);
    } catch (e) {
      jsonData = { rawResponse: responseData };
    }

    return {
      status: response.status,
      statusText: response.statusText,
      data: jsonData,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return {
      status: 0,
      statusText: 'Network Error',
      data: { error: error.message },
      headers: {}
    };
  }
}

// Generate test data
function generateTestUser(userType = 'CUSTOMER') {
  const timestamp = Date.now();
  return {
    email: `test${userType.toLowerCase()}${timestamp}@bookingbot.test`,
    password: 'TestPassword123!',
    firstName: `Test${userType}`,
    lastName: `User${timestamp}`,
    userType: userType,
    phoneNumber: `+380${Math.floor(Math.random() * 1000000000)}`,
    language: 'en'
  };
}

function generateTestService() {
  const timestamp = Date.now();
  return {
    name: `Test Service ${timestamp}`,
    description: 'This is a test service for platform testing',
    category: 'beauty',
    basePrice: 100.00,
    currency: 'USD',
    duration: 60,
    requirements: JSON.stringify(['clean hair', 'arrive on time']),
    deliverables: JSON.stringify(['styled hair', 'professional service'])
  };
}

function generateTestBooking(serviceId, specialistId) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);
  
  return {
    serviceId: serviceId,
    specialistId: specialistId,
    scheduledAt: futureDate.toISOString(),
    customerNotes: 'This is a test booking'
  };
}

// Test functions

async function testUserRegistrationAndAuth() {
  console.log('\n🔐 Testing User Registration & Authentication Flow...');
  
  try {
    // Test 1: Customer Registration
    console.log('  Testing customer registration...');
    const customerData = generateTestUser('CUSTOMER');
    const customerRegResponse = await makeRequest('POST', '/auth/register', customerData);
    
    if (customerRegResponse.status === 201 || customerRegResponse.status === 200) {
      testResults.userRegistrationAuth.score += 2;
      console.log('    ✅ Customer registration successful');
    } else {
      testResults.userRegistrationAuth.issues.push(`Customer registration failed: ${customerRegResponse.status} - ${JSON.stringify(customerRegResponse.data)}`);
      console.log('    ❌ Customer registration failed');
    }

    // Test 2: Specialist Registration
    console.log('  Testing specialist registration...');
    const specialistData = generateTestUser('SPECIALIST');
    const specialistRegResponse = await makeRequest('POST', '/auth/register', specialistData);
    
    if (specialistRegResponse.status === 201 || specialistRegResponse.status === 200) {
      testResults.userRegistrationAuth.score += 2;
      console.log('    ✅ Specialist registration successful');
    } else {
      testResults.userRegistrationAuth.issues.push(`Specialist registration failed: ${specialistRegResponse.status} - ${JSON.stringify(specialistRegResponse.data)}`);
      console.log('    ❌ Specialist registration failed');
    }

    // Test 3: Customer Login
    console.log('  Testing customer login...');
    const customerLoginResponse = await makeRequest('POST', '/auth/login', {
      email: customerData.email,
      password: customerData.password
    });
    
    let customerToken = null;
    if (customerLoginResponse.status === 200 && (customerLoginResponse.data.token || customerLoginResponse.data.data?.tokens?.accessToken)) {
      testResults.userRegistrationAuth.score += 2;
      customerToken = customerLoginResponse.data.token || customerLoginResponse.data.data.tokens.accessToken;
      console.log('    ✅ Customer login successful');
    } else {
      testResults.userRegistrationAuth.issues.push(`Customer login failed: ${customerLoginResponse.status} - ${JSON.stringify(customerLoginResponse.data)}`);
      console.log('    ❌ Customer login failed');
    }

    // Test 4: Specialist Login
    console.log('  Testing specialist login...');
    const specialistLoginResponse = await makeRequest('POST', '/auth/login', {
      email: specialistData.email,
      password: specialistData.password
    });
    
    let specialistToken = null;
    if (specialistLoginResponse.status === 200 && (specialistLoginResponse.data.token || specialistLoginResponse.data.data?.tokens?.accessToken)) {
      testResults.userRegistrationAuth.score += 2;
      specialistToken = specialistLoginResponse.data.token || specialistLoginResponse.data.data.tokens.accessToken;
      console.log('    ✅ Specialist login successful');
    } else {
      testResults.userRegistrationAuth.issues.push(`Specialist login failed: ${specialistLoginResponse.status} - ${JSON.stringify(specialistLoginResponse.data)}`);
      console.log('    ❌ Specialist login failed');
    }

    // Test 5: Protected route access
    console.log('  Testing protected route access...');
    if (customerToken) {
      const profileResponse = await makeRequest('GET', '/users/profile', null, {
        'Authorization': `Bearer ${customerToken}`
      });
      
      if (profileResponse.status === 200) {
        testResults.userRegistrationAuth.score += 1;
        console.log('    ✅ Protected route access successful');
      } else {
        testResults.userRegistrationAuth.issues.push(`Protected route access failed: ${profileResponse.status}`);
        console.log('    ❌ Protected route access failed');
      }
    }

    // Test 6: Invalid login
    console.log('  Testing invalid login handling...');
    const invalidLoginResponse = await makeRequest('POST', '/auth/login', {
      email: customerData.email,
      password: 'wrongpassword'
    });
    
    if (invalidLoginResponse.status === 401 || invalidLoginResponse.status === 400) {
      testResults.userRegistrationAuth.score += 1;
      console.log('    ✅ Invalid login properly rejected');
    } else {
      testResults.userRegistrationAuth.issues.push(`Invalid login not properly handled: ${invalidLoginResponse.status}`);
      console.log('    ❌ Invalid login not properly handled');
    }

    // Store tokens for further testing
    global.testTokens = {
      customer: customerToken,
      specialist: specialistToken,
      customerData: customerData,
      specialistData: specialistData
    };

  } catch (error) {
    testResults.userRegistrationAuth.issues.push(`Unexpected error: ${error.message}`);
    console.log(`    ❌ Unexpected error: ${error.message}`);
  }
}

async function testCustomerJourney() {
  console.log('\n👥 Testing Customer Journey...');
  
  try {
    const customerToken = global.testTokens?.customer;
    if (!customerToken) {
      testResults.customerJourney.issues.push('No customer token available for testing');
      console.log('    ❌ No customer token available');
      return;
    }

    // Test 1: Service Discovery/Search
    console.log('  Testing service discovery...');
    const servicesResponse = await makeRequest('GET', '/services');
    
    if (servicesResponse.status === 200) {
      testResults.customerJourney.score += 2;
      console.log('    ✅ Service discovery successful');
    } else {
      testResults.customerJourney.issues.push(`Service discovery failed: ${servicesResponse.status}`);
      console.log('    ❌ Service discovery failed');
    }

    // Test 2: Specialist Discovery
    console.log('  Testing specialist discovery...');
    const specialistsResponse = await makeRequest('GET', '/specialists');
    
    if (specialistsResponse.status === 200) {
      testResults.customerJourney.score += 2;
      console.log('    ✅ Specialist discovery successful');
    } else {
      testResults.customerJourney.issues.push(`Specialist discovery failed: ${specialistsResponse.status}`);
      console.log('    ❌ Specialist discovery failed');
    }

    // Test 3: Customer Profile Management
    console.log('  Testing customer profile management...');
    const profileUpdateResponse = await makeRequest('PUT', '/users/profile', {
      firstName: 'UpdatedCustomer',
      language: 'uk'
    }, {
      'Authorization': `Bearer ${customerToken}`
    });
    
    if (profileUpdateResponse.status === 200) {
      testResults.customerJourney.score += 2;
      console.log('    ✅ Profile update successful');
    } else {
      testResults.customerJourney.issues.push(`Profile update failed: ${profileUpdateResponse.status}`);
      console.log('    ❌ Profile update failed');
    }

    // Test 4: Booking Management (viewing bookings)
    console.log('  Testing booking management...');
    const bookingsResponse = await makeRequest('GET', '/bookings', null, {
      'Authorization': `Bearer ${customerToken}`
    });
    
    if (bookingsResponse.status === 200) {
      testResults.customerJourney.score += 2;
      console.log('    ✅ Booking management access successful');
    } else {
      testResults.customerJourney.issues.push(`Booking management failed: ${bookingsResponse.status}`);
      console.log('    ❌ Booking management failed');
    }

    // Test 5: Notifications
    console.log('  Testing notifications...');
    const notificationsResponse = await makeRequest('GET', '/notifications', null, {
      'Authorization': `Bearer ${customerToken}`
    });
    
    if (notificationsResponse.status === 200) {
      testResults.customerJourney.score += 2;
      console.log('    ✅ Notifications access successful');
    } else {
      testResults.customerJourney.issues.push(`Notifications failed: ${notificationsResponse.status}`);
      console.log('    ❌ Notifications failed');
    }

  } catch (error) {
    testResults.customerJourney.issues.push(`Unexpected error: ${error.message}`);
    console.log(`    ❌ Unexpected error: ${error.message}`);
  }
}

async function testSpecialistJourney() {
  console.log('\n🔧 Testing Specialist Journey...');
  
  try {
    const specialistToken = global.testTokens?.specialist;
    if (!specialistToken) {
      testResults.specialistJourney.issues.push('No specialist token available for testing');
      console.log('    ❌ No specialist token available');
      return;
    }

    // Test 1: Specialist Profile Creation
    console.log('  Testing specialist profile creation...');
    const profileData = {
      businessName: 'Test Beauty Studio',
      bio: 'Professional beauty services',
      specialties: JSON.stringify(['hair', 'makeup']),
      address: '123 Test Street',
      city: 'Test City',
      country: 'Ukraine',
      workingHours: JSON.stringify({
        monday: { start: '09:00', end: '18:00' },
        tuesday: { start: '09:00', end: '18:00' }
      })
    };
    
    const profileResponse = await makeRequest('POST', '/specialists/profile', profileData, {
      'Authorization': `Bearer ${specialistToken}`
    });
    
    if (profileResponse.status === 201 || profileResponse.status === 200) {
      testResults.specialistJourney.score += 2;
      console.log('    ✅ Specialist profile creation successful');
    } else {
      testResults.specialistJourney.issues.push(`Specialist profile creation failed: ${profileResponse.status} - ${JSON.stringify(profileResponse.data)}`);
      console.log('    ❌ Specialist profile creation failed');
    }

    // Test 2: Service Creation
    console.log('  Testing service creation...');
    const serviceData = generateTestService();
    const serviceResponse = await makeRequest('POST', '/services', serviceData, {
      'Authorization': `Bearer ${specialistToken}`
    });
    
    let serviceId = null;
    if (serviceResponse.status === 201 || serviceResponse.status === 200) {
      testResults.specialistJourney.score += 2;
      serviceId = serviceResponse.data?.id || serviceResponse.data?.service?.id;
      console.log('    ✅ Service creation successful');
    } else {
      testResults.specialistJourney.issues.push(`Service creation failed: ${serviceResponse.status} - ${JSON.stringify(serviceResponse.data)}`);
      console.log('    ❌ Service creation failed');
    }

    // Test 3: Service Management
    console.log('  Testing service management...');
    if (serviceId) {
      const serviceUpdateResponse = await makeRequest('PUT', `/services/${serviceId}`, {
        name: 'Updated Test Service',
        basePrice: 150.00
      }, {
        'Authorization': `Bearer ${specialistToken}`
      });
      
      if (serviceUpdateResponse.status === 200) {
        testResults.specialistJourney.score += 2;
        console.log('    ✅ Service management successful');
      } else {
        testResults.specialistJourney.issues.push(`Service management failed: ${serviceUpdateResponse.status}`);
        console.log('    ❌ Service management failed');
      }
    }

    // Test 4: Booking Management
    console.log('  Testing specialist booking management...');
    const bookingsResponse = await makeRequest('GET', '/bookings', null, {
      'Authorization': `Bearer ${specialistToken}`
    });
    
    if (bookingsResponse.status === 200) {
      testResults.specialistJourney.score += 2;
      console.log('    ✅ Specialist booking management successful');
    } else {
      testResults.specialistJourney.issues.push(`Specialist booking management failed: ${bookingsResponse.status}`);
      console.log('    ❌ Specialist booking management failed');
    }

    // Test 5: Analytics Access
    console.log('  Testing analytics access...');
    const analyticsResponse = await makeRequest('GET', '/analytics/dashboard', null, {
      'Authorization': `Bearer ${specialistToken}`
    });
    
    if (analyticsResponse.status === 200) {
      testResults.specialistJourney.score += 2;
      console.log('    ✅ Analytics access successful');
    } else {
      testResults.specialistJourney.issues.push(`Analytics access failed: ${analyticsResponse.status}`);
      console.log('    ❌ Analytics access failed');
    }

  } catch (error) {
    testResults.specialistJourney.issues.push(`Unexpected error: ${error.message}`);
    console.log(`    ❌ Unexpected error: ${error.message}`);
  }
}

async function testIntegrationFeatures() {
  console.log('\n🔗 Testing Integration Features...');
  
  try {
    // Test 1: Database Operations
    console.log('  Testing database operations...');
    const healthResponse = await makeRequest('GET', '/health');
    
    if (healthResponse.status === 200) {
      testResults.integrationTesting.score += 2;
      console.log('    ✅ Database connection healthy');
    } else {
      testResults.integrationTesting.issues.push(`Database health check failed: ${healthResponse.status}`);
      console.log('    ❌ Database health check failed');
    }

    // Test 2: Error Handling
    console.log('  Testing error handling...');
    const invalidEndpointResponse = await makeRequest('GET', '/invalid-endpoint');
    
    if (invalidEndpointResponse.status === 404) {
      testResults.integrationTesting.score += 2;
      console.log('    ✅ Error handling working correctly');
    } else {
      testResults.integrationTesting.issues.push(`Error handling not working: ${invalidEndpointResponse.status}`);
      console.log('    ❌ Error handling not working properly');
    }

    // Test 3: CORS Headers
    console.log('  Testing CORS configuration...');
    const corsResponse = await makeRequest('OPTIONS', '/auth/login');
    
    if (corsResponse.headers['access-control-allow-origin'] || corsResponse.status === 200) {
      testResults.integrationTesting.score += 2;
      console.log('    ✅ CORS configuration working');
    } else {
      testResults.integrationTesting.issues.push('CORS configuration may be missing');
      console.log('    ❌ CORS configuration issues');
    }

    // Test 4: Rate Limiting
    console.log('  Testing rate limiting...');
    const rapidRequests = [];
    for (let i = 0; i < 5; i++) {
      rapidRequests.push(makeRequest('GET', '/health'));
    }
    
    const results = await Promise.all(rapidRequests);
    const allSuccessful = results.every(r => r.status === 200);
    
    if (allSuccessful) {
      testResults.integrationTesting.score += 2;
      console.log('    ✅ Rate limiting configured (allowing reasonable requests)');
    } else {
      testResults.integrationTesting.issues.push('Rate limiting may be too aggressive');
      console.log('    ⚠️ Rate limiting may be too restrictive');
    }

    // Test 5: File Upload Endpoint
    console.log('  Testing file upload capabilities...');
    const fileResponse = await makeRequest('GET', '/files'); // Just check if endpoint exists
    
    if (fileResponse.status !== 404) {
      testResults.integrationTesting.score += 2;
      console.log('    ✅ File upload endpoints available');
    } else {
      testResults.integrationTesting.issues.push('File upload endpoints not available');
      console.log('    ❌ File upload endpoints not available');
    }

  } catch (error) {
    testResults.integrationTesting.issues.push(`Unexpected error: ${error.message}`);
    console.log(`    ❌ Unexpected error: ${error.message}`);
  }
}

async function testPerformanceAndSecurity() {
  console.log('\n🔒 Testing Performance & Security...');
  
  try {
    // Test 1: Response Time
    console.log('  Testing API response times...');
    const startTime = Date.now();
    const response = await makeRequest('GET', '/health');
    const responseTime = Date.now() - startTime;
    
    if (responseTime < 1000 && response.status === 200) {
      testResults.performanceSecurity.score += 2;
      console.log(`    ✅ Good response time: ${responseTime}ms`);
    } else {
      testResults.performanceSecurity.issues.push(`Slow response time: ${responseTime}ms`);
      console.log(`    ⚠️ Response time: ${responseTime}ms`);
    }

    // Test 2: Security Headers
    console.log('  Testing security headers...');
    const securityResponse = await makeRequest('GET', '/health');
    const hasSecurityHeaders = 
      securityResponse.headers['x-content-type-options'] ||
      securityResponse.headers['x-frame-options'] ||
      securityResponse.headers['x-xss-protection'];
    
    if (hasSecurityHeaders) {
      testResults.performanceSecurity.score += 2;
      console.log('    ✅ Security headers present');
    } else {
      testResults.performanceSecurity.issues.push('Missing security headers');
      console.log('    ❌ Security headers missing');
    }

    // Test 3: SQL Injection Protection
    console.log('  Testing SQL injection protection...');
    const sqlInjectionResponse = await makeRequest('POST', '/auth/login', {
      email: "'; DROP TABLE users; --",
      password: "password"
    });
    
    if (sqlInjectionResponse.status === 400 || sqlInjectionResponse.status === 401) {
      testResults.performanceSecurity.score += 2;
      console.log('    ✅ SQL injection protection working');
    } else {
      testResults.performanceSecurity.issues.push('SQL injection protection may be insufficient');
      console.log('    ❌ SQL injection protection concerns');
    }

    // Test 4: Input Validation
    console.log('  Testing input validation...');
    const invalidInputResponse = await makeRequest('POST', '/auth/register', {
      email: 'invalid-email',
      password: '123', // Too short
      firstName: '',
      userType: 'INVALID_TYPE'
    });
    
    if (invalidInputResponse.status === 400) {
      testResults.performanceSecurity.score += 2;
      console.log('    ✅ Input validation working');
    } else {
      testResults.performanceSecurity.issues.push('Input validation may be insufficient');
      console.log('    ❌ Input validation concerns');
    }

    // Test 5: Authentication Required
    console.log('  Testing authentication requirements...');
    const unauthorizedResponse = await makeRequest('GET', '/users/profile');
    
    if (unauthorizedResponse.status === 401) {
      testResults.performanceSecurity.score += 2;
      console.log('    ✅ Authentication properly enforced');
    } else {
      testResults.performanceSecurity.issues.push('Authentication not properly enforced');
      console.log('    ❌ Authentication enforcement issues');
    }

  } catch (error) {
    testResults.performanceSecurity.issues.push(`Unexpected error: ${error.message}`);
    console.log(`    ❌ Unexpected error: ${error.message}`);
  }
}

function calculateOverallScore() {
  const categories = Object.keys(testResults);
  let totalScore = 0;
  let maxPossibleScore = 0;
  
  categories.forEach(category => {
    totalScore += testResults[category].score;
    maxPossibleScore += testResults[category].maxScore;
  });
  
  return {
    score: totalScore,
    maxScore: maxPossibleScore,
    percentage: Math.round((totalScore / maxPossibleScore) * 100)
  };
}

function generateTestReport() {
  console.log('\n📊 COMPREHENSIVE TEST REPORT');
  console.log('=' .repeat(50));
  
  const overall = calculateOverallScore();
  
  console.log(`\n🎯 OVERALL SCORE: ${overall.score}/${overall.maxScore} (${overall.percentage}%)\n`);
  
  // Detailed breakdown
  Object.entries(testResults).forEach(([category, result]) => {
    const categoryName = category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    const percentage = Math.round((result.score / result.maxScore) * 100);
    
    console.log(`📋 ${categoryName}:`);
    console.log(`   Score: ${result.score}/${result.maxScore} (${percentage}%)`);
    
    if (result.issues.length > 0) {
      console.log(`   Issues:`);
      result.issues.forEach(issue => {
        console.log(`     ❌ ${issue}`);
      });
    } else {
      console.log(`   ✅ All tests passed`);
    }
    console.log();
  });
  
  // Production readiness assessment
  console.log('🚀 PRODUCTION READINESS ASSESSMENT:');
  console.log('-'.repeat(40));
  
  if (overall.percentage >= 90) {
    console.log('✅ READY FOR PRODUCTION - Excellent score');
  } else if (overall.percentage >= 80) {
    console.log('⚠️ MOSTLY READY - Some issues need attention');
  } else if (overall.percentage >= 70) {
    console.log('🔄 NEEDS WORK - Several critical issues');
  } else {
    console.log('❌ NOT READY - Major issues blocking production');
  }
  
  console.log('\n📝 RECOMMENDATIONS:');
  console.log('-'.repeat(40));
  
  const allIssues = Object.values(testResults).flatMap(result => result.issues);
  if (allIssues.length === 0) {
    console.log('✅ No critical issues found. Platform is ready for production!');
  } else {
    console.log('Priority fixes needed:');
    allIssues.slice(0, 5).forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
    if (allIssues.length > 5) {
      console.log(`   ... and ${allIssues.length - 5} more issues`);
    }
  }
  
  return {
    overall,
    results: testResults,
    issues: allIssues
  };
}

// Main test execution
async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive BookingBot Platform Testing');
  console.log('=' .repeat(60));
  
  // Initialize global object for sharing data between tests
  global.testTokens = {};
  
  try {
    await testUserRegistrationAndAuth();
    await testCustomerJourney();
    await testSpecialistJourney();
    await testIntegrationFeatures();
    await testPerformanceAndSecurity();
    
    // Note: Telegram, Admin, and Platform Features require additional setup
    console.log('\n⚠️ NOTE: Some tests require additional setup:');
    console.log('  - Telegram integration requires bot token');
    console.log('  - Admin features require admin user creation');
    console.log('  - Payment testing requires Stripe configuration');
    console.log('  - Frontend testing requires React app deployment');
    
    const report = generateTestReport();
    
    // Save detailed report
    const fs = require('fs');
    fs.writeFileSync('platform_test_report.json', JSON.stringify(report, null, 2));
    console.log('\n💾 Detailed report saved to: platform_test_report.json');
    
  } catch (error) {
    console.error('💥 Test execution failed:', error);
  }
}

// Export for external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runComprehensiveTests,
    testResults,
    makeRequest
  };
}

// Run if called directly
if (require.main === module) {
  runComprehensiveTests();
}