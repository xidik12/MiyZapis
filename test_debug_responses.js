const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000/api/v1';

async function testDebugResponses() {
  try {
    console.log('Testing API responses structure...');
    
    // Register a specialist
    const registrationData = {
      email: `debug-specialist-${Date.now()}@example.com`,
      password: 'Password123!',
      firstName: 'Debug',
      lastName: 'Specialist',
      userType: 'SPECIALIST'
    };

    const response = await axios.post(`${API_BASE_URL}/auth/register`, registrationData, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3005'
      }
    });

    const accessToken = response.data.data.tokens.accessToken;
    
    // Test get profile - debug response
    console.log('\n=== GET MY PROFILE DEBUG ===');
    try {
      const profileResponse = await axios.get(`${API_BASE_URL}/specialists/my/profile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Origin': 'http://localhost:3005'
        }
      });

      console.log('Full profile response:');
      console.log(JSON.stringify(profileResponse.data, null, 2));
    } catch (profileError) {
      console.log('Profile error response:');
      console.log(JSON.stringify(profileError.response?.data, null, 2));
    }

    // Test update profile - debug response
    console.log('\n=== UPDATE PROFILE DEBUG ===');
    try {
      const updateData = {
        businessName: 'Debug Studio',
        description: 'Debug description'
      };

      const updateResponse = await axios.put(`${API_BASE_URL}/specialists/profile`, updateData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3005'
        }
      });

      console.log('Full update response:');
      console.log(JSON.stringify(updateResponse.data, null, 2));
    } catch (updateError) {
      console.log('Update error response:');
      console.log(JSON.stringify(updateError.response?.data, null, 2));
    }

    // Test create service - debug response
    console.log('\n=== CREATE SERVICE DEBUG ===');
    try {
      const serviceData = {
        name: 'Debug Service',
        description: 'Debug service description',
        category: 'haircut',
        basePrice: 25,
        duration: 30,
        currency: 'USD'
      };

      const serviceResponse = await axios.post(`${API_BASE_URL}/services`, serviceData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3005'
        }
      });

      console.log('Full service response:');
      console.log(JSON.stringify(serviceResponse.data, null, 2));
    } catch (serviceError) {
      console.log('Service error response:');
      console.log(JSON.stringify(serviceError.response?.data, null, 2));
    }
    
    return true;
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
    return false;
  }
}

testDebugResponses().then(success => {
  process.exit(success ? 0 : 1);
});