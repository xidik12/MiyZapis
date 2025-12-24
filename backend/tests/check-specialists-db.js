const { PrismaClient } = require('@prisma/client');

async function checkSpecialistsAndReviews() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking specialists and reviews in database...');
    
    // Get all specialists
    const specialists = await prisma.user.findMany({
      where: { userType: 'SPECIALIST' },
      include: {
        specialist: true
      }
    });
    
    console.log(`👥 Found ${specialists.length} specialists:`);
    specialists.forEach(specialist => {
      console.log(`  - ID: ${specialist.id}, Name: ${specialist.firstName} ${specialist.lastName}, Email: ${specialist.email}`);
    });
    
    // Get all reviews
    const reviews = await prisma.review.findMany({
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true }
        },
        specialist: {
          select: { id: true, firstName: true, lastName: true }
        },
        service: {
          select: { id: true, name: true }
        },
        booking: {
          select: { id: true, completedAt: true }
        }
      }
    });
    
    console.log(`⭐ Found ${reviews.length} reviews:`);
    reviews.forEach(review => {
      console.log(`  - Review ID: ${review.id}`);
      console.log(`    Customer: ${review.customer.firstName} ${review.customer.lastName} (${review.customer.id})`);
      console.log(`    Specialist: ${review.specialist.firstName} ${review.specialist.lastName} (${review.specialist.id})`);
      console.log(`    Rating: ${review.rating}/5`);
      console.log(`    Comment: ${review.comment || 'No comment'}`);
      console.log(`    Service: ${review.service?.name || 'Unknown service'}`);
      console.log(`    Created: ${review.createdAt}`);
      console.log('    ---');
    });
    
    // Group reviews by specialist
    console.log('📊 Reviews grouped by specialist:');
    const reviewsBySpecialist = {};
    reviews.forEach(review => {
      const specialistId = review.specialist.id;
      if (!reviewsBySpecialist[specialistId]) {
        reviewsBySpecialist[specialistId] = {
          specialist: review.specialist,
          reviews: []
        };
      }
      reviewsBySpecialist[specialistId].reviews.push(review);
    });
    
    Object.entries(reviewsBySpecialist).forEach(([specialistId, data]) => {
      console.log(`  Specialist: ${data.specialist.firstName} ${data.specialist.lastName} (${specialistId})`);
      console.log(`    Review count: ${data.reviews.length}`);
      console.log(`    Average rating: ${(data.reviews.reduce((sum, r) => sum + r.rating, 0) / data.reviews.length).toFixed(1)}`);
    });
    
  } catch (error) {
    console.error('❌ Database query error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpecialistsAndReviews().catch(console.error);