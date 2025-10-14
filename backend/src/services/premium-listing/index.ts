import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreatePremiumListingData {
  specialistId: string;
  type: 'FEATURED' | 'SPONSORED' | 'TOP_RATED';
  category?: string;
  location?: string;
  boostMultiplier?: number;
  priority?: number;
  price: number;
  billingType: 'ONE_TIME' | 'WEEKLY' | 'MONTHLY';
  startDate: Date;
  duration: number; // in days
}

export class PremiumListingService {
  /**
   * Create a premium listing
   */
  static async createPremiumListing(data: CreatePremiumListingData) {
    const endDate = new Date(data.startDate);
    endDate.setDate(endDate.getDate() + data.duration);

    const listing = await prisma.premiumListing.create({
      data: {
        specialistId: data.specialistId,
        type: data.type,
        category: data.category,
        location: data.location,
        boostMultiplier: data.boostMultiplier || 10.0,
        priority: data.priority || 5,
        price: data.price,
        billingType: data.billingType,
        startDate: data.startDate,
        endDate,
        status: 'ACTIVE',
        isActive: true,
        paidAmount: data.price,
        paymentDate: new Date(),
      },
      include: {
        specialist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            specialist: {
              select: {
                businessName: true,
                rating: true,
                reviewCount: true,
              },
            },
          },
        },
      },
    });

    return listing;
  }

  /**
   * Get premium listing by ID
   */
  static async getPremiumListingById(id: string, specialistId?: string) {
    const where: any = { id };
    if (specialistId) {
      where.specialistId = specialistId;
    }

    return prisma.premiumListing.findUnique({
      where,
      include: {
        specialist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialist: {
              select: {
                businessName: true,
                rating: true,
                reviewCount: true,
              },
            },
          },
        },
        analytics: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    });
  }

  /**
   * Get all premium listings for a specialist
   */
  static async getSpecialistListings(specialistId: string, filters?: {
    status?: string;
    skip?: number;
    limit?: number;
  }) {
    const where: any = { specialistId };

    if (filters?.status) {
      where.status = filters.status;
    }

    const [listings, total] = await Promise.all([
      prisma.premiumListing.findMany({
        where,
        include: {
          specialist: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: filters?.skip || 0,
        take: filters?.limit || 10,
      }),
      prisma.premiumListing.count({ where }),
    ]);

    return { listings, total };
  }

  /**
   * Get active premium listings for search results
   */
  static async getActivePremiumListings(filters?: {
    category?: string;
    location?: string;
    limit?: number;
  }) {
    const now = new Date();

    const where: any = {
      isActive: true,
      status: 'ACTIVE',
      startDate: { lte: now },
      endDate: { gte: now },
    };

    if (filters?.category) {
      where.OR = [{ category: filters.category }, { category: null }];
    }
    if (filters?.location) {
      where.OR = [...(where.OR || []), { location: filters.location }, { location: null }];
    }

    const listings = await prisma.premiumListing.findMany({
      where,
      include: {
        specialist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialist: {
              select: {
                id: true,
                businessName: true,
                rating: true,
                reviewCount: true,
                city: true,
                specialties: true,
              },
            },
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { boostMultiplier: 'desc' }],
      take: filters?.limit || 10,
    });

    return listings;
  }

  /**
   * Check if specialist has active premium listing
   */
  static async hasActivePremiumListing(specialistId: string, category?: string) {
    const now = new Date();

    const where: any = {
      specialistId,
      isActive: true,
      status: 'ACTIVE',
      startDate: { lte: now },
      endDate: { gte: now },
    };

    if (category) {
      where.OR = [{ category }, { category: null }];
    }

    const listing = await prisma.premiumListing.findFirst({ where });
    return !!listing;
  }

  /**
   * Track premium listing impression
   */
  static async trackImpression(listingId: string) {
    await prisma.premiumListing.update({
      where: { id: listingId },
      data: {
        impressions: { increment: 1 },
      },
    });

    // Update daily analytics
    await this.updateDailyAnalytics(listingId, { impressions: 1 });
  }

  /**
   * Track premium listing click
   */
  static async trackClick(listingId: string) {
    await prisma.premiumListing.update({
      where: { id: listingId },
      data: {
        clicks: { increment: 1 },
      },
    });

    // Update daily analytics
    await this.updateDailyAnalytics(listingId, { clicks: 1 });
  }

  /**
   * Track premium listing conversion (booking)
   */
  static async trackConversion(listingId: string, bookingAmount: number) {
    await prisma.premiumListing.update({
      where: { id: listingId },
      data: {
        conversions: { increment: 1 },
      },
    });

    // Update daily analytics
    await this.updateDailyAnalytics(listingId, {
      conversions: 1,
      revenue: bookingAmount,
    });
  }

  /**
   * Update daily analytics
   */
  private static async updateDailyAnalytics(
    listingId: string,
    data: {
      impressions?: number;
      clicks?: number;
      conversions?: number;
      revenue?: number;
    }
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.premiumListingAnalytics.findUnique({
      where: {
        listingId_date: {
          listingId,
          date: today,
        },
      },
    });

    if (existing) {
      const updateData: any = {};
      if (data.impressions) updateData.impressions = { increment: data.impressions };
      if (data.clicks) updateData.clicks = { increment: data.clicks };
      if (data.conversions) updateData.conversions = { increment: data.conversions };
      if (data.revenue) updateData.revenue = { increment: data.revenue };

      const updated = await prisma.premiumListingAnalytics.update({
        where: {
          listingId_date: {
            listingId,
            date: today,
          },
        },
        data: updateData,
      });

      // Recalculate metrics
      await prisma.premiumListingAnalytics.update({
        where: { id: updated.id },
        data: {
          ctr: updated.impressions > 0 ? (updated.clicks / updated.impressions) * 100 : 0,
          conversionRate: updated.clicks > 0 ? (updated.conversions / updated.clicks) * 100 : 0,
          averageBookingValue: updated.conversions > 0 ? updated.revenue / updated.conversions : 0,
        },
      });
    } else {
      await prisma.premiumListingAnalytics.create({
        data: {
          listingId,
          date: today,
          impressions: data.impressions || 0,
          clicks: data.clicks || 0,
          conversions: data.conversions || 0,
          revenue: data.revenue || 0,
          ctr: data.clicks && data.impressions ? (data.clicks / data.impressions) * 100 : 0,
          conversionRate: data.conversions && data.clicks ? (data.conversions / data.clicks) * 100 : 0,
          averageBookingValue: data.revenue && data.conversions ? data.revenue / data.conversions : 0,
        },
      });
    }
  }

  /**
   * Get premium listing analytics
   */
  static async getAnalytics(
    listingId: string,
    specialistId: string,
    period?: { startDate: Date; endDate: Date }
  ) {
    const where: any = { listingId };

    if (period) {
      where.date = {
        gte: period.startDate,
        lte: period.endDate,
      };
    }

    const analytics = await prisma.premiumListingAnalytics.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    // Calculate totals
    const totals = analytics.reduce(
      (acc, day) => ({
        impressions: acc.impressions + day.impressions,
        clicks: acc.clicks + day.clicks,
        conversions: acc.conversions + day.conversions,
        revenue: acc.revenue + day.revenue,
      }),
      { impressions: 0, clicks: 0, conversions: 0, revenue: 0 }
    );

    const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
    const conversionRate = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;
    const averageBookingValue = totals.conversions > 0 ? totals.revenue / totals.conversions : 0;

    return {
      daily: analytics,
      totals: {
        ...totals,
        ctr,
        conversionRate,
        averageBookingValue,
      },
    };
  }

  /**
   * Pause/Resume premium listing
   */
  static async toggleListing(listingId: string, specialistId: string, pause: boolean) {
    return prisma.premiumListing.update({
      where: {
        id: listingId,
        specialistId,
      },
      data: {
        status: pause ? 'PAUSED' : 'ACTIVE',
        isActive: !pause,
      },
    });
  }

  /**
   * Renew premium listing
   */
  static async renewListing(listingId: string, specialistId: string, duration: number) {
    const listing = await prisma.premiumListing.findUnique({
      where: { id: listingId, specialistId },
    });

    if (!listing) {
      throw new Error('Premium listing not found');
    }

    const newEndDate = new Date(listing.endDate);
    newEndDate.setDate(newEndDate.getDate() + duration);

    return prisma.premiumListing.update({
      where: { id: listingId },
      data: {
        endDate: newEndDate,
        status: 'ACTIVE',
        isActive: true,
      },
    });
  }

  /**
   * Cancel premium listing
   */
  static async cancelListing(listingId: string, specialistId: string) {
    return prisma.premiumListing.update({
      where: {
        id: listingId,
        specialistId,
      },
      data: {
        status: 'EXPIRED',
        isActive: false,
        endDate: new Date(),
      },
    });
  }

  /**
   * Get premium listing pricing
   */
  static getPricing() {
    return {
      FEATURED: {
        ONE_TIME: { 7: 20, 14: 35, 30: 60 }, // 7 days: $20, 14 days: $35, 30 days: $60
        WEEKLY: 15,
        MONTHLY: 50,
      },
      SPONSORED: {
        ONE_TIME: { 7: 15, 14: 25, 30: 45 },
        WEEKLY: 10,
        MONTHLY: 35,
      },
      TOP_RATED: {
        ONE_TIME: { 7: 10, 14: 18, 30: 30 },
        WEEKLY: 8,
        MONTHLY: 25,
      },
    };
  }
}
