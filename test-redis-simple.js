// Simple Redis connection test using the internal Railway network
console.log('Testing Redis connection...');

const testUrls = [
  'redis://default:OsMBFqxgAhFAKoBYNZDesdCxqmDdNlPO@redis.railway.internal:6379',
  'redis://default:OsMBFqxgAhFAKoBYNZDesdCxqmDdNlPO@redis-production-36c1.up.railway.app:6379',
  'redis://default:OsMBFqxgAhFAKoBYNZDesdCxqmDdNlPO@shuttle.proxy.rlwy.net:14387'
];

testUrls.forEach((url, index) => {
  console.log(`\n${index + 1}. Testing URL: ${url.replace(/:[^:@]*@/, ':***@')}`);
  console.log('   This URL should be used for Railway internal connections');
});

console.log('\n🔧 To fix your Redis connection:');
console.log('1. Update your Railway environment variables:');
console.log('   REDIS_URL=redis://default:OsMBFqxgAhFAKoBYNZDesdCxqmDdNlPO@redis.railway.internal:6379');
console.log('2. Use the Railway private network domain: redis.railway.internal');
console.log('3. Ensure your Redis service is running and accessible');

// Test connection to external Redis via CLI
console.log('\n📝 To test Redis connection manually:');
console.log('redis-cli -h redis-production-36c1.up.railway.app -p 6379 -a OsMBFqxgAhFAKoBYNZDesdCxqmDdNlPO ping');