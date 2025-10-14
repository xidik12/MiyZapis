import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateAdvertisementData {
  advertiserId: string;
  type: 'SERVICE_PAGE_BANNER' | 'SEARCH_SIDEBAR';
  placement: 'TOP' | 'SIDEBAR' | 'BOTTOM';
  title: string;
  titleKh?: string;
  description: string;
  descriptionKh?: string;
  imageUrl?: string;
  linkUrl: string;
  callToAction?: string;
  targetCategories?: string[];
  targetLocations?: string[];
  targetUserType?: 'CUSTOMER' | 'SPECIALIST' | 'ALL';
  dailyBudget?: number;
  totalBudget?: number;
  costPerClick?: number;
  startDate: Date;
  endDate: Date;
}

interface UpdateAdvertisementData {
  title?: string;
  titleKh?: string;
  description?: string;
  descriptionKh?: string;
  imageUrl?: string;
  linkUrl?: string;
  callToAction?: string;
  targetCategories?: string[];
  targetLocations?: string[];
  targetUserType?: 'CUSTOMER' | 'SPECIALIST' | 'ALL';
  dailyBudget?: number;
  totalBudget?: number;
  costPerClick?: number;
  startDate?: Date;
  endDate?: Date;
  status?: 'PENDING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'REJECTED';
  isActive?: boolean;
}

export class AdvertisementService {
  /**
   * Create a new advertisement
   */
  static async createAdvertisement(data: CreateAdvertisementData) {
    const advertisement = await prisma.advertisement.create({
      data: {
        advertiserId: data.advertiserId,
        type: data.type,
        placement: data.placement,
        title: data.title,
        titleKh: data.titleKh,
        description: data.description,
        descriptionKh: data.descriptionKh,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl,
        callToAction: data.callToAction,
        targetCategories: data.targetCategories ? JSON.stringify(data.targetCategories) : null,
        targetLocations: data.targetLocations ? JSON.stringify(data.targetLocations) : null,
        targetUserType: data.targetUserType || 'ALL',
        dailyBudget: data.dailyBudget,
        totalBudget: data.totalBudget,
        costPerClick: data.costPerClick || 0.5,
        startDate: data.startDate,
        endDate: data.endDate,
        status: 'PENDING',
        isActive: false,
      },
      include: {
        advertiser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return advertisement;
  }

  /**
   * Get advertisement by ID
   */
  static async getAdvertisementById(id: string, advertiserId?: string) {
    const where: any = { id };
    if (advertiserId) {
      where.advertiserId = advertiserId;
    }

    return prisma.advertisement.findUnique({
      where,
      include: {
        advertiser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
   * Get all advertisements for an advertiser
   */
  static async getAdvertiserAds(advertiserId: string, filters?: {
    status?: string;
    type?: string;
    skip?: number;
    limit?: number;
  }) {
    const where: any = { advertiserId };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.type) {
      where.type = filters.type;
    }

    const [ads, total] = await Promise.all([
      prisma.advertisement.findMany({
        where,
        include: {
          advertiser: {
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
      prisma.advertisement.count({ where }),
    ]);

    return { ads, total };
  }

  /**
   * Update advertisement
   */
  static async updateAdvertisement(id: string, advertiserId: string, data: UpdateAdvertisementData) {
    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.titleKh !== undefined) updateData.titleKh = data.titleKh;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.descriptionKh !== undefined) updateData.descriptionKh = data.descriptionKh;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.linkUrl !== undefined) updateData.linkUrl = data.linkUrl;
    if (data.callToAction !== undefined) updateData.callToAction = data.callToAction;
    if (data.targetCategories !== undefined) updateData.targetCategories = JSON.stringify(data.targetCategories);
    if (data.targetLocations !== undefined) updateData.targetLocations = JSON.stringify(data.targetLocations);
    if (data.targetUserType !== undefined) updateData.targetUserType = data.targetUserType;
    if (data.dailyBudget !== undefined) updateData.dailyBudget = data.dailyBudget;
    if (data.totalBudget !== undefined) updateData.totalBudget = data.totalBudget;
    if (data.costPerClick !== undefined) updateData.costPerClick = data.costPerClick;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return prisma.advertisement.update({
      where: {
        id,
        advertiserId,
      },
      data: updateData,
      include: {
        advertiser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Delete advertisement
   */
  static async deleteAdvertisement(id: string, advertiserId: string) {
    return prisma.advertisement.delete({
      where: {
        id,
        advertiserId,
      },
    });
  }

  /**
   * Get active advertisements for display (public-facing)
   */
  static async getActiveAds(filters: {
    type?: 'SERVICE_PAGE_BANNER' | 'SEARCH_SIDEBAR';
    placement?: 'TOP' | 'SIDEBAR' | 'BOTTOM';
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
      OR: [
        { totalBudget: null },
        { spentAmount: { lt: prisma.advertisement.fields.totalBudget } },
      ],
    };

    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.placement) {
      where.placement = filters.placement;
    }

    // Get ads
    let ads = await prisma.advertisement.findMany({
      where,
      select: {
        id: true,
        type: true,
        placement: true,
        title: true,
        titleKh: true,
        description: true,
        descriptionKh: true,
        imageUrl: true,
        linkUrl: true,
        callToAction: true,
        targetCategories: true,
        targetLocations: true,
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 5,
    });

    // Filter by category/location if provided
    if (filters.category || filters.location) {
      ads = ads.filter((ad) => {
        if (filters.category && ad.targetCategories) {
          const categories = JSON.parse(ad.targetCategories);
          if (!categories.includes(filters.category)) return false;
        }
        if (filters.location && ad.targetLocations) {
          const locations = JSON.parse(ad.targetLocations);
          if (!locations.includes(filters.location)) return false;
        }
        return true;
      });
    }

    return ads;
  }

  /**
   * Track ad impression
   */
  static async trackImpression(adId: string) {
    await prisma.advertisement.update({
      where: { id: adId },
      data: {
        impressions: { increment: 1 },
      },
    });

    // Update daily analytics
    await this.updateDailyAnalytics(adId, { impressions: 1 });
  }

  /**
   * Track ad click
   */
  static async trackClick(adId: string) {
    const ad = await prisma.advertisement.update({
      where: { id: adId },
      data: {
        clicks: { increment: 1 },
        spentAmount: { increment: prisma.advertisement.fields.costPerClick },
      },
    });

    // Update daily analytics
    await this.updateDailyAnalytics(adId, {
      clicks: 1,
      spent: ad.costPerClick,
    });

    // Check if budget is exhausted
    if (ad.totalBudget && ad.spentAmount >= ad.totalBudget) {
      await prisma.advertisement.update({
        where: { id: adId },
        data: {
          status: 'COMPLETED',
          isActive: false,
        },
      });
    }

    return ad;
  }

  /**
   * Track ad conversion (booking)
   */
  static async trackConversion(adId: string) {
    await prisma.advertisement.update({
      where: { id: adId },
      data: {
        conversions: { increment: 1 },
      },
    });

    // Update daily analytics
    await this.updateDailyAnalytics(adId, { conversions: 1 });
  }

  /**
   * Update daily analytics
   */
  private static async updateDailyAnalytics(
    adId: string,
    data: {
      impressions?: number;
      clicks?: number;
      conversions?: number;
      spent?: number;
    }
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.adAnalytics.findUnique({
      where: {
        adId_date: {
          adId,
          date: today,
        },
      },
    });

    if (existing) {
      const updateData: any = {};
      if (data.impressions) updateData.impressions = { increment: data.impressions };
      if (data.clicks) updateData.clicks = { increment: data.clicks };
      if (data.conversions) updateData.conversions = { increment: data.conversions };
      if (data.spent) updateData.spent = { increment: data.spent };

      await prisma.adAnalytics.update({
        where: {
          adId_date: {
            adId,
            date: today,
          },
        },
        data: updateData,
      });
    } else {
      await prisma.adAnalytics.create({
        data: {
          adId,
          date: today,
          impressions: data.impressions || 0,
          clicks: data.clicks || 0,
          conversions: data.conversions || 0,
          spent: data.spent || 0,
          ctr: data.clicks && data.impressions ? (data.clicks / data.impressions) * 100 : 0,
          conversionRate: data.conversions && data.clicks ? (data.conversions / data.clicks) * 100 : 0,
          costPerConversion: data.spent && data.conversions ? data.spent / data.conversions : 0,
        },
      });
    }
  }

  /**
   * Get advertisement analytics
   */
  static async getAnalytics(adId: string, advertiserId: string, period?: { startDate: Date; endDate: Date }) {
    const where: any = { adId };

    if (period) {
      where.date = {
        gte: period.startDate,
        lte: period.endDate,
      };
    }

    const analytics = await prisma.adAnalytics.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    // Calculate totals
    const totals = analytics.reduce(
      (acc, day) => ({
        impressions: acc.impressions + day.impressions,
        clicks: acc.clicks + day.clicks,
        conversions: acc.conversions + day.conversions,
        spent: acc.spent + day.spent,
      }),
      { impressions: 0, clicks: 0, conversions: 0, spent: 0 }
    );

    const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
    const conversionRate = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;
    const costPerConversion = totals.conversions > 0 ? totals.spent / totals.conversions : 0;

    return {
      daily: analytics,
      totals: {
        ...totals,
        ctr,
        conversionRate,
        costPerConversion,
      },
    };
  }

  /**
   * Admin: Review advertisement
   */
  static async reviewAdvertisement(
    adId: string,
    reviewerId: string,
    approved: boolean,
    rejectionReason?: string
  ) {
    return prisma.advertisement.update({
      where: { id: adId },
      data: {
        status: approved ? 'ACTIVE' : 'REJECTED',
        isActive: approved,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        rejectionReason: rejectionReason || null,
      },
    });
  }

  /**
   * Pause/Resume advertisement
   */
  static async toggleAdvertisement(adId: string, advertiserId: string, pause: boolean) {
    return prisma.advertisement.update({
      where: {
        id: adId,
        advertiserId,
      },
      data: {
        status: pause ? 'PAUSED' : 'ACTIVE',
        isActive: !pause,
      },
    });
  }
}
