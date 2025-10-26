import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function deleteAllBlocks() {
  try {
    console.log('🗑️  Deleting all availability blocks...');
    
    const result = await prisma.availabilityBlock.deleteMany({});
    
    console.log(`✅ Deleted ${result.count} blocks successfully!`);
    
    const remaining = await prisma.availabilityBlock.count();
    console.log(`📊 Remaining blocks: ${remaining}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllBlocks();
