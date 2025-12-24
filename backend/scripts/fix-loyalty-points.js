/**
 * Script to investigate and fix loyalty points discrepancies
 * This script will check if user's total loyalty points match their transaction sum
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigateLoyaltyPoints(userId = null) {
    try {
        console.log('🔍 Investigating loyalty points discrepancies...\n');

        // Get all users or specific user
        const whereClause = userId ? { id: userId } : {};
        const users = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                loyaltyPoints: true
            }
        });

        console.log(`Found ${users.length} user(s) to check.\n`);

        for (const user of users) {
            console.log(`👤 Checking user: ${user.firstName} ${user.lastName} (${user.email})`);
            console.log(`📊 Current loyaltyPoints field: ${user.loyaltyPoints}`);

            // Calculate total points from transactions
            const transactions = await prisma.loyaltyTransaction.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' }
            });

            const totalFromTransactions = transactions.reduce((sum, tx) => sum + tx.points, 0);
            console.log(`💰 Total from transactions: ${totalFromTransactions}`);

            // Show recent transactions
            console.log(`📝 Recent transactions (${transactions.length} total):`);
            transactions.slice(0, 5).forEach(tx => {
                console.log(`   ${tx.createdAt.toISOString().split('T')[0]} | ${tx.type} | ${tx.points} pts | ${tx.reason}`);
            });

            const difference = totalFromTransactions - user.loyaltyPoints;
            if (difference !== 0) {
                console.log(`❌ DISCREPANCY FOUND: ${difference} point difference`);
                console.log(`   Transaction sum: ${totalFromTransactions}`);
                console.log(`   User field: ${user.loyaltyPoints}`);
                console.log(`   Need to ${difference > 0 ? 'ADD' : 'SUBTRACT'} ${Math.abs(difference)} points\n`);
            } else {
                console.log(`✅ Points match perfectly!\n`);
            }
        }
    } catch (error) {
        console.error('Error investigating loyalty points:', error);
    }
}

async function fixLoyaltyPoints(userId = null) {
    try {
        console.log('🔧 Fixing loyalty points discrepancies...\n');

        // Get all users or specific user
        const whereClause = userId ? { id: userId } : {};
        const users = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                loyaltyPoints: true
            }
        });

        for (const user of users) {
            console.log(`👤 Processing user: ${user.firstName} ${user.lastName} (${user.email})`);

            // Calculate correct total points from transactions
            const transactions = await prisma.loyaltyTransaction.findMany({
                where: { userId: user.id }
            });

            const correctTotal = transactions.reduce((sum, tx) => sum + tx.points, 0);
            console.log(`Current: ${user.loyaltyPoints}, Correct: ${correctTotal}`);

            if (correctTotal !== user.loyaltyPoints) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { loyaltyPoints: correctTotal }
                });
                console.log(`✅ Updated user ${user.email} from ${user.loyaltyPoints} to ${correctTotal} points`);
            } else {
                console.log(`✅ User ${user.email} already has correct points`);
            }
        }
    } catch (error) {
        console.error('Error fixing loyalty points:', error);
    }
}

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    const userId = args[1];

    switch (command) {
        case 'investigate':
            await investigateLoyaltyPoints(userId);
            break;
        case 'fix':
            await fixLoyaltyPoints(userId);
            break;
        default:
            console.log('Usage:');
            console.log('  node fix-loyalty-points.js investigate [userId]  - Check for discrepancies');
            console.log('  node fix-loyalty-points.js fix [userId]          - Fix discrepancies');
            break;
    }

    await prisma.$disconnect();
}

main().catch(console.error);
