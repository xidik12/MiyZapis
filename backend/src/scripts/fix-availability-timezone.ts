import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Migration script to fix timezone issues in availability blocks
 *
 * Problem: Availability blocks were created with hardcoded 'Z' suffix (UTC),
 * causing local times like 8:30 AM to be stored as 8:30 AM UTC instead of
 * being converted properly. For Cambodia (UTC+7), this means 8:30 AM local
 * was stored as 8:30 UTC and displayed as 15:30 (3:30 PM) local.
 *
 * Solution: Subtract 7 hours from all existing availability blocks to correct
 * the timezone offset for Cambodia (UTC+7).
 *
 * Usage:
 * - Development: npx tsx src/scripts/fix-availability-timezone.ts
 * - Production: DATABASE_URL="..." npx tsx src/scripts/fix-availability-timezone.ts
 */

const TIMEZONE_OFFSET_HOURS = 7; // Cambodia is UTC+7

async function fixAvailabilityTimezone() {
  console.log('🔧 Starting availability timezone migration...');
  console.log(`📍 Timezone offset: UTC+${TIMEZONE_OFFSET_HOURS}`);
  console.log('');

  try {
    // Get all availability blocks
    const blocks = await prisma.availabilityBlock.findMany({
      select: {
        id: true,
        startDateTime: true,
        endDateTime: true,
        specialistId: true,
        isAvailable: true,
      },
    });

    console.log(`📊 Found ${blocks.length} availability blocks to process`);
    console.log('');

    if (blocks.length === 0) {
      console.log('✅ No blocks to migrate');
      return;
    }

    // Show preview of changes
    console.log('📋 Preview of changes (first 5 blocks):');
    console.log('─'.repeat(80));
    blocks.slice(0, 5).forEach((block) => {
      const oldStart = new Date(block.startDateTime);
      const oldEnd = new Date(block.endDateTime);
      const newStart = new Date(oldStart.getTime() - TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000);
      const newEnd = new Date(oldEnd.getTime() - TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000);

      console.log(`Block ${block.id.substring(0, 8)}...`);
      console.log(`  OLD: ${oldStart.toISOString()} → ${oldEnd.toISOString()}`);
      console.log(`  NEW: ${newStart.toISOString()} → ${newEnd.toISOString()}`);
      console.log(`  (${oldStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} → ${newStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })})`);
      console.log('');
    });

    // Ask for confirmation
    console.log('⚠️  This will modify all availability blocks in the database.');
    console.log('');

    // In production, we'd want to prompt for confirmation
    // For now, we'll proceed automatically but show a clear message
    console.log('🚀 Proceeding with migration...');
    console.log('');

    let updated = 0;
    let failed = 0;

    // Update each block
    for (const block of blocks) {
      try {
        const oldStart = new Date(block.startDateTime);
        const oldEnd = new Date(block.endDateTime);

        // Subtract timezone offset hours
        const newStart = new Date(oldStart.getTime() - TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000);
        const newEnd = new Date(oldEnd.getTime() - TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000);

        await prisma.availabilityBlock.update({
          where: { id: block.id },
          data: {
            startDateTime: newStart,
            endDateTime: newEnd,
          },
        });

        updated++;

        if (updated % 10 === 0) {
          console.log(`✓ Updated ${updated}/${blocks.length} blocks...`);
        }
      } catch (error) {
        console.error(`✗ Failed to update block ${block.id}:`, error);
        failed++;
      }
    }

    console.log('');
    console.log('─'.repeat(80));
    console.log('📊 Migration Summary:');
    console.log(`  ✅ Successfully updated: ${updated} blocks`);
    console.log(`  ❌ Failed: ${failed} blocks`);
    console.log(`  📍 Timezone offset applied: -${TIMEZONE_OFFSET_HOURS} hours`);
    console.log('');

    if (updated > 0) {
      console.log('✅ Availability timezone migration completed successfully!');
      console.log('');
      console.log('📝 Note: New availability blocks created after frontend deployment');
      console.log('   will automatically use the correct timezone conversion.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
fixAvailabilityTimezone()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
