const axios = require('axios');

async function testReviewsAPI() {
  console.log('🧪 Testing Reviews API...');
  
  const baseURL = 'http://localhost:3006/api/v1';
  
  // We need an auth token to test the specialist endpoints
  // Let's first check if we can get specialist profile without auth (should fail)
  
  try {
    console.log('1️⃣ Testing GET /specialists/profile (should require auth)...');
    const response = await axios.get(`${baseURL}/specialists/profile`);
    console.log('❌ Unexpected success - should require auth:', response.status);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Correctly requires authentication (401)');
    } else {
      console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
    }
  }
  
  // Test getting reviews for a specific specialist ID directly
  try {
    console.log('2️⃣ Testing GET /reviews/specialist/:id (without auth - should work for public endpoint)...');
    
    // We need a specialist ID - let's try to get one from the database
    // First let's check if there are any specialists in the system
    console.log('📋 Checking specialists in database...');
    
    // We can't directly query the database from this script, so let's try a common ID pattern
    // Let's try to find a specialist ID from our previous testing
    
    const testSpecialistIds = [
      'cm4qy6zle0000j8oq7n1i4d3w', // Common CUID pattern
      'cm4qy6zle0001j8oq7n1i4d3x',
      'cm4qy6zle0002j8oq7n1i4d3y'
    ];
    
    for (const specialistId of testSpecialistIds) {
      try {
        console.log(`📝 Testing with specialist ID: ${specialistId}`);
        const response = await axios.get(`${baseURL}/reviews/specialist/${specialistId}`);
        console.log('✅ Reviews API response:', {
          status: response.status,
          reviewCount: response.data?.reviews?.length || 0,
          stats: response.data?.stats,
          pagination: response.data?.pagination
        });
        
        // If we get a successful response, we found a valid specialist
        break;
      } catch (error) {
        console.log(`⚠️  Specialist ${specialistId} not found or has no reviews:`, error.response?.status);
      }
    }
    
  } catch (error) {
    console.log('❌ Error testing reviews API:', error.response?.status, error.response?.data);
  }
  
  // Test the general reviews endpoint
  try {
    console.log('3️⃣ Testing GET /reviews (general endpoint)...');
    const response = await axios.get(`${baseURL}/reviews`);
    console.log('✅ General reviews endpoint response:', {
      status: response.status,
      hasData: !!response.data
    });
  } catch (error) {
    console.log('❌ General reviews endpoint error:', error.response?.status, error.response?.data);
  }
  
  console.log('🏁 API testing completed');
}

// Run the test
testReviewsAPI().catch(console.error);