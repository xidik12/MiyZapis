// Script to delete all availability blocks for a specialist
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteAllBlocks() {
  try {
    // Get all specialists
    const specialists = await prisma.specialist.findMany({
      select: { id: true, businessName: true }
    });

    console.log('Found specialists:', specialists.length);

    for (const specialist of specialists) {
      const deleted = await prisma.availabilityBlock.deleteMany({
        where: { specialistId: specialist.id }
      });
      
      console.log(`Deleted ${deleted.count} blocks for ${specialist.businessName} (${specialist.id})`);
    }

    console.log('✅ All blocks deleted successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllBlocks();
