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

async function createAdmin(options: CreateAdminOptions) {
  console.log('🔧 Creating admin user...');
  
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: options.email }
    });

    if (existingAdmin) {
      if (existingAdmin.userType === 'ADMIN') {
        console.log('❌ Admin user already exists with this email');
        return;
      } else {
        console.log('❌ User with this email already exists but is not an admin');
        return;
      }
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(options.password, saltRounds);

    // Generate verification token (although admin should be pre-verified)
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: options.email,
        password: hashedPassword,
        firstName: options.firstName,
        lastName: options.lastName,
        userType: 'ADMIN',
        isActive: true,
        isEmailVerified: true, // Admin should be pre-verified
        loyaltyPoints: 0,
        language: 'en',
        currency: 'USD'
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminUser.email);
    console.log('👤 Name:', `${adminUser.firstName} ${adminUser.lastName}`);
    console.log('🔑 User Type:', adminUser.userType);
    console.log('🌐 Admin Dashboard URL: /admin/dashboard');
    console.log('\n🚨 IMPORTANT: Please delete this script after use for security!');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Default admin configuration
const DEFAULT_ADMIN = {
  email: 'admin@miyzapis.com',
  password: 'Admin123!@#',
  firstName: 'System',
  lastName: 'Administrator'
};

// Allow custom admin creation via command line arguments
const args = process.argv.slice(2);
let adminConfig = DEFAULT_ADMIN;

if (args.length >= 4) {
  adminConfig = {
    email: args[0],
    firstName: args[1],
    lastName: args[2],
    password: args[3]
  };
  console.log('Using custom admin configuration from command line arguments');
} else {
  console.log('Using default admin configuration');
  console.log('To create custom admin, run: npm run create-admin email firstName lastName password');
}

console.log('\n📋 Admin Details:');
console.log('Email:', adminConfig.email);
console.log('Name:', `${adminConfig.firstName} ${adminConfig.lastName}`);
console.log('Password:', adminConfig.password);
console.log('\n⚠️ Please change the default password after first login!\n');

// Run the script
if (require.main === module) {
  createAdmin(adminConfig)
    .catch((error) => {
      console.error('Failed to create admin user:', error);
      process.exit(1);
    });
}

export { createAdmin };