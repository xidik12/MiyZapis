/**
 * Test script to debug service duration issue
 * This simulates the service creation/update process to identify where duration gets corrupted
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3006/api/v1';

// Test data for service creation
const testServiceData = {
  name: "Test Service Duration Fix",
  description: "Testing service duration handling to identify the bug where duration reverts to 15 minutes",
  category: "haircut",
  basePrice: 50.00,
  currency: "USD", 
  duration: 42, // This should be 42 minutes but reportedly reverts to 15
  requirements: ["Clean hair", "Appointment confirmed"],
  deliverables: ["Professional haircut", "Style consultation"],
  requiresApproval: false,
  maxAdvanceBooking: 30,
  minAdvanceBooking: 24,
  images: []
};

// Test data for service update
const updateServiceData = {
  duration: 42, // Test updating duration to 42 minutes
  basePrice: 55.00
};

async function testServiceDurationFlow() {
  console.log('🧪 Starting service duration debugging test...');
  
  try {
    // First, we need to authenticate (simulate logged-in specialist)
    // For this test, we'll skip auth and use the direct service endpoints
    console.log('\n📝 Step 1: Creating new service with duration 42 minutes...');
    console.log('Service data being sent:', JSON.stringify(testServiceData, null, 2));
    
    const createResponse = await axios.post(`${API_BASE}/services`, testServiceData, {
      headers: {
        'Content-Type': 'application/json',
        // Add auth header if needed for testing
      }
    });
    
    console.log('✅ Service created successfully!');
    console.log('Response data:', JSON.stringify(createResponse.data, null, 2));
    console.log(`⏰ Duration in response: ${createResponse.data.duration} minutes`);
    
    const serviceId = createResponse.data.id;
    
    // Wait a moment then fetch the service to see if duration is correct
    console.log('\n🔍 Step 2: Fetching created service to verify duration...');
    const fetchResponse = await axios.get(`${API_BASE}/services/${serviceId}`);
    console.log('Service fetched:', JSON.stringify(fetchResponse.data, null, 2));
    console.log(`⏰ Duration after fetch: ${fetchResponse.data.duration} minutes`);
    
    // Test updating the service
    console.log('\n🔄 Step 3: Updating service duration...');
    console.log('Update data being sent:', JSON.stringify(updateServiceData, null, 2));
    
    const updateResponse = await axios.put(`${API_BASE}/services/${serviceId}`, updateServiceData, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('✅ Service updated successfully!');
    console.log('Update response:', JSON.stringify(updateResponse.data, null, 2));
    console.log(`⏰ Duration after update: ${updateResponse.data.duration} minutes`);
    
    // Final verification
    console.log('\n🔍 Step 4: Final verification fetch...');
    const finalResponse = await axios.get(`${API_BASE}/services/${serviceId}`);
    console.log('Final service state:', JSON.stringify(finalResponse.data, null, 2));
    console.log(`⏰ Final duration: ${finalResponse.data.duration} minutes`);
    
    // Summary
    console.log('\n📊 DURATION TRACKING SUMMARY:');
    console.log(`Initial request: ${testServiceData.duration} minutes`);
    console.log(`After creation: ${createResponse.data.duration} minutes`);
    console.log(`After fetch: ${fetchResponse.data.duration} minutes`);
    console.log(`Update request: ${updateServiceData.duration} minutes`);
    console.log(`After update: ${updateResponse.data.duration} minutes`);
    console.log(`Final verification: ${finalResponse.data.duration} minutes`);
    
    if (finalResponse.data.duration !== 42) {
      console.log('🚨 BUG CONFIRMED: Duration was corrupted during the process!');
    } else {
      console.log('✅ SUCCESS: Duration remained correct throughout the process');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testServiceDurationFlow();