const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

const BASE_URL = 'https://miyzapis-backend-production.up.railway.app/api/v1';

// Create a test JWT token for testing
function createTestToken() {
  const testUser = {
    userId: 'test-user-id',
    email: 'test@test.com',
    userType: 'CUSTOMER'
  };
  
  // Use a common test secret - this won't work in production but helps for testing
  return jwt.sign(testUser, 'test-secret-key', { expiresIn: '1h' });
}

async function testNotificationsEndpoint() {
  const token = createTestToken();
  
  console.log('🔍 Testing Notifications System');
  console.log('================================\n');
  
  // Test 1: GET /notifications (simplified controller)
  console.log('1. Testing GET /notifications');
  try {
    const response = await fetch(`${BASE_URL}/notifications`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.log(`   ❌ Error:`, error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: GET /notifications/unread-count
  console.log('2. Testing GET /notifications/unread-count');
  try {
    const response = await fetch(`${BASE_URL}/notifications/unread-count`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.log(`   ❌ Error:`, error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 3: GET /notifications/test-backend
  console.log('3. Testing GET /notifications/test-backend');
  try {
    const response = await fetch(`${BASE_URL}/notifications/test-backend`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.log(`   ❌ Error:`, error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 4: PUT /notifications/read-all
  console.log('4. Testing PUT /notifications/read-all');
  try {
    const response = await fetch(`${BASE_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.log(`   ❌ Error:`, error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 5: PUT /notifications/test-notification-id/read
  console.log('5. Testing PUT /notifications/{id}/read');
  try {
    const response = await fetch(`${BASE_URL}/notifications/test-notification-id/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.log(`   ❌ Error:`, error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  console.log('✅ Notification system testing completed!');
}

// Test without token first
async function testWithoutAuth() {
  console.log('🔒 Testing without authentication');
  console.log('=================================\n');
  
  try {
    const response = await fetch(`${BASE_URL}/notifications`);
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.log(`   ❌ Error:`, error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
}

async function main() {
  await testWithoutAuth();
  await testNotificationsEndpoint();
}

main().catch(console.error);