import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

interface CreateAdminOptions {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

async function createRailwayAdmin(options: CreateAdminOptions) {
  console.log('🚂 Creating Railway Admin User...');
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Database URL available:', !!process.env.DATABASE_URL);
  
  try {
    // Test database connection first
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: options.email }
    });

    if (existingAdmin) {
      if (existingAdmin.userType === 'ADMIN') {
        console.log('❌ Admin user already exists with this email');
        console.log('   If you want to reset password, delete the existing admin first');
        return;
      } else {
        console.log('❌ User with this email already exists but is not an admin');
        console.log('   Please use a different email for the admin account');
        return;
      }
    }

    // Hash password with high security
    console.log('🔐 Hashing password...');
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(options.password, saltRounds);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create admin user
    console.log('👤 Creating admin user in database...');
    const adminUser = await prisma.user.create({
      data: {
        email: options.email,
        password: hashedPassword,
        firstName: options.firstName,
        lastName: options.lastName,
        userType: 'ADMIN',
        isActive: true,
        isEmailVerified: true, // Pre-verify admin
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

    console.log('\n🎉 RAILWAY ADMIN CREATED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Admin Email:', adminUser.email);
    console.log('👤 Admin Name:', `${adminUser.firstName} ${adminUser.lastName}`);
    console.log('🔑 User Type:', adminUser.userType);
    console.log('🆔 User ID:', adminUser.id);
    console.log('✅ Email Verified:', adminUser.isEmailVerified);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🌐 ADMIN ACCESS INSTRUCTIONS:');
    console.log('1. Go to: https://miyzapis.com/auth/login');
    console.log('2. Login with:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: ${options.password}`);
    console.log('3. You will be automatically redirected to: /admin/dashboard');
    console.log('\n🔒 SECURITY RECOMMENDATIONS:');
    console.log('• Change the password after first login');
    console.log('• Delete this script from Railway after use');
    console.log('• Keep admin credentials secure');
    console.log('• Monitor admin access logs');
    
  } catch (error: any) {
    console.error('\n❌ ERROR CREATING RAILWAY ADMIN:');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error:', error.message);
    
    if (error.code === 'P2002') {
      console.error('This email is already in use. Try a different email.');
    } else if (error.code === 'P1001') {
      console.error('Cannot connect to database. Check DATABASE_URL environment variable.');
    } else {
      console.error('Full error details:', error);
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Configuration for Railway deployment
const RAILWAY_ADMIN_CONFIG = {
  email: process.env.ADMIN_EMAIL || 'admin@miyzapis.com',
  firstName: process.env.ADMIN_FIRST_NAME || 'System',
  lastName: process.env.ADMIN_LAST_NAME || 'Administrator',
  password: process.env.ADMIN_PASSWORD || 'Admin123!@#Railway'
};

console.log('\n🚂 RAILWAY ADMIN SETUP SCRIPT');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('This script will create an admin user for Railway deployment');

// Check if running in Railway environment
if (process.env.RAILWAY_ENVIRONMENT) {
  console.log('✅ Running in Railway environment');
  console.log('📋 Admin Configuration:');
  console.log('Email:', RAILWAY_ADMIN_CONFIG.email);
  console.log('Name:', `${RAILWAY_ADMIN_CONFIG.firstName} ${RAILWAY_ADMIN_CONFIG.lastName}`);
  console.log('Password:', '****** (hidden for security)');
} else {
  console.log('⚠️  Not running in Railway environment');
  console.log('You can set these environment variables in Railway:');
  console.log('• ADMIN_EMAIL (optional, defaults to admin@miyzapis.com)');
  console.log('• ADMIN_FIRST_NAME (optional, defaults to System)');  
  console.log('• ADMIN_LAST_NAME (optional, defaults to Administrator)');
  console.log('• ADMIN_PASSWORD (optional, defaults to Admin123!@#Railway)');
}

// Run the script
if (require.main === module) {
  createRailwayAdmin(RAILWAY_ADMIN_CONFIG)
    .then(() => {
      console.log('\n✅ Admin setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Admin setup failed:', error.message);
      process.exit(1);
    });
}

export { createRailwayAdmin };