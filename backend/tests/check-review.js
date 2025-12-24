const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkReview() {
  try {
    const review = await prisma.review.findFirst({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        rating: true,
        comment: true,
        specialistId: true,
        customerId: true,
        bookingId: true,
        createdAt: true,
        isPublic: true
      }
    });

    console.log('Latest review:', review);

    if (review) {
      console.log(`Testing specialist endpoint for ID: ${review.specialistId}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkReview();