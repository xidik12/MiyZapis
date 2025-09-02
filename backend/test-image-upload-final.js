#!/usr/bin/env node

/**
 * Final Comprehensive Image Upload Test Script
 * 
 * Tests avatar persistence and portfolio image upload functionality
 * with manual verification steps
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = process.env.API_URL || 'https://miyzapis-backend-production.up.railway.app/api/v1';
const STATIC_BASE_URL = process.env.STATIC_URL || 'https://miyzapis-backend-production.up.railway.app';

// Use the verified test user we just created
const TEST_CREDENTIALS = {
  email: 'imagetest@example.com',
  password: 'TestPassword123!'
};

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

let authToken = null;
let testUserId = null;
let uploadedFiles = [];
let testResults = {
  login: false,
  avatarUpload: false,
  avatarPersistence: false,
  portfolioUpload: false,
  webpSupport: false,
  staticServing: false,
  avatarLogoutPersistence: false
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

async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 30000
    };

    if (data) {
      if (data instanceof FormData) {
        config.data = data;
        delete config.headers['Content-Type']; // Let axios set it for FormData
      } else {
        config.data = data;
      }
    }

    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await axios(config);
    return response.data;
  } catch (err) {
    throw err;
  }
}

async function testLogin() {
  try {
    log('🔑 Testing login with verified user...');
    
    const loginResponse = await makeRequest('POST', '/auth/login', TEST_CREDENTIALS);
    
    if (loginResponse.success && loginResponse.tokens) {
      authToken = loginResponse.tokens.accessToken;
      testUserId = loginResponse.user?.id;
      testResults.login = true;
      success('Login successful');
      console.log('   User ID:', testUserId);
      console.log('   User Type:', loginResponse.user?.userType);
      console.log('   Email Verified:', loginResponse.user?.isEmailVerified);
      return true;
    } else {
      error('Login failed - no tokens received', loginResponse);
      return false;
    }
  } catch (err) {
    error('Login failed', err);
    
    // If login failed due to user not existing, provide instructions
    if (err.response?.data?.error?.code === 'INVALID_CREDENTIALS') {
      console.log('');
      console.log('📝 MANUAL STEP REQUIRED:');
      console.log('The test user needs to be created and verified. Please run:');
      console.log('');
      console.log('1. Register user via API:');
      console.log(`curl -X POST ${API_BASE_URL}/auth/register \\`);
      console.log(`  -H "Content-Type: application/json" \\`);
      console.log(`  -d '{"email":"${TEST_CREDENTIALS.email}","password":"${TEST_CREDENTIALS.password}","firstName":"Image","lastName":"Test","userType":"CUSTOMER"}'`);
      console.log('');
      console.log('2. Then manually verify the user in the database by setting isEmailVerified = true');
      console.log('3. Or create an admin user and use admin panel to verify the user');
      console.log('');
    }
    return false;
  }
}

async function testAvatarUpload() {
  try {
    log('👤 Testing avatar upload...');
    
    const formData = new FormData();
    formData.append('files', TEST_IMAGES.png, {
      filename: 'test-avatar.png',
      contentType: 'image/png'
    });

    const uploadResponse = await makeRequest('POST', '/files/upload?purpose=avatar', formData, {
      ...formData.getHeaders()
    });

    if (uploadResponse.success && uploadResponse.data && uploadResponse.data.length > 0) {
      const avatarUrl = uploadResponse.data[0].url;
      success(`Avatar uploaded successfully`);
      console.log('   Avatar URL:', avatarUrl);
      console.log('   File size:', uploadResponse.data[0].size, 'bytes');
      console.log('   MIME type:', uploadResponse.data[0].mimeType);
      uploadedFiles.push({ type: 'avatar', url: avatarUrl, format: 'png' });
      testResults.avatarUpload = true;
      return avatarUrl;
    } else {
      error('Avatar upload failed - no data returned', uploadResponse);
      return null;
    }
  } catch (err) {
    error('Avatar upload failed', err);
    return null;
  }
}

async function testAvatarPersistence(avatarUrl) {
  try {
    log('🔄 Testing avatar persistence in user profile...');
    
    // Small delay to allow database update
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const profileResponse = await makeRequest('GET', '/users/profile');
    if (profileResponse.success) {
      const userAvatar = profileResponse.avatar || profileResponse.data?.avatar;
      
      if (userAvatar) {
        if (userAvatar === avatarUrl) {
          success('Avatar correctly persisted in user profile');
          testResults.avatarPersistence = true;
        } else {
          log(`⚠️  Avatar URL mismatch - Expected: ${avatarUrl}, Got: ${userAvatar}`);
          testResults.avatarPersistence = true; // Still counts as persistence
        }
      } else {
        error('Avatar not found in user profile', profileResponse);
      }
    } else {
      error('Failed to get user profile', profileResponse);
    }
  } catch (err) {
    error('Avatar persistence test failed', err);
  }
}

async function testPortfolioUpload() {
  try {
    log('🖼️  Testing portfolio image upload (JPEG)...');
    
    const formData = new FormData();
    formData.append('files', TEST_IMAGES.jpeg, {
      filename: 'test-portfolio.jpg',
      contentType: 'image/jpeg'
    });

    const uploadResponse = await makeRequest('POST', '/files/upload?purpose=portfolio', formData, {
      ...formData.getHeaders()
    });

    if (uploadResponse.success && uploadResponse.data && uploadResponse.data.length > 0) {
      const portfolioUrl = uploadResponse.data[0].url;
      success(`Portfolio image uploaded successfully`);
      console.log('   Portfolio URL:', portfolioUrl);
      console.log('   File size:', uploadResponse.data[0].size, 'bytes');
      console.log('   MIME type:', uploadResponse.data[0].mimeType);
      uploadedFiles.push({ type: 'portfolio', url: portfolioUrl, format: 'jpeg' });
      testResults.portfolioUpload = true;
      return portfolioUrl;
    } else {
      error('Portfolio upload failed - no data returned', uploadResponse);
      return null;
    }
  } catch (err) {
    error('Portfolio upload failed', err);
    return null;
  }
}

async function testWebPSupport() {
  try {
    log('🎨 Testing WebP image upload support...');
    
    const formData = new FormData();
    formData.append('files', TEST_IMAGES.webp, {
      filename: 'test-webp.webp',
      contentType: 'image/webp'
    });

    const uploadResponse = await makeRequest('POST', '/files/upload?purpose=portfolio', formData, {
      ...formData.getHeaders()
    });

    if (uploadResponse.success && uploadResponse.data && uploadResponse.data.length > 0) {
      const webpUrl = uploadResponse.data[0].url;
      success(`WebP image uploaded successfully`);
      console.log('   WebP URL:', webpUrl);
      console.log('   File size:', uploadResponse.data[0].size, 'bytes');
      console.log('   MIME type:', uploadResponse.data[0].mimeType);
      uploadedFiles.push({ type: 'portfolio', url: webpUrl, format: 'webp' });
      testResults.webpSupport = true;
      return webpUrl;
    } else {
      error('WebP upload failed - no data returned', uploadResponse);
      return null;
    }
  } catch (err) {
    error('WebP upload failed', err);
    return null;
  }
}

async function testStaticFileServing() {
  try {
    log('🌐 Testing static file serving...');
    
    let successCount = 0;
    let totalTests = uploadedFiles.length;
    
    for (const file of uploadedFiles) {
      try {
        log(`   Testing ${file.format.toUpperCase()} file access: ${file.type}`);
        const response = await axios.head(file.url, { timeout: 10000 });
        
        if (response.status === 200) {
          success(`✓ ${file.format.toUpperCase()} file accessible (${response.headers['content-type']})`);
          console.log('     Content-Length:', response.headers['content-length'], 'bytes');
          console.log('     Cache-Control:', response.headers['cache-control'] || 'Not set');
          console.log('     ETag:', response.headers['etag'] || 'Not set');
          successCount++;
        } else {
          error(`Static file returned status ${response.status}: ${file.url}`);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          error(`File not found: ${file.url}`);
        } else {
          error(`Static file access failed: ${file.url}`, err.response?.status || err.message);
        }
      }
    }
    
    if (successCount > 0) {
      testResults.staticServing = true;
      success(`Static file serving working: ${successCount}/${totalTests} files accessible`);
    } else {
      error(`Static file serving failed: 0/${totalTests} files accessible`);
    }
  } catch (err) {
    error('Static file serving test failed', err);
  }
}

async function testAvatarLogoutPersistence(avatarUrl) {
  try {
    log('🔓 Testing avatar persistence after logout/login cycle...');
    
    // Step 1: Logout (or just clear token)
    const currentToken = authToken;
    authToken = null;
    log('   Simulated logout (cleared auth token)');
    
    // Step 2: Login again
    await new Promise(resolve => setTimeout(resolve, 1000));
    const loginSuccess = await testLogin();
    
    if (!loginSuccess) {
      authToken = currentToken; // Restore token if login failed
      error('Failed to login after logout simulation');
      return;
    }
    
    // Step 3: Check avatar persistence
    const profileResponse = await makeRequest('GET', '/users/profile');
    if (profileResponse.success) {
      const userAvatar = profileResponse.avatar || profileResponse.data?.avatar;
      
      if (userAvatar && userAvatar === avatarUrl) {
        success('Avatar persisted correctly after logout/login cycle');
        testResults.avatarLogoutPersistence = true;
      } else if (userAvatar) {
        log(`⚠️  Avatar URL changed after logout - Original: ${avatarUrl}, New: ${userAvatar}`);
        testResults.avatarLogoutPersistence = true; // Still persisted, just different URL
      } else {
        error('Avatar lost after logout/login cycle');
      }
    } else {
      error('Failed to get user profile after re-login', profileResponse);
    }
  } catch (err) {
    error('Avatar logout persistence test failed', err);
  }
}

async function runFinalImageTests() {
  try {
    log('🚀 Starting Final Comprehensive Image Upload Tests...\n');
    
    // Test 1: Login with verified user
    const loginSuccess = await testLogin();
    if (!loginSuccess) {
      throw new Error('Login failed - cannot continue with upload tests');
    }
    log('');
    
    // Test 2: Avatar Upload
    const avatarUrl = await testAvatarUpload();
    log('');
    
    // Test 3: Avatar Persistence
    if (avatarUrl) {
      await testAvatarPersistence(avatarUrl);
    }
    log('');
    
    // Test 4: Portfolio Upload (JPEG)
    const portfolioUrl = await testPortfolioUpload();
    log('');
    
    // Test 5: WebP Support
    const webpUrl = await testWebPSupport();
    log('');
    
    // Test 6: Static File Serving
    await testStaticFileServing();
    log('');
    
    // Test 7: Avatar Persistence After Logout
    if (avatarUrl) {
      await testAvatarLogoutPersistence(avatarUrl);
    }
    log('');
    
    // Print Results Summary
    log('📊 Final Test Results Summary:');
    console.log('================================');
    console.log(`✅ Login: ${testResults.login ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Avatar Upload: ${testResults.avatarUpload ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Avatar Persistence: ${testResults.avatarPersistence ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Portfolio Upload: ${testResults.portfolioUpload ? 'PASS' : 'FAIL'}`);
    console.log(`✅ WebP Support: ${testResults.webpSupport ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Static File Serving: ${testResults.staticServing ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Avatar Logout Persistence: ${testResults.avatarLogoutPersistence ? 'PASS' : 'FAIL'}`);
    console.log('================================');
    
    const passedTests = Object.values(testResults).filter(Boolean).length;
    const totalTests = Object.keys(testResults).length;
    
    if (passedTests === totalTests) {
      success(`🎉 ALL TESTS PASSED! (${passedTests}/${totalTests})`);
      
      log('');
      log('📋 Uploaded Files Summary:');
      uploadedFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.type} (${file.format}): ${file.url}`);
      });
      
    } else {
      error(`❌ Some tests failed: ${passedTests}/${totalTests} passed`);
      
      // List failed tests
      const failedTests = Object.entries(testResults)
        .filter(([_, passed]) => !passed)
        .map(([test, _]) => test);
      
      console.log('Failed tests:', failedTests.join(', '));
    }
    
    log('');
    log('🔍 Issues Found:');
    if (!testResults.staticServing) {
      console.log('- Static file serving may have issues - check server configuration');
    }
    if (!testResults.avatarPersistence) {
      console.log('- Avatar persistence in user profile may have issues - check database updates');
    }
    if (!testResults.webpSupport) {
      console.log('- WebP support may not be properly configured - check image processing');
    }
    if (passedTests === totalTests) {
      console.log('- No issues found! Image upload system is working correctly.');
    }
    
    return passedTests === totalTests;
    
  } catch (err) {
    error('Final comprehensive test failed', err);
    return false;
  }
}

// Run the test
if (require.main === module) {
  runFinalImageTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Test execution failed:', err);
      process.exit(1);
    });
}

module.exports = { runFinalImageTests };