import { logger } from '@/utils/logger';
import { prisma } from '@/config/database';

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  specialistId?: string;
  serviceId?: string;
  status?: string;
  groupBy?: 'day' | 'week' | 'month' | 'year';
}

export interface SpecialistAnalyticsData {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  responseTimeAvg: number;
  conversionRate: number;
  repeatCustomerRate: number;
  revenueGrowth: number;
  bookingGrowth: number;
  topServices: Array<{
    serviceId: string;
    serviceName: string;
    bookingCount: number;
    revenue: number;
  }>;
  revenueByMonth: Array<any>;
  bookingsByStatus: Record<string, number>;
  bookingsByCategory: Array<any>;
  recentBookings: Array<any>;
  upcomingBookings: Array<any>;
  popularServices: Array<{
    serviceId: string;
    serviceName: string;
    bookingCount: number;
    revenue: number;
  }>;
  recentReviews: Array<{
    id: string;
    rating: number;
    comment: string;
    customerName: string;
    createdAt: Date;
  }>;
  monthlyTrends: Array<{
    month: string;
    bookings: number;
    revenue: number;
    rating: number;
  }>;
}

export interface PlatformAnalyticsData {
  totalUsers: number;
  totalSpecialists: number;
  totalBookings: number;
  totalRevenue: number;
  averagePlatformRating: number;
  activeUsers: number;
  growthMetrics: {
    userGrowth: number;
    bookingGrowth: number;
    revenueGrowth: number;
  };
  topCategories: Array<{
    category: string;
    bookingCount: number;
    revenue: number;
  }>;
  topSpecialists: Array<{
    id: string;
    name: string;
    businessName: string;
    bookingCount: number;
    rating: number;
    revenue: number;
  }>;
  bookingStatusDistribution: {
    [status: string]: number;
  };
  dailyMetrics: Array<{
    date: string;
    bookings: number;
    revenue: number;
    newUsers: number;
  }>;
}

export class EnhancedAnalyticsService {
  /**
   * Get specialist analytics
   */
  static async getSpecialistAnalytics(
    specialistId: string,
    filters: AnalyticsFilters = {}
  ): Promise<SpecialistAnalyticsData> {
    try {
      // Validate specialist exists
      const specialist = await prisma.specialist.findUnique({
        where: { id: specialistId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!specialist) {
        // Return empty analytics instead of throwing error
        return {
          totalRevenue: 0,
          totalBookings: 0,
          completedBookings: 0,
          cancelledBookings: 0,
          pendingBookings: 0,
          averageRating: 0,
          totalReviews: 0,
          responseTimeAvg: 0,
          conversionRate: 0,
          repeatCustomerRate: 0,
          revenueGrowth: 0,
          bookingGrowth: 0,
          topServices: [],
          revenueByMonth: [],
          bookingsByStatus: {},
          bookingsByCategory: [],
          recentBookings: [],
          upcomingBookings: [],
          popularServices: [],
          recentReviews: [],
          monthlyTrends: []
        };
      }

      const { startDate, endDate } = filters;
      const dateFilter = this.buildDateFilter(startDate, endDate);

      // Base booking filter
      const bookingWhere = {
        specialistId: specialist.userId,
        ...dateFilter,
      };

      // Get basic metrics
      const [
        totalBookings,
        completedBookings,
        cancelledBookings,
        bookingDetails,
        reviews,
        popularServices,
      ] = await Promise.all([
        prisma.booking.count({ where: bookingWhere }),
        prisma.booking.count({ where: { ...bookingWhere, status: 'COMPLETED' } }),
        prisma.booking.count({ where: { ...bookingWhere, status: 'CANCELLED' } }),
        prisma.booking.findMany({
          where: bookingWhere,
          select: {
            totalAmount: true,
            status: true,
            customerId: true,
            service: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
            createdAt: true,
          },
        }),
        prisma.review.findMany({
          where: {
            specialistId,
            ...(startDate && { createdAt: { gte: startDate } }),
            ...(endDate && { createdAt: { lte: endDate } }),
          },
          include: {
            customer: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        this.getPopularServices(specialist.userId, dateFilter),
      ]);

      // Calculate revenue
      const totalRevenue = bookingDetails
        .filter(b => b.status === 'COMPLETED')
        .reduce((sum, b) => sum + Number(b.totalAmount), 0);

      // Calculate average rating
      const averageRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      // Calculate conversion rate (completed / total)
      const conversionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

      // Calculate repeat customer rate
      const uniqueCustomers = new Set(bookingDetails.map(b => b.customerId));
      const repeatCustomers = bookingDetails.reduce((acc, booking) => {
        acc[booking.customerId] = (acc[booking.customerId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const repeatCustomerCount = Object.values(repeatCustomers).filter(count => count > 1).length;
      const repeatCustomerRate = uniqueCustomers.size > 0 
        ? (repeatCustomerCount / uniqueCustomers.size) * 100 
        : 0;

      // Get monthly trends
      const monthlyTrends = await this.getMonthlyTrends(specialist.userId, filters);

      const pendingBookings = totalBookings - completedBookings - cancelledBookings;
      
      return {
        totalBookings,
        completedBookings,
        cancelledBookings,
        pendingBookings,
        totalRevenue,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length,
        responseTimeAvg: specialist.responseTime,
        conversionRate: Math.round(conversionRate * 10) / 10,
        repeatCustomerRate: Math.round(repeatCustomerRate * 10) / 10,
        revenueGrowth: 0, // TODO: Calculate revenue growth
        bookingGrowth: 0, // TODO: Calculate booking growth
        topServices: popularServices, // Use popularServices for topServices
        revenueByMonth: monthlyTrends,
        bookingsByStatus: { completed: completedBookings, cancelled: cancelledBookings, pending: pendingBookings },
        bookingsByCategory: [],
        recentBookings: [],
        upcomingBookings: [],
        popularServices,
        recentReviews: reviews.map(r => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment || '',
          customerName: `${r.customer.firstName} ${r.customer.lastName.charAt(0)}.`,
          createdAt: r.createdAt,
        })),
        monthlyTrends,
      };
    } catch (error) {
      logger.error('Error getting specialist analytics:', error);
      throw error;
    }
  }

  /**
   * Get platform analytics
   */
  static async getPlatformAnalytics(
    filters: AnalyticsFilters = {}
  ): Promise<PlatformAnalyticsData> {
    try {
      const { startDate, endDate } = filters;
      const dateFilter = this.buildDateFilter(startDate, endDate);

      // Calculate comparison period for growth metrics
      const periodLength = endDate && startDate 
        ? endDate.getTime() - startDate.getTime()
        : 30 * 24 * 60 * 60 * 1000; // Default 30 days

      const previousStartDate = startDate 
        ? new Date(startDate.getTime() - periodLength)
        : new Date(Date.now() - 2 * periodLength);
      
      const previousEndDate = startDate 
        ? new Date(startDate)
        : new Date(Date.now() - periodLength);

      const previousDateFilter = this.buildDateFilter(previousStartDate, previousEndDate);

      // Get current period metrics
      const [
        totalUsers,
        totalSpecialists,
        totalBookings,
        completedBookings,
        totalRevenue,
        activeUsers,
        topCategories,
        topSpecialists,
        bookingStatuses,
        dailyMetrics,
        allReviews,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.specialist.count(),
        prisma.booking.count({ where: dateFilter }),
        prisma.booking.findMany({
          where: { ...dateFilter, status: 'COMPLETED' },
          select: { totalAmount: true },
        }),
        prisma.booking.aggregate({
          where: { ...dateFilter, status: 'COMPLETED' },
          _sum: { totalAmount: true },
        }),
        prisma.user.count({
          where: {
            lastLoginAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        }),
        this.getTopCategories(dateFilter),
        this.getTopSpecialists(dateFilter),
        this.getBookingStatusDistribution(dateFilter),
        this.getDailyMetrics(filters),
        prisma.review.findMany({
          where: {
            ...(startDate && { createdAt: { gte: startDate } }),
            ...(endDate && { createdAt: { lte: endDate } }),
          },
          select: { rating: true },
        }),
      ]);

      // Get previous period metrics for growth calculation
      const [
        previousUsers,
        previousBookings,
        previousRevenue,
      ] = await Promise.all([
        prisma.user.count({
          where: {
            createdAt: previousDateFilter.createdAt,
          },
        }),
        prisma.booking.count({ where: previousDateFilter }),
        prisma.booking.aggregate({
          where: { ...previousDateFilter, status: 'COMPLETED' },
          _sum: { totalAmount: true },
        }),
      ]);

      // Calculate growth metrics
      const userGrowth = previousUsers > 0 
        ? ((totalUsers - previousUsers) / previousUsers) * 100 
        : 0;

      const bookingGrowth = previousBookings > 0 
        ? ((totalBookings - previousBookings) / previousBookings) * 100 
        : 0;

      const currentRevenue = totalRevenue._sum.totalAmount || 0;
      const prevRevenue = previousRevenue._sum.totalAmount || 0;
      const revenueGrowth = prevRevenue > 0 
        ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 
        : 0;

      // Calculate average platform rating
      const averagePlatformRating = allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0;

      return {
        totalUsers,
        totalSpecialists,
        totalBookings,
        totalRevenue: currentRevenue,
        averagePlatformRating: Math.round(averagePlatformRating * 10) / 10,
        activeUsers,
        growthMetrics: {
          userGrowth: Math.round(userGrowth * 10) / 10,
          bookingGrowth: Math.round(bookingGrowth * 10) / 10,
          revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        },
        topCategories,
        topSpecialists,
        bookingStatusDistribution: bookingStatuses,
        dailyMetrics,
      };
    } catch (error) {
      logger.error('Error getting platform analytics:', error);
      throw error;
    }
  }

  /**
   * Get popular services for a specialist
   */
  private static async getPopularServices(
    specialistUserId: string, 
    dateFilter: any
  ) {
    const services = await prisma.booking.groupBy({
      by: ['serviceId'],
      where: {
        specialistId: specialistUserId,
        status: 'COMPLETED',
        ...dateFilter,
      },
      _count: { serviceId: true },
      _sum: { totalAmount: true },
    });

    const serviceDetails = await prisma.service.findMany({
      where: {
        id: { in: services.map(s => s.serviceId) },
      },
      select: {
        id: true,
        name: true,
      },
    });

    return services.map(service => {
      const details = serviceDetails.find(d => d.id === service.serviceId);
      return {
        serviceId: service.serviceId,
        serviceName: details?.name || 'Unknown Service',
        bookingCount: service._count.serviceId,
        revenue: service._sum.totalAmount || 0,
      };
    }).sort((a, b) => b.bookingCount - a.bookingCount);
  }

  /**
   * Get monthly trends
   */
  private static async getMonthlyTrends(
    specialistUserId: string,
    filters: AnalyticsFilters
  ) {
    // This is a simplified implementation
    // In production, you might want to use raw SQL for better performance
    const months = [];
    const endDate = filters.endDate || new Date();
    const startDate = filters.startDate || new Date(endDate.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(endDate);
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setTime(monthEnd.getTime() - 1);

      const [bookings, revenue, reviews] = await Promise.all([
        prisma.booking.count({
          where: {
            specialistId: specialistUserId,
            status: 'COMPLETED',
            createdAt: { gte: monthStart, lte: monthEnd },
          },
        }),
        prisma.booking.aggregate({
          where: {
            specialistId: specialistUserId,
            status: 'COMPLETED',
            createdAt: { gte: monthStart, lte: monthEnd },
          },
          _sum: { totalAmount: true },
        }),
        prisma.review.findMany({
          where: {
            specialistId: specialistUserId,
            createdAt: { gte: monthStart, lte: monthEnd },
          },
          select: { rating: true },
        }),
      ]);

      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      months.unshift({
        month: monthStart.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        bookings,
        revenue: revenue._sum.totalAmount || 0,
        rating: Math.round(avgRating * 10) / 10,
      });
    }

    return months;
  }

  /**
   * Get top categories
   */
  private static async getTopCategories(dateFilter: any) {
    const categories = await prisma.booking.groupBy({
      by: ['serviceId'],
      where: {
        status: 'COMPLETED',
        ...dateFilter,
      },
      _count: { serviceId: true },
      _sum: { totalAmount: true },
    });

    const services = await prisma.service.findMany({
      where: {
        id: { in: categories.map(c => c.serviceId) },
      },
      select: {
        id: true,
        category: true,
      },
    });

    const categoryMap = categories.reduce((acc, cat) => {
      const service = services.find(s => s.id === cat.serviceId);
      const category = service?.category || 'Other';
      
      if (!acc[category]) {
        acc[category] = { bookingCount: 0, revenue: 0 };
      }
      
      acc[category].bookingCount += cat._count.serviceId;
      acc[category].revenue += cat._sum.totalAmount || 0;
      
      return acc;
    }, {} as Record<string, { bookingCount: number; revenue: number }>);

    return Object.entries(categoryMap)
      .map(([category, data]) => ({
        category,
        ...data,
      }))
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, 10);
  }

  /**
   * Get top specialists
   */
  private static async getTopSpecialists(dateFilter: any) {
    const specialists = await prisma.booking.groupBy({
      by: ['specialistId'],
      where: {
        status: 'COMPLETED',
        ...dateFilter,
      },
      _count: { specialistId: true },
      _sum: { totalAmount: true },
    });

    const specialistDetails = await prisma.user.findMany({
      where: {
        id: { in: specialists.map(s => s.specialistId) },
      },
      include: {
        specialist: {
          select: {
            id: true,
            businessName: true,
            rating: true,
          },
        },
      },
    });

    return specialists.map(spec => {
      const details = specialistDetails.find(d => d.id === spec.specialistId);
      return {
        id: details?.specialist?.id || '',
        name: `${details?.firstName} ${details?.lastName}`,
        businessName: details?.specialist?.businessName || '',
        bookingCount: spec._count.specialistId,
        rating: details?.specialist?.rating || 0,
        revenue: spec._sum.totalAmount || 0,
      };
    }).sort((a, b) => b.bookingCount - a.bookingCount).slice(0, 10);
  }

  /**
   * Get booking status distribution
   */
  private static async getBookingStatusDistribution(dateFilter: any) {
    const statuses = await prisma.booking.groupBy({
      by: ['status'],
      where: dateFilter,
      _count: { status: true },
    });

    return statuses.reduce((acc, status) => {
      acc[status.status] = status._count.status;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Get daily metrics
   */
  private static async getDailyMetrics(filters: AnalyticsFilters) {
    const endDate = filters.endDate || new Date();
    const startDate = filters.startDate || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const days = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const [bookings, revenue, newUsers] = await Promise.all([
        prisma.booking.count({
          where: {
            createdAt: { gte: dayStart, lte: dayEnd },
          },
        }),
        prisma.booking.aggregate({
          where: {
            status: 'COMPLETED',
            createdAt: { gte: dayStart, lte: dayEnd },
          },
          _sum: { totalAmount: true },
        }),
        prisma.user.count({
          where: {
            createdAt: { gte: dayStart, lte: dayEnd },
          },
        }),
      ]);

      days.push({
        date: currentDate.toISOString().split('T')[0],
        bookings,
        revenue: revenue._sum.totalAmount || 0,
        newUsers,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }

  /**
   * Build date filter for Prisma queries
   */
  private static buildDateFilter(startDate?: Date, endDate?: Date) {
    const filter: any = {};

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.gte = startDate;
      if (endDate) filter.createdAt.lte = endDate;
    }

    return filter;
  }
}