#!/usr/bin/env node

/**
 * Standalone S3 Connection Test
 * 
 * This script tests S3 connectivity without requiring database or authentication
 */

require('dotenv').config();

// Manually import the S3 SDK since our backend might have compilation issues
async function testS3Standalone() {
  console.log('🧪 Standalone S3 Connection Test');
  console.log('🌅 S3 Configuration:');
  console.log('  - Region:', process.env.AWS_REGION);
  console.log('  - Bucket:', process.env.AWS_S3_BUCKET);
  console.log('  - Access Key ID:', process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not Set');
  console.log('  - Secret Key:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not Set');

  try {
    // Dynamically import S3 client
    const { S3Client, PutObjectCommand, DeleteObjectCommand } = await import('@aws-sdk/client-s3');

    console.log('\n📡 Step 1: Creating S3 client...');
    
    const s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    console.log('✅ S3 client created successfully');

    // Step 2: Test upload
    console.log('\n📤 Step 2: Testing S3 upload...');
    
    const testKey = `test/standalone-test-${Date.now()}.txt`;
    const testContent = 'Hello from S3 standalone test!';
    
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain'
      // ACL: 'public-read' // Removed - using bucket policy instead
    });

    await s3Client.send(uploadCommand);
    console.log('✅ Upload successful!');
    console.log('  🔑 Key:', testKey);
    console.log('  🌐 URL:', `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${testKey}`);

    // Step 3: Test file accessibility
    console.log('\n🔍 Step 3: Testing file accessibility...');
    
    const testUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${testKey}`;
    
    const axios = require('axios');
    const response = await axios.get(testUrl);
    
    if (response.status === 200) {
      console.log('✅ File is accessible via public URL');
      console.log('  📄 Content:', response.data);
    }

    // Step 4: Clean up
    console.log('\n🧹 Step 4: Cleaning up test file...');
    
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: testKey
    });

    await s3Client.send(deleteCommand);
    console.log('✅ Test file deleted successfully');

    console.log('\n🎉 S3 STANDALONE TEST PASSED!');
    console.log('☁️ S3 cloud storage is configured correctly and ready to use');

  } catch (error) {
    console.error('\n❌ S3 test failed:', error.message);
    
    if (error.name === 'CredentialsProviderError') {
      console.error('🔐 Issue: Invalid AWS credentials');
      console.error('💡 Solution: Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
    } else if (error.name === 'NoSuchBucket') {
      console.error('🪣 Issue: S3 bucket does not exist');
      console.error('💡 Solution: Create bucket or check AWS_S3_BUCKET name');
    } else if (error.name === 'AccessDenied') {
      console.error('🚫 Issue: Access denied to S3 bucket');
      console.error('💡 Solution: Check bucket permissions and IAM user policies');
    }
    
    process.exit(1);
  }
}

testS3Standalone();