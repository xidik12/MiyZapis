const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:GVGsHSeKorazyvATppTqvabRFqGniRQsH@caboose.proxy.rlwy.net:51538/railway"
    }
  }
});

async function debugBookingConflict() {
  console.log('🔍 Debugging booking conflict for specialist cmfcgy5p10004zzir9q0m6c6v');
  
  // The exact time the user is trying to book
  const requestedTime = new Date('2025-09-22T03:00:00.000Z');
  console.log('📅 Requested booking time:', requestedTime.toISOString());
  console.log('📅 Local time:', requestedTime.toLocaleString());
  
  // First, let's get the specialist info
  const specialist = await prisma.specialist.findUnique({
    where: { id: 'cmfcgy5p10004zzir9q0m6c6v' },
    select: { id: true, userId: true }
  });
  
  console.log('👤 Specialist info:', specialist);
  
  // Check existing bookings for this specialist on this date
  const startOfDay = new Date('2025-09-22T00:00:00.000Z');
  const endOfDay = new Date('2025-09-23T00:00:00.000Z');
  
  console.log('📅 Checking bookings between:', startOfDay.toISOString(), 'and', endOfDay.toISOString());
  
  const existingBookings = await prisma.booking.findMany({
    where: {
      specialistId: specialist.userId, // Use the User ID as we fixed
      scheduledAt: {
        gte: startOfDay,
        lt: endOfDay
      },
      status: {
        in: ['PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS']
      }
    },
    select: {
      id: true,
      scheduledAt: true,
      duration: true,
      status: true,
      service: {
        select: { name: true }
      }
    }
  });
  
  console.log(`📋 Found ${existingBookings.length} existing bookings:`);
  existingBookings.forEach(booking => {
    const startTime = new Date(booking.scheduledAt);
    const endTime = new Date(startTime.getTime() + (booking.duration * 60 * 1000));
    console.log(`  - ${booking.service.name}: ${startTime.toISOString()} to ${endTime.toISOString()} (${booking.status})`);
  });
  
  // Check for conflicts with requested time
  const bookingDuration = 60; // Assume 1 hour
  const requestedEndTime = new Date(requestedTime.getTime() + (bookingDuration * 60 * 1000));
  
  console.log('🔍 Checking for conflicts with requested time range:');
  console.log(`   ${requestedTime.toISOString()} to ${requestedEndTime.toISOString()}`);
  
  const conflictingBookings = existingBookings.filter(booking => {
    const existingStart = new Date(booking.scheduledAt);
    const existingEnd = new Date(existingStart.getTime() + (booking.duration * 60 * 1000));
    
    // Two time ranges overlap if: start1 < end2 && start2 < end1
    const hasOverlap = requestedTime < existingEnd && existingStart < requestedEndTime;
    
    if (hasOverlap) {
      console.log(`   ⚠️  CONFLICT with booking ${booking.id}: ${existingStart.toISOString()} to ${existingEnd.toISOString()}`);
    }
    
    return hasOverlap;
  });
  
  console.log(`🚨 Found ${conflictingBookings.length} conflicting bookings`);
  
  await prisma.$disconnect();
}

debugBookingConflict().catch(console.error);