const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Railway production database URL
const DATABASE_URL = 'postgresql://postgres:GVGsHSeKoazyvATppTqvabRFqGniRQsH@caboose.proxy.rlwy.net:51538/railway';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

async function fixRailwayAdmin() {
  try {
    console.log('🚂 Connecting to Railway production database...\n');

    // Check if admin exists
    let admin = await prisma.user.findUnique({
      where: { email: 'admin@miyzapis.com' }
    });

    if (!admin) {
      console.log('❌ Admin user does not exist. Creating...\n');

      // Create admin user
      const hashedPassword = await bcrypt.hash('Admin123!@#', 12);

      admin = await prisma.user.create({
        data: {
          email: 'admin@miyzapis.com',
          password: hashedPassword,
          firstName: 'System',
          lastName: 'Administrator',
          userType: 'admin',
          isActive: true,
          isEmailVerified: true,
          loyaltyPoints: 0,
          language: 'en',
          currency: 'USD'
        }
      });

      console.log('✅ Admin user created successfully!');
    } else {
      console.log('📋 Admin user exists. Updating...\n');

      // Update admin user
      const hashedPassword = await bcrypt.hash('Admin123!@#', 12);

      admin = await prisma.user.update({
        where: { email: 'admin@miyzapis.com' },
        data: {
          password: hashedPassword,
          userType: 'admin',
          isActive: true,
          isEmailVerified: true
        }
      });

      console.log('✅ Admin user updated successfully!');
    }

    console.log('\n📋 Admin Details:');
    console.log('Email:', admin.email);
    console.log('Name:', `${admin.firstName} ${admin.lastName}`);
    console.log('UserType:', admin.userType);
    console.log('Active:', admin.isActive);
    console.log('Email Verified:', admin.isEmailVerified);

    console.log('\n🌐 Admin Dashboard Access:');
    console.log('URL: https://miyzapis.com/admin/dashboard');
    console.log('Email: admin@miyzapis.com');
    console.log('Password: Admin123!@#');
    console.log('\n⚠️  Remember to change the password after first login!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRailwayAdmin();
