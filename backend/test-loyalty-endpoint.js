const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3013/api/v1';

async function testLoyaltyEndpoint() {
  try {
    console.log('=== TESTING LOYALTY ENDPOINT ===');
    
    // First, try to register or login to get a token
    // Let's try to login with a test user first
    const loginData = {
      email: 'test@test.com',
      password: 'password123'
    };
    
    console.log('1. Attempting login...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    });
    
    if (loginResponse.ok) {
      const loginResult = await loginResponse.json();
      console.log('✅ Login successful:', loginResult.user.email);
      
      const token = loginResult.token;
      
      // Now test the loyalty stats endpoint
      console.log('2. Testing loyalty stats endpoint...');
      const statsResponse = await fetch(`${BASE_URL}/loyalty/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('✅ Loyalty stats response:', JSON.stringify(statsData, null, 2));
      } else {
        const error = await statsResponse.text();
        console.log('❌ Loyalty stats failed:', statsResponse.status, error);
      }
      
      // Also test loyalty profile endpoint
      console.log('3. Testing loyalty profile endpoint...');
      const profileResponse = await fetch(`${BASE_URL}/loyalty/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log('✅ Loyalty profile response:', JSON.stringify(profileData, null, 2));
      } else {
        const error = await profileResponse.text();
        console.log('❌ Loyalty profile failed:', profileResponse.status, error);
      }
      
    } else {
      console.log('❌ Login failed:', loginResponse.status);
      
      // Try to register a test user instead
      console.log('Attempting to register test user...');
      const registerData = {
        email: 'test@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        userType: 'customer'
      };
      
      const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerData)
      });
      
      if (registerResponse.ok) {
        const registerResult = await registerResponse.json();
        console.log('✅ Registration successful:', registerResult.user.email);
        
        // Now try the loyalty endpoints with the new token
        const token = registerResult.token;
        
        console.log('Testing loyalty stats with new user...');
        const statsResponse = await fetch(`${BASE_URL}/loyalty/stats`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          console.log('✅ New user loyalty stats:', JSON.stringify(statsData, null, 2));
        } else {
          const error = await statsResponse.text();
          console.log('❌ New user loyalty stats failed:', statsResponse.status, error);
        }
      } else {
        const error = await registerResponse.text();
        console.log('❌ Registration failed:', registerResponse.status, error);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLoyaltyEndpoint();