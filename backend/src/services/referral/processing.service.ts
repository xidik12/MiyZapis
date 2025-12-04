import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { ReferralService } from './index';

export class ReferralProcessingService {

  // Process referral completion when a booking is completed
  static async processBookingCompletion(bookingId: string) {
    try {
      // Get the booking details
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          customer: true,
          service: true
        }
      });

      if (!booking) {
        throw new Error('BOOKING_NOT_FOUND');
      }

      // Check if this was the customer's first completed booking
      const completedBookingCount = await prisma.booking.count({
        where: {
          customerId: booking.customerId,
          status: 'COMPLETED'
        }
      });

      if (completedBookingCount === 1) {
        // This is the first completed booking - process any pending referrals
        const pendingReferrals = await prisma.loyaltyReferral.findMany({
          where: {
            referredId: booking.customerId,
            status: 'PENDING',
            firstBookingId: bookingId
          }
        });

        for (const referral of pendingReferrals) {
          try {
            await ReferralService.processReferralCompletion({
              referralCode: referral.referralCode,
              referredUserId: booking.customerId,
              firstBookingId: bookingId
            });

            logger.info('Referral completed successfully', {
              referralId: referral.id,
              referralCode: referral.referralCode,
              customerId: booking.customerId,
              bookingId: bookingId
            });
          } catch (error) {
            logger.error('Failed to complete referral', {
              referralId: referral.id,
              referralCode: referral.referralCode,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      }
    } catch (error) {
      logger.error('Failed to process booking completion for referrals', {
        bookingId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Check for expired referrals and clean them up (can be run as a cron job)
  static async cleanupExpiredReferrals() {
    try {
      const count = await ReferralService.cleanupExpiredReferrals();
      logger.info('Cleaned up expired referrals', { count });
      return count;
    } catch (error) {
      logger.error('Failed to cleanup expired referrals', { error });
      throw error;
    }
  }

  // Get referral performance summary for admin dashboard
  static async getReferralPerformanceSummary() {
    try {
      const [totalReferrals, completedReferrals, pendingReferrals, expiredReferrals] = await Promise.all([
        // Total referrals
        prisma.loyaltyReferral.count(),

        // Completed referrals
        prisma.loyaltyReferral.count({
          where: { status: 'COMPLETED' }
        }),

        // Pending referrals
        prisma.loyaltyReferral.count({
          where: { status: 'PENDING' }
        }),

        // Expired referrals
        prisma.loyaltyReferral.count({
          where: { status: 'EXPIRED' }
        })
      ]);

      // Get referrals by type
      const referralsByType = await prisma.loyaltyReferral.groupBy({
        by: ['referralType'],
        _count: {
          id: true
        }
      });

      // Get conversion rate data
      const conversionRate = totalReferrals > 0 ? (completedReferrals / totalReferrals) * 100 : 0;

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentReferrals = await prisma.loyaltyReferral.count({
        where: {
          createdAt: { gte: sevenDaysAgo }
        }
      });

      const recentCompletions = await prisma.loyaltyReferral.count({
        where: {
          completedAt: { gte: sevenDaysAgo }
        }
      });

      // Get top referrers
      const topReferrers = await prisma.loyaltyReferral.groupBy({
        by: ['referrerId'],
        where: { status: 'COMPLETED' },
        _count: { id: true },
        orderBy: {
          _count: { id: 'desc' }
        },
        take: 10
      });

      // Get referrer details
      const referrerIds = topReferrers.map(r => r.referrerId);
      const referrerDetails = await prisma.user.findMany({
        where: { id: { in: referrerIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          userType: true
        }
      });

      const topReferrersWithDetails = topReferrers.map(referrer => {
        const details = referrerDetails.find(d => d.id === referrer.referrerId);
        return {
          userId: referrer.referrerId,
          name: details ? `${details.firstName} ${details.lastName}` : 'Unknown',
          userType: details?.userType || 'UNKNOWN',
          completedReferrals: referrer._count.id
        };
      });

      return {
        overview: {
          totalReferrals,
          completedReferrals,
          pendingReferrals,
          expiredReferrals,
          conversionRate: Math.round(conversionRate * 100) / 100
        },
        byType: referralsByType.reduce((acc, item) => {
          acc[item.referralType] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        recentActivity: {
          newReferrals: recentReferrals,
          completedReferrals: recentCompletions
        },
        topReferrers: topReferrersWithDetails
      };
    } catch (error) {
      logger.error('Failed to get referral performance summary', { error });
      throw error;
    }
  }

  // Validate referral link and track view
  static async validateAndTrackReferralLink(referralCode: string) {
    try {
      // Get referral details
      const referral = await ReferralService.getReferralByCode(referralCode);

      // Track the view
      await ReferralService.trackReferralActivity(referralCode, 'VIEW');

      return {
        isValid: true,
        referral: {
          code: referral.referralCode,
          type: referral.referralType,
          targetUserType: referral.targetUserType,
          referrerName: `${referral.referrer.firstName} ${referral.referrer.lastName}`,
          reward: {
            type: referral.referredRewardType,
            value: referral.referredRewardValue
          },
          customMessage: referral.customMessage,
          expiresAt: referral.expiresAt
        }
      };
    } catch (error) {
      logger.error('Error validating referral link', { referralCode, error });

      if (error instanceof Error) {
        switch (error.message) {
          case 'REFERRAL_NOT_FOUND':
            return { isValid: false, error: 'Referral code not found' };
          case 'REFERRAL_EXPIRED':
            return { isValid: false, error: 'Referral code has expired' };
          default:
            return { isValid: false, error: 'Invalid referral code' };
        }
      }

      return { isValid: false, error: 'Failed to validate referral code' };
    }
  }

  // Track referral click (when user clicks on referral link)
  static async trackReferralClick(referralCode: string) {
    try {
      await ReferralService.trackReferralActivity(referralCode, 'CLICK');
      return { success: true };
    } catch (error) {
      logger.error('Error tracking referral click', { referralCode, error });
      return { success: false };
    }
  }
}