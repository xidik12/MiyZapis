const axios = require('axios');

// Test the PayPal API endpoints
async function testPayPalAPI() {
  const BASE_URL = 'http://localhost:3036/api/v1';

  console.log('🧪 Testing PayPal API endpoints...\n');

  try {
    // First, let's check if the PayPal routes are available by testing the create order endpoint
    console.log('1. Testing PayPal create order endpoint...');

    const createOrderResponse = await axios.post(`${BASE_URL}/payments/paypal/create-order`, {
      bookingId: 'test-booking-123',
      amount: 5000, // $50.00 in cents
      currency: 'USD',
      description: 'Test booking payment'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(error => {
      if (error.response) {
        return error.response;
      }
      throw error;
    });

    console.log('Status:', createOrderResponse.status);
    console.log('Response:', JSON.stringify(createOrderResponse.data, null, 2));

    if (createOrderResponse.status === 401) {
      console.log('✅ Expected: Authentication required (401) - route is properly protected');
    } else if (createOrderResponse.status === 200) {
      console.log('✅ PayPal order created successfully');
    } else {
      console.log('❌ Unexpected response');
    }

  } catch (error) {
    console.error('❌ Error testing PayPal API:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('Server is not running on port 3002');
    }
  }

  console.log('\n2. Testing if PayPal service is properly configured...');

  try {
    // Test a simple health check or API documentation endpoint
    const healthResponse = await axios.get(`${BASE_URL}`).catch(error => {
      if (error.response) {
        return error.response;
      }
      throw error;
    });

    console.log('API Health Status:', healthResponse.status);
    if (healthResponse.status === 200) {
      console.log('✅ Backend API is running and accessible');
    }

  } catch (error) {
    console.error('❌ Error checking API health:', error.message);
  }
}

// Run the test
testPayPalAPI();