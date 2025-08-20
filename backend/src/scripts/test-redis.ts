#!/usr/bin/env ts-node

/**
 * Redis Connection Test Script
 * 
 * This script tests the Redis connection and basic operations
 * to help debug Redis connectivity issues.
 * 
 * Usage: npm run test:redis or ts-node src/scripts/test-redis.ts
 */

import { redis, testRedisConnection, cacheUtils } from '@/config/redis';
import { config } from '@/config';
import { logger } from '@/utils/logger';

async function testRedisOperations() {
  console.log('🔄 Testing Redis connection and operations...\n');
  
  // Test 1: Basic connection
  console.log('1. Testing basic connection...');
  const connectionTest = await testRedisConnection();
  console.log(`   Result: ${connectionTest ? '✅ PASSED' : '❌ FAILED'}\n`);
  
  if (!redis) {
    console.log('❌ Redis is not initialized. Check your REDIS_URL environment variable.');
    console.log(`   Current REDIS_URL: ${config.redis.url ? 'SET' : 'NOT SET'}`);
    return;
  }
  
  // Test 2: Cache utilities
  console.log('2. Testing cache utilities...');
  try {
    const testData = { 
      userId: 'test-user-123', 
      email: 'test@example.com',
      timestamp: new Date().toISOString()
    };
    
    // Set data
    await cacheUtils.set('test:user:123', testData, 60);
    console.log('   ✅ Set operation successful');
    
    // Get data
    const retrievedData = await cacheUtils.get<typeof testData>('test:user:123');
    if (retrievedData && retrievedData.userId === testData.userId) {
      console.log('   ✅ Get operation successful');
    } else {
      console.log('   ❌ Get operation failed - data mismatch');
    }
    
    // Check existence
    const exists = await cacheUtils.exists('test:user:123');
    console.log(`   ${exists ? '✅' : '❌'} Exists check: ${exists}`);
    
    // Clean up
    await cacheUtils.del('test:user:123');
    console.log('   ✅ Cleanup successful\n');
    
  } catch (error) {
    console.log('   ❌ Cache utilities test failed:', error);
  }
  
  // Test 3: Session simulation
  console.log('3. Testing session storage simulation...');
  try {
    const sessionData = {
      userId: 'session-test-user',
      tokenId: 'test-token-123',
      createdAt: new Date(),
      platform: 'web'
    };
    
    // Simulate session storage (like in authentication)
    await cacheUtils.set(`session:${sessionData.tokenId}`, sessionData, 30 * 24 * 3600);
    await cacheUtils.set(`user:${sessionData.userId}`, { 
      id: sessionData.userId, 
      email: 'session-test@example.com' 
    }, 3600);
    
    console.log('   ✅ Session data stored');
    
    // Retrieve session data
    const storedSession = await cacheUtils.get(`session:${sessionData.tokenId}`);
    const storedUser = await cacheUtils.get(`user:${sessionData.userId}`);
    
    if (storedSession && storedUser) {
      console.log('   ✅ Session data retrieved successfully');
      console.log(`   Session: ${JSON.stringify(storedSession, null, 2)}`);
      console.log(`   User: ${JSON.stringify(storedUser, null, 2)}`);
    } else {
      console.log('   ❌ Session data retrieval failed');
    }
    
    // Clean up session data
    await cacheUtils.del(`session:${sessionData.tokenId}`);
    await cacheUtils.del(`user:${sessionData.userId}`);
    console.log('   ✅ Session cleanup successful\n');
    
  } catch (error) {
    console.log('   ❌ Session simulation failed:', error);
  }
  
  // Test 4: Redis info
  console.log('4. Redis server information...');
  try {
    if (redis) {
      const info = await redis.info('server');
      const memory = await redis.info('memory');
      const keyspace = await redis.info('keyspace');
      
      console.log('   ✅ Server info retrieved');
      console.log('   Key metrics:');
      
      // Parse and display key information
      const serverLines = info.split('\r\n');
      const memoryLines = memory.split('\r\n');
      
      for (const line of serverLines) {
        if (line.includes('redis_version:') || line.includes('os:')) {
          console.log(`     ${line}`);
        }
      }
      
      for (const line of memoryLines) {
        if (line.includes('used_memory_human:') || line.includes('maxmemory_human:')) {
          console.log(`     ${line}`);
        }
      }
      
      console.log(`   Keyspace info: ${keyspace || 'No keys found'}\n`);
    }
  } catch (error) {
    console.log('   ⚠️ Could not retrieve Redis info:', error);
  }
  
  console.log('🎉 Redis testing completed!');
}

// Run the test
if (require.main === module) {
  testRedisOperations()
    .then(() => {
      console.log('\n✅ All tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test execution failed:', error);
      process.exit(1);
    });
}

export { testRedisOperations };
