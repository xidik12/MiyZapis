const axios = require('axios');

const BASE_URL = 'http://localhost:8000/api/v1';

async function testSpecialistFlow() {
  console.log('Testing Specialist User Flow...\n');

  let specialistTokens = null;
  let specialistId = null;

  // 1. Register a specialist
  console.log('1. Registering a specialist...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      email: 'specialist@example.com',
      password: 'Specialist123',
      firstName: 'Test',
      lastName: 'Specialist',
      userType: 'SPECIALIST'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    console.log('✓ Specialist registration successful');
    specialistTokens = response.data.data.tokens;
    specialistId = response.data.data.user.id;
    console.log('Specialist ID:', specialistId);
    console.log('Access Token:', specialistTokens.accessToken.substring(0, 50) + '...');

  } catch (error) {
    if (error.response?.status === 409) {
      console.log('ℹ Specialist already exists, trying to login...');
      
      try {
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          email: 'specialist@example.com',
          password: 'Specialist123'
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        });
        
        console.log('✓ Specialist login successful');
        specialistTokens = loginResponse.data.data.tokens;
        specialistId = loginResponse.data.data.user.id;
        
      } catch (loginError) {
        console.log('✗ Failed to login specialist:', loginError.response?.data || loginError.message);
        return;
      }
    } else {
      console.log('✗ Specialist registration failed:', error.response?.data || error.message);
      return;
    }
  }

  // 2. Test getting specialist profile
  console.log('\n2. Getting specialist profile...');
  try {
    const profileResponse = await axios.get(`${BASE_URL}/specialists/${specialistId}`, {
      headers: { 
        'Authorization': `Bearer ${specialistTokens.accessToken}`,
        'Content-Type': 'application/json' 
      },
      timeout: 10000
    });

    console.log('✓ Specialist profile retrieved successfully');
    console.log('Business Name:', profileResponse.data.data?.businessName || 'Not set');
    
  } catch (error) {
    console.log('✗ Failed to get specialist profile:', error.response?.data || error.message);
  }

  // 3. Test creating a service
  console.log('\n3. Creating a service...');
  try {
    const serviceData = {
      name: 'Professional Hair Cut',
      description: 'A professional haircut service with consultation and styling',
      category: 'haircut',
      basePrice: 50,
      currency: 'USD',
      duration: 60,
      requirements: 'Please arrive with clean hair',
      deliverables: 'Professional haircut and styling',
      maxAdvanceBooking: 30,
      minAdvanceBooking: 24,
      images: ['https://example.com/image1.jpg']
    };

    const serviceResponse = await axios.post(`${BASE_URL}/services`, serviceData, {
      headers: { 
        'Authorization': `Bearer ${specialistTokens.accessToken}`,
        'Content-Type': 'application/json' 
      },
      timeout: 10000
    });

    console.log('✓ Service created successfully');
    console.log('Service ID:', serviceResponse.data.data?.id);
    console.log('Service Name:', serviceResponse.data.data?.name);
    
  } catch (error) {
    console.log('✗ Failed to create service:', error.response?.data || error.message);
  }

  // 4. Test listing services for specialist
  console.log('\n4. Listing services for specialist...');
  try {
    const servicesResponse = await axios.get(`${BASE_URL}/services?specialistId=${specialistId}`, {
      headers: { 
        'Authorization': `Bearer ${specialistTokens.accessToken}`,
        'Content-Type': 'application/json' 
      },
      timeout: 10000
    });

    console.log('✓ Services listed successfully');
    console.log('Number of services:', servicesResponse.data.data?.services?.length || 0);
    
  } catch (error) {
    console.log('✗ Failed to list services:', error.response?.data || error.message);
  }

  // 5. Test getting service categories
  console.log('\n5. Testing service categories...');
  try {
    const categoriesResponse = await axios.get(`${BASE_URL}/services/categories`, {
      timeout: 10000
    });

    console.log('✓ Service categories retrieved successfully');
    console.log('Available categories:', categoriesResponse.data.data?.categories?.map(c => c.name).join(', ') || 'None');
    
  } catch (error) {
    console.log('✗ Failed to get service categories:', error.response?.data || error.message);
  }

  console.log('\n=== Specialist Flow Test Results ===');
  console.log('All tests completed. Check individual results above.');
}

testSpecialistFlow();