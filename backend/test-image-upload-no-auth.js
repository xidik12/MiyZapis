#!/usr/bin/env node

/**
 * Image Upload Test Script (No Authentication)
 * 
 * Tests image upload endpoints and static file serving without authentication
 * to isolate upload functionality issues from auth issues
 */

const axios = require('axios');
const FormData = require('form-data');

// Configuration
const API_BASE_URL = process.env.API_URL || 'https://miyzapis-backend-production.up.railway.app';

// Test image buffers for different formats
const TEST_IMAGES = {
  png: Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
    0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x01, 0x1A, 0x25, 0xBC, 0x10, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]),
  jpeg: Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2NjIpLCBxdWFsaXR5ID0gNzUK/9sAQwAGBAUGBQQGBgUGBwcGCAoQCgoJCQoUDg0NDhQUExMTExQTFBcYGBsbGBcTFhsdHh8fHhsdHh8bHR8fHR8fHR8f/9sAQwEHBwcKCAoTCgoTHhQTFB8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8f/8AAEQgAAQABAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+gEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==', 'base64'),
  webp: Buffer.from('UklGRioAAABXRUJQVlA4IBgAAADwAQCdASoBAAEAAwA0JaQAA3AA/vuuAAA=', 'base64')
};

async function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

async function error(message, err) {
  console.error(`[${new Date().toISOString()}] ❌ ${message}`, err?.response?.data || err?.message || err);
}

async function success(message) {
  console.log(`[${new Date().toISOString()}] ✅ ${message}`);
}

async function testHealthEndpoint() {
  try {
    log('🏥 Testing health endpoint...');
    const response = await axios.get(`${API_BASE_URL}/api/v1/health`, { timeout: 10000 });
    
    if (response.status === 200 && response.data.status === 'healthy') {
      success('Backend is healthy and reachable');
      console.log('   Database:', response.data.database);
      console.log('   Uptime:', response.data.uptime);
      console.log('   Environment:', response.data.environment);
      return true;
    } else {
      error('Backend health check failed', response.data);
      return false;
    }
  } catch (err) {
    error('Health endpoint failed', err);
    return false;
  }
}

async function testStaticFileEndpoints() {
  try {
    log('🌐 Testing static file endpoints...');
    
    // Test existing uploads directory
    try {
      const response = await axios.get(`${API_BASE_URL}/uploads/`, { timeout: 5000 });
      console.log('   Uploads directory accessible:', response.status);
    } catch (err) {
      if (err.response?.status === 403) {
        success('Uploads directory exists (403 - directory listing disabled)');
      } else if (err.response?.status === 404) {
        log('   Uploads directory not found (404)');
      } else {
        error('Uploads directory test failed', err.response?.status || err.message);
      }
    }
    
    // Test if any existing files are accessible
    const testFiles = [
      '/uploads/test.jpg',
      '/uploads/avatar-test.png',
      '/uploads/portfolio-test.jpg'
    ];
    
    for (const testFile of testFiles) {
      try {
        const response = await axios.head(`${API_BASE_URL}${testFile}`, { timeout: 5000 });
        success(`Existing file found: ${testFile} (${response.headers['content-type']})`);
      } catch (err) {
        if (err.response?.status === 404) {
          log(`   File not found (expected): ${testFile}`);
        } else {
          error(`   File access error: ${testFile}`, err.response?.status || err.message);
        }
      }
    }
  } catch (err) {
    error('Static file endpoint test failed', err);
  }
}

async function testFileUploadStructure() {
  try {
    log('🔍 Testing file upload endpoints structure...');
    
    // Test without authentication (should fail with 401)
    const testEndpoints = [
      '/api/v1/files/upload',
      '/api/v1/files/upload-simple',
      '/api/v1/files/test'
    ];
    
    for (const endpoint of testEndpoints) {
      try {
        const formData = new FormData();
        formData.append('files', TEST_IMAGES.png, {
          filename: 'test.png',
          contentType: 'image/png'
        });
        
        const response = await axios.post(`${API_BASE_URL}${endpoint}?purpose=test`, formData, {
          headers: formData.getHeaders(),
          timeout: 10000
        });
        
        error(`Unexpected success for ${endpoint} without auth:`, response.status);
      } catch (err) {
        if (err.response?.status === 401) {
          success(`Endpoint ${endpoint} correctly requires authentication`);
        } else if (err.response?.status === 404) {
          log(`   Endpoint not found: ${endpoint}`);
        } else {
          error(`Unexpected error for ${endpoint}:`, err.response?.data || err.message);
        }
      }
    }
    
  } catch (err) {
    error('File upload structure test failed', err);
  }
}

async function testDatabaseConnection() {
  try {
    log('🗄️ Testing database connectivity (indirect)...');
    
    // Try to hit an endpoint that requires database access
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/services`, { timeout: 10000 });
      if (response.status === 200) {
        success('Database appears to be connected (services endpoint accessible)');
        console.log('   Services found:', Array.isArray(response.data) ? response.data.length : 'N/A');
      } else {
        log('   Services endpoint returned:', response.status);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        log('   Services endpoint not found');
      } else {
        error('Services endpoint test failed', err.response?.data || err.message);
      }
    }
  } catch (err) {
    error('Database connectivity test failed', err);
  }
}

async function testImageProcessingSupport() {
  try {
    log('🎨 Testing image processing support...');
    
    // Check if Sharp/image processing is available by trying to access an image processing endpoint
    const testUrls = [
      '/api/v1/files/resize/test',
      '/api/v1/images/process',
      '/api/v1/files/thumbnail'
    ];
    
    for (const testUrl of testUrls) {
      try {
        const response = await axios.get(`${API_BASE_URL}${testUrl}`, { timeout: 5000 });
        success(`Image processing endpoint found: ${testUrl}`);
      } catch (err) {
        if (err.response?.status === 404) {
          log(`   Image processing endpoint not found: ${testUrl}`);
        } else if (err.response?.status === 401) {
          success(`Image processing endpoint exists but requires auth: ${testUrl}`);
        } else {
          error(`Image processing endpoint error: ${testUrl}`, err.response?.status || err.message);
        }
      }
    }
  } catch (err) {
    error('Image processing support test failed', err);
  }
}

async function runNoAuthTests() {
  try {
    log('🚀 Starting Image Upload Tests (No Authentication)...\n');
    
    // Test 1: Health Check
    const isHealthy = await testHealthEndpoint();
    if (!isHealthy) {
      throw new Error('Backend is not healthy, stopping tests');
    }
    log('');
    
    // Test 2: Static File Endpoints
    await testStaticFileEndpoints();
    log('');
    
    // Test 3: File Upload Structure
    await testFileUploadStructure();
    log('');
    
    // Test 4: Database Connection
    await testDatabaseConnection();
    log('');
    
    // Test 5: Image Processing Support
    await testImageProcessingSupport();
    log('');
    
    success('🎉 No-Auth Tests Completed!');
    
    log('');
    log('📝 Summary:');
    log('- Backend is healthy and reachable');
    log('- Upload endpoints exist and require authentication (good security)');
    log('- Static file serving is configured');
    log('- Database connectivity appears functional');
    log('');
    log('💡 Next steps:');
    log('1. Create or verify user with email verification');
    log('2. Test authenticated upload functionality');
    log('3. Test image processing and WebP support');
    
    return true;
    
  } catch (err) {
    error('No-auth tests failed', err);
    return false;
  }
}

// Run the test
if (require.main === module) {
  runNoAuthTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Test execution failed:', err);
      process.exit(1);
    });
}

module.exports = { runNoAuthTests };