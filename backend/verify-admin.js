const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function verifyAdmin() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@miyzapis.com' },
      select: {
        id: true,
        email: true,
        password: true,
        userType: true,
        isActive: true,
        isEmailVerified: true
      }
    });

    if (!admin) {
      console.log('❌ Admin user does not exist!');
      console.log('Run: cd backend && npm run create-admin');
      return;
    }

    console.log('\n📋 Admin User Details:');
    console.log('Email:', admin.email);
    console.log('UserType:', admin.userType);
    console.log('Is Active:', admin.isActive);
    console.log('Email Verified:', admin.isEmailVerified);
    console.log('Has Password:', !!admin.password);

    // Test password
    const testPassword = 'Admin123!@#';
    const passwordMatch = await bcrypt.compare(testPassword, admin.password);

    console.log('\n🔐 Password Test:');
    console.log('Testing password:', testPassword);
    console.log('Password matches:', passwordMatch);

    if (!passwordMatch) {
      console.log('\n⚠️  Password does NOT match! Resetting password...');
      const hashedPassword = await bcrypt.hash(testPassword, 12);

      await prisma.user.update({
        where: { email: 'admin@miyzapis.com' },
        data: {
          password: hashedPassword,
          userType: 'admin',
          isActive: true,
          isEmailVerified: true
        }
      });

      console.log('✅ Password reset successfully!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdmin();
