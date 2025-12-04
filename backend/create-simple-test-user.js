#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const testUserId = 'e4490d53-8b24-45fe-9cd9-9476f0667460'; // matches JWT

async function createTestUser() {
  console.log('Creating simple test user...');

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: testUserId }
    });

    if (existingUser) {
      console.log('✅ Test user already exists:', existingUser.email);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('TestPassword123!', 12);

    // Create user with minimal data
    const testUser = await prisma.user.create({
      data: {
        id: testUserId,
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        userType: 'CUSTOMER',
        isActive: true,
        isEmailVerified: true, // Skip email verification for testing
      }
    });

    console.log('✅ Test user created successfully:');
    console.log('📧 Email:', testUser.email);
    console.log('🆔 ID:', testUser.id);
    console.log('💰 Wallet Balance:', testUser.walletBalance);
    console.log('💱 Wallet Currency:', testUser.walletCurrency);

  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();