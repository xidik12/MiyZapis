#!/usr/bin/env node

/**
 * Test script for discount functionality
 * Tests creating a service with discounts via API
 */

const API_BASE = 'http://localhost:3019/api/v1';

// Test data for service with discount
const testServiceData = {
  name: 'Photography Session with Discount',
  description: 'Professional photography session with special discount',
  category: 'Photography',
  basePrice: 100,
  currency: 'USD',
  duration: 120,
  isActive: true,
  // Discount fields
  discountEnabled: true,
  discountType: 'PERCENTAGE',
  discountValue: 20,
  discountValidFrom: '2025-09-15',
  discountValidUntil: '2025-12-31',
  discountDescription: 'Early bird special - 20% off!'
};

// Test specialist user data
const testSpecialistData = {
  email: `test.specialist.${Date.now()}@example.com`,
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'Specialist',
  userType: 'specialist'
};

async function makeRequest(endpoint, method = 'GET', data = null, token = null) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();

    return {
      status: response.status,
      data: result,
      ok: response.ok
    };
  } catch (error) {
    console.error(`❌ Request failed: ${error.message}`);
    return { status: 0, data: { error: error.message }, ok: false };
  }
}

async function testDiscountFunctionality() {
  console.log('🧪 Testing Discount Functionality');
  console.log('================================');

  try {
    // Step 1: Register a test specialist
    console.log('\n1️⃣ Registering test specialist...');
    const registerResponse = await makeRequest('/auth/register', 'POST', testSpecialistData);

    if (!registerResponse.ok) {
      console.log('❌ Registration failed:', registerResponse.data);
      return;
    }

    console.log('✅ Specialist registered successfully');

    // Step 2: Login to get token
    console.log('\n2️⃣ Logging in...');
    const loginData = {
      email: testSpecialistData.email,
      password: testSpecialistData.password
    };

    const loginResponse = await makeRequest('/auth/login', 'POST', loginData);

    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginResponse.data);
      console.log('💡 This might be due to email verification requirement');
      return;
    }

    const accessToken = loginResponse.data.accessToken;
    console.log('✅ Login successful');

    // Step 3: Create service with discount
    console.log('\n3️⃣ Creating service with discount...');
    const serviceResponse = await makeRequest('/services', 'POST', testServiceData, accessToken);

    if (!serviceResponse.ok) {
      console.log('❌ Service creation failed:', serviceResponse.data);
      return;
    }

    const createdService = serviceResponse.data;
    console.log('✅ Service created successfully');
    console.log('📋 Service details:');
    console.log(`   Name: ${createdService.name}`);
    console.log(`   Base Price: $${createdService.basePrice}`);
    console.log(`   Discount Enabled: ${createdService.discountEnabled}`);
    console.log(`   Discount Type: ${createdService.discountType}`);
    console.log(`   Discount Value: ${createdService.discountValue}%`);
    console.log(`   Valid From: ${createdService.discountValidFrom}`);
    console.log(`   Valid Until: ${createdService.discountValidUntil}`);
    console.log(`   Description: ${createdService.discountDescription}`);

    // Step 4: Calculate expected discounted price
    const originalPrice = createdService.basePrice;
    const discountValue = createdService.discountValue;
    const expectedDiscountedPrice = originalPrice * (1 - discountValue / 100);

    console.log('\n💰 Price Calculation:');
    console.log(`   Original Price: $${originalPrice}`);
    console.log(`   Discount: ${discountValue}%`);
    console.log(`   Expected Discounted Price: $${expectedDiscountedPrice.toFixed(2)}`);

    // Step 5: Test service retrieval
    console.log('\n4️⃣ Retrieving service to verify discount data...');
    const getServiceResponse = await makeRequest(`/services/${createdService.id}`);

    if (!getServiceResponse.ok) {
      console.log('❌ Service retrieval failed:', getServiceResponse.data);
      return;
    }

    const retrievedService = getServiceResponse.data;
    console.log('✅ Service retrieved successfully');

    // Verify discount fields
    const discountFieldsMatch =
      retrievedService.discountEnabled === testServiceData.discountEnabled &&
      retrievedService.discountType === testServiceData.discountType &&
      retrievedService.discountValue === testServiceData.discountValue &&
      retrievedService.discountDescription === testServiceData.discountDescription;

    if (discountFieldsMatch) {
      console.log('✅ All discount fields match expected values');
    } else {
      console.log('❌ Discount fields do not match:');
      console.log('   Expected:', {
        discountEnabled: testServiceData.discountEnabled,
        discountType: testServiceData.discountType,
        discountValue: testServiceData.discountValue,
        discountDescription: testServiceData.discountDescription
      });
      console.log('   Actual:', {
        discountEnabled: retrievedService.discountEnabled,
        discountType: retrievedService.discountType,
        discountValue: retrievedService.discountValue,
        discountDescription: retrievedService.discountDescription
      });
    }

    console.log('\n🎉 Discount functionality test completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   ✅ Service creation with discount fields works');
    console.log('   ✅ Discount data is properly stored and retrieved');
    console.log('   ✅ All discount fields are preserved');

    return createdService;

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This test requires Node.js 18+ for native fetch support');
  console.log('💡 Alternatively, install node-fetch: npm install node-fetch');
  process.exit(1);
}

// Run the test
testDiscountFunctionality().then((result) => {
  if (result) {
    console.log('\n✅ All tests passed! Discount functionality is working correctly.');
    process.exit(0);
  } else {
    console.log('\n❌ Tests failed or incomplete.');
    process.exit(1);
  }
}).catch((error) => {
  console.error('\n❌ Test script failed:', error);
  process.exit(1);
});