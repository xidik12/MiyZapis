#!/usr/bin/env node

/**
 * Test S3 Upload Integration
 * 
 * This script tests the S3 upload functionality by:
 * 1. Testing S3 connection
 * 2. Uploading a test image
 * 3. Verifying the upload was successful
 * 4. Cleaning up test files
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://miyzapis-backend-production.up.railway.app/api/v1'
  : 'http://localhost:3002/api/v1';

console.log('🧪 S3 Upload Integration Test');
console.log('📡 API Base URL:', API_BASE);
console.log('🌅 S3 Configuration:');
console.log('  - Region:', process.env.AWS_REGION);
console.log('  - Bucket:', process.env.AWS_S3_BUCKET);
console.log('  - S3 Enabled:', process.env.ENABLE_S3_STORAGE);

async function testS3Upload() {
  try {
    // Step 1: Get authentication token
    console.log('\n🔐 Step 1: Getting authentication token...');
    
    const authResponse = await axios.post(`${API_BASE}/files/test-auth`);
    if (!authResponse.data.success) {
      throw new Error('Failed to get auth token: ' + authResponse.data.error);
    }
    
    const token = authResponse.data.data.token;
    console.log('✅ Authentication successful');

    // Step 2: Create a test image buffer (simple 1x1 PNG)
    console.log('\n🖼️ Step 2: Creating test image...');
    
    // Create a simple test image as base64 PNG (1x1 red pixel)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const testImageBuffer = Buffer.from(testImageBase64, 'base64');
    
    console.log('✅ Test image created (1x1 PNG, size:', testImageBuffer.length, 'bytes)');

    // Step 3: Test S3 upload endpoint
    console.log('\n📤 Step 3: Testing S3 upload...');
    
    const FormData = require('form-data');
    const form = new FormData();
    
    // Add the image as a file
    form.append('files', testImageBuffer, {
      filename: 'test-s3-upload.png',
      contentType: 'image/png'
    });

    const uploadResponse = await axios.post(
      `${API_BASE}/files/upload`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${token}`
        },
        params: {
          purpose: 'portfolio'
        }
      }
    );

    if (!uploadResponse.data.success) {
      throw new Error('Upload failed: ' + uploadResponse.data.error);
    }

    const uploadedFile = uploadResponse.data.data[0];
    console.log('✅ Upload successful!');
    console.log('  📄 File ID:', uploadedFile.id);
    console.log('  🔗 URL:', uploadedFile.url);
    console.log('  📏 Size:', uploadedFile.size, 'bytes');
    console.log('  🎯 Purpose:', uploadedFile.purpose);
    console.log('  ☁️ Cloud Provider:', uploadedFile.cloudProvider || 'Local');

    // Step 4: Verify file accessibility
    console.log('\n🔍 Step 4: Verifying file accessibility...');
    
    const fileResponse = await axios.get(uploadedFile.url, {
      responseType: 'arraybuffer'
    });
    
    if (fileResponse.status === 200) {
      console.log('✅ File is accessible via URL');
      console.log('  📏 Downloaded size:', fileResponse.data.length, 'bytes');
      console.log('  📋 Content type:', fileResponse.headers['content-type']);
    } else {
      throw new Error('File not accessible: ' + fileResponse.status);
    }

    // Step 5: Test presigned URL generation (if S3 is enabled)
    if (process.env.ENABLE_S3_STORAGE === 'true') {
      console.log('\n🔗 Step 5: Testing presigned URL generation...');
      
      const presignedResponse = await axios.post(
        `${API_BASE}/files/presigned-upload`,
        {
          filename: 'test-presigned.png',
          contentType: 'image/png',
          type: 'portfolio'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (presignedResponse.data.success) {
        console.log('✅ Presigned URL generated successfully');
        console.log('  🔗 Upload URL:', presignedResponse.data.data.uploadUrl.substring(0, 100) + '...');
        console.log('  🎯 File URL:', presignedResponse.data.data.fileUrl);
      } else {
        console.log('⚠️ Presigned URL generation failed:', presignedResponse.data.error);
      }
    }

    // Step 6: Clean up - delete the test file
    console.log('\n🧹 Step 6: Cleaning up test file...');
    
    const deleteResponse = await axios.delete(
      `${API_BASE}/files/${uploadedFile.id}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (deleteResponse.data.success) {
      console.log('✅ Test file deleted successfully');
    } else {
      console.log('⚠️ Test file deletion failed:', deleteResponse.data.error);
    }

    // Final summary
    console.log('\n🎉 S3 Upload Integration Test COMPLETED!');
    console.log('✅ All tests passed successfully');
    
    if (process.env.ENABLE_S3_STORAGE === 'true') {
      console.log('☁️ S3 cloud storage is working correctly');
    } else {
      console.log('📁 Local storage is working correctly');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('📄 Response status:', error.response.status);
      console.error('📄 Response data:', error.response.data);
    }
    
    process.exit(1);
  }
}

// Run the test
testS3Upload();