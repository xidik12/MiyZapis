const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDB() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@miyzapis.com' }
    });

    console.log('\n📋 Database Check:');
    console.log('Email:', admin?.email);
    console.log('UserType:', admin?.userType);
    console.log('UserType === "admin"?', admin?.userType === 'admin');
    console.log('UserType === "ADMIN"?', admin?.userType === 'ADMIN');
    console.log('UserType === "CUSTOMER"?', admin?.userType === 'CUSTOMER');

    if (admin?.userType !== 'admin') {
      console.log('\n⚠️  UserType is wrong! Fixing...');
      await prisma.$executeRaw`UPDATE "users" SET "userType" = 'admin' WHERE email = 'admin@miyzapis.com'`;
      console.log('✅ Fixed to lowercase "admin"');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDB();
