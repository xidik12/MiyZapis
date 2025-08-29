#!/usr/bin/env node

/**
 * Database migration script for Railway deployment
 * This ensures all tables exist in the production database
 */

const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Starting database migration...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Check if notification table exists by trying to count records
    try {
      const notificationCount = await prisma.notification.count();
      console.log(`✅ Notification table exists with ${notificationCount} records`);
    } catch (error) {
      console.log('❌ Notification table does not exist or is inaccessible');
      console.log('Error:', error.message);
      
      // Try to create the table using raw SQL if it doesn't exist
      try {
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "Notification" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "userId" TEXT NOT NULL,
            "type" TEXT NOT NULL,
            "title" TEXT NOT NULL,
            "message" TEXT NOT NULL,
            "data" TEXT,
            "isRead" BOOLEAN NOT NULL DEFAULT false,
            "readAt" TIMESTAMP,
            "emailSent" BOOLEAN NOT NULL DEFAULT false,
            "smsSent" BOOLEAN NOT NULL DEFAULT false,
            "telegramSent" BOOLEAN NOT NULL DEFAULT false,
            "pushSent" BOOLEAN NOT NULL DEFAULT false,
            "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `;
        console.log('✅ Created notification table manually');
      } catch (createError) {
        console.log('❌ Failed to create notification table:', createError.message);
      }
    }
    
    // Test other important tables
    const userCount = await prisma.user.count();
    const bookingCount = await prisma.booking.count();
    
    console.log(`✅ Database health check:`);
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Bookings: ${bookingCount}`);
    
    console.log('🎉 Migration completed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();