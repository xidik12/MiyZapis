#!/usr/bin/env node

/**
 * Test script for payment intent creation and WebSocket functionality
 * Tests all payment methods: CRYPTO, PAYPAL, WAYFORPAY
 */

const axios = require('axios');
const io = require('socket.io-client');

const API_BASE = 'http://localhost:3040/api/v1';
const WS_URL = 'http://localhost:3040';

// Test data
const testServiceId = 'test-service-123';
const testScheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Tomorrow
const testDuration = 60; // 1 hour

console.log('🧪 Starting Payment WebSocket Test Suite');
console.log('==========================================');

/**
 * Test Payment Intent Creation for all methods
 */
async function testPaymentIntents() {
    console.log('\n📋 Testing Payment Intent Creation...');

    const paymentMethods = ['CRYPTO_ONLY', 'PAYPAL', 'WAYFORPAY'];
    const results = {};

    for (const method of paymentMethods) {
        try {
            console.log(`\n🔹 Testing ${method} payment intent...`);

            const response = await axios.post(`${API_BASE}/payments/intent`, {
                serviceId: testServiceId,
                scheduledAt: testScheduledAt,
                duration: testDuration,
                paymentMethod: method
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            if (response.status === 200 || response.status === 201) {
                console.log(`✅ ${method} payment intent created successfully`);
                console.log(`   Payment ID: ${response.data.paymentId}`);
                console.log(`   Status: ${response.data.status}`);
                console.log(`   Method: ${response.data.paymentMethod}`);

                if (response.data.approvalUrl) {
                    console.log(`   Approval URL: ${response.data.approvalUrl}`);
                }
                if (response.data.invoiceUrl) {
                    console.log(`   Invoice URL: ${response.data.invoiceUrl}`);
                }

                results[method] = {
                    success: true,
                    paymentId: response.data.paymentId,
                    data: response.data
                };
            } else {
                console.log(`❌ ${method} failed with status: ${response.status}`);
                results[method] = { success: false, status: response.status };
            }

        } catch (error) {
            console.error(`❌ ${method} payment intent failed:`);
            if (error.response) {
                console.error(`   Status: ${error.response.status}`);
                console.error(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
            } else {
                console.error(`   Error: ${error.message}`);
            }
            results[method] = {
                success: false,
                error: error.response?.data || error.message
            };
        }
    }

    return results;
}

/**
 * Test WebSocket Connection and Events
 */
async function testWebSocketConnection(paymentResults) {
    console.log('\n🔌 Testing WebSocket Connection...');

    return new Promise((resolve) => {
        const socket = io(WS_URL, {
            transports: ['websocket', 'polling'],
            timeout: 5000,
            forceNew: true
        });

        let connectionTimeout;
        const events = [];

        socket.on('connect', () => {
            console.log('✅ WebSocket connected successfully');
            console.log(`   Socket ID: ${socket.id}`);
            events.push({ type: 'connected', timestamp: new Date() });

            // Test payment subscription for each successful payment
            Object.entries(paymentResults).forEach(([method, result]) => {
                if (result.success && result.paymentId) {
                    console.log(`🔔 Subscribing to payment updates for ${method}: ${result.paymentId}`);
                    socket.emit('payment:subscribe', { paymentId: result.paymentId });
                }
            });

            // Clean up after 5 seconds
            setTimeout(() => {
                socket.disconnect();
                resolve({
                    success: true,
                    events,
                    socketId: socket.id
                });
            }, 5000);
        });

        socket.on('connect_error', (error) => {
            console.error('❌ WebSocket connection failed:', error.message);
            events.push({ type: 'connect_error', error: error.message, timestamp: new Date() });
            clearTimeout(connectionTimeout);
            resolve({
                success: false,
                error: error.message,
                events
            });
        });

        socket.on('disconnect', (reason) => {
            console.log(`🔌 WebSocket disconnected: ${reason}`);
            events.push({ type: 'disconnected', reason, timestamp: new Date() });
        });

        // Listen for payment events
        socket.on('payment:status_changed', (data) => {
            console.log('💳 Payment status changed:', data);
            events.push({ type: 'payment:status_changed', data, timestamp: new Date() });
        });

        socket.on('payment:completed', (data) => {
            console.log('✅ Payment completed:', data);
            events.push({ type: 'payment:completed', data, timestamp: new Date() });
        });

        socket.on('notification', (data) => {
            console.log('🔔 Notification received:', data);
            events.push({ type: 'notification', data, timestamp: new Date() });
        });

        // Set connection timeout
        connectionTimeout = setTimeout(() => {
            console.error('❌ WebSocket connection timeout');
            socket.disconnect();
            resolve({
                success: false,
                error: 'Connection timeout',
                events
            });
        }, 10000);
    });
}

/**
 * Test Basic API Endpoints
 */
async function testBasicEndpoints() {
    console.log('\n🌐 Testing Basic API Endpoints...');

    const endpoints = [
        { path: '/health', name: 'Health Check' },
        { path: '/', name: 'API Root' }
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`\n🔹 Testing ${endpoint.name}...`);
            const response = await axios.get(`${API_BASE}${endpoint.path}`, {
                timeout: 5000
            });

            console.log(`✅ ${endpoint.name} responded successfully`);
            console.log(`   Status: ${response.status}`);

        } catch (error) {
            console.error(`❌ ${endpoint.name} failed:`);
            if (error.response) {
                console.error(`   Status: ${error.response.status}`);
                console.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
            } else {
                console.error(`   Error: ${error.message}`);
            }
        }
    }
}

/**
 * Main test function
 */
async function runTests() {
    try {
        console.log(`\n🎯 Target API: ${API_BASE}`);
        console.log(`🎯 Target WebSocket: ${WS_URL}`);

        // Test basic endpoints first
        await testBasicEndpoints();

        // Test payment intents
        const paymentResults = await testPaymentIntents();

        // Test WebSocket functionality
        const wsResults = await testWebSocketConnection(paymentResults);

        // Print summary
        console.log('\n📊 TEST SUMMARY');
        console.log('================');

        console.log('\n💳 Payment Intent Results:');
        Object.entries(paymentResults).forEach(([method, result]) => {
            const status = result.success ? '✅' : '❌';
            console.log(`   ${status} ${method}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
            if (!result.success && result.error) {
                console.log(`       Error: ${JSON.stringify(result.error)}`);
            }
        });

        console.log('\n🔌 WebSocket Results:');
        const wsStatus = wsResults.success ? '✅' : '❌';
        console.log(`   ${wsStatus} Connection: ${wsResults.success ? 'SUCCESS' : 'FAILED'}`);
        if (!wsResults.success && wsResults.error) {
            console.log(`       Error: ${wsResults.error}`);
        }
        console.log(`   Events captured: ${wsResults.events.length}`);

        console.log('\n🎉 Test Suite Complete!');

        // Exit with appropriate code
        const allSuccess = Object.values(paymentResults).every(r => r.success) && wsResults.success;
        process.exit(allSuccess ? 0 : 1);

    } catch (error) {
        console.error('\n💥 Test Suite Failed:', error.message);
        process.exit(1);
    }
}

// Run tests
runTests();