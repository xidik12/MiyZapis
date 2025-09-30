#!/usr/bin/env node

/**
 * Test the specific endpoints that the frontend is calling
 */

const axios = require('axios');

const PROD_API = 'https://miyzapis-backend-production.up.railway.app/api/v1';

console.log('🔍 Testing Frontend Specific Endpoints');
console.log('=====================================');

async function testFrontendEndpoints() {
    console.log('\n📋 Testing actual frontend endpoint calls...');

    // Test PayPal create order endpoint (what's actually failing)
    try {
        console.log('\n🔹 Testing PayPal create-order endpoint...');

        const response = await axios.post(`${PROD_API}/payments/paypal/create-order`, {
            bookingId: 'test-booking-123',
            amount: 1000,
            currency: 'USD',
            description: 'Test booking'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer fake-token'  // Use fake token to see if it's auth or logic error
            },
            timeout: 5000
        });

        console.log(`✅ PayPal endpoint working (Status: ${response.status})`);

    } catch (error) {
        if (error.response) {
            const status = error.response.status;
            const errorData = error.response.data;

            console.log(`❌ PayPal endpoint failed (Status: ${status})`);
            console.log(`   Error:`, errorData);

            if (status === 500) {
                console.log('   🚨 This is a server error - backend logic issue');
            } else if (status === 401) {
                console.log('   🔒 This is authentication - endpoint exists but needs auth');
            } else if (status === 404) {
                console.log('   🚫 This endpoint does not exist');
            } else if (status === 400) {
                console.log('   📝 This is validation error - check request format');
            }
        } else {
            console.log(`❌ PayPal endpoint network error: ${error.message}`);
        }
    }

    // Test payment intent endpoint with auth
    try {
        console.log('\n🔹 Testing payment intent with auth token...');

        const response = await axios.post(`${PROD_API}/payments/intent`, {
            serviceId: 'test-service-123',
            scheduledAt: new Date().toISOString(),
            duration: 60,
            paymentMethod: 'CRYPTO_ONLY'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer fake-token'  // Use fake token
            },
            timeout: 5000
        });

        console.log(`✅ Payment intent endpoint working (Status: ${response.status})`);

    } catch (error) {
        if (error.response) {
            const status = error.response.status;
            const errorData = error.response.data;

            console.log(`❌ Payment intent endpoint failed (Status: ${status})`);
            console.log(`   Error:`, errorData);

            if (status === 500) {
                console.log('   🚨 This is a server error - backend logic issue');
            } else if (status === 401) {
                console.log('   🔒 This is authentication - endpoint exists but auth failed');
            } else if (status === 404) {
                console.log('   🚫 This endpoint does not exist');
            } else if (status === 400) {
                console.log('   📝 This is validation error - check request format');
            }
        } else {
            console.log(`❌ Payment intent network error: ${error.message}`);
        }
    }

    // Check if logout endpoint exists (also failing in frontend)
    try {
        console.log('\n🔹 Testing logout endpoint...');

        const response = await axios.post(`${PROD_API}/auth-enhanced/logout`, {}, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer fake-token'
            },
            timeout: 5000
        });

        console.log(`✅ Logout endpoint working (Status: ${response.status})`);

    } catch (error) {
        if (error.response) {
            const status = error.response.status;
            console.log(`❌ Logout endpoint failed (Status: ${status})`);

            if (status === 404) {
                console.log('   🚫 Logout endpoint does not exist - this explains frontend errors');
            }
        } else {
            console.log(`❌ Logout network error: ${error.message}`);
        }
    }

    console.log('\n📊 Analysis:');
    console.log('- 500 errors = Backend logic problems (need to fix server code)');
    console.log('- 401 errors = Authentication problems (need valid tokens)');
    console.log('- 404 errors = Missing endpoints (need to implement)');
    console.log('- 400 errors = Validation problems (need to fix request format)');
}

testFrontendEndpoints().catch(error => {
    console.error('Test failed:', error.message);
    process.exit(1);
});