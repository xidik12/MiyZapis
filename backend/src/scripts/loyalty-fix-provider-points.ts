import { prisma } from '@/config/database';
import LoyaltyService from '@/services/loyalty';
import { logger } from '@/utils/logger';

/**
 * Correct historical loyalty points where specialists were credited booking completion points
 * for services they provided (should be only for customers).
 *
 * Usage:
 *   npx tsx src/scripts/loyalty-fix-provider-points.ts --mode=report
 *   npx tsx src/scripts/loyalty-fix-provider-points.ts --mode=compensate --confirm=YES
 *   npx tsx src/scripts/loyalty-fix-provider-points.ts --mode=reassign --confirm=YES
 *
 * Modes:
 *   - report:    Only prints totals and what would be changed (default)
 *   - compensate:Creates offsetting negative ADJUSTMENT transactions for invalid specialist entries
 *   - reassign:  Compensates invalid specialist entries and awards same points to the booking customer
 *
 * Safety:
 *   Any mode that mutates requires --confirm=YES
 */

type Mode = 'report' | 'compensate' | 'reassign';

const parseArgs = (): { mode: Mode; confirm: boolean } => {
  const args = process.argv.slice(2);
  const get = (k: string) => {
    const p = args.find(a => a.startsWith(`--${k}=`));
    return p ? p.split('=')[1] : undefined;
  };
  const mode = (get('mode') as Mode) || 'report';
  const confirm = (get('confirm') || '').toUpperCase() === 'YES';
  return { mode, confirm };
};

async function main() {
  const { mode, confirm } = parseArgs();
  logger.info('Starting loyalty provider-points correction script', { mode, confirm });

  // Find candidate transactions
  const txs = await prisma.loyaltyTransaction.findMany({
    where: {
      reason: 'BOOKING_COMPLETED',
      points: { gt: 0 },
      NOT: { referenceId: null }
    }
  });

  if (txs.length === 0) {
    logger.info('No BOOKING_COMPLETED transactions with positive points and referenceId found.');
    return;
  }

  // Load bookings for referenceIds
  const bookingIds = Array.from(new Set(txs.map(t => t.referenceId!)));
  const bookings = await prisma.booking.findMany({
    where: { id: { in: bookingIds } },
    select: { id: true, customerId: true }
  });
  const bookingById = new Map(bookings.map(b => [b.id, b.customerId]));

  const invalid = txs.filter(t => {
    const cust = bookingById.get(t.referenceId!);
    return !cust || cust !== t.userId;
  });

  const totalInvalid = invalid.length;
  const totalPoints = invalid.reduce((s, t) => s + t.points, 0);
  const byUser = invalid.reduce<Record<string, number>>((acc, t) => {
    acc[t.userId] = (acc[t.userId] || 0) + t.points;
    return acc;
  }, {});

  logger.info('Invalid provider-attributed transactions detected', {
    totalInvalid,
    totalPoints,
    usersAffected: Object.keys(byUser).length
  });

  if (mode === 'report') {
    console.log('Top affected users (userId -> points):');
    Object.entries(byUser).slice(0, 20).forEach(([u, p]) => console.log(`  ${u} -> ${p}`));
    return;
  }

  if (!confirm) {
    logger.warn('Mutation requested but --confirm=YES not provided. Aborting.');
    return;
  }

  let corrected = 0;
  for (const t of invalid) {
    const bookingCustomerId = bookingById.get(t.referenceId!);
    try {
      await prisma.$transaction(async (tx) => {
        // Compensate the specialist (remove points via ADJUSTMENT)
        await tx.loyaltyTransaction.create({
          data: {
            userId: t.userId,
            type: 'ADJUSTMENT',
            points: -t.points,
            reason: 'PROVIDER_POINTS_CORRECTION',
            description: `Correction for booking ${t.referenceId}`,
            referenceId: t.referenceId || undefined
          }
        });
        await tx.user.update({
          where: { id: t.userId },
          data: { loyaltyPoints: { decrement: t.points } }
        });

        // Reassign to customer if requested and customer known
        if (mode === 'reassign' && bookingCustomerId) {
          await LoyaltyService.earnPoints({
            userId: bookingCustomerId,
            points: t.points,
            reason: 'BOOKING_COMPLETED_CORRECTION',
            description: `Reassigned points for booking ${t.referenceId}`,
            referenceId: t.referenceId || undefined
          });
        }
      });
      corrected += 1;
    } catch (e: unknown) {
      logger.error('Failed to correct transaction', { txId: t.id, error: e?.message || e });
    }
  }

  logger.info('Correction completed', { corrected, totalInvalid, mode });
}

main()
  .then(() => {
    logger.info('Script finished');
    process.exit(0);
  })
  .catch((err) => {
    logger.error('Script failed', err);
    process.exit(1);
  });

