import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function forceFixAdmin() {
  console.log('🔧 Force fixing admin user with raw SQL...\n');

  try {
    // Use raw SQL to update the userType (lowercase to match frontend expectation)
    await prisma.$executeRaw`
      UPDATE "users"
      SET "userType" = 'admin'
      WHERE email = 'admin@miyzapis.com'
    `;

    console.log('✅ UserType updated with raw SQL');

    // Verify the update
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@miyzapis.com' },
      select: { email: true, firstName: true, lastName: true, userType: true }
    });

    console.log('\n📋 Verified admin user:');
    console.log('Email:', admin?.email);
    console.log('Name:', `${admin?.firstName} ${admin?.lastName}`);
    console.log('UserType:', admin?.userType);

    if (admin?.userType === 'admin') {
      console.log('\n✅ SUCCESS! Admin userType is now admin');
      console.log('🌐 Clear browser storage and login again to access /admin/dashboard');
    } else {
      console.log('\n❌ ERROR: UserType is still:', admin?.userType);
      console.log('Expected: "admin" (lowercase)');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceFixAdmin();
