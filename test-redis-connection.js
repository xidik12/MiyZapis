const redis = require('redis');

async function testRedisConnection() {
  console.log('Testing Redis connection...');
  
  // Use the public URL for external connections
  const client = redis.createClient({
    url: 'redis://default:OsMBFqxgAhFAKoBYNZDesdCxqmDdNlPO@shuttle.proxy.rlwy.net:14387'
  });

  try {
    // Connect to Redis
    await client.connect();
    console.log('✅ Connected to Redis successfully!');

    // Test basic operations
    await client.set('test:connection', 'Hello Redis!');
    const value = await client.get('test:connection');
    console.log('✅ Read/Write test passed:', value);

    // Test ping
    const pong = await client.ping();
    console.log('✅ Ping test passed:', pong);

    // Clean up test key
    await client.del('test:connection');
    console.log('✅ Cleanup completed');

    console.log('\n🎉 Redis is working perfectly!');
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await client.quit();
    console.log('Connection closed.');
  }
}

testRedisConnection();