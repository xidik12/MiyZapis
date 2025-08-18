const http = require('http');

function testSimplePost() {
  const data = JSON.stringify({
    email: 'test@example.com',
    password: 'Test123abc',
    firstName: 'Test',
    lastName: 'User',
    userType: 'CUSTOMER'
  });

  const options = {
    hostname: 'localhost',
    port: 8000,
    path: '/api/v1/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    },
    timeout: 5000
  };

  console.log('Attempting registration...');
  console.log('Data:', data);

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);

    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
      console.log('Received chunk:', chunk.toString());
    });

    res.on('end', () => {
      console.log('Response body:', body);
    });
  });

  req.on('error', (e) => {
    console.error(`Request error: ${e.message}`);
  });

  req.on('timeout', () => {
    console.error('Request timed out');
    req.destroy();
  });

  req.write(data);
  req.end();
}

testSimplePost();