import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';
import { convertCurrency } from '@/utils/currency';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';

// Booking statuses that generate revenue
const revenueGeneratingStatuses = ['COMPLETED', 'IN_PROGRESS'] as const;

export class AnalyticsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Helper method to get user ID from specialist ID
  private async getSpecialistUserId(specialistId: string): Promise<string> {
    const specialist = await this.prisma.specialist.findUnique({
      where: { id: specialistId },
      select: { userId: true }
    });

    if (!specialist) {
      throw new Error('Specialist not found');
    }

    return specialist.userId;
  }

  async getDashboardData(specialistId: string): Promise<any> {
    try {
      const now = new Date();
      const startOfCurrentMonth = startOfMonth(now);
      const endOfCurrentMonth = endOfMonth(now);
      const startOfLastMonth = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      const endOfLastMonth = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));

      // Current month stats
      const currentMonthBookings = await this.prisma.booking.count({
        where: {
          specialistId,
          createdAt: {
            gte: startOfCurrentMonth,
            lte: endOfCurrentMonth
          }
        }
      });

      const currentMonthRevenue = await this.prisma.booking.aggregate({
        where: {
          specialistId,
          status: 'COMPLETED',
          createdAt: {
            gte: startOfCurrentMonth,
            lte: endOfCurrentMonth
          }
        },
        _sum: { totalAmount: true }
      });

      // Last month stats for comparison
      const lastMonthBookings = await this.prisma.booking.count({
        where: {
          specialistId,
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      });

      const lastMonthRevenue = await this.prisma.booking.aggregate({
        where: {
          specialistId,
          status: 'COMPLETED',
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        },
        _sum: { totalAmount: true }
      });

      // Average rating
      const ratingData = await this.prisma.review.aggregate({
        where: { specialistId },
        _avg: { rating: true },
        _count: { rating: true }
      });

      // Pending bookings
      const pendingBookings = await this.prisma.booking.count({
        where: {
          specialistId,
          status: 'PENDING'
        }
      });

      // Today's bookings
      const todayBookings = await this.prisma.booking.count({
        where: {
          specialistId,
          scheduledAt: {
            gte: startOfDay(now),
            lte: endOfDay(now)
          }
        }
      });

      // Calculate growth percentages
      const bookingGrowth = lastMonthBookings > 0 
        ? ((currentMonthBookings - lastMonthBookings) / lastMonthBookings) * 100 
        : 0;

      const revenueGrowth = (lastMonthRevenue._sum.totalAmount || 0) > 0 
        ? (((currentMonthRevenue._sum.totalAmount || 0) - (lastMonthRevenue._sum.totalAmount || 0)) / (lastMonthRevenue._sum.totalAmount || 0)) * 100 
        : 0;

      return {
        overview: {
          totalBookings: currentMonthBookings,
          totalRevenue: currentMonthRevenue._sum.totalAmount || 0,
          averageRating: ratingData._avg.rating || 0,
          totalReviews: ratingData._count.rating || 0,
          pendingBookings,
          todayBookings
        },
        growth: {
          bookings: bookingGrowth,
          revenue: revenueGrowth
        },
        period: {
          current: {
            start: startOfCurrentMonth,
            end: endOfCurrentMonth
          },
          previous: {
            start: startOfLastMonth,
            end: endOfLastMonth
          }
        }
      };
    } catch (error) {
      logger.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  async getBookingAnalytics(
    specialistId: string,
    fromDate?: string,
    toDate?: string,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<any> {
    try {
      const dateFilter = this.buildDateFilter(fromDate, toDate);

      const bookings = await this.prisma.booking.findMany({
        where: {
          specialistId,
          createdAt: dateFilter
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
          totalAmount: true
        }
      });

      // Group bookings by time period
      const grouped = this.groupDataByPeriod(bookings, groupBy, 'createdAt');

      return {
        data: grouped,
        summary: {
          total: bookings.length,
          byStatus: this.groupByStatus(bookings),
          totalRevenue: bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0)
        }
      };
    } catch (error) {
      logger.error('Error getting booking analytics:', error);
      throw error;
    }
  }

  async getRevenueAnalytics(
    specialistId: string,
    fromDate?: string,
    toDate?: string,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<any> {
    try {
      const dateFilter = this.buildDateFilter(fromDate, toDate);

      const bookings = await this.prisma.booking.findMany({
        where: {
          specialistId,
          status: 'COMPLETED',
          createdAt: dateFilter
        },
        select: {
          totalAmount: true,
          createdAt: true,
          service: {
            select: {
              name: true,
              category: true
            }
          }
        }
      });

      // Group revenue by time period
      const grouped = this.groupRevenueByPeriod(bookings, groupBy, 'createdAt');

      // Revenue by service category
      const byCategory = this.groupRevenueByCategory(bookings);

      return {
        data: grouped,
        byCategory,
        summary: {
          totalRevenue: bookings.reduce((sum, booking) => sum + booking.totalAmount, 0),
          averageBookingValue: bookings.length > 0 ? bookings.reduce((sum, booking) => sum + booking.totalAmount, 0) / bookings.length : 0,
          totalBookings: bookings.length
        }
      };
    } catch (error) {
      logger.error('Error getting revenue analytics:', error);
      throw error;
    }
  }

  async getReviewAnalytics(
    specialistId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<any> {
    try {
      const dateFilter = this.buildDateFilter(fromDate, toDate);

      const reviews = await this.prisma.review.findMany({
        where: {
          specialistId,
          createdAt: dateFilter
        },
        select: {
          rating: true,
          createdAt: true,
          tags: true
        }
      });

      // Rating distribution
      const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: reviews.filter(review => review.rating === rating).length
      }));

      // Average rating over time
      const ratingOverTime = this.groupRatingByPeriod(reviews, 'week');

      // Most common tags
      const allTags = reviews.flatMap(review => 
        review.tags ? JSON.parse(review.tags) : []
      );
      const tagCounts = allTags.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }));

      return {
        summary: {
          totalReviews: reviews.length,
          averageRating: reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0
        },
        ratingDistribution,
        ratingOverTime,
        topTags
      };
    } catch (error) {
      logger.error('Error getting review analytics:', error);
      throw error;
    }
  }

  async getResponseTimeAnalytics(
    specialistId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<any> {
    try {
      // This would require tracking message response times
      // For now, return placeholder data
      return {
        averageResponseTime: 0,
        responseTimeByPeriod: [],
        summary: {
          fastest: 0,
          slowest: 0,
          totalMessages: 0
        }
      };
    } catch (error) {
      logger.error('Error getting response time analytics:', error);
      throw error;
    }
  }

  async getServicePerformance(
    specialistId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<any> {
    try {
      const dateFilter = this.buildDateFilter(fromDate, toDate);

      const bookings = await this.prisma.booking.findMany({
        where: {
          specialistId,
          createdAt: dateFilter
        },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              category: true,
              basePrice: true
            }
          },
          review: {
            select: {
              rating: true
            }
          }
        }
      });

      // Group by service
      const serviceGroups = bookings.reduce((acc, booking) => {
        const serviceId = booking.service.id;
        if (!acc[serviceId]) {
          acc[serviceId] = {
            service: booking.service,
            bookings: [],
            revenue: 0,
            averageRating: 0,
            reviewCount: 0
          };
        }
        acc[serviceId].bookings.push(booking);
        acc[serviceId].revenue += booking.totalAmount;
        if (booking.review) {
          acc[serviceId].reviewCount++;
          acc[serviceId].averageRating += booking.review.rating;
        }
        return acc;
      }, {} as any);

      // Calculate averages and format data
      const servicePerformance = Object.values(serviceGroups).map((group: any) => ({
        service: group.service,
        bookingCount: group.bookings.length,
        revenue: group.revenue,
        averageRating: group.reviewCount > 0 ? group.averageRating / group.reviewCount : 0,
        conversionRate: 100 // Placeholder - would need booking flow tracking
      }));

      return {
        services: servicePerformance.sort((a, b) => b.revenue - a.revenue),
        summary: {
          totalServices: servicePerformance.length,
          bestPerforming: servicePerformance[0] || null,
          totalRevenue: servicePerformance.reduce((sum, service) => sum + service.revenue, 0)
        }
      };
    } catch (error) {
      logger.error('Error getting service performance:', error);
      throw error;
    }
  }

  async getEarnings(
    specialistId: string,
    fromDate?: string,
    toDate?: string,
    period: 'day' | 'week' | 'month' = 'month'
  ): Promise<any> {
    try {
      const dateFilter = this.buildDateFilter(fromDate, toDate);

      const completedBookings = await this.prisma.booking.findMany({
        where: {
          specialistId,
          status: 'COMPLETED',
          completedAt: dateFilter
        },
        select: {
          totalAmount: true,
          completedAt: true,
          service: {
            select: {
              currency: true
            }
          }
        }
      });

      const earnings = this.groupRevenueByPeriod(completedBookings, period, 'completedAt');

      return {
        earnings,
        summary: {
          totalEarnings: completedBookings.reduce((sum, booking) => {
            // Convert booking amount to USD base currency before summing
            const serviceCurrency = booking.service?.currency || 'USD';
            const convertedAmount = convertCurrency(booking.totalAmount, serviceCurrency, 'USD');
            return sum + convertedAmount;
          }, 0),
          averageEarningsPerBooking: completedBookings.length > 0
            ? completedBookings.reduce((sum, booking) => {
                // Convert booking amount to USD base currency before summing
                const serviceCurrency = booking.service?.currency || 'USD';
                const convertedAmount = convertCurrency(booking.totalAmount, serviceCurrency, 'USD');
                return sum + convertedAmount;
              }, 0) / completedBookings.length
            : 0,
          totalCompletedBookings: completedBookings.length,
          currency: 'USD' // All aggregated amounts are in USD base currency
        }
      };
    } catch (error) {
      logger.error('Error getting earnings:', error);
      throw error;
    }
  }

  async getCustomerInsights(
    specialistId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<any> {
    try {
      const dateFilter = this.buildDateFilter(fromDate, toDate);

      const bookings = await this.prisma.booking.findMany({
        where: {
          specialistId,
          createdAt: dateFilter
        },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              createdAt: true
            }
          }
        }
      });

      // Customer analysis
      const customerGroups = bookings.reduce((acc, booking) => {
        const customerId = booking.customer.id;
        if (!acc[customerId]) {
          acc[customerId] = {
            customer: booking.customer,
            bookingCount: 0,
            totalSpent: 0,
            firstBooking: booking.createdAt,
            lastBooking: booking.createdAt
          };
        }
        acc[customerId].bookingCount++;
        acc[customerId].totalSpent += booking.totalAmount;
        if (booking.createdAt < acc[customerId].firstBooking) {
          acc[customerId].firstBooking = booking.createdAt;
        }
        if (booking.createdAt > acc[customerId].lastBooking) {
          acc[customerId].lastBooking = booking.createdAt;
        }
        return acc;
      }, {} as any);

      const customers = Object.values(customerGroups);
      const newCustomers = customers.filter((customer: any) => 
        customer.bookingCount === 1
      ).length;

      const repeatCustomers = customers.filter((customer: any) => 
        customer.bookingCount > 1
      ).length;

      return {
        summary: {
          totalCustomers: customers.length,
          newCustomers,
          repeatCustomers,
          retentionRate: customers.length > 0 ? (repeatCustomers / customers.length) * 100 : 0
        },
        topCustomers: customers
          .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
          .slice(0, 10),
        customersByBookingCount: {
          oneTime: newCustomers,
          repeat: repeatCustomers,
          frequent: customers.filter((customer: any) => customer.bookingCount >= 5).length
        }
      };
    } catch (error) {
      logger.error('Error getting customer insights:', error);
      throw error;
    }
  }

  async exportData(
    specialistId: string,
    type: string,
    format: 'csv' | 'xlsx',
    fromDate?: string,
    toDate?: string
  ): Promise<string | Buffer> {
    // This would implement data export functionality
    // For now, return placeholder
    return format === 'csv' ? 'CSV data would be here' : Buffer.from('Excel data');
  }

  // New service methods for frontend endpoints

  async getOverviewAnalytics(
    specialistId: string,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    try {
      const dateFilter = this.buildDateFilter(startDate, endDate);
      const now = new Date();
      
      // Use user ID for booking queries since bookings are linked to user ID, not specialist ID
      const userId = await this.getSpecialistUserId(specialistId);
      
      // Get basic statistics
      const [
        totalBookings,
        completedBookings,
        totalRevenue,
        pendingBookings,
        todayBookings,
        averageRating,
        totalReviews,
        uniqueCustomers
      ] = await Promise.all([
        this.prisma.booking.count({
          where: {
            specialistId: userId,
            createdAt: dateFilter
          }
        }),
        this.prisma.booking.count({
          where: {
            specialistId: userId,
            status: 'COMPLETED',
            createdAt: dateFilter
          }
        }),
        this.prisma.booking.aggregate({
          where: {
            specialistId: userId,
            status: 'COMPLETED',
            createdAt: dateFilter
          },
          _sum: { totalAmount: true }
        }),
        this.prisma.booking.count({
          where: {
            specialistId: userId,
            status: 'PENDING'
          }
        }),
        this.prisma.booking.count({
          where: {
            specialistId: userId,
            scheduledAt: {
              gte: startOfDay(now),
              lte: endOfDay(now)
            }
          }
        }),
        this.prisma.review.aggregate({
          where: { 
            specialistId: userId,
            createdAt: dateFilter
          },
          _avg: { rating: true },
          _count: { rating: true }
        }),
        this.prisma.review.count({
          where: { 
            specialistId: userId,
            createdAt: dateFilter
          }
        }),
        this.prisma.booking.findMany({
          where: {
            specialistId: userId,
            createdAt: dateFilter
          },
          distinct: ['customerId'],
          select: { customerId: true }
        })
      ]);

      // Calculate conversion rate (completed / total bookings)
      const conversionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

      // Get recent bookings trend
      const recentBookings = await this.prisma.booking.findMany({
        where: {
          specialistId: userId,
          createdAt: dateFilter
        },
        select: {
          createdAt: true,
          status: true,
          totalAmount: true
        },
        orderBy: { createdAt: 'desc' },
        take: 30
      });

      const bookingsTrend = this.groupDataByPeriod(recentBookings, 'day', 'createdAt');

      return {
        summary: {
          totalBookings,
          completedBookings,
          totalRevenue: totalRevenue._sum.totalAmount || 0,
          averageRating: averageRating._avg.rating || 0,
          totalReviews,
          pendingBookings,
          todayBookings,
          uniqueCustomers: uniqueCustomers.length,
          conversionRate: Math.round(conversionRate * 100) / 100
        },
        trends: {
          bookings: bookingsTrend
        },
        metrics: {
          bookingCompletionRate: conversionRate,
          averageBookingValue: completedBookings > 0 ? (totalRevenue._sum.totalAmount || 0) / completedBookings : 0,
          customerRetentionRate: uniqueCustomers.length > 0 ? (uniqueCustomers.length - uniqueCustomers.length) / uniqueCustomers.length * 100 : 0
        }
      };
    } catch (error) {
      logger.error('Error getting overview analytics:', error);
      throw error;
    }
  }

  async getServicesAnalytics(
    specialistId: string,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    try {
      const dateFilter = this.buildDateFilter(startDate, endDate);

      // Get all services offered by the specialist with booking data
      const services = await this.prisma.service.findMany({
        where: { specialistId },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          basePrice: true,
          bookings: {
            where: {
              createdAt: dateFilter
            },
            select: {
              id: true,
              status: true,
              totalAmount: true,
              createdAt: true,
              review: {
                select: {
                  rating: true
                }
              }
            }
          }
        }
      });

      // Consider bookings that should count as "completed" for revenue purposes
      const revenueGeneratingStatuses = ['COMPLETED', 'CONFIRMED', 'IN_PROGRESS'];

      const serviceAnalytics = services.map(service => {
        const bookings = service.bookings;
        const completedBookings = bookings.filter(b => (revenueGeneratingStatuses as readonly string[]).includes(b.status));
        const totalRevenue = completedBookings.reduce((sum, b) => sum + b.totalAmount, 0);
        const ratings = bookings
          .filter(b => b.review)
          .map(b => b.review!.rating);
        const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
        
        // Calculate conversion rate
        const conversionRate = bookings.length > 0 ? (completedBookings.length / bookings.length) * 100 : 0;

        return {
          id: service.id,
          name: service.name,
          category: service.category,
          description: service.description,
          basePrice: service.basePrice,
          metrics: {
            totalBookings: bookings.length,
            completedBookings: completedBookings.length,
            totalRevenue,
            averageRating: Math.round(averageRating * 100) / 100,
            totalReviews: ratings.length,
            conversionRate: Math.round(conversionRate * 100) / 100,
            averageBookingValue: completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0
          },
          performance: {
            popularityRank: 0, // Will be calculated after sorting
            revenueRank: 0,
            ratingRank: 0
          }
        };
      });

      // Calculate rankings
      const sortedByBookings = [...serviceAnalytics].sort((a, b) => b.metrics.totalBookings - a.metrics.totalBookings);
      const sortedByRevenue = [...serviceAnalytics].sort((a, b) => b.metrics.totalRevenue - a.metrics.totalRevenue);
      const sortedByRating = [...serviceAnalytics].sort((a, b) => b.metrics.averageRating - a.metrics.averageRating);

      serviceAnalytics.forEach(service => {
        service.performance.popularityRank = sortedByBookings.findIndex(s => s.id === service.id) + 1;
        service.performance.revenueRank = sortedByRevenue.findIndex(s => s.id === service.id) + 1;
        service.performance.ratingRank = sortedByRating.findIndex(s => s.id === service.id) + 1;
      });

      const totalBookings = serviceAnalytics.reduce((sum, s) => sum + s.metrics.totalBookings, 0);
      const totalRevenue = serviceAnalytics.reduce((sum, s) => sum + s.metrics.totalRevenue, 0);
      const totalReviews = serviceAnalytics.reduce((sum, s) => sum + s.metrics.totalReviews, 0);

      return {
        services: serviceAnalytics,
        summary: {
          totalServices: services.length,
          totalBookings,
          totalRevenue,
          totalReviews,
          averageRating: totalReviews > 0 ? 
            serviceAnalytics.reduce((sum, s) => sum + (s.metrics.averageRating * s.metrics.totalReviews), 0) / totalReviews : 0,
          topPerformingService: sortedByRevenue[0] || null,
          mostPopularService: sortedByBookings[0] || null
        }
      };
    } catch (error) {
      logger.error('Error getting services analytics:', error);
      throw error;
    }
  }

  async getPerformanceAnalytics(
    specialistId: string,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    try {
      const dateFilter = this.buildDateFilter(startDate, endDate);

      // Get booking data for performance calculations
      const bookings = await this.prisma.booking.findMany({
        where: {
          specialistId,
          createdAt: dateFilter
        },
        select: {
          id: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          review: {
            select: { rating: true }
          },
          service: {
            select: { name: true, category: true }
          }
        }
      });

      const completedBookings = bookings.filter(b => (revenueGeneratingStatuses as readonly string[]).includes(b.status));
      const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED');
      
      // Calculate key performance metrics
      const totalBookings = bookings.length;
      const completionRate = totalBookings > 0 ? (completedBookings.length / totalBookings) * 100 : 0;
      const cancellationRate = totalBookings > 0 ? (cancelledBookings.length / totalBookings) * 100 : 0;
      
      // Revenue metrics
      const totalRevenue = completedBookings.reduce((sum, b) => sum + b.totalAmount, 0);
      const averageBookingValue = completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0;
      
      // Customer satisfaction
      const reviewedBookings = completedBookings.filter(b => b.review);
      const averageRating = reviewedBookings.length > 0 ? 
        reviewedBookings.reduce((sum, b) => sum + b.review!.rating, 0) / reviewedBookings.length : 0;
      const reviewRate = completedBookings.length > 0 ? (reviewedBookings.length / completedBookings.length) * 100 : 0;

      // Response time analytics (placeholder - would need message data)
      const responseTimeData = {
        averageResponseTime: 0, // Minutes
        fastestResponse: 0,
        slowestResponse: 0,
        responseTimeByPeriod: []
      };

      // Conversion funnel
      const pendingBookings = bookings.filter(b => b.status === 'PENDING').length;
      const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED').length;
      const conversionFunnel = {
        inquiries: totalBookings, // In a real scenario, this would be higher
        bookings: totalBookings,
        confirmed: confirmedBookings,
        completed: completedBookings.length,
        reviewed: reviewedBookings.length
      };

      // Performance trends
      const performanceTrend = this.groupDataByPeriod(bookings, 'week', 'createdAt').map(group => ({
        period: group.period,
        bookings: group.count,
        completedBookings: group.items.filter(b => revenueGeneratingStatuses.includes(b.status)).length,
        revenue: group.items.filter(b => revenueGeneratingStatuses.includes(b.status)).reduce((sum, b) => sum + b.totalAmount, 0),
        averageRating: group.items.filter(b => b.review).length > 0 ?
          group.items.filter(b => b.review).reduce((sum, b) => sum + b.review!.rating, 0) / group.items.filter(b => b.review).length : 0
      }));

      // Service category performance
      const categoryPerformance = this.groupRevenueByCategory(completedBookings);

      return {
        overview: {
          totalBookings,
          completedBookings: completedBookings.length,
          completionRate: Math.round(completionRate * 100) / 100,
          cancellationRate: Math.round(cancellationRate * 100) / 100,
          totalRevenue,
          averageBookingValue: Math.round(averageBookingValue * 100) / 100,
          averageRating: Math.round(averageRating * 100) / 100,
          reviewRate: Math.round(reviewRate * 100) / 100
        },
        responseTime: responseTimeData,
        conversionFunnel,
        trends: performanceTrend,
        categoryPerformance,
        benchmarks: {
          industryAverage: {
            completionRate: 85,
            averageRating: 4.2,
            responseTime: 15 // minutes
          },
          yourPerformance: {
            completionRate: Math.round(completionRate * 100) / 100,
            averageRating: Math.round(averageRating * 100) / 100,
            responseTime: 0 // Would be calculated from actual data
          }
        }
      };
    } catch (error) {
      logger.error('Error getting performance analytics:', error);
      throw error;
    }
  }

  // Helper methods
  private buildDateFilter(fromDate?: string, toDate?: string) {
    const filter: any = {};
    if (fromDate) filter.gte = new Date(fromDate);
    if (toDate) filter.lte = new Date(toDate);
    return Object.keys(filter).length > 0 ? filter : undefined;
  }

  private groupDataByPeriod(data: any[], period: 'day' | 'week' | 'month', dateField: string) {
    const grouped: Record<string, any[]> = {};
    
    data.forEach(item => {
      const date = new Date(item[dateField]);
      let key: string;
      
      switch (period) {
        case 'day':
          key = format(date, 'yyyy-MM-dd');
          break;
        case 'week':
          key = format(startOfWeek(date), 'yyyy-MM-dd');
          break;
        case 'month':
          key = format(date, 'yyyy-MM');
          break;
        default:
          key = format(date, 'yyyy-MM-dd');
      }
      
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });

    return Object.entries(grouped).map(([period, items]) => ({
      period,
      count: items.length,
      items
    }));
  }

  private groupRevenueByPeriod(data: any[], period: 'day' | 'week' | 'month', dateField: string) {
    const grouped = this.groupDataByPeriod(data, period, dateField);
    return grouped.map(group => ({
      period: group.period,
      revenue: group.items.reduce((sum, item) => sum + item.totalAmount, 0),
      count: group.count
    }));
  }

  private groupRatingByPeriod(reviews: any[], period: 'day' | 'week' | 'month') {
    const grouped = this.groupDataByPeriod(reviews, period, 'createdAt');
    return grouped.map(group => ({
      period: group.period,
      averageRating: group.items.reduce((sum, item) => sum + item.rating, 0) / group.items.length,
      count: group.count
    }));
  }

  private groupRevenueByCategory(bookings: any[]) {
    const categoryGroups = bookings.reduce((acc, booking) => {
      const category = booking.service.category;
      if (!acc[category]) {
        acc[category] = { revenue: 0, count: 0 };
      }
      acc[category].revenue += booking.totalAmount;
      acc[category].count++;
      return acc;
    }, {} as Record<string, { revenue: number; count: number }>);

    return Object.entries(categoryGroups).map(([category, data]) => ({
      category,
      revenue: (data as { revenue: number; count: number }).revenue || 0,
      count: (data as { revenue: number; count: number }).count || 0
    }));
  }

  private groupByStatus(bookings: any[]) {
    return bookings.reduce((acc, booking) => {
      const status = booking.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}
