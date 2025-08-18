const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000/api/v1';

async function testSpecialistRegistration() {
  try {
    console.log('Testing specialist registration...');
    
    const registrationData = {
      email: `specialist-${Date.now()}@example.com`,
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'Specialist',
      userType: 'SPECIALIST'
    };

    const response = await axios.post(`${API_BASE_URL}/auth/register`, registrationData, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3005'
      }
    });

    console.log('Specialist registration successful!');
    console.log('User:', JSON.stringify(response.data.data.user, null, 2));
    console.log('UserType:', response.data.data.user.userType);
    
    const accessToken = response.data.data.tokens.accessToken;
    
    // Test creating a specialist profile
    console.log('\nTesting specialist profile creation...');
    
    try {
      const specialistData = {
        businessName: 'Test Beauty Studio',
        description: 'Professional beauty services',
        specialties: ['haircut', 'massage'],
        experience: 5,
        location: {
          address: '123 Main St',
          city: 'Test City',
          country: 'Ukraine'
        }
      };

      const specialistResponse = await axios.post(`${API_BASE_URL}/specialists/profile`, specialistData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3005'
        }
      });

      console.log('Specialist profile created successfully!');
      console.log('Specialist ID:', specialistResponse.data.data.id);
      console.log('Business Name:', specialistResponse.data.data.businessName);
    } catch (specialistError) {
      console.log('Specialist profile creation failed:', specialistError.response?.data || specialistError.message);
    }
    
    return true;
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
    return false;
  }
}

testSpecialistRegistration().then(success => {
  process.exit(success ? 0 : 1);
});