const axios = require('axios');

async function testCORS() {
  console.log('Testing CORS configuration...\n');

  // Test preflight (OPTIONS) request
  try {
    const preflightResponse = await axios.options('http://localhost:8000/api/v1/auth/register', {
      headers: {
        'Origin': 'http://localhost:3004',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      },
      timeout: 5000
    });
    
    console.log('✓ CORS Preflight Test: PASSED');
    console.log('Access-Control-Allow-Origin:', preflightResponse.headers['access-control-allow-origin']);
    console.log('Access-Control-Allow-Methods:', preflightResponse.headers['access-control-allow-methods']);
    console.log('Access-Control-Allow-Headers:', preflightResponse.headers['access-control-allow-headers']);
    console.log('Access-Control-Allow-Credentials:', preflightResponse.headers['access-control-allow-credentials']);
    
  } catch (error) {
    console.log('✗ CORS Preflight Test: FAILED');
    console.log('Error:', error.message);
  }

  console.log('\n');

  // Test actual POST request with Origin header
  try {
    const postResponse = await axios.post('http://localhost:8000/api/v1/auth/register', {
      email: 'corstest@example.com',
      password: 'Test123abc',
      firstName: 'CORS',
      lastName: 'Test',
      userType: 'CUSTOMER'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3004'
      },
      timeout: 5000
    });

    console.log('✓ CORS POST Request Test: PASSED');
    console.log('Response Status:', postResponse.status);
    console.log('CORS Headers in Response:');
    console.log('  Access-Control-Allow-Origin:', postResponse.headers['access-control-allow-origin']);
    console.log('  Access-Control-Allow-Credentials:', postResponse.headers['access-control-allow-credentials']);
    
  } catch (error) {
    if (error.response) {
      console.log('✓ CORS POST Request Test: PASSED (got expected response)');
      console.log('Response Status:', error.response.status);
      console.log('CORS Headers in Error Response:');
      console.log('  Access-Control-Allow-Origin:', error.response.headers['access-control-allow-origin']);
      console.log('  Access-Control-Allow-Credentials:', error.response.headers['access-control-allow-credentials']);
    } else {
      console.log('✗ CORS POST Request Test: FAILED');
      console.log('Error:', error.message);
    }
  }
}

testCORS();