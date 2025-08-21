#!/usr/bin/env node

// Simple Redis connection test script for Railway deployment
const Redis = require('ioredis');

async function testRedisConnection() {
  console.log('🔍 Testing Redis connection...');
  
  const redisUrl = process.env.REDIS_URL;
  const redisPassword = process.env.REDIS_PASSWORD;
  
  console.log('Environment variables:');
  console.log('- REDIS_URL:', redisUrl ? redisUrl.replace(/\/\/.*@/, '//***:***@') : 'NOT SET');
  console.log('- REDIS_PASSWORD:', redisPassword ? '***' : 'NOT SET');
  
  if (!redisUrl) {
    console.error('❌ REDIS_URL environment variable is not set');
    process.exit(1);
  }
  
  let redis;
  try {
    console.log('\n📡 Connecting to Redis...');
    redis = new Redis(redisUrl, {
      password: redisPassword,
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      commandTimeout: 5000,
      enableReadyCheck: true,
      lazyConnect: true,
      family: 4, // Force IPv4
    });
    
    // Test connection
    console.log('🏓 Testing ping...');
    const pingResult = await redis.ping();
    console.log('✅ Ping result:', pingResult);
    
    // Test write operation
    console.log('✍️ Testing write operation...');
    await redis.set('test:connection', 'Hello Redis!', 'EX', 30);
    console.log('✅ Write successful');
    
    // Test read operation
    console.log('📖 Testing read operation...');
    const value = await redis.get('test:connection');
    console.log('✅ Read result:', value);
    
    // Test delete operation
    console.log('🗑️ Testing delete operation...');
    await redis.del('test:connection');
    console.log('✅ Delete successful');
    
    // Get Redis info
    console.log('\n📊 Redis server info:');
    const info = await redis.info('server');
    const lines = info.split('\r\n').filter(line => line && !line.startsWith('#'));
    lines.slice(0, 5).forEach(line => console.log('-', line));
    
    console.log('\n🎉 All Redis tests passed successfully!');
    console.log('✅ Redis is connected and working properly');
    
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    if (redis) {
      await redis.quit();
      console.log('👋 Redis connection closed');
    }
  }
}

// Run the test
testRedisConnection().catch(console.error);
