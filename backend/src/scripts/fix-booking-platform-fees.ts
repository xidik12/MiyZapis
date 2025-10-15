import { prisma } from '../config/database';
import { logger } from '../utils/logger';

async function fixBookingPlatformFees() {
  try {
    logger.info('Starting platform fee fix for existing bookings...');

    // Get all bookings that don't have platform fees calculated
    const bookings = await prisma.booking.findMany({
      where: {
        OR: [
          { platformFeeAmount: 0 },
          { specialistEarnings: 0 },
        ],
      },
      select: {
        id: true,
        totalAmount: true,
        platformFeePercentage: true,
      },
    });

    logger.info(`Found ${bookings.length} bookings to update`);

    let updated = 0;
    for (const booking of bookings) {
      const platformFeePercentage = booking.platformFeePercentage || 5.0;
      const platformFeeAmount = booking.totalAmount * (platformFeePercentage / 100);
      const specialistEarnings = booking.totalAmount - platformFeeAmount;

      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          platformFeePercentage,
          platformFeeAmount,
          specialistEarnings,
        },
      });

      updated++;
      if (updated % 10 === 0) {
        logger.info(`Updated ${updated}/${bookings.length} bookings`);
      }
    }

    logger.info(`✅ Successfully updated ${updated} bookings with platform fees`);
  } catch (error) {
    logger.error('Failed to fix booking platform fees:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixBookingPlatformFees()
  .then(() => {
    console.log('✅ Platform fee fix completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Platform fee fix failed:', error);
    process.exit(1);
  });
