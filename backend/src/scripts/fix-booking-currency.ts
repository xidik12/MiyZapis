import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

/**
 * Script to fix historical booking currency data inconsistencies
 * 
 * Issue: Some bookings have incorrect totalAmount due to currency conversion
 * being applied during booking creation instead of just using the service's basePrice.
 * 
 * This script identifies and fixes bookings where:
 * - The booking's totalAmount doesn't match the service's basePrice
 * - The totalAmount appears to be a currency-converted value
 */
async function fixBookingCurrencyData() {
  try {
    logger.info('Starting booking currency data migration...');

    // Find all bookings with their services
    const problematicBookings = await prisma.booking.findMany({
      include: {
        service: true,
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Filter bookings where totalAmount doesn't match service basePrice
    const bookingsWithIssues = problematicBookings.filter(booking => 
      booking.totalAmount !== booking.service.basePrice
    );

    logger.info(`Found ${bookingsWithIssues.length} bookings with amount mismatches out of ${problematicBookings.length} total bookings`);

    const fixes = [];

    for (const booking of bookingsWithIssues) {
      const service = booking.service;
      const currentTotal = booking.totalAmount;
      const servicePrice = service.basePrice;
      const serviceCurrency = service.currency;

      // Detect if this looks like a currency conversion issue
      let shouldFix = false;
      let reason = '';

      // Check if the booking amount is approximately the service price converted to another currency
      const usdToUahRate = 37;
      const convertedToUSD = Math.round(servicePrice / usdToUahRate * 100) / 100;
      const convertedToUAH = Math.round(servicePrice * usdToUahRate * 100) / 100;

      if (serviceCurrency === 'UAH') {
        // Service is in UAH, check if booking amount is converted to USD
        if (Math.abs(currentTotal - convertedToUSD) < 1) {
          shouldFix = true;
          reason = `UAH service price ${servicePrice} was incorrectly converted to ${currentTotal} (should be ${servicePrice} UAH)`;
        }
      } else if (serviceCurrency === 'USD') {
        // Service is in USD, check if booking amount is converted to UAH
        if (Math.abs(currentTotal - convertedToUAH) < 50) {
          shouldFix = true;
          reason = `USD service price ${servicePrice} was incorrectly converted to ${currentTotal} (should be ${servicePrice} USD)`;
        }
      }

      // Also check for obvious mismatches where the service price should be used
      if (!shouldFix && currentTotal !== servicePrice) {
        // If it's not a conversion issue, but still doesn't match, 
        // only fix if the difference suggests a clear error
        const ratio = currentTotal / servicePrice;
        if (Math.abs(ratio - usdToUahRate) < 1 || Math.abs(ratio - (1/usdToUahRate)) < 0.01) {
          shouldFix = true;
          reason = `Booking amount ${currentTotal} appears to be incorrectly converted from service price ${servicePrice} ${serviceCurrency}`;
        }
      }

      if (shouldFix) {
        fixes.push({
          bookingId: booking.id,
          serviceId: service.id,
          serviceName: service.name,
          oldTotalAmount: currentTotal,
          newTotalAmount: servicePrice,
          serviceCurrency: serviceCurrency,
          reason: reason
        });
      }
    }

    logger.info(`Identified ${fixes.length} bookings that need fixing:`);
    fixes.forEach(fix => {
      logger.info(`- Booking ${fix.bookingId} (${fix.serviceName}): ${fix.oldTotalAmount} → ${fix.newTotalAmount} ${fix.serviceCurrency} - ${fix.reason}`);
    });

    if (fixes.length === 0) {
      logger.info('No booking currency issues found. Migration complete.');
      return { totalBookings: problematicBookings.length, fixedBookings: 0, fixes: [] };
    }

    // Apply fixes
    logger.info('Applying fixes...');
    
    for (const fix of fixes) {
      await prisma.booking.update({
        where: { id: fix.bookingId },
        data: {
          totalAmount: fix.newTotalAmount,
          // Also update related amounts proportionally
          depositAmount: fix.newTotalAmount * 0.2, // 20% deposit
          remainingAmount: fix.newTotalAmount * 0.8, // 80% remaining
        }
      });

      logger.info(`✅ Fixed booking ${fix.bookingId}: ${fix.oldTotalAmount} → ${fix.newTotalAmount} ${fix.serviceCurrency}`);
    }

    // Also fix any payment records that might have the wrong amounts
    logger.info('Fixing related payment records...');
    let fixedPayments = 0;

    for (const fix of fixes) {
      const payments = await prisma.payment.findMany({
        where: { bookingId: fix.bookingId }
      });

      for (const payment of payments) {
        if (payment.amount === fix.oldTotalAmount) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { amount: fix.newTotalAmount }
          });
          fixedPayments++;
          logger.info(`✅ Fixed payment ${payment.id}: ${fix.oldTotalAmount} → ${fix.newTotalAmount}`);
        }
      }
    }

    logger.info(`✅ Booking currency migration completed:`);
    logger.info(`   - Checked: ${problematicBookings.length} problematic bookings`);
    logger.info(`   - Fixed: ${fixes.length} bookings`);
    logger.info(`   - Fixed: ${fixedPayments} payment records`);

    return {
      totalBookings: problematicBookings.length,
      bookingsWithIssues: bookingsWithIssues.length,
      fixedBookings: fixes.length,
      fixedPayments: fixedPayments,
      fixes: fixes.map(f => ({
        bookingId: f.bookingId,
        serviceName: f.serviceName,
        oldAmount: f.oldTotalAmount,
        newAmount: f.newTotalAmount,
        currency: f.serviceCurrency,
        reason: f.reason
      }))
    };

  } catch (error) {
    logger.error('Error during booking currency migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  fixBookingCurrencyData()
    .then(result => {
      console.log('Booking currency migration completed successfully:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Booking currency migration failed:', error);
      process.exit(1);
    });
}

export { fixBookingCurrencyData };