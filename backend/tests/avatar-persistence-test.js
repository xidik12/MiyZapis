#!/usr/bin/env node

/**
 * Avatar Persistence Test Script
 * 
 * This script tests the avatar upload and persistence functionality
 * to ensure avatars are properly stored and retrieved after login/logout cycles.
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
const TEST_EMAIL = 'avatar-test@example.com';
const TEST_PASSWORD = 'TestPassword123!';
const TEST_USER_DATA = {
  email: TEST_EMAIL,
  password: TEST_PASSWORD,
  firstName: 'Avatar',
  lastName: 'Test',
  userType: 'CUSTOMER'
};

// Create a test image buffer (1x1 pixel PNG)
const TEST_IMAGE_BUFFER = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
  0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
  0x01, 0x00, 0x01, 0x1A, 0x25, 0xBC, 0x10, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
]);

let authTokens = null;
let testUserId = null;

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
      }
    };

    if (data) {
      if (data instanceof FormData) {
        config.data = data;
        delete config.headers['Content-Type']; // Let axios set it for FormData
      } else {
        config.data = data;
      }
    }

    if (authTokens?.accessToken) {
      config.headers.Authorization = `Bearer ${authTokens.accessToken}`;
    }

    const response = await axios(config);
    return response.data;
  } catch (err) {
    throw err;
  }
}

async function registerOrLoginUser() {
  try {
    log('Attempting to register test user...');
    const registerResponse = await makeRequest('POST', '/auth/register', TEST_USER_DATA);
    
    if (registerResponse.success) {
      success('User registered successfully');
      authTokens = registerResponse.tokens;
      testUserId = registerResponse.user.id;
      return registerResponse.user;
    }
  } catch (err) {
    if (err.response?.status === 409 || err.response?.data?.error?.message?.includes('already exists')) {
      log('User already exists, attempting login...');
      try {
        const loginResponse = await makeRequest('POST', '/auth/login', {
          email: TEST_EMAIL,
          password: TEST_PASSWORD
        });
        
        if (loginResponse.success) {
          success('User logged in successfully');
          authTokens = loginResponse.tokens;
          testUserId = loginResponse.user.id;
          return loginResponse.user;
        }
      } catch (loginErr) {
        error('Failed to login existing user', loginErr);
        throw loginErr;
      }
    } else {
      error('Failed to register user', err);
      throw err;
    }
  }
}

async function uploadAvatar() {
  try {
    log('Uploading avatar...');
    
    const formData = new FormData();
    formData.append('files', TEST_IMAGE_BUFFER, {
      filename: 'test-avatar.png',
      contentType: 'image/png'
    });

    const uploadResponse = await makeRequest('POST', '/files/upload?purpose=avatar', formData, {
      ...formData.getHeaders()
    });

    if (uploadResponse.success && uploadResponse.data && uploadResponse.data.length > 0) {
      const avatarUrl = uploadResponse.data[0].url || uploadResponse.data[0].path;
      success(`Avatar uploaded successfully: ${avatarUrl}`);
      return avatarUrl;
    } else {
      throw new Error('Upload response missing data');
    }
  } catch (err) {
    error('Failed to upload avatar', err);
    throw err;
  }
}

async function getCurrentUser() {
  try {
    log('Getting current user profile...');
    const response = await makeRequest('GET', '/users/profile');
    
    if (response.success) {
      success('Retrieved user profile successfully');
      return response;
    } else {
      throw new Error('Failed to get user profile');
    }
  } catch (err) {
    error('Failed to get current user', err);
    throw err;
  }
}

async function simulateLogout() {
  try {
    log('Simulating logout...');
    const refreshToken = authTokens?.refreshToken;
    
    if (refreshToken) {
      await makeRequest('POST', '/auth/logout', { refreshToken });
    }
    
    authTokens = null;
    success('Logged out successfully');
  } catch (err) {
    log('Logout request failed, but continuing test...');
    authTokens = null;
  }
}

async function loginAgain() {
  try {
    log('Logging in again...');
    const loginResponse = await makeRequest('POST', '/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (loginResponse.success) {
      authTokens = loginResponse.tokens;
      success('Logged in successfully');
      return loginResponse.user;
    } else {
      throw new Error('Login failed');
    }
  } catch (err) {
    error('Failed to login again', err);
    throw err;
  }
}

async function runAvatarPersistenceTest() {
  try {
    log('🚀 Starting Avatar Persistence Test...\n');

    // Step 1: Register/Login user
    log('Step 1: Register/Login user');
    const initialUser = await registerOrLoginUser();
    log(`Initial user avatar: ${initialUser.avatar || 'none'}\n`);

    // Step 2: Upload avatar
    log('Step 2: Upload avatar');
    const uploadedAvatarUrl = await uploadAvatar();
    log('');

    // Step 3: Get user profile after upload
    log('Step 3: Get user profile after upload');
    const userAfterUpload = await getCurrentUser();
    const avatarAfterUpload = userAfterUpload.avatar;
    log(`Avatar after upload: ${avatarAfterUpload}\n`);

    // Verify avatar was set
    if (!avatarAfterUpload) {
      throw new Error('Avatar was not set in user profile after upload');
    }

    if (avatarAfterUpload !== uploadedAvatarUrl) {
      log(`⚠️  WARNING: Avatar URL mismatch - Uploaded: ${uploadedAvatarUrl}, Profile: ${avatarAfterUpload}`);
    } else {
      success('Avatar URL matches uploaded URL');
    }

    // Step 4: Simulate logout
    log('Step 4: Simulate logout');
    await simulateLogout();
    log('');

    // Step 5: Login again
    log('Step 5: Login again');
    const userAfterRelogin = await loginAgain();
    const avatarAfterRelogin = userAfterRelogin.avatar;
    log(`Avatar after re-login: ${avatarAfterRelogin}\n`);

    // Step 6: Verify avatar persistence
    log('Step 6: Verify avatar persistence');
    if (!avatarAfterRelogin) {
      throw new Error('❌ AVATAR PERSISTENCE FAILED: Avatar is missing after re-login');
    }

    if (avatarAfterRelogin !== avatarAfterUpload) {
      throw new Error(`❌ AVATAR PERSISTENCE FAILED: Avatar URLs don't match - Before: ${avatarAfterUpload}, After: ${avatarAfterRelogin}`);
    }

    success('🎉 AVATAR PERSISTENCE TEST PASSED: Avatar is correctly maintained across login/logout cycles');
    
    // Step 7: Final verification by getting profile again
    log('\nStep 7: Final verification');
    const finalProfile = await getCurrentUser();
    const finalAvatar = finalProfile.avatar;
    
    if (finalAvatar === avatarAfterRelogin) {
      success('✅ Final verification passed: Avatar URL is consistent');
    } else {
      throw new Error(`❌ Final verification failed: Avatar inconsistency - Expected: ${avatarAfterRelogin}, Got: ${finalAvatar}`);
    }

    log('\n🏆 ALL TESTS PASSED: Avatar persistence is working correctly!');
    
  } catch (err) {
    error('Test failed', err);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  runAvatarPersistenceTest();
}

module.exports = { runAvatarPersistenceTest };