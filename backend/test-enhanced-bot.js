const { enhancedTelegramBot } = require('./dist/services/telegram/enhanced-bot');

console.log('Testing Enhanced Telegram Bot integration...');

try {
  console.log('✅ Enhanced bot imported successfully');
  
  // Check if bot has required methods
  const requiredMethods = ['initialize', 'launch', 'stop', 'getBot', 'sendNotification', 'broadcastMessage'];
  
  for (const method of requiredMethods) {
    if (typeof enhancedTelegramBot[method] === 'function') {
      console.log(`✅ Method ${method} exists`);
    } else {
      console.log(`❌ Method ${method} missing`);
    }
  }
  
  console.log('\n🎉 Enhanced Telegram Bot integration test completed!');
  console.log('\nNext steps:');
  console.log('1. Set TELEGRAM_BOT_TOKEN environment variable');
  console.log('2. Start the server with npm run dev');
  console.log('3. Test bot functionality via /api/v1/telegram/test-enhanced');
  
} catch (error) {
  console.error('❌ Error testing enhanced bot:', error.message);
  process.exit(1);
}