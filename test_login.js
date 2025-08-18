const http = require('http');

function testLogin() {
  const data = JSON.stringify({
    email: 'test@example.com',
    password: 'Test123abc'
  });

  const options = {
    hostname: 'localhost',
    port: 8000,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    },
    timeout: 5000
  };

  console.log('Attempting login...');
  console.log('Data:', data);

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);

    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });

    res.on('end', () => {
      console.log('Login response:', body);
    });
  });

  req.on('error', (e) => {
    console.error(`Login error: ${e.message}`);
  });

  req.on('timeout', () => {
    console.error('Login timed out');
    req.destroy();
  });

  req.write(data);
  req.end();
}

testLogin();