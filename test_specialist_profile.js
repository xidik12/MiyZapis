const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000/api/v1';

async function testSpecialistProfile() {
  try {
    console.log('Testing specialist profile management...');
    
    // First register a specialist
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

    console.log('Specialist registered successfully!');
    const accessToken = response.data.data.tokens.accessToken;
    
    // Try to get the specialist profile
    console.log('\nTesting get my profile...');
    
    try {
      const profileResponse = await axios.get(`${API_BASE_URL}/specialists/my/profile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Origin': 'http://localhost:3005'
        }
      });

      console.log('Specialist profile retrieved!');
      console.log('Business Name:', profileResponse.data.data.businessName || 'Not set');
      console.log('Rating:', profileResponse.data.data.rating);
      console.log('Is Verified:', profileResponse.data.data.isVerified);
    } catch (profileError) {
      console.log('Get profile failed:', profileError.response?.data || profileError.message);
    }

    // Try to update the specialist profile
    console.log('\nTesting update profile...');
    
    try {
      const updateData = {
        businessName: 'Updated Beauty Studio',
        description: 'Professional beauty and wellness services',
        specialties: ['haircut', 'massage', 'facial'],
        experience: 7
      };

      const updateResponse = await axios.put(`${API_BASE_URL}/specialists/profile`, updateData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3005'
        }
      });

      console.log('Profile updated successfully!');
      console.log('New Business Name:', updateResponse.data.data.businessName);
      console.log('New Description:', updateResponse.data.data.description);
    } catch (updateError) {
      console.log('Update profile failed:', updateError.response?.data || updateError.message);
    }

    // Test creating a service
    console.log('\nTesting service creation...');
    
    try {
      const serviceData = {
        name: 'Premium Haircut',
        description: 'Professional haircut with styling',
        category: 'haircut',
        basePrice: 50,
        duration: 60,
        currency: 'USD'
      };

      const serviceResponse = await axios.post(`${API_BASE_URL}/services`, serviceData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3005'
        }
      });

      console.log('Service created successfully!');
      console.log('Service Name:', serviceResponse.data.data.name);
      console.log('Service Price:', serviceResponse.data.data.basePrice, serviceResponse.data.data.currency);
    } catch (serviceError) {
      console.log('Service creation failed:', serviceError.response?.data || serviceError.message);
    }
    
    return true;
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
    return false;
  }
}

testSpecialistProfile().then(success => {
  process.exit(success ? 0 : 1);
});