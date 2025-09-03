#!/usr/bin/env node

const axios = require('axios');
const readline = require('readline');

// Configuration
const BASE_URL = 'https://miyzapis-backend-production.up.railway.app/api/v1';
const FRONTEND_URL = 'https://miyzapis.com';

// Test data
const TEST_USERS = {
  customer: {
    email: 'test.customer.qa@example.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'Customer',
    userType: 'CUSTOMER'
  },
  specialist: {
    email: 'test.specialist.qa@example.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'Specialist',
    userType: 'SPECIALIST'
  }
};

let customerToken = '';
let specialistToken = '';
let customerId = '';
let specialistId = '';
let serviceId = '';
let bookingId = '';

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  issues: []
};

function logResult(testName, success, message = '', data = null) {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${testName}`);
  
  if (message) {
    console.log(`   ${message}`);
  }
  
  if (data && !success) {
    console.log(`   Data: ${JSON.stringify(data, null, 2)}`);
  }
  
  if (success) {
    testResults.passed++;
  } else {
    testResults.failed++;
    testResults.issues.push({
      test: testName,
      message,
      data
    });
  }
  console.log('');
}

async function makeRequest(method, endpoint, data = null, token = null) {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers,
      timeout: 30000
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response ? error.response.data : error.message,
      status: error.response ? error.response.status : 500
    };
  }
}

async function testHealthCheck() {
  console.log('🏥 Testing Health Check...');
  const result = await makeRequest('GET', '/health');
  
  logResult(
    'Backend Health Check',
    result.success && result.data.status === 'healthy',
    result.success ? 'Backend is healthy' : `Health check failed: ${JSON.stringify(result.error)}`,
    result.data
  );
  
  return result.success;
}

async function testUserRegistration() {
  console.log('👤 Testing User Registration...');
  
  // Test customer registration
  const customerResult = await makeRequest('POST', '/auth/register', TEST_USERS.customer);
  logResult(
    'Customer Registration',
    customerResult.success,
    customerResult.success ? 'Customer registered successfully' : `Registration failed: ${JSON.stringify(customerResult.error)}`,
    customerResult.data || customerResult.error
  );
  
  if (customerResult.success && customerResult.data.data) {
    customerId = customerResult.data.data.user?.id || customerResult.data.data.id;
    customerToken = customerResult.data.data.token;
  }
  
  // Test specialist registration
  const specialistResult = await makeRequest('POST', '/auth/register', TEST_USERS.specialist);
  logResult(
    'Specialist Registration',
    specialistResult.success,
    specialistResult.success ? 'Specialist registered successfully' : `Registration failed: ${JSON.stringify(specialistResult.error)}`,
    specialistResult.data || specialistResult.error
  );
  
  if (specialistResult.success && specialistResult.data.data) {
    specialistId = specialistResult.data.data.user?.id || specialistResult.data.data.id;
    specialistToken = specialistResult.data.data.token;
  }
}

async function testUserLogin() {
  console.log('🔐 Testing User Login...');
  
  // Test customer login
  const customerLogin = await makeRequest('POST', '/auth/login', {
    email: TEST_USERS.customer.email,
    password: TEST_USERS.customer.password
  });
  
  logResult(
    'Customer Login',
    customerLogin.success,
    customerLogin.success ? 'Customer login successful' : `Login failed: ${JSON.stringify(customerLogin.error)}`,
    customerLogin.data || customerLogin.error
  );
  
  if (customerLogin.success && customerLogin.data.data?.token) {
    customerToken = customerLogin.data.data.token;
    customerId = customerLogin.data.data.user?.id;
  }
  
  // Test specialist login
  const specialistLogin = await makeRequest('POST', '/auth/login', {
    email: TEST_USERS.specialist.email,
    password: TEST_USERS.specialist.password
  });
  
  logResult(
    'Specialist Login',
    specialistLogin.success,
    specialistLogin.success ? 'Specialist login successful' : `Login failed: ${JSON.stringify(specialistLogin.error)}`,
    specialistLogin.data || specialistLogin.error
  );
  
  if (specialistLogin.success && specialistLogin.data.data?.token) {
    specialistToken = specialistLogin.data.data.token;
    specialistId = specialistLogin.data.data.user?.id;
  }
}

async function testUserProfile() {
  console.log('👤 Testing User Profile...');
  
  if (customerToken) {
    const customerProfile = await makeRequest('GET', '/auth/me', null, customerToken);
    logResult(
      'Customer Profile Retrieval',
      customerProfile.success,
      customerProfile.success ? 'Customer profile retrieved successfully' : `Profile retrieval failed: ${JSON.stringify(customerProfile.error)}`,
      customerProfile.data || customerProfile.error
    );
  }
  
  if (specialistToken) {
    const specialistProfile = await makeRequest('GET', '/auth/me', null, specialistToken);
    logResult(
      'Specialist Profile Retrieval',
      specialistProfile.success,
      specialistProfile.success ? 'Specialist profile retrieved successfully' : `Profile retrieval failed: ${JSON.stringify(specialistProfile.error)}`,
      specialistProfile.data || specialistProfile.error
    );
  }
}

async function testSpecialistOnboarding() {
  console.log('🎯 Testing Specialist Onboarding...');
  
  if (!specialistToken) {
    logResult('Specialist Onboarding', false, 'No specialist token available');
    return;
  }
  
  // Test specialist profile completion
  const specialistData = {
    bio: 'Test specialist for QA testing',
    specialties: '["hair-styling", "makeup"]',
    experience: 5,
    address: '123 Test Street',
    city: 'Test City',
    country: 'Ukraine',
    workingHours: '{"monday": {"start": "09:00", "end": "18:00"}, "tuesday": {"start": "09:00", "end": "18:00"}}',
    paymentMethods: '["cash", "card"]'
  };
  
  const specialistUpdate = await makeRequest('PUT', '/specialists/profile', specialistData, specialistToken);
  logResult(
    'Specialist Profile Update',
    specialistUpdate.success,
    specialistUpdate.success ? 'Specialist profile updated successfully' : `Profile update failed: ${JSON.stringify(specialistUpdate.error)}`,
    specialistUpdate.data || specialistUpdate.error
  );
}

async function testServiceCreation() {
  console.log('🛠️ Testing Service Creation...');
  
  if (!specialistToken) {
    logResult('Service Creation', false, 'No specialist token available');
    return;
  }
  
  const serviceData = {
    name: 'Test Hair Styling Service',
    description: 'Professional hair styling service for testing',
    category: 'hair-styling',
    basePrice: 50.00,
    duration: 60,
    requirements: '[]',
    deliverables: '["Styled hair", "Hair care tips"]'
  };
  
  const serviceResult = await makeRequest('POST', '/services', serviceData, specialistToken);
  logResult(
    'Service Creation',
    serviceResult.success,
    serviceResult.success ? 'Service created successfully' : `Service creation failed: ${JSON.stringify(serviceResult.error)}`,
    serviceResult.data || serviceResult.error
  );
  
  if (serviceResult.success && serviceResult.data.data) {
    serviceId = serviceResult.data.data.id;
  }
}

async function testSearchAndFiltering() {
  console.log('🔍 Testing Search and Filtering...');
  
  // Test service search
  const searchResult = await makeRequest('GET', '/services?search=hair&category=hair-styling');
  logResult(
    'Service Search',
    searchResult.success,
    searchResult.success ? 'Service search executed successfully' : `Search failed: ${JSON.stringify(searchResult.error)}`,
    searchResult.data || searchResult.error
  );
  
  // Test specialist search
  const specialistSearch = await makeRequest('GET', '/specialists?city=Test City');
  logResult(
    'Specialist Search',
    specialistSearch.success,
    specialistSearch.success ? 'Specialist search executed successfully' : `Search failed: ${JSON.stringify(specialistSearch.error)}`,
    specialistSearch.data || specialistSearch.error
  );
}

async function testBookingFlow() {
  console.log('📅 Testing Booking Flow...');
  
  if (!customerToken || !serviceId) {
    logResult('Booking Flow', false, 'Missing customer token or service ID');
    return;
  }
  
  // Calculate future date for booking
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);
  
  const bookingData = {
    serviceId: serviceId,
    scheduledAt: futureDate.toISOString(),
    customerNotes: 'Test booking for QA'
  };
  
  const bookingResult = await makeRequest('POST', '/bookings', bookingData, customerToken);
  logResult(
    'Booking Creation',
    bookingResult.success,
    bookingResult.success ? 'Booking created successfully' : `Booking creation failed: ${JSON.stringify(bookingResult.error)}`,
    bookingResult.data || bookingResult.error
  );
  
  if (bookingResult.success && bookingResult.data.data) {
    bookingId = bookingResult.data.data.id;
  }
}

async function testFavorites() {
  console.log('❤️ Testing Favorites Functionality...');
  
  if (!customerToken || !specialistId) {
    logResult('Favorites', false, 'Missing customer token or specialist ID');
    return;
  }
  
  // Test adding specialist to favorites
  const favoriteResult = await makeRequest('POST', '/favorites/specialists', { specialistId }, customerToken);
  logResult(
    'Add Specialist to Favorites',
    favoriteResult.success,
    favoriteResult.success ? 'Specialist added to favorites' : `Failed to add to favorites: ${JSON.stringify(favoriteResult.error)}`,
    favoriteResult.data || favoriteResult.error
  );
  
  // Test retrieving favorites
  const getFavorites = await makeRequest('GET', '/favorites/specialists', null, customerToken);
  logResult(
    'Retrieve Favorite Specialists',
    getFavorites.success,
    getFavorites.success ? 'Favorites retrieved successfully' : `Failed to retrieve favorites: ${JSON.stringify(getFavorites.error)}`,
    getFavorites.data || getFavorites.error
  );
}

async function testReviewSystem() {
  console.log('⭐ Testing Review System...');
  
  if (!customerToken || !bookingId) {
    logResult('Review System', false, 'Missing customer token or booking ID');
    return;
  }
  
  const reviewData = {
    rating: 5,
    comment: 'Excellent service for testing!',
    tags: '["professional", "punctual"]'
  };
  
  const reviewResult = await makeRequest('POST', `/reviews/booking/${bookingId}`, reviewData, customerToken);
  logResult(
    'Review Creation',
    reviewResult.success,
    reviewResult.success ? 'Review created successfully' : `Review creation failed: ${JSON.stringify(reviewResult.error)}`,
    reviewResult.data || reviewResult.error
  );
}

async function testNotifications() {
  console.log('🔔 Testing Notifications...');
  
  if (customerToken) {
    const notifications = await makeRequest('GET', '/notifications', null, customerToken);
    logResult(
      'Customer Notifications',
      notifications.success,
      notifications.success ? 'Notifications retrieved successfully' : `Failed to retrieve notifications: ${JSON.stringify(notifications.error)}`,
      notifications.data || notifications.error
    );
  }
  
  if (specialistToken) {
    const notifications = await makeRequest('GET', '/notifications', null, specialistToken);
    logResult(
      'Specialist Notifications',
      notifications.success,
      notifications.success ? 'Notifications retrieved successfully' : `Failed to retrieve notifications: ${JSON.stringify(notifications.error)}`,
      notifications.data || notifications.error
    );
  }
}

async function testFileUpload() {
  console.log('📁 Testing File Upload...');
  
  if (!specialistToken) {
    logResult('File Upload', false, 'No specialist token available');
    return;
  }
  
  // Test file upload endpoint availability
  const uploadTest = await makeRequest('POST', '/files/upload', { 
    purpose: 'AVATAR',
    file: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2ODApLCBxdWFsaXR5ID0gOTAK/9sAQwADAgIDAgIDAwMDBAMDBAUIBQUEBAUKBwcGCAwKDAwLCgsLDQ4SEA0OEQ4LCxAWEBETFBUVFQwPFxgWFBgSFBUU/9sAQwEDBAQFBAUJBQUJFA0LDRQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQU/8AAEQgAAQABAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMEAgEDAwMDAwUAAAMBAgMAACMRBBIhMQVBUWEicYEGkfAUIjKhsRVCwdHhM+EJGhUSSURiUqCyshYnOjW6c3Nz5u3/xAAbAQADAQEBAQEAAAAAAAAAAAAAAQIDBAUGBwD/8QAGBEBAAMBAQAAAAAAAAAAAAAAAQACESIx/9oADAMBAAIRAxEAPwD9/KKKKK//2Q=='
  }, specialistToken);
  
  logResult(
    'File Upload Test',
    uploadTest.status !== 404,
    uploadTest.status !== 404 ? 'File upload endpoint is accessible' : 'File upload endpoint not found',
    uploadTest.error
  );
}

async function testPaymentEndpoints() {
  console.log('💳 Testing Payment Endpoints...');
  
  if (!customerToken) {
    logResult('Payment Endpoints', false, 'No customer token available');
    return;
  }
  
  // Test payment methods endpoint
  const paymentMethods = await makeRequest('GET', '/payments/methods', null, customerToken);
  logResult(
    'Payment Methods Retrieval',
    paymentMethods.success,
    paymentMethods.success ? 'Payment methods retrieved successfully' : `Failed to retrieve payment methods: ${JSON.stringify(paymentMethods.error)}`,
    paymentMethods.data || paymentMethods.error
  );
  
  // Test payment history
  const paymentHistory = await makeRequest('GET', '/payments/history', null, customerToken);
  logResult(
    'Payment History Retrieval',
    paymentHistory.success,
    paymentHistory.success ? 'Payment history retrieved successfully' : `Failed to retrieve payment history: ${JSON.stringify(paymentHistory.error)}`,
    paymentHistory.data || paymentHistory.error
  );
}

async function testAdminEndpoints() {
  console.log('👑 Testing Admin Endpoints...');
  
  // Test admin endpoints without authentication (should fail)
  const adminStats = await makeRequest('GET', '/admin/stats');
  logResult(
    'Admin Endpoints Security',
    !adminStats.success && adminStats.status === 401,
    !adminStats.success && adminStats.status === 401 ? 'Admin endpoints properly protected' : 'Admin endpoints may be accessible without authentication',
    adminStats.data || adminStats.error
  );
}

async function cleanup() {
  console.log('🧹 Cleanup - Removing Test Data...');
  
  // Delete test booking if created
  if (bookingId && customerToken) {
    await makeRequest('DELETE', `/bookings/${bookingId}`, null, customerToken);
  }
  
  // Delete test service if created
  if (serviceId && specialistToken) {
    await makeRequest('DELETE', `/services/${serviceId}`, null, specialistToken);
  }
  
  console.log('Cleanup completed (test data may persist in database)');
}

async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive Platform Testing');
  console.log('===========================================');
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Backend URL: ${BASE_URL}`);
  console.log('===========================================\n');
  
  try {
    // Core functionality tests
    await testHealthCheck();
    await testUserRegistration();
    await testUserLogin();
    await testUserProfile();
    
    // Feature tests
    await testSpecialistOnboarding();
    await testServiceCreation();
    await testSearchAndFiltering();
    await testBookingFlow();
    await testFavorites();
    await testReviewSystem();
    await testNotifications();
    await testFileUpload();
    await testPaymentEndpoints();
    await testAdminEndpoints();
    
    // Cleanup
    await cleanup();
    
    // Final report
    console.log('📊 COMPREHENSIVE TEST RESULTS');
    console.log('==============================');
    console.log(`✅ Tests Passed: ${testResults.passed}`);
    console.log(`❌ Tests Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
    
    if (testResults.issues.length > 0) {
      console.log('\n🚨 ISSUES FOUND:');
      console.log('================');
      testResults.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.test}`);
        console.log(`   Issue: ${issue.message}`);
        if (issue.data) {
          console.log(`   Details: ${JSON.stringify(issue.data, null, 2)}`);
        }
        console.log('');
      });
    }
    
    console.log('\n🏁 Testing completed!');
    
  } catch (error) {
    console.error('❌ Critical test error:', error);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runComprehensiveTest().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runComprehensiveTest,
  testResults
};