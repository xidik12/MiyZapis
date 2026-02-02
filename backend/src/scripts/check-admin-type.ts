import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdminType() {
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@miyzapis.com' },
    select: { email: true, userType: true }
  });

  console.log('Database value:', admin?.userType);
  console.log('Expected by frontend: "admin" (lowercase)');
  console.log('Match:', admin?.userType === 'admin');

  await prisma.$disconnect();
}

checkAdminType();
