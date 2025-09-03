#!/usr/bin/env node

// Detailed booking API testing
const https = require('https');

const BASE_URL = 'https://miyzapis-backend-production.up.railway.app';

function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BookingAPITest/1.0',
        ...headers
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testAuthentication() {
  console.log('🔐 Testing Authentication Flow...\n');

  const testUser = {
    email: `testuser${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    userType: 'CUSTOMER'
  };

  try {
    // Registration
    console.log('📝 Testing registration...');
    const registerResult = await makeRequest('POST', '/api/v1/auth/register', testUser);
    console.log(`   Status: ${registerResult.status}`);
    console.log(`   Response: ${JSON.stringify(registerResult.data, null, 2)}\n`);

    // Try to login immediately
    console.log('🔑 Testing login...');
    const loginResult = await makeRequest('POST', '/api/v1/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    console.log(`   Status: ${loginResult.status}`);
    console.log(`   Response: ${JSON.stringify(loginResult.data, null, 2)}\n`);

    let accessToken = null;
    
    // Extract token from either response
    if (registerResult.data?.data?.accessToken) {
      accessToken = registerResult.data.data.accessToken;
      console.log('✅ Got token from registration');
    } else if (loginResult.data?.data?.accessToken) {
      accessToken = loginResult.data.data.accessToken;
      console.log('✅ Got token from login');
    } else if (registerResult.data?.data?.token) {
      accessToken = registerResult.data.data.token;
      console.log('✅ Got token from registration (alt field)');
    } else if (loginResult.data?.data?.token) {
      accessToken = loginResult.data.data.token;
      console.log('✅ Got token from login (alt field)');
    }

    if (!accessToken) {
      console.log('❌ No access token found, trying to find pattern...');
      console.log('Registration response keys:', Object.keys(registerResult.data?.data || {}));
      console.log('Login response keys:', Object.keys(loginResult.data?.data || {}));
      return null;
    }

    return accessToken;
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    return null;
  }
}

async function testBookingWithAuth(accessToken) {
  console.log('📅 Testing Booking Creation with Authentication...\n');

  try {
    // Get a valid service ID first
    console.log('📋 Getting available services...');
    const servicesResult = await makeRequest('GET', '/api/v1/services');
    
    if (!servicesResult.data?.data?.services?.[0]) {
      console.log('❌ No services available');
      return;
    }

    const service = servicesResult.data.data.services[0];
    console.log(`✅ Using service: ${service.name} (ID: ${service.id})\n`);

    // Attempt booking creation
    const bookingData = {
      serviceId: service.id,
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      duration: 60,
      customerNotes: 'Test booking via API testing'
    };

    console.log('🏗️  Creating booking...');
    console.log(`   Service ID: ${bookingData.serviceId}`);
    console.log(`   Scheduled: ${bookingData.scheduledAt}`);
    console.log(`   Duration: ${bookingData.duration} minutes\n`);

    const bookingResult = await makeRequest('POST', '/api/v1/bookings', bookingData, {
      'Authorization': `Bearer ${accessToken}`
    });

    console.log(`📊 Booking Result:`);
    console.log(`   Status: ${bookingResult.status}`);
    console.log(`   Response: ${JSON.stringify(bookingResult.data, null, 2)}\n`);

    // If we got a 500 error, this is what we need to fix
    if (bookingResult.status === 500) {
      console.log('🚨 500 ERROR REPRODUCED! This is the issue we need to fix.');
      console.log('   Error details:', bookingResult.data?.error);
    }

    return bookingResult;

  } catch (error) {
    console.error('❌ Booking test error:', error.message);
  }
}

async function main() {
  console.log('🎯 Starting Comprehensive API Testing\n');
  
  const accessToken = await testAuthentication();
  
  if (accessToken) {
    await testBookingWithAuth(accessToken);
  } else {
    console.log('⚠️  Cannot test booking without authentication token');
    
    // Try some known test credentials
    console.log('\n🔄 Trying fallback login with potential existing user...');
    const fallbackLogin = await makeRequest('POST', '/api/v1/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    console.log(`   Status: ${fallbackLogin.status}`);
    console.log(`   Response: ${JSON.stringify(fallbackLogin.data, null, 2)}`);
  }
}

// Run tests
main().catch(console.error);