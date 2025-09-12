/**
 * Quick script to fix loyalty points discrepancy for a specific user
 * This recalculates loyalty points from transactions and updates the user table
 */

const { PrismaClient } = require('@prisma/client');

async function fixUserLoyaltyPoints() {
    const prisma = new PrismaClient();
    
    try {
        console.log('🔍 Finding users with loyalty point discrepancies...\n');

        // Get all users with their loyalty points
        const users = await prisma.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                loyaltyPoints: true,
            }
        });

        for (const user of users) {
            // Calculate correct total from transactions
            const transactions = await prisma.loyaltyTransaction.findMany({
                where: { userId: user.id },
                select: { points: true, type: true, reason: true, createdAt: true }
            });

            const correctTotal = transactions.reduce((sum, tx) => sum + tx.points, 0);
            const currentTotal = user.loyaltyPoints || 0;
            const difference = correctTotal - currentTotal;

            if (difference !== 0) {
                console.log(`🔧 User: ${user.firstName} ${user.lastName} (${user.email})`);
                console.log(`   Current: ${currentTotal} points`);
                console.log(`   Correct: ${correctTotal} points`);
                console.log(`   Difference: ${difference} points`);
                console.log(`   Recent transactions:`);
                
                transactions.slice(-3).forEach(tx => {
                    console.log(`      ${tx.createdAt.toISOString().split('T')[0]} | ${tx.points} pts | ${tx.reason}`);
                });

                // Update user's loyalty points
                await prisma.user.update({
                    where: { id: user.id },
                    data: { loyaltyPoints: correctTotal }
                });

                console.log(`   ✅ Fixed! Updated to ${correctTotal} points\n`);
            } else if (transactions.length > 0) {
                console.log(`✅ User: ${user.firstName} ${user.lastName} - Already correct (${currentTotal} points)`);
            }
        }

        console.log('✅ Loyalty points recalculation completed!');

    } catch (error) {
        console.error('❌ Error fixing loyalty points:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixUserLoyaltyPoints();
