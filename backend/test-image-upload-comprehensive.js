#!/usr/bin/env node

/**
 * Comprehensive Image Upload Test Script
 * 
 * Tests avatar persistence and portfolio image upload functionality
 * including WebP support and static file serving
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = process.env.API_URL || 'https://miyzapis-backend-production.up.railway.app/api/v1';
const TEST_EMAIL = 'imagetest-' + Date.now() + '@example.com';
const TEST_PASSWORD = 'TestPassword123!';

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
let testResults = {
  registration: false,
  login: false,
  avatarUpload: false,
  avatarPersistence: false,
  portfolioUpload: false,
  webpSupport: false,
  staticServing: false
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

async function testRegistration() {
  try {
    log('🔐 Testing user registration...');
    
    const registerResponse = await makeRequest('POST', '/auth/register', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      firstName: 'Image',
      lastName: 'Test',
      userType: 'CUSTOMER'
    });
    
    if (registerResponse.success) {
      success('User registration successful');
      testUserId = registerResponse.data?.user?.id;
      testResults.registration = true;
      
      // Check if verification is required
      if (registerResponse.data?.requiresVerification) {
        log('⚠️  Email verification required - attempting direct login bypass...');
        
        // Try to login anyway (some systems allow unverified login)
        return await testLogin();
      } else if (registerResponse.tokens) {
        authToken = registerResponse.tokens.accessToken;
        testResults.login = true;
        success('Authentication tokens received');
        return true;
      }
    }
    return false;
  } catch (err) {
    error('Registration failed', err);
    return false;
  }
}

async function testLogin() {
  try {
    log('🔑 Testing user login...');
    
    const loginResponse = await makeRequest('POST', '/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (loginResponse.success && loginResponse.tokens) {
      authToken = loginResponse.tokens.accessToken;
      testUserId = loginResponse.user?.id;
      testResults.login = true;
      success('Login successful');
      return true;
    } else {
      error('Login failed - no tokens received', loginResponse);
      return false;
    }
  } catch (err) {
    error('Login failed', err);
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
      success(`Avatar uploaded successfully: ${avatarUrl}`);
      testResults.avatarUpload = true;
      
      // Test avatar persistence by getting user profile
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait a bit
      
      const profileResponse = await makeRequest('GET', '/users/profile');
      if (profileResponse.success && profileResponse.avatar) {
        success('Avatar persisted in user profile');
        testResults.avatarPersistence = true;
      } else {
        error('Avatar not found in user profile', profileResponse);
      }
      
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

async function testPortfolioUpload() {
  try {
    log('🖼️  Testing portfolio image upload...');
    
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
      success(`Portfolio image uploaded successfully: ${portfolioUrl}`);
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
      success(`WebP image uploaded successfully: ${webpUrl}`);
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

async function testStaticFileServing(imageUrls) {
  try {
    log('🌐 Testing static file serving...');
    
    let successCount = 0;
    let totalTests = 0;
    
    for (const imageUrl of imageUrls.filter(Boolean)) {
      totalTests++;
      try {
        const response = await axios.head(imageUrl, { timeout: 10000 });
        if (response.status === 200) {
          success(`Static file accessible: ${imageUrl} (${response.headers['content-type']})`);
          successCount++;
        } else {
          error(`Static file returned status ${response.status}: ${imageUrl}`);
        }
      } catch (err) {
        error(`Static file access failed: ${imageUrl}`, err);
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

async function runComprehensiveImageTests() {
  try {
    log('🚀 Starting Comprehensive Image Upload Tests...\n');
    
    // Test 1: Registration
    const registrationSuccess = await testRegistration();
    if (!registrationSuccess) {
      // Try with existing user
      log('Registration failed, trying with existing user...');
      const loginSuccess = await testLogin();
      if (!loginSuccess) {
        throw new Error('Both registration and login failed');
      }
    }
    
    log('');
    
    // Test 2: Avatar Upload & Persistence
    const avatarUrl = await testAvatarUpload();
    log('');
    
    // Test 3: Portfolio Upload
    const portfolioUrl = await testPortfolioUpload();
    log('');
    
    // Test 4: WebP Support
    const webpUrl = await testWebPSupport();
    log('');
    
    // Test 5: Static File Serving
    await testStaticFileServing([avatarUrl, portfolioUrl, webpUrl]);
    log('');
    
    // Print Results
    log('📊 Test Results Summary:');
    console.log('========================');
    console.log(`✅ Registration: ${testResults.registration ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Login: ${testResults.login ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Avatar Upload: ${testResults.avatarUpload ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Avatar Persistence: ${testResults.avatarPersistence ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Portfolio Upload: ${testResults.portfolioUpload ? 'PASS' : 'FAIL'}`);
    console.log(`✅ WebP Support: ${testResults.webpSupport ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Static File Serving: ${testResults.staticServing ? 'PASS' : 'FAIL'}`);
    console.log('========================');
    
    const passedTests = Object.values(testResults).filter(Boolean).length;
    const totalTests = Object.keys(testResults).length;
    
    if (passedTests === totalTests) {
      success(`🎉 ALL TESTS PASSED! (${passedTests}/${totalTests})`);
    } else {
      error(`❌ Some tests failed: ${passedTests}/${totalTests} passed`);
      
      // List failed tests
      const failedTests = Object.entries(testResults)
        .filter(([_, passed]) => !passed)
        .map(([test, _]) => test);
      
      console.log('Failed tests:', failedTests.join(', '));
    }
    
    return passedTests === totalTests;
    
  } catch (err) {
    error('Comprehensive test failed', err);
    return false;
  }
}

// Run the test
if (require.main === module) {
  runComprehensiveImageTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Test execution failed:', err);
      process.exit(1);
    });
}

module.exports = { runComprehensiveImageTests };