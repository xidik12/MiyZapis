const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function fixLoyaltyIssues() {
  try {
    console.log('🔍 Checking current loyalty tiers...');

    // Check current tiers
    const currentTiers = await prisma.loyaltyTier.findMany({
      orderBy: { minPoints: 'asc' }
    });

    console.log('Current tiers:', currentTiers.map(t => `${t.name}: ${t.minPoints}-${t.maxPoints || '∞'}`));

    // Check if BRONZE tier exists
    const bronzeTier = currentTiers.find(t => t.name === 'BRONZE');

    if (!bronzeTier) {
      console.log('❌ BRONZE tier missing! Creating proper tier structure...');

      // Delete existing tiers
      await prisma.loyaltyTier.deleteMany();

      // Create correct tier structure
      const correctTiers = [
        { name: 'BRONZE', minPoints: 0, maxPoints: 499, color: '#CD7F32', icon: '🥉', benefits: JSON.stringify(['Basic support', 'Standard booking', 'Point earning']) },
        { name: 'SILVER', minPoints: 500, maxPoints: 999, color: '#C0C0C0', icon: '🥈', benefits: JSON.stringify(['Basic support', 'Standard booking', 'Point earning']) },
        { name: 'GOLD', minPoints: 1000, maxPoints: 1999, color: '#FFD700', icon: '🥇', benefits: JSON.stringify(['Priority support', 'Early booking access', '5% bonus points']) },
        { name: 'PLATINUM', minPoints: 2000, maxPoints: null, color: '#E5E4E2', icon: '💎', benefits: JSON.stringify(['VIP support', 'Exclusive services', '10% bonus points', 'Free cancellation']) }
      ];

      for (const tier of correctTiers) {
        await prisma.loyaltyTier.create({ data: tier });
        console.log(`✅ Created ${tier.name} tier (${tier.minPoints}-${tier.maxPoints || '∞'} points)`);
      }
    } else {
      console.log('✅ BRONZE tier exists');
    }

    // Check loyalty rewards
    console.log('\n🎁 Checking loyalty rewards...');
    const rewards = await prisma.loyaltyReward.findMany({
      include: {
        specialist: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    console.log(`Found ${rewards.length} total rewards:`);
    rewards.forEach(reward => {
      console.log(`- ${reward.title} (${reward.pointsRequired} pts, ${reward.isActive ? 'ACTIVE' : 'INACTIVE'}) by ${reward.specialist?.firstName || 'Unknown'}`);
    });

    const activeRewards = rewards.filter(r => r.isActive);
    console.log(`\n✅ ${activeRewards.length} active rewards available`);

    if (activeRewards.length === 0) {
      console.log('❌ No active rewards found! Make sure rewards are created and marked as active.');
    }

    console.log('\n🔧 Fixes completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixLoyaltyIssues();