const { chromium } = require('playwright');

async function verifyUI() {
  console.log('🚀 Starting UI verification...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Check if localhost:3000 is running
    console.log('📡 Connecting to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 10000 });
    console.log('✅ Connected to development server\n');

    // Take screenshot of homepage
    await page.screenshot({ path: 'screenshot-homepage.png', fullPage: true });
    console.log('📸 Screenshot saved: screenshot-homepage.png');

    // Check for new UI components in the DOM
    const checks = {
      'NotificationDropdownV2': await page.locator('[class*="NotificationDropdown"]').count() > 0,
      'Message bubbles': await page.locator('[class*="rounded-2xl"][class*="shadow"]').count() > 0,
      'Motion animations': await page.locator('[style*="transform"]').count() > 0,
      'Dark mode support': await page.locator('[class*="dark:"]').count() > 0,
    };

    console.log('\n🔍 Component Detection:');
    for (const [component, found] of Object.entries(checks)) {
      console.log(`  ${found ? '✅' : '❌'} ${component}: ${found ? 'Found' : 'Not found'}`);
    }

    // Check if service worker is registered
    const hasServiceWorker = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    console.log(`\n🔧 Service Worker: ${hasServiceWorker ? 'Supported' : 'Not supported'}`);

    // Get all registered service workers
    const swCount = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        return registrations.length;
      }
      return 0;
    });
    console.log(`   Active registrations: ${swCount}`);

    if (swCount > 0) {
      console.log('\n⚠️  SERVICE WORKER DETECTED - This may be caching old UI!');
      console.log('   Recommendation: Clear service workers in DevTools');
    }

    console.log('\n✨ Verification complete! Check screenshot-homepage.png for visual confirmation.');

  } catch (error) {
    if (error.message.includes('ERR_CONNECTION_REFUSED')) {
      console.log('❌ Development server not running on localhost:5173');
      console.log('   Please start the dev server with: npm run dev');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await browser.close();
  }
}

verifyUI();
