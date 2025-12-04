#!/usr/bin/env node

/**
 * Simple test to check what the production API actually supports
 */

const axios = require('axios');

const PROD_API = 'https://miyzapis-backend-production.up.railway.app/api/v1';

console.log('🔍 Testing Production API Support');
console.log('=================================');

async function testApiSupport() {
    console.log('\n📋 Testing API endpoints without authentication...');

    // Test health endpoint
    try {
        const healthResponse = await axios.get(`${PROD_API}/health`, { timeout: 5000 });
        console.log('✅ Health endpoint working');
        console.log('   Status:', healthResponse.status);
        if (healthResponse.data.version) {
            console.log('   API Version:', healthResponse.data.version);
        }
    } catch (error) {
        console.log('❌ Health endpoint failed');
        if (error.response) {
            console.log('   Status:', error.response.status);
            console.log('   Error:', error.response.data);
        } else {
            console.log('   Error:', error.message);
        }
    }

    // Test payment intent with different methods to see validation errors
    const testMethods = ['CRYPTO_ONLY', 'PAYPAL', 'WAYFORPAY', 'UNKNOWN_METHOD'];

    console.log('\n💳 Testing Payment Intent Validation (expect authentication errors)...');

    for (const method of testMethods) {
        try {
            console.log(`\n🔹 Testing method: ${method}`);

            const response = await axios.post(`${PROD_API}/payments/intent`, {
                serviceId: 'test-service',
                scheduledAt: new Date().toISOString(),
                duration: 60,
                paymentMethod: method
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000
            });

            console.log(`✅ ${method}: Accepted (Status: ${response.status})`);

        } catch (error) {
            if (error.response) {
                const status = error.response.status;
                const errorData = error.response.data;

                if (status === 401) {
                    console.log(`✅ ${method}: Method supported (Auth required)`);
                } else if (status === 400) {
                    console.log(`❌ ${method}: Validation error`);
                    if (errorData.error && errorData.error.message) {
                        console.log(`   Error: ${errorData.error.message}`);
                    }
                } else {
                    console.log(`❌ ${method}: Failed (Status: ${status})`);
                    console.log(`   Error:`, errorData);
                }
            } else {
                console.log(`❌ ${method}: Network error - ${error.message}`);
            }
        }
    }

    console.log('\n📊 Summary:');
    console.log('If a method shows "Auth required" it means the method is supported.');
    console.log('If a method shows "Validation error" it might not be supported.');
    console.log('404 errors suggest the endpoint or method is not implemented.');
}

testApiSupport().catch(error => {
    console.error('Test failed:', error.message);
    process.exit(1);
});