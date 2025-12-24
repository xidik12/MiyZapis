const http = require('http');

// Simple test using existing users who might be already verified
const testEndpoints = [
  {
    name: 'Check Auth',
    path: '/api/v1/auth/check',
    method: 'GET'
  },
  {
    name: 'Test Stats (no auth)',
    path: '/api/v1/loyalty/stats',
    method: 'GET'
  }
];

async function testAPI() {
  console.log('=== Testing Loyalty API ===');
  
  for (const endpoint of testEndpoints) {
    try {
      const options = {
        hostname: 'localhost',
        port: 3014,
        path: endpoint.path,
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      console.log(`\n${endpoint.name}: ${endpoint.method} ${endpoint.path}`);
      
      const response = await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => resolve({ status: res.statusCode, data }));
        });
        
        req.on('error', reject);
        req.end();
      });
      
      console.log(`Status: ${response.status}`);
      console.log(`Response: ${response.data.substring(0, 200)}${response.data.length > 200 ? '...' : ''}`);
      
    } catch (error) {
      console.error(`Error testing ${endpoint.name}:`, error.message);
    }
  }
}

testAPI();