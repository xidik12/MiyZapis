const axios = require('axios');

// Test the WayForPay API endpoints
async function testWayForPayAPI() {
  const BASE_URL = 'http://localhost:3036/api/v1';

  console.log('🧪 Testing WayForPay API endpoints...\n');

  try {
    // Test 1: Check if WayForPay create invoice endpoint exists
    console.log('1. Testing WayForPay create invoice endpoint...');

    const createInvoiceResponse = await axios.post(`${BASE_URL}/payments/wayforpay/create-invoice`, {
      bookingId: 'test-booking-123',
      amount: 5000, // 50.00 UAH in kopecks
      currency: 'UAH',
      description: 'Test booking payment',
      customerEmail: 'test@example.com'
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

    console.log('Status:', createInvoiceResponse.status);
    console.log('Response:', JSON.stringify(createInvoiceResponse.data, null, 2));

    if (createInvoiceResponse.status === 401) {
      console.log('✅ Expected: Authentication required (401) - route is properly protected');
    } else if (createInvoiceResponse.status === 200) {
      console.log('✅ WayForPay invoice created successfully');
    } else {
      console.log('❌ Unexpected response');
    }

  } catch (error) {
    console.error('❌ Error testing WayForPay API:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('Server is not running on port 3036');
    }
  }

  console.log('\n2. Testing WayForPay payment status endpoint...');

  try {
    // Test payment status endpoint
    const statusResponse = await axios.get(`${BASE_URL}/payments/wayforpay/status/test-order-123`, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(error => {
      if (error.response) {
        return error.response;
      }
      throw error;
    });

    console.log('Status Response Status:', statusResponse.status);
    console.log('Status Response:', JSON.stringify(statusResponse.data, null, 2));

    if (statusResponse.status === 401) {
      console.log('✅ Expected: Authentication required (401) - route is properly protected');
    } else if (statusResponse.status === 200) {
      console.log('✅ WayForPay status check working');
    } else {
      console.log('❌ Unexpected response');
    }

  } catch (error) {
    console.error('❌ Error checking WayForPay status:', error.message);
  }

  console.log('\n3. Testing WayForPay webhook endpoint...');

  try {
    // Test webhook endpoint (should not require authentication)
    const webhookResponse = await axios.post(`${BASE_URL}/payments/webhooks/wayforpay`, {
      merchantAccount: 'test_merchant',
      orderReference: 'booking-123-1234567890',
      merchantSignature: 'test_signature',
      amount: 5000,
      currency: 'UAH',
      authCode: '123456',
      email: 'test@example.com',
      phone: '380123456789',
      createdDate: Math.floor(Date.now() / 1000),
      processingDate: Math.floor(Date.now() / 1000),
      cardPan: '4***1234',
      cardType: 'Visa',
      issuerBankCountry: 'UA',
      issuerBankName: 'Test Bank',
      transactionStatus: 'Approved',
      reason: 'OK',
      reasonCode: 1100,
      fee: 50,
      paymentSystem: 'card'
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

    console.log('Webhook Status:', webhookResponse.status);
    console.log('Webhook Response:', JSON.stringify(webhookResponse.data, null, 2));

    if (webhookResponse.status === 200) {
      console.log('✅ WayForPay webhook endpoint accessible');
    } else if (webhookResponse.status === 400) {
      console.log('✅ Expected: Invalid signature (400) - webhook signature validation working');
    } else {
      console.log('❌ Unexpected webhook response');
    }

  } catch (error) {
    console.error('❌ Error testing WayForPay webhook:', error.message);
  }

  console.log('\n4. Testing if WayForPay service is properly configured...');

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

  console.log('\n5. Testing PayPal endpoints...');

  try {
    // Test PayPal create order endpoint
    const paypalOrderResponse = await axios.post(`${BASE_URL}/payments/paypal/create-order`, {
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

    console.log('PayPal Order Status:', paypalOrderResponse.status);
    if (paypalOrderResponse.status === 401) {
      console.log('✅ Expected: Authentication required (401) - PayPal route is properly protected');
    } else if (paypalOrderResponse.status === 200) {
      console.log('✅ PayPal order created successfully');
    } else {
      console.log('❌ Unexpected PayPal response');
    }

  } catch (error) {
    console.error('❌ Error testing PayPal API:', error.message);
  }
}

// Run the test
testWayForPayAPI();