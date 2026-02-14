const { PrismaClient } = require('@prisma/client');

// Use Railway production database URL
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:FrsHSPBtjWPCQQhGvLAcQMrWhYLxaKOS@junction.proxy.rlwy.net:43164/railway';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

async function checkRailwayAdmin() {
  console.log('🔍 Checking admin user in Railway production database...\n');

  try {
    // Find admin user
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@miyzapis.com' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        userType: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true
      }
    });

    if (!admin) {
      console.log('❌ Admin user NOT FOUND in database');
      console.log('Run fix-railway-admin.js to create admin user');
      return;
    }

    console.log('✅ Admin user found:');
    console.log('ID:', admin.id);
    console.log('Email:', admin.email);
    console.log('Name:', `${admin.firstName} ${admin.lastName}`);
    console.log('UserType:', admin.userType, '<-- This is what matters!');
    console.log('Is Active:', admin.isActive);
    console.log('Last Login:', admin.lastLoginAt);
    console.log('Created:', admin.createdAt);

    console.log('\n📊 Analysis:');
    if (admin.userType === 'admin') {
      console.log('✅ UserType is correct: "admin" (lowercase)');
    } else if (admin.userType === 'ADMIN') {
      console.log('⚠️  UserType is uppercase "ADMIN" (should work with latest middleware)');
    } else {
      console.log(`❌ UserType is WRONG: "${admin.userType}" (should be "admin")`);
      console.log('Run: cd backend && npm run force-fix-admin');
    }

    if (!admin.isActive) {
      console.log('❌ Account is NOT ACTIVE (needs to be true)');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRailwayAdmin();
