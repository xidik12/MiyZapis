#!/usr/bin/env node

// Simple script to fix specialist schedules
const https = require('https');

const backendUrl = 'https://miyzapis-backend-production.up.railway.app';

// You'll need to get an auth token from your browser's network tab when logged in
// Or we can make this endpoint not require auth for admin purposes
async function fixSchedules() {
  console.log('🔧 Triggering schedule fix for all specialists...');
  
  const postData = JSON.stringify({});
  
  const options = {
    hostname: 'miyzapis-backend-production.up.railway.app',
    port: 443,
    path: '/api/v1/availability/specialists/availability/fix-all',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Response status:', res.statusCode);
        console.log('Response:', data);
        
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('✅ Schedule fix completed successfully!');
          resolve(data);
        } else {
          console.log('❌ Schedule fix failed');
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Request error:', err);
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

// Make the endpoint not require auth for this admin operation
console.log('Note: You may need to temporarily disable auth for the fix-all endpoint');
console.log('Or call it with proper authentication headers');

fixSchedules().catch(console.error);
