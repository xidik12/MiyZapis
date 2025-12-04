/**
 * Script to generate availability blocks for a specialist
 * Run with: node generate-availability.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generateAvailability() {
  try {
    console.log('🚀 Starting availability generation...');

    // Find the specialist by userId
    const userId = 'cmf9hreek000054ezewen8l9n'; // Your user ID from the logs

    const specialist = await prisma.specialist.findUnique({
      where: { userId: userId },
      select: {
        id: true,
        businessName: true,
        workingHours: true
      }
    });

    if (!specialist) {
      console.error('❌ Specialist not found for userId:', userId);
      return;
    }

    console.log('✅ Found specialist:', specialist.businessName);
    console.log('📋 Working hours:', specialist.workingHours);

    if (!specialist.workingHours) {
      console.error('❌ No working hours configured');
      return;
    }

    // Parse working hours
    const workingHours = JSON.parse(specialist.workingHours);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const slotDuration = 15; // 15-minute slots
    const weeksAhead = 4; // Generate 4 weeks ahead

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (weeksAhead * 7));

    console.log(`📅 Generating slots from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    // Get existing blocks to avoid duplicates
    const existingBlocks = await prisma.availabilityBlock.findMany({
      where: {
        specialistId: specialist.id,
        startDateTime: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        startDateTime: true,
        endDateTime: true
      }
    });

    console.log(`📊 Found ${existingBlocks.length} existing blocks`);

    const newBlocks = [];
    const now = new Date();

    // Generate blocks for each day
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayName = dayNames[date.getDay()];
      const daySchedule = workingHours[dayName];

      if (daySchedule && (daySchedule.isWorking || daySchedule.isOpen)) {
        // Prioritize startTime/endTime (new format) over start/end (legacy format)
        const startTime = daySchedule.startTime || daySchedule.start || '09:00';
        const endTime = daySchedule.endTime || daySchedule.end || '17:00';

        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        const startMinutesFromMidnight = startHour * 60 + startMinute;
        const endMinutesFromMidnight = endHour * 60 + endMinute;

        // Generate 15-minute time slots
        for (let minutes = startMinutesFromMidnight; minutes < endMinutesFromMidnight; minutes += slotDuration) {
          const slotStartDateTime = new Date(date);
          const slotEndDateTime = new Date(date);

          const hour = Math.floor(minutes / 60);
          const minute = minutes % 60;

          slotStartDateTime.setHours(hour, minute, 0, 0);
          slotEndDateTime.setHours(hour, minute + slotDuration, 0, 0);

          // Skip past time slots
          if (slotEndDateTime <= now) {
            continue;
          }

          // Check if this exact time slot already exists
          const hasExistingBlock = existingBlocks.some(block => {
            const blockStart = new Date(block.startDateTime);
            const blockEnd = new Date(block.endDateTime);
            return blockStart.getTime() === slotStartDateTime.getTime() &&
                   blockEnd.getTime() === slotEndDateTime.getTime();
          });

          // Only create block if no existing block for this exact time slot
          if (!hasExistingBlock) {
            newBlocks.push({
              specialistId: specialist.id,
              startDateTime: slotStartDateTime,
              endDateTime: slotEndDateTime,
              isAvailable: true,
              reason: 'Available',
              isRecurring: false
            });
          }
        }
      }
    }

    console.log(`💡 Generated ${newBlocks.length} new 15-minute time slots`);

    // Batch create availability blocks
    if (newBlocks.length > 0) {
      await prisma.availabilityBlock.createMany({
        data: newBlocks
      });

      console.log(`✅ Successfully created ${newBlocks.length} availability blocks!`);
    } else {
      console.log('ℹ️  No new blocks to create (all slots already exist)');
    }

  } catch (error) {
    console.error('❌ Error generating availability:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateAvailability();
