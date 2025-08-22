#!/usr/bin/env node

/**
 * Simple Redis connection test for Railway
 * Run with: node test-redis-railway.js
 * Or deploy and check logs
 */

console.log('🚀 Redis Test Script Starting...');
console.log('📋 Environment Check:');
console.log('   NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('   REDIS_URL provided:', !!process.env.REDIS_URL);
console.log('   REDIS_PRIVATE_URL provided:', !!process.env.REDIS_PRIVATE_URL);

const Redis = require('ioredis');

async function testRedis() {
  console.log('🔍 Testing Redis connection on Railway...');
  
  const redisUrl = process.env.REDIS_URL || process.env.REDIS_PRIVATE_URL;
  
  if (!redisUrl) {
    console.error('❌ No REDIS_URL or REDIS_PRIVATE_URL environment variable found');
    console.log('   Make sure you have created a Redis service in Railway');
    process.exit(1);
  }
  
  console.log('🔗 Connecting to Redis...');
  console.log('   URL:', redisUrl.replace(/\/\/.*@/, '//***:***@'));
  
  const redis = new Redis(redisUrl, {
    connectTimeout: 10000,
    commandTimeout: 5000,
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    family: 4,
  });
  
  try {
    // Test connection
    console.log('📡 Pinging Redis...');
    const pong = await redis.ping();
    console.log('✅ Ping result:', pong);
    
    // Test basic operations
    console.log('💾 Testing Redis operations...');
    const testKey = `test:${Date.now()}`;
    
    await redis.set(testKey, 'Hello Railway Redis!', 'EX', 60);
    console.log('✅ Set operation successful');
    
    const value = await redis.get(testKey);
    console.log('✅ Get operation successful:', value);
    
    await redis.del(testKey);
    console.log('✅ Delete operation successful');
    
    // Test pub/sub (important for real-time features)
    console.log('📢 Testing pub/sub...');
    const publisher = redis.duplicate();
    const subscriber = redis.duplicate();
    
    subscriber.on('message', (channel, message) => {
      console.log('✅ Received message:', { channel, message });
      publisher.disconnect();
      subscriber.disconnect();
      redis.disconnect();
      console.log('🎉 All Redis tests passed! Ready for production.');
    });
    
    await subscriber.subscribe('test-channel');
    await publisher.publish('test-channel', 'Hello from Railway!');
    
  } catch (error) {
    console.error('❌ Redis test failed:', error.message);
    redis.disconnect();
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⏹️  Test interrupted');
  process.exit(0);
});

// Run the test
testRedis().catch(console.error);