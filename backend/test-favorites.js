const jwt = require('jsonwebtoken');
const axios = require('axios');

// JWT secret from .env file
const JWT_SECRET = "your-super-secret-jwt-key-that-is-at-least-32-characters-long";

// Create a test user payload
const testUser = {
  userId: "cmezpxpdl0000mg9vdi63lv58", // The user we created earlier
  email: "testuser@example.com",
  userType: "CLIENT"
};

// Generate JWT token
const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });

console.log('Generated JWT Token:', token);

const BASE_URL = 'http://localhost:3003/api/v1';
const SPECIALIST_ID = 'cmen2kyq90002xvhekj7884ee'; // The specialist we found earlier

async function testFavoritesAPI() {
  try {
    console.log('\n=== Testing Favorites API ===\n');

    // Test 1: Check if specialist is in favorites (should be false initially)
    console.log('1. Checking if specialist is in favorites (should be false)...');
    const checkResponse = await axios.get(
      `${BASE_URL}/favorites/specialists/${SPECIALIST_ID}/check`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Check result:', checkResponse.data);

    // Test 2: Add specialist to favorites
    console.log('\n2. Adding specialist to favorites...');
    const addResponse = await axios.post(
      `${BASE_URL}/favorites/specialists/${SPECIALIST_ID}`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Add result:', addResponse.data);

    // Test 3: Check if specialist is in favorites (should be true now)
    console.log('\n3. Checking if specialist is in favorites (should be true)...');
    const checkResponse2 = await axios.get(
      `${BASE_URL}/favorites/specialists/${SPECIALIST_ID}/check`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Check result:', checkResponse2.data);

    // Test 4: Get user's favorite specialists
    console.log('\n4. Getting user\'s favorite specialists...');
    const getFavoritesResponse = await axios.get(
      `${BASE_URL}/favorites/specialists`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Get favorites result:', JSON.stringify(getFavoritesResponse.data, null, 2));

    // Test 5: Remove specialist from favorites
    console.log('\n5. Removing specialist from favorites...');
    const removeResponse = await axios.delete(
      `${BASE_URL}/favorites/specialists/${SPECIALIST_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Remove result:', removeResponse.data);

    // Test 6: Check if specialist is in favorites (should be false again)
    console.log('\n6. Checking if specialist is in favorites (should be false)...');
    const checkResponse3 = await axios.get(
      `${BASE_URL}/favorites/specialists/${SPECIALIST_ID}/check`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Check result:', checkResponse3.data);

    console.log('\n✅ All favorites tests completed successfully!');

  } catch (error) {
    console.error('❌ Error testing favorites API:', error.response?.data || error.message);
  }
}

// Run the test
testFavoritesAPI();