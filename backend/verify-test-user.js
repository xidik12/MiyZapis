#!/usr/bin/env node

/**
 * Test User Verification Script
 * 
 * This script creates a verified test user for image upload testing
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

const TEST_USER = {
  email: 'imagetest@example.com',
  password: 'TestPassword123!',
  firstName: 'Image',
  lastName: 'Test'
};

async function createVerifiedTestUser() {
  console.log('🔧 Creating verified test user for image testing...');
  
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: TEST_USER.email }
    });

    if (existingUser) {
      if (existingUser.isEmailVerified) {
        console.log('✅ Verified test user already exists');
        console.log('📧 Email:', existingUser.email);
        console.log('🔑 Password:', TEST_USER.password);
        return existingUser;
      } else {
        console.log('📧 Updating existing user to verified status...');
        const updatedUser = await prisma.user.update({
          where: { email: TEST_USER.email },
          data: {
            isEmailVerified: true,
            isActive: true,
            emailVerifiedAt: new Date()
          }
        });
        console.log('✅ Test user verified successfully!');
        console.log('📧 Email:', updatedUser.email);
        console.log('🔑 Password:', TEST_USER.password);
        return updatedUser;
      }
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(TEST_USER.password, saltRounds);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create verified test user
    const testUser = await prisma.user.create({
      data: {
        email: TEST_USER.email,
        password: hashedPassword,
        firstName: TEST_USER.firstName,
        lastName: TEST_USER.lastName,
        userType: 'CUSTOMER',
        isActive: true,
        isEmailVerified: true, // Pre-verified for testing
        emailVerifiedAt: new Date(),
        emailVerificationToken: verificationToken,
        loyaltyPoints: 0,
        totalBookings: 0,
        preferences: {
          language: 'en',
          currency: 'USD',
          notifications: {
            email: true,
            push: true,
            telegram: false
          }
        }
      }
    });

    console.log('✅ Verified test user created successfully!');
    console.log('📧 Email:', testUser.email);
    console.log('🔑 Password:', TEST_USER.password);
    console.log('👤 Name:', `${testUser.firstName} ${testUser.lastName}`);
    console.log('🔑 User Type:', testUser.userType);
    console.log('✉️  Email Verified:', testUser.isEmailVerified);
    console.log('\n🧪 This user can now be used for image upload testing');
    
    return testUser;
    
  } catch (error) {
    console.error('❌ Error creating verified test user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Allow getting the user credentials for testing
function getTestUserCredentials() {
  return {
    email: TEST_USER.email,
    password: TEST_USER.password
  };
}

// Run the script
if (require.main === module) {
  createVerifiedTestUser()
    .catch((error) => {
      console.error('Failed to create verified test user:', error);
      process.exit(1);
    });
}

module.exports = { createVerifiedTestUser, getTestUserCredentials };