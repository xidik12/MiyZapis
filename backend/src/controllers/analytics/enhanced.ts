import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { EnhancedAnalyticsService, AnalyticsFilters } from '@/services/analytics/enhanced';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { ErrorCodes, AuthenticatedRequest } from '@/types';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

export class EnhancedAnalyticsController {
  /**
   * Get specialist analytics
   * GET /analytics/specialist/:id
   */
  static async getSpecialistAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const { id } = req.params;
      const { startDate, endDate, groupBy } = req.query;

      if (!id) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Specialist ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Check if user has access to this specialist's analytics
      const specialist = await prisma.specialist.findUnique({
        where: { id },
        select: { userId: true },
      });

      if (!specialist) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Specialist not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Only allow access to own analytics or admin
      if (specialist.userId !== req.user.id && req.user.userType !== 'ADMIN') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'You do not have permission to view these analytics',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const filters: AnalyticsFilters = {};
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (groupBy) filters.groupBy = groupBy as 'day' | 'week' | 'month' | 'year';

      const analytics = await EnhancedAnalyticsService.getSpecialistAnalytics(id, filters);

      res.json(
        createSuccessResponse({
          analytics,
        })
      );
    } catch (error: any) {
      logger.error('Get specialist analytics error:', error);

      if (error.message === 'SPECIALIST_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Specialist not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get specialist analytics',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Get platform analytics (Admin only)
   * GET /analytics/platform
   */
  static async getPlatformAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Check admin permissions
      if (req.user.userType !== 'ADMIN') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'Only administrators can view platform analytics',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const { startDate, endDate, groupBy } = req.query;

      const filters: AnalyticsFilters = {};
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (groupBy) filters.groupBy = groupBy as 'day' | 'week' | 'month' | 'year';

      const analytics = await EnhancedAnalyticsService.getPlatformAnalytics(filters);

      res.json(
        createSuccessResponse({
          analytics,
        })
      );
    } catch (error: any) {
      logger.error('Get platform analytics error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get platform analytics',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Get current user's specialist analytics (shortcut endpoint)
   * GET /analytics/my-specialist
   */
  static async getMySpecialistAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Get specialist profile for current user
      const specialist = await prisma.specialist.findUnique({
        where: { userId: req.user.id },
        select: { id: true },
      });

      if (!specialist) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Specialist profile not found for current user',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const { startDate, endDate, groupBy } = req.query;

      const filters: AnalyticsFilters = {};
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (groupBy) filters.groupBy = groupBy as 'day' | 'week' | 'month' | 'year';

      const analytics = await EnhancedAnalyticsService.getSpecialistAnalytics(specialist.id, filters);

      res.json(
        createSuccessResponse({
          analytics,
        })
      );
    } catch (error: any) {
      logger.error('Get my specialist analytics error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get specialist analytics',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Get analytics summary for dashboard
   * GET /analytics/summary
   */
  static async getAnalyticsSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const summary: any = {};

      if (req.user.userType === 'ADMIN') {
        // Admin gets platform summary
        const platformAnalytics = await EnhancedAnalyticsService.getPlatformAnalytics({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          endDate: new Date(),
        });

        summary.platform = {
          totalUsers: platformAnalytics.totalUsers,
          totalSpecialists: platformAnalytics.totalSpecialists,
          totalBookings: platformAnalytics.totalBookings,
          totalRevenue: platformAnalytics.totalRevenue,
          averageRating: platformAnalytics.averagePlatformRating,
          growthMetrics: platformAnalytics.growthMetrics,
        };
      } else if (req.user.userType === 'SPECIALIST') {
        // Specialist gets their own summary
        const specialist = await prisma.specialist.findUnique({
          where: { userId: req.user.id },
          select: { id: true },
        });

        if (specialist) {
          const specialistAnalytics = await EnhancedAnalyticsService.getSpecialistAnalytics(
            specialist.id,
            {
              startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              endDate: new Date(),
            }
          );

          summary.specialist = {
            totalBookings: specialistAnalytics.totalBookings,
            completedBookings: specialistAnalytics.completedBookings,
            totalRevenue: specialistAnalytics.totalRevenue,
            averageRating: specialistAnalytics.averageRating,
            conversionRate: specialistAnalytics.conversionRate,
            repeatCustomerRate: specialistAnalytics.repeatCustomerRate,
          };
        }
      } else {
        // Customer gets basic stats
        const customerStats = await prisma.booking.aggregate({
          where: {
            customerId: req.user.id,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
          _count: { id: true },
          _sum: { totalAmount: true },
        });

        const completedBookings = await prisma.booking.count({
          where: {
            customerId: req.user.id,
            status: 'COMPLETED',
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        });

        summary.customer = {
          totalBookings: customerStats._count.id,
          completedBookings,
          totalSpent: customerStats._sum.totalAmount || 0,
          loyaltyPoints: req.user.loyaltyPoints,
        };
      }

      res.json(
        createSuccessResponse({
          summary,
          period: 'last_30_days',
        })
      );
    } catch (error: any) {
      logger.error('Get analytics summary error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get analytics summary',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Get booking analytics with custom filters
   * GET /analytics/bookings
   */
  static async getBookingAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const {
        startDate,
        endDate,
        status,
        specialistId,
        serviceId,
        customerId,
        groupBy = 'day',
      } = req.query;

      // Build filter based on user type and permissions
      const where: any = {};

      if (startDate) where.createdAt = { gte: new Date(startDate as string) };
      if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate as string) };
      if (status) where.status = status;
      if (serviceId) where.serviceId = serviceId;

      // Apply user-specific filters
      if (req.user.userType === 'CUSTOMER') {
        where.customerId = req.user.id;
      } else if (req.user.userType === 'SPECIALIST') {
        where.specialistId = req.user.id;
      } else if (req.user.userType === 'ADMIN') {
        // Admin can filter by any user
        if (specialistId) where.specialistId = specialistId;
        if (customerId) where.customerId = customerId;
      }

      const [bookings, totalRevenue, statusDistribution] = await Promise.all([
        prisma.booking.findMany({
          where,
          select: {
            id: true,
            status: true,
            totalAmount: true,
            createdAt: true,
            service: {
              select: {
                name: true,
                category: true,
              },
            },
            customer: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.booking.aggregate({
          where: { ...where, status: 'COMPLETED' },
          _sum: { totalAmount: true },
        }),
        prisma.booking.groupBy({
          by: ['status'],
          where,
          _count: { status: true },
        }),
      ]);

      // Group bookings by time period
      const groupedBookings = this.groupBookingsByPeriod(bookings, groupBy as string);

      res.json(
        createSuccessResponse({
          bookings: bookings.slice(0, 50), // Limit to 50 for performance
          totalBookings: bookings.length,
          totalRevenue: totalRevenue._sum.totalAmount || 0,
          statusDistribution: statusDistribution.reduce((acc, status) => {
            acc[status.status] = status._count.status;
            return acc;
          }, {} as Record<string, number>),
          timeline: groupedBookings,
          filters: {
            startDate,
            endDate,
            status,
            specialistId,
            serviceId,
            customerId,
            groupBy,
          },
        })
      );
    } catch (error: any) {
      logger.error('Get booking analytics error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get booking analytics',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Group bookings by time period
   */
  private static groupBookingsByPeriod(bookings: any[], groupBy: string) {
    const grouped: Record<string, { bookings: number; revenue: number }> = {};

    bookings.forEach(booking => {
      let key: string;
      const date = new Date(booking.createdAt);

      switch (groupBy) {
        case 'hour':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
          break;
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          key = String(date.getFullYear());
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!grouped[key]) {
        grouped[key] = { bookings: 0, revenue: 0 };
      }

      grouped[key].bookings += 1;
      if (booking.status === 'COMPLETED') {
        grouped[key].revenue += booking.totalAmount;
      }
    });

    return Object.entries(grouped)
      .map(([period, data]) => ({
        period,
        ...data,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }
}