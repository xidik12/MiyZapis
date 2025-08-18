const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000/api/v1';

async function testRegistration() {
  try {
    console.log('Testing user registration...');
    
    const registrationData = {
      email: `test-${Date.now()}@example.com`,
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
      userType: 'CUSTOMER'
    };

    const response = await axios.post(`${API_BASE_URL}/auth/register`, registrationData, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3005'
      }
    });

    console.log('Registration successful!');
    console.log('User:', JSON.stringify(response.data.data.user, null, 2));
    console.log('Tokens received:', !!response.data.data.tokens.accessToken);
    
    // Test login with the same credentials
    console.log('\nTesting login...');
    
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: registrationData.email,
      password: registrationData.password
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3005'
      }
    });

    console.log('Login successful!');
    console.log('User logged in:', loginResponse.data.data.user.email);
    console.log('UserType:', loginResponse.data.data.user.userType);
    
    // Test protected endpoint
    console.log('\nTesting protected endpoint...');
    
    const profileResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${loginResponse.data.data.tokens.accessToken}`,
        'Origin': 'http://localhost:3005'
      }
    });

    console.log('Profile fetch successful!');
    console.log('Profile user type:', profileResponse.data.data.user.userType);
    
    return true;
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
    return false;
  }
}

testRegistration().then(success => {
  process.exit(success ? 0 : 1);
});