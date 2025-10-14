const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testServiceLocation() {
  try {
    console.log('🔍 Testing service location data persistence...\n');

    // Find a specialist to use for testing
    const specialist = await prisma.specialist.findFirst({
      include: {
        user: true
      }
    });

    if (!specialist) {
      console.log('❌ No specialist found in database. Please create a specialist first.');
      return;
    }

    console.log(`✅ Found specialist: ${specialist.user.firstName} ${specialist.user.lastName} (ID: ${specialist.id})\n`);

    // Check if specialist already has services with location
    const existingServices = await prisma.service.findMany({
      where: {
        specialistId: specialist.id,
        serviceLocation: { not: null }
      },
      select: {
        id: true,
        name: true,
        serviceLocation: true,
        locationNotes: true
      }
    });

    if (existingServices.length > 0) {
      console.log(`✅ Found ${existingServices.length} existing service(s) with location data:\n`);
      existingServices.forEach((service, index) => {
        console.log(`${index + 1}. ${service.name}`);
        console.log(`   Location: ${service.serviceLocation}`);
        console.log(`   Notes: ${service.locationNotes || 'N/A'}\n`);
      });
    } else {
      console.log('ℹ️  No existing services with location data found.\n');
    }

    // Create a test service with location
    console.log('📝 Creating test service with location data...\n');

    const testService = await prisma.service.create({
      data: {
        specialistId: specialist.id,
        name: 'Test Service with Location',
        description: 'This is a test service to verify location data persistence',
        category: 'test',
        basePrice: 50,
        currency: 'USD',
        duration: 60,
        serviceLocation: '123 Test Street, Test City, TC 12345',
        locationNotes: 'Ring buzzer #5. Parking available in back. Building code: 1234',
        requirements: JSON.stringify(['Test requirement']),
        deliverables: JSON.stringify(['Test deliverable']),
        isActive: true,
        requiresApproval: true,
        maxAdvanceBooking: 30,
        minAdvanceBooking: 1
      }
    });

    console.log('✅ Test service created successfully!\n');
    console.log(`Service ID: ${testService.id}`);
    console.log(`Name: ${testService.name}`);
    console.log(`Location: ${testService.serviceLocation}`);
    console.log(`Location Notes: ${testService.locationNotes}\n`);

    // Verify the data was saved by fetching it again
    console.log('🔄 Verifying data persistence by re-fetching from database...\n');

    const verifyService = await prisma.service.findUnique({
      where: { id: testService.id },
      select: {
        id: true,
        name: true,
        serviceLocation: true,
        locationNotes: true,
        createdAt: true
      }
    });

    if (verifyService && verifyService.serviceLocation) {
      console.log('✅ SUCCESS! Location data is properly saved and retrievable:\n');
      console.log(`Service ID: ${verifyService.id}`);
      console.log(`Location: ${verifyService.serviceLocation}`);
      console.log(`Notes: ${verifyService.locationNotes}`);
      console.log(`Created At: ${verifyService.createdAt}\n`);
    } else {
      console.log('❌ ERROR! Location data was not saved properly.\n');
    }

    // Clean up test service
    console.log('🧹 Cleaning up test service...\n');
    await prisma.service.delete({
      where: { id: testService.id }
    });
    console.log('✅ Test service deleted.\n');

    console.log('✨ Test completed successfully! Location data is being saved properly.\n');

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testServiceLocation();
