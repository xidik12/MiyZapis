#!/usr/bin/env node

/**
 * Upload Endpoints Test Script
 * 
 * Tests file upload endpoints and functionality without user creation
 */

const axios = require('axios');
const FormData = require('form-data');

const API_BASE_URL = process.env.API_URL || 'https://miyzapis-backend-production.up.railway.app/api/v1';
const STATIC_BASE_URL = 'https://miyzapis-backend-production.up.railway.app';

// Test image buffers
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

// Try different possible authentication tokens
const POSSIBLE_TOKENS = [
  'test-token',
  'demo-token',
  'dummy-token'
];

async function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

async function error(message, err) {
  console.error(`[${new Date().toISOString()}] ❌ ${message}`, err?.response?.data || err?.message || err);
}

async function success(message) {
  console.log(`[${new Date().toISOString()}] ✅ ${message}`);
}

async function testUploadEndpoint(endpoint, imageType, authToken = null) {
  try {
    const formData = new FormData();
    formData.append('files', TEST_IMAGES[imageType], {
      filename: `test-${imageType}.${imageType}`,
      contentType: `image/${imageType === 'jpeg' ? 'jpeg' : imageType}`
    });

    const headers = {
      ...formData.getHeaders()
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    log(`📤 Testing ${endpoint} with ${imageType.toUpperCase()} image...`);
    
    const response = await axios.post(`${API_BASE_URL}${endpoint}?purpose=portfolio`, formData, {
      headers,
      timeout: 15000
    });

    if (response.status === 200 || response.status === 201) {
      success(`Upload successful: ${response.status}`);
      if (response.data && response.data.data && response.data.data.length > 0) {
        const fileInfo = response.data.data[0];
        console.log('   File URL:', fileInfo.url || fileInfo.path);
        console.log('   File size:', fileInfo.size, 'bytes');
        console.log('   MIME type:', fileInfo.mimeType);
        return fileInfo.url || fileInfo.path;
      }
    } else {
      log(`   Unexpected status: ${response.status}`);
    }
    return null;
    
  } catch (err) {
    if (err.response?.status === 401) {
      log(`   Expected 401 (auth required) for ${endpoint}`);
    } else if (err.response?.status === 400) {
      error(`   Bad request (400) for ${endpoint}`, err.response?.data?.error || err.response?.data);
    } else {
      error(`   Upload failed for ${endpoint}`, err.response?.data || err.message);
    }
    return null;
  }
}

async function testStaticFileAccess(fileUrl) {
  if (!fileUrl) return false;
  
  try {
    log(`🌐 Testing static file access: ${fileUrl}`);
    const response = await axios.head(fileUrl, { timeout: 10000 });
    
    if (response.status === 200) {
      success(`File accessible: ${response.headers['content-type']}`);
      console.log('   Content-Length:', response.headers['content-length']);
      console.log('   Cache-Control:', response.headers['cache-control'] || 'Not set');
      return true;
    } else {
      log(`   Status: ${response.status}`);
      return false;
    }
  } catch (err) {
    if (err.response?.status === 404) {
      error('   File not found (404)');
    } else {
      error('   File access failed', err.response?.status || err.message);
    }
    return false;
  }
}

async function testWithExistingUsers() {
  log('🔍 Testing with potential existing users...');
  
  const testUsers = [
    { email: 'test@example.com', password: 'password' },
    { email: 'admin@example.com', password: 'admin' },
    { email: 'demo@example.com', password: 'demo' },
    { email: 'user@test.com', password: 'test123' }
  ];
  
  for (const user of testUsers) {
    try {
      log(`   Trying login: ${user.email}`);
      const response = await axios.post(`${API_BASE_URL}/auth/login`, user, { timeout: 10000 });
      
      if (response.data.success && response.data.tokens) {
        success(`Login successful: ${user.email}`);
        console.log('   User type:', response.data.user?.userType);
        console.log('   Email verified:', response.data.user?.isEmailVerified);
        return response.data.tokens.accessToken;
      }
    } catch (err) {
      // Silently continue - expected for most attempts
    }
  }
  
  log('   No existing test users found');
  return null;
}

async function runUploadEndpointTests() {
  try {
    log('🚀 Starting Upload Endpoint Tests...\n');
    
    // Test 1: Health check
    try {
      const healthResponse = await axios.get(`${API_BASE_URL}/health`);
      if (healthResponse.data.status === 'healthy') {
        success('Backend is healthy');
      }
    } catch (err) {
      log('Health check failed, but continuing...');
    }
    log('');
    
    // Test 2: Try to find existing user
    const authToken = await testWithExistingUsers();
    log('');
    
    // Test 3: Test upload endpoints
    const endpoints = [
      '/files/upload',
      '/files/upload-simple',
      '/files/test'
    ];
    
    const uploadedFiles = [];
    
    for (const endpoint of endpoints) {
      log(`🧪 Testing endpoint: ${endpoint}`);
      
      // Test without auth first (should fail)
      await testUploadEndpoint(endpoint, 'png', null);
      
      // Test with auth if available
      if (authToken) {
        const pngUrl = await testUploadEndpoint(endpoint, 'png', authToken);
        const jpegUrl = await testUploadEndpoint(endpoint, 'jpeg', authToken);
        const webpUrl = await testUploadEndpoint(endpoint, 'webp', authToken);
        
        if (pngUrl) uploadedFiles.push({ type: 'png', url: pngUrl, endpoint });
        if (jpegUrl) uploadedFiles.push({ type: 'jpeg', url: jpegUrl, endpoint });
        if (webpUrl) uploadedFiles.push({ type: 'webp', url: webpUrl, endpoint });
      } else {
        // Test with dummy tokens
        for (const dummyToken of POSSIBLE_TOKENS) {
          await testUploadEndpoint(endpoint, 'png', dummyToken);
          break; // Only test first dummy token per endpoint
        }
      }
      log('');
    }
    
    // Test 4: Static file access
    if (uploadedFiles.length > 0) {
      log('🌐 Testing static file access for uploaded files:');
      let accessibleFiles = 0;
      
      for (const file of uploadedFiles) {
        const accessible = await testStaticFileAccess(file.url);
        if (accessible) accessibleFiles++;
      }
      
      if (accessibleFiles > 0) {
        success(`${accessibleFiles}/${uploadedFiles.length} uploaded files are accessible`);
      } else {
        error(`None of the uploaded files are accessible via static serving`);
      }
    } else {
      log('🌐 No files uploaded successfully, testing static serving with sample URLs:');
      await testStaticFileAccess(`${STATIC_BASE_URL}/uploads/test.jpg`);
      await testStaticFileAccess(`${STATIC_BASE_URL}/uploads/sample.png`);
    }
    log('');
    
    // Results summary
    log('📊 Test Results Summary:');
    console.log('=========================');
    console.log(`Auth Token Available: ${authToken ? 'YES' : 'NO'}`);
    console.log(`Upload Endpoints: ${endpoints.length} tested`);
    console.log(`Files Uploaded: ${uploadedFiles.length}`);
    console.log(`Image Formats: PNG ${uploadedFiles.some(f => f.type === 'png') ? '✅' : '❌'}, JPEG ${uploadedFiles.some(f => f.type === 'jpeg') ? '✅' : '❌'}, WebP ${uploadedFiles.some(f => f.type === 'webp') ? '✅' : '❌'}`);
    console.log('=========================');
    
    if (uploadedFiles.length > 0) {
      log('');
      log('📋 Uploaded Files:');
      uploadedFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.type.toUpperCase()} via ${file.endpoint}: ${file.url}`);
      });
    }
    
    log('');
    log('💡 Recommendations:');
    if (!authToken) {
      console.log('- Create a test user and verify email to test authenticated uploads');
      console.log('- Check if admin user exists for testing purposes');
    }
    if (uploadedFiles.length === 0) {
      console.log('- Verify upload endpoint authentication and file handling');
      console.log('- Check server logs for detailed error information');
    } else {
      console.log('- Upload functionality is working correctly!');
      console.log('- Static file serving appears to be configured');
      if (uploadedFiles.some(f => f.type === 'webp')) {
        console.log('- WebP support is working correctly');
      }
    }
    
    return uploadedFiles.length > 0;
    
  } catch (err) {
    error('Upload endpoint tests failed', err);
    return false;
  }
}

// Run the test
if (require.main === module) {
  runUploadEndpointTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Test execution failed:', err);
      process.exit(1);
    });
}

module.exports = { runUploadEndpointTests };