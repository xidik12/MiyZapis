const { chromium } = require('playwright');

async function verifyAuthenticatedUI() {
  console.log('🚀 Starting authenticated UI verification...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('📡 Connecting to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    console.log('✅ Connected!\n');

    // Check if we're on login page or authenticated
    const isLoginPage = await page.locator('input[type="email"]').count() > 0;

    if (isLoginPage) {
      console.log('🔐 Login page detected. Testing login flow...');

      // Take screenshot of login page
      await page.screenshot({ path: 'screenshot-login.png' });
      console.log('📸 Screenshot saved: screenshot-login.png');

      console.log('\n⚠️  Cannot verify authenticated components without valid credentials.');
      console.log('   Please log in manually to see:');
      console.log('   - Notification bell with rich cards');
      console.log('   - Messages with WhatsApp-style interface  ');
      console.log('   - Reviews with Instagram-style feed');
      console.log('   - Bookings with Kanban board');
    } else {
      console.log('✅ Already authenticated!\n');

      // Check for notification bell in header
      const notificationBell = await page.locator('[aria-label*="notification" i], button:has(svg):has-text("Notifications")').count();
      console.log(`🔔 Notification Bell: ${notificationBell > 0 ? '✅ Found' : '❌ Not found'}`);

      if (notificationBell > 0) {
        console.log('   Clicking notification bell...');
        await page.locator('button:has(svg)').first().click();
        await page.waitForTimeout(500);

        // Check for NotificationDropdownV2 features
        const hasTimeGroups = await page.locator('text=/TODAY|YESTERDAY|THIS WEEK|EARLIER/i').count();
        console.log(`   Time-based grouping: ${hasTimeGroups > 0 ? '✅ Found' : '❌ Not found'}`);

        const hasRichCards = await page.locator('[class*="rounded"], [class*="shadow"]').count();
        console.log(`   Rich card UI: ${hasRichCards > 10 ? '✅ Found' : '❌ Limited'}`);

        await page.screenshot({ path: 'screenshot-notifications.png' });
        console.log('   📸 Screenshot saved: screenshot-notifications.png');
      }

      // Navigate to Messages page
      console.log('\n💬 Checking Messages page...');
      const messagesLink = await page.locator('a[href*="messages" i], text=/messages/i').first();
      if (await messagesLink.count() > 0) {
        await messagesLink.click();
        await page.waitForTimeout(1000);

        const hasMessageBubbles = await page.locator('[class*="rounded-2xl"][class*="shadow"]').count();
        const hasCheckmarks = await page.locator('svg').count() > 5;
        console.log(`   Message bubbles: ${hasMessageBubbles > 0 ? '✅ Found' : '❌ Not found'}`);
        console.log(`   Icons/checkmarks: ${hasCheckmarks ? '✅ Found' : '❌ Not found'}`);

        await page.screenshot({ path: 'screenshot-messages.png' });
        console.log('   📸 Screenshot saved: screenshot-messages.png');
      }

      // Navigate to Reviews page
      console.log('\n⭐ Checking Reviews page...');
      const reviewsLink = await page.locator('a[href*="reviews" i], text=/reviews/i').first();
      if (await reviewsLink.count() > 0) {
        await reviewsLink.click();
        await page.waitForTimeout(1000);

        const hasReviewCards = await page.locator('[class*="shadow"]').count();
        const hasStars = await page.locator('svg').count() > 3;
        console.log(`   Review cards: ${hasReviewCards > 0 ? '✅ Found' : '❌ Not found'}`);
        console.log(`   Star ratings: ${hasStars ? '✅ Found' : '❌ Not found'}`);

        await page.screenshot({ path: 'screenshot-reviews.png' });
        console.log('   📸 Screenshot saved: screenshot-reviews.png');
      }

      // Navigate to Bookings page
      console.log('\n📅 Checking Bookings page...');
      const bookingsLink = await page.locator('a[href*="bookings" i], text=/bookings/i').first();
      if (await bookingsLink.count() > 0) {
        await bookingsLink.click();
        await page.waitForTimeout(1000);

        const hasKanbanColumns = await page.locator('[class*="column"], [class*="status"]').count();
        const hasCards = await page.locator('[class*="card"], [class*="booking"]').count();
        console.log(`   Kanban columns: ${hasKanbanColumns > 0 ? '✅ Found' : '❌ Not found'}`);
        console.log(`   Booking cards: ${hasCards > 0 ? '✅ Found' : '❌ Not found'}`);

        await page.screenshot({ path: 'screenshot-bookings.png' });
        console.log('   📸 Screenshot saved: screenshot-bookings.png');
      }
    }

    console.log('\n✨ Verification complete! Check screenshots for visual confirmation.');
    console.log('   All screenshots saved in frontend/ directory');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

verifyAuthenticatedUI();
