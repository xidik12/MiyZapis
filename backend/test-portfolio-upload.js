// Test script for portfolio image upload functionality
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const API_BASE_URL = process.env.API_BASE_URL || 'https://miyzapis-backend-production.up.railway.app';

async function testPortfolioUpload() {
  console.log('🧪 Testing portfolio image upload functionality...');
  
  try {
    // Test with different image formats
    const testImages = [
      { name: 'test-jpeg.jpg', format: 'image/jpeg' },
      { name: 'test-png.png', format: 'image/png' },
      { name: 'test-webp.webp', format: 'image/webp' }
    ];
    
    for (const testImage of testImages) {
      console.log(`\n📸 Testing ${testImage.name} (${testImage.format})...`);
      
      // Create a simple test image buffer (1x1 pixel)
      let imageBuffer;
      if (testImage.format === 'image/jpeg') {
        // Simple JPEG header
        imageBuffer = Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2NjIpLCBxdWFsaXR5ID0gNzUK/9sAQwAGBAUGBQQGBgUGBwcGCAoQCgoJCQoUDg0NDhQUExMTExQTFBcYGBsbGBcTFhsdHh8fHhsdHh8bHR8fHR8fHR8f/9sAQwEHBwcKCAoTCgoTHhQTFB8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8f/8AAEQgAAQABAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+gEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==', 'base64');
      } else if (testImage.format === 'image/png') {
        // Simple PNG header (1x1 transparent pixel)
        imageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
      } else if (testImage.format === 'image/webp') {
        // Simple WebP header (1x1 pixel)
        imageBuffer = Buffer.from('UklGRioAAABXRUJQVlA4IBgAAADwAQCdASoBAAEAAwA0JaQAA3AA/vuuAAA=', 'base64');
      }
      
      if (!imageBuffer) {
        console.log(`❌ Could not create test image buffer for ${testImage.format}`);
        continue;
      }
      
      // Test file upload endpoint directly
      const form = new FormData();
      form.append('files', imageBuffer, {
        filename: testImage.name,
        contentType: testImage.format
      });
      
      try {
        const response = await axios.post(`${API_BASE_URL}/api/v1/files/upload?purpose=portfolio`, form, {
          headers: {
            ...form.getHeaders(),
            'Authorization': 'Bearer test-token' // You'll need a valid token for actual testing
          },
          timeout: 10000
        });
        
        if (response.status === 201 && response.data) {
          console.log(`✅ Upload successful for ${testImage.name}`);
          console.log(`   URL: ${response.data[0]?.url || 'N/A'}`);
          console.log(`   Size: ${response.data[0]?.size || 'N/A'} bytes`);
          console.log(`   MIME: ${response.data[0]?.mimeType || 'N/A'}`);
        } else {
          console.log(`⚠️ Unexpected response for ${testImage.name}:`, response.status);
        }
      } catch (error) {
        if (error.response) {
          console.log(`❌ Upload failed for ${testImage.name}:`, error.response.status, error.response.data?.error?.message || error.response.data);
        } else {
          console.log(`❌ Network error for ${testImage.name}:`, error.message);
        }
      }
    }
    
    // Test static file serving
    console.log('\n🌐 Testing static file serving...');
    
    const testUrls = [
      '/uploads/portfolio/test.jpg',
      '/uploads/portfolio/test.png', 
      '/uploads/portfolio/test.webp'
    ];
    
    for (const testUrl of testUrls) {
      try {
        const response = await axios.head(`${API_BASE_URL}${testUrl}`, { timeout: 5000 });
        console.log(`✅ Static file accessible: ${testUrl} (${response.headers['content-type'] || 'unknown type'})`);
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`⚠️ File not found (expected): ${testUrl}`);
        } else {
          console.log(`❌ Static file error for ${testUrl}:`, error.message);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n🧪 Portfolio image upload test completed.');
}

if (require.main === module) {
  testPortfolioUpload();
}

module.exports = { testPortfolioUpload };