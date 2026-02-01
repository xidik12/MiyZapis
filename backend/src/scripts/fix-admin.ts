import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAdminUser() {
  console.log('🔍 Checking admin user...\n');

  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@miyzapis.com' }
    });

    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('📋 Current admin user details:');
    console.log('Email:', admin.email);
    console.log('Name:', `${admin.firstName} ${admin.lastName}`);
    console.log('UserType:', admin.userType);
    console.log('Active:', admin.isActive);
    console.log('Verified:', admin.isEmailVerified);

    if (admin.userType !== 'ADMIN') {
      console.log('\n🔧 Fixing userType from', admin.userType, 'to ADMIN...');

      const updated = await prisma.user.update({
        where: { email: 'admin@miyzapis.com' },
        data: { userType: 'ADMIN' }
      });

      console.log('✅ Admin user updated successfully!');
      console.log('New UserType:', updated.userType);
      console.log('\n🌐 Please logout and login again to access /admin/dashboard');
    } else {
      console.log('\n✅ Admin user is already configured correctly');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminUser();
