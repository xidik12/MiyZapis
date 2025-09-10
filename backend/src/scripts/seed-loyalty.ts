import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedLoyaltyProgram() {
  console.log('🌱 Seeding loyalty program data...');

  try {
    // Create loyalty tiers
    const tiers = [
      {
        name: 'SILVER',
        minPoints: 0,
        maxPoints: 999,
        color: '#C0C0C0',
        icon: '🥈',
        benefits: JSON.stringify([
          'Earn 1 point per $1 spent',
          'Basic customer support',
          'Monthly newsletter'
        ])
      },
      {
        name: 'GOLD',
        minPoints: 1000,
        maxPoints: 4999,
        color: '#FFD700',
        icon: '🥇',
        benefits: JSON.stringify([
          'Earn 1 point per $1 spent',
          '5% discount on bookings',
          'Priority customer support',
          'Early access to new services',
          'Monthly newsletter'
        ])
      },
      {
        name: 'PLATINUM',
        minPoints: 5000,
        maxPoints: null,
        color: '#E5E4E2',
        icon: '💎',
        benefits: JSON.stringify([
          'Earn 1.2 points per $1 spent',
          '10% discount on bookings',
          'VIP customer support',
          'Early access to new services',
          'Exclusive platinum member events',
          'Personal account manager',
          'Monthly newsletter'
        ])
      }
    ];

    for (const tier of tiers) {
      await prisma.loyaltyTier.upsert({
        where: { name: tier.name },
        update: tier,
        create: tier
      });
    }

    console.log('✅ Created loyalty tiers');

    // Create badges
    const badges = [
      // Booking badges
      {
        name: 'First Timer',
        description: 'Complete your first booking',
        icon: '🎉',
        color: '#10B981',
        category: 'BOOKING',
        criteria: JSON.stringify({ type: 'BOOKING_COUNT', target: 1 }),
        rarity: 'COMMON'
      },
      {
        name: 'Regular Customer',
        description: 'Complete 5 bookings',
        icon: '🔄',
        color: '#3B82F6',
        category: 'BOOKING',
        criteria: JSON.stringify({ type: 'BOOKING_COUNT', target: 5 }),
        rarity: 'COMMON'
      },
      {
        name: 'Frequent Booker',
        description: 'Complete 25 bookings',
        icon: '⚡',
        color: '#8B5CF6',
        category: 'BOOKING',
        criteria: JSON.stringify({ type: 'BOOKING_COUNT', target: 25 }),
        rarity: 'RARE'
      },
      {
        name: 'Super Customer',
        description: 'Complete 100 bookings',
        icon: '🚀',
        color: '#F59E0B',
        category: 'BOOKING',
        criteria: JSON.stringify({ type: 'BOOKING_COUNT', target: 100 }),
        rarity: 'EPIC'
      },

      // Review badges
      {
        name: 'Reviewer',
        description: 'Leave your first review',
        icon: '⭐',
        color: '#10B981',
        category: 'REVIEW',
        criteria: JSON.stringify({ type: 'REVIEW_COUNT', target: 1 }),
        rarity: 'COMMON'
      },
      {
        name: 'Helpful Reviewer',
        description: 'Leave 10 reviews',
        icon: '📝',
        color: '#3B82F6',
        category: 'REVIEW',
        criteria: JSON.stringify({ type: 'REVIEW_COUNT', target: 10 }),
        rarity: 'RARE'
      },
      {
        name: 'Review Master',
        description: 'Leave 50 reviews',
        icon: '🏆',
        color: '#F59E0B',
        category: 'REVIEW',
        criteria: JSON.stringify({ type: 'REVIEW_COUNT', target: 50 }),
        rarity: 'LEGENDARY'
      },

      // Referral badges
      {
        name: 'Friend Bringer',
        description: 'Refer your first friend',
        icon: '👥',
        color: '#10B981',
        category: 'REFERRAL',
        criteria: JSON.stringify({ type: 'REFERRAL_COUNT', target: 1 }),
        rarity: 'COMMON'
      },
      {
        name: 'Community Builder',
        description: 'Refer 5 friends',
        icon: '🌟',
        color: '#8B5CF6',
        category: 'REFERRAL',
        criteria: JSON.stringify({ type: 'REFERRAL_COUNT', target: 5 }),
        rarity: 'RARE'
      },
      {
        name: 'Ambassador',
        description: 'Refer 25 friends',
        icon: '🎖️',
        color: '#EF4444',
        category: 'REFERRAL',
        criteria: JSON.stringify({ type: 'REFERRAL_COUNT', target: 25 }),
        rarity: 'LEGENDARY'
      },

      // Loyalty badges
      {
        name: 'Points Collector',
        description: 'Earn your first 100 points',
        icon: '💰',
        color: '#10B981',
        category: 'LOYALTY',
        criteria: JSON.stringify({ type: 'POINTS_EARNED', target: 100 }),
        rarity: 'COMMON'
      },
      {
        name: 'Gold Member',
        description: 'Reach Gold tier',
        icon: '🥇',
        color: '#FFD700',
        category: 'LOYALTY',
        criteria: JSON.stringify({ type: 'TIER_REACHED', target: 'GOLD' }),
        rarity: 'RARE'
      },
      {
        name: 'Platinum Elite',
        description: 'Reach Platinum tier',
        icon: '💎',
        color: '#E5E4E2',
        category: 'LOYALTY',
        criteria: JSON.stringify({ type: 'TIER_REACHED', target: 'PLATINUM' }),
        rarity: 'EPIC'
      },
      {
        name: 'Streak Master',
        description: 'Book services for 7 consecutive months',
        icon: '🔥',
        color: '#EF4444',
        category: 'LOYALTY',
        criteria: JSON.stringify({ type: 'MONTHLY_STREAK', target: 7 }),
        rarity: 'LEGENDARY'
      }
    ];

    for (const badge of badges) {
      await prisma.badge.upsert({
        where: { name: badge.name },
        update: badge,
        create: badge
      });
    }

    console.log('✅ Created badges');
    console.log('🎉 Loyalty program data seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding loyalty program data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder if called directly
if (require.main === module) {
  seedLoyaltyProgram()
    .then(() => {
      console.log('✅ Loyalty program seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Loyalty program seeding failed:', error);
      process.exit(1);
    });
}

export default seedLoyaltyProgram;