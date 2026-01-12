const { chromium } = require('playwright');

async function checkUI() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  try {
    console.log('Opening localhost:3000...\n');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Take homepage screenshot
    await page.screenshot({ path: 'screenshot-home.png', fullPage: false });
    console.log('✅ Homepage screenshot saved');

    // Check page source for our new components
    const html = await page.content();

    console.log('\n🔍 Checking for new UI components in HTML:');
    console.log(`  NotificationDropdownV2: ${html.includes('NotificationDropdownV2') || html.includes('NotificationGroup') ? '✅' : '❌'}`);
    console.log(`  MessageInterface: ${html.includes('MessageInterface') || html.includes('MessageBubble') ? '✅' : '❌'}`);
    console.log(`  ReviewFeed: ${html.includes('ReviewFeed') || html.includes('ReviewCard') ? '✅' : '❌'}`);
    console.log(`  Framer Motion animations: ${html.includes('framer-motion') || html.includes('motion.div') ? '✅' : '❌'}`);
    console.log(`  Dark mode classes: ${html.includes('dark:') ? '✅' : '❌'}`);

    // Check for specific UI elements
    console.log('\n🎨 Visual Elements:');
    const elements = {
      'Rounded elements (rounded-2xl, rounded-xl)': html.match(/rounded-2xl|rounded-xl/g)?.length || 0,
      'Shadow effects': html.match(/shadow-md|shadow-lg|shadow-xl/g)?.length || 0,
      'Gradient backgrounds': html.match(/bg-gradient/g)?.length || 0,
      'Animation classes': html.match(/animate-|transition-/g)?.length || 0,
      'Primary color variants': html.match(/primary-\d{3}/g)?.length || 0
    };

    for (const [name, count] of Object.entries(elements)) {
      console.log(`  ${name}: ${count > 0 ? `✅ ${count} found` : '❌ none'}`);
    }

    // Try to navigate and check if we can see the navigation
    console.log('\n📱 Checking navigation...');
    const navLinks = await page.$$('nav a, [role="navigation"] a');
    console.log(`  Navigation links found: ${navLinks.length}`);

    // Keep browser open for 10 seconds so you can see it
    console.log('\n👀 Browser will stay open for 10 seconds for you to inspect...');
    await page.waitForTimeout(10000);

    console.log('\n✅ Check complete! Screenshot saved as screenshot-home.png');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

checkUI();
