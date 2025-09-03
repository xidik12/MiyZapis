#!/usr/bin/env node

// Simple script to test booking API endpoints
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

async function testBookingEndpoints() {
  console.log('🧪 Testing Booking API Endpoints...\n');

  try {
    // Test 1: Try booking without authentication
    console.log('1️⃣  Testing POST /api/v1/bookings (no auth)');
    const noAuthResult = await makeRequest('POST', '/api/v1/bookings', {
      serviceId: 'test-service-id',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      duration: 60
    });
    console.log(`   Status: ${noAuthResult.status}`);
    console.log(`   Response: ${JSON.stringify(noAuthResult.data, null, 2)}\n`);

    // Test 2: Try to get available services/specialists to find valid IDs
    console.log('2️⃣  Testing GET /api/v1/services (to find valid service IDs)');
    const servicesResult = await makeRequest('GET', '/api/v1/services');
    console.log(`   Status: ${servicesResult.status}`);
    if (servicesResult.data && servicesResult.data.data) {
      console.log(`   Found ${servicesResult.data.data.services?.length || 0} services`);
      if (servicesResult.data.data.services?.length > 0) {
        console.log(`   First service ID: ${servicesResult.data.data.services[0].id}`);
      }
    }
    console.log();

    // Test 3: Try user registration to get auth token
    console.log('3️⃣  Testing POST /api/v1/auth/register (to get auth token)');
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      userType: 'CUSTOMER'
    };
    
    const registerResult = await makeRequest('POST', '/api/v1/auth/register', testUser);
    console.log(`   Status: ${registerResult.status}`);
    if (registerResult.data) {
      console.log(`   Has token: ${!!registerResult.data.data?.accessToken}`);
    }
    console.log();

    // Test 4: Try login if registration didn't work
    if (!registerResult.data?.data?.accessToken) {
      console.log('4️⃣  Testing POST /api/v1/auth/login');
      const loginResult = await makeRequest('POST', '/api/v1/auth/login', {
        email: testUser.email,
        password: testUser.password
      });
      console.log(`   Status: ${loginResult.status}`);
      if (loginResult.data) {
        console.log(`   Has token: ${!!loginResult.data.data?.accessToken}`);
      }
      console.log();
    }

    // Test 5: Get auth endpoints info
    console.log('5️⃣  Testing GET /api/v1/auth (endpoint info)');
    const authInfoResult = await makeRequest('GET', '/api/v1/auth');
    console.log(`   Status: ${authInfoResult.status}`);
    console.log(`   Response: ${JSON.stringify(authInfoResult.data, null, 2)}\n`);

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

// Run the tests
testBookingEndpoints().then(() => {
  console.log('✅ Testing completed');
}).catch(error => {
  console.error('❌ Testing failed:', error);
});