const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function initializeLoyaltyForUsers() {
  console.log('🔄 Initializing loyalty data for existing users...');
  
  try {
    // Get all users
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users`);
    
    // Create loyalty transactions for each user to give them some starting points
    for (const user of users) {
      console.log(`Processing user: ${user.email}`);
      
      // Check if user already has loyalty transactions
      const existingTransactions = await prisma.loyaltyTransaction.findMany({
        where: { userId: user.id }
      });
      
      if (existingTransactions.length === 0) {
        console.log(`  Creating initial loyalty points for ${user.email}`);
        
        // Give welcome bonus
        await prisma.loyaltyTransaction.create({
          data: {
            userId: user.id,
            type: 'BONUS',
            points: 100,
            description: 'Welcome bonus - Thank you for joining MiyZapis!',
            reference: 'WELCOME_BONUS'
          }
        });
        
        // Add points based on user activity
        const userBookings = await prisma.booking.findMany({
          where: { 
            OR: [
              { customerId: user.id },
              { specialistId: user.id }
            ],
            status: 'COMPLETED'
          }
        });
        
        if (userBookings.length > 0) {
          console.log(`  Found ${userBookings.length} completed bookings for ${user.email}`);
          
          // Give points for historical bookings
          for (const booking of userBookings) {
            const points = Math.floor((booking.totalAmount || 0) * 0.01); // 1 point per $1
            if (points > 0) {
              await prisma.loyaltyTransaction.create({
                data: {
                  userId: user.id,
                  type: 'EARNED',
                  points: points,
                  description: `Points earned from booking: ${booking.serviceName}`,
                  reference: 'HISTORICAL_BOOKING',
                  bookingId: booking.id
                }
              });
            }
          }
        }
        
        // Add extra points for specialists
        if (user.userType === 'specialist') {
          await prisma.loyaltyTransaction.create({
            data: {
              userId: user.id,
              type: 'BONUS',
              points: 500,
              description: 'Specialist bonus - Thank you for providing services!',
              reference: 'SPECIALIST_BONUS'
            }
          });
        }
      } else {
        console.log(`  User ${user.email} already has loyalty transactions`);
      }
    }
    
    console.log('✅ Successfully initialized loyalty data for all users');
  } catch (error) {
    console.error('❌ Error initializing loyalty data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initializeLoyaltyForUsers();