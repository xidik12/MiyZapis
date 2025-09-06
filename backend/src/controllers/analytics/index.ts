import { Request, Response } from 'express';
import { AnalyticsService } from '@/services/analytics/index';
import { successResponse, errorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { AuthenticatedRequest } from '@/types';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { prisma } from '@/config/database';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService(prisma);
  }

  getDashboard = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      
      // Verify user is a specialist
      const specialist = await prisma.specialist.findUnique({
        where: { userId }
      });

      if (!specialist) {
        return errorResponse(res, 'Access denied. Specialist account required.', 403);
      }

      const dashboard = await this.analyticsService.getDashboardData(specialist.id);

      return successResponse(res, dashboard, 'Dashboard data retrieved successfully');
    } catch (error) {
      logger.error('Error getting dashboard data:', error);
      return errorResponse(res, 'Failed to retrieve dashboard data', 500);
    }
  };

  getBookingAnalytics = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { fromDate, toDate, groupBy = 'day' } = req.query;

      // Verify user is a specialist
      const specialist = await prisma.specialist.findUnique({
        where: { userId }
      });

      if (!specialist) {
        return errorResponse(res, 'Access denied. Specialist account required.', 403);
      }

      const analytics = await this.analyticsService.getBookingAnalytics(
        specialist.id,
        fromDate as string,
        toDate as string,
        groupBy as 'day' | 'week' | 'month'
      );

      return successResponse(res, analytics, 'Booking analytics retrieved successfully');
    } catch (error) {
      logger.error('Error getting booking analytics:', error);
      return errorResponse(res, 'Failed to retrieve booking analytics', 500);
    }
  };

  getRevenueAnalytics = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { fromDate, toDate, groupBy = 'day' } = req.query;

      // Verify user is a specialist
      const specialist = await prisma.specialist.findUnique({
        where: { userId }
      });

      if (!specialist) {
        return errorResponse(res, 'Access denied. Specialist account required.', 403);
      }

      const analytics = await this.analyticsService.getRevenueAnalytics(
        specialist.id,
        fromDate as string,
        toDate as string,
        groupBy as 'day' | 'week' | 'month'
      );

      return successResponse(res, analytics, 'Revenue analytics retrieved successfully');
    } catch (error) {
      logger.error('Error getting revenue analytics:', error);
      return errorResponse(res, 'Failed to retrieve revenue analytics', 500);
    }
  };

  getReviewAnalytics = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { fromDate, toDate } = req.query;

      // Verify user is a specialist
      const specialist = await prisma.specialist.findUnique({
        where: { userId }
      });

      if (!specialist) {
        return errorResponse(res, 'Access denied. Specialist account required.', 403);
      }

      const analytics = await this.analyticsService.getReviewAnalytics(
        specialist.id,
        fromDate as string,
        toDate as string
      );

      return successResponse(res, analytics, 'Review analytics retrieved successfully');
    } catch (error) {
      logger.error('Error getting review analytics:', error);
      return errorResponse(res, 'Failed to retrieve review analytics', 500);
    }
  };

  getResponseTimeAnalytics = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { fromDate, toDate } = req.query;

      // Verify user is a specialist
      const specialist = await prisma.specialist.findUnique({
        where: { userId }
      });

      if (!specialist) {
        return errorResponse(res, 'Access denied. Specialist account required.', 403);
      }

      const analytics = await this.analyticsService.getResponseTimeAnalytics(
        specialist.id,
        fromDate as string,
        toDate as string
      );

      return successResponse(res, analytics, 'Response time analytics retrieved successfully');
    } catch (error) {
      logger.error('Error getting response time analytics:', error);
      return errorResponse(res, 'Failed to retrieve response time analytics', 500);
    }
  };

  getServicePerformance = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { fromDate, toDate } = req.query;

      // Verify user is a specialist
      const specialist = await prisma.specialist.findUnique({
        where: { userId }
      });

      if (!specialist) {
        return errorResponse(res, 'Access denied. Specialist account required.', 403);
      }

      const performance = await this.analyticsService.getServicePerformance(
        specialist.id,
        fromDate as string,
        toDate as string
      );

      return successResponse(res, performance, 'Service performance data retrieved successfully');
    } catch (error) {
      logger.error('Error getting service performance:', error);
      return errorResponse(res, 'Failed to retrieve service performance', 500);
    }
  };

  getEarnings = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { fromDate, toDate, period = 'month' } = req.query;

      // Verify user is a specialist
      const specialist = await prisma.specialist.findUnique({
        where: { userId }
      });

      if (!specialist) {
        return errorResponse(res, 'Access denied. Specialist account required.', 403);
      }

      const earnings = await this.analyticsService.getEarnings(
        specialist.id,
        fromDate as string,
        toDate as string,
        period as 'day' | 'week' | 'month'
      );

      return successResponse(res, earnings, 'Earnings data retrieved successfully');
    } catch (error) {
      logger.error('Error getting earnings:', error);
      return errorResponse(res, 'Failed to retrieve earnings', 500);
    }
  };

  getCustomerInsights = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { fromDate, toDate } = req.query;

      // Verify user is a specialist
      const specialist = await prisma.specialist.findUnique({
        where: { userId }
      });

      if (!specialist) {
        return errorResponse(res, 'Access denied. Specialist account required.', 403);
      }

      const insights = await this.analyticsService.getCustomerInsights(
        specialist.id,
        fromDate as string,
        toDate as string
      );

      return successResponse(res, insights, 'Customer insights retrieved successfully');
    } catch (error) {
      logger.error('Error getting customer insights:', error);
      return errorResponse(res, 'Failed to retrieve customer insights', 500);
    }
  };

  exportData = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return errorResponse(res, 'Authentication required', 401);
      }
      
      const userId = req.user.id;
      const { type, format = 'csv', fromDate, toDate } = req.query;

      // Verify user is a specialist
      const specialist = await prisma.specialist.findUnique({
        where: { userId }
      });

      if (!specialist) {
        return errorResponse(res, 'Access denied. Specialist account required.', 403);
      }

      const exportData = await this.analyticsService.exportData(
        specialist.id,
        type as string,
        format as 'csv' | 'xlsx',
        fromDate as string,
        toDate as string
      );

      // Set appropriate headers for file download
      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=analytics_${type}_${Date.now()}.${format}`);

      return res.send(exportData);
    } catch (error) {
      logger.error('Error exporting data:', error);
      return errorResponse(res, 'Failed to export data', 500);
    }
  };

  // New methods for frontend endpoints

  getOverview = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return errorResponse(res, 'Authentication required', 401);
      }

      const userId = req.user.id;
      const { startDate, endDate } = req.query;

      // Verify user is a specialist
      const specialist = await prisma.specialist.findUnique({
        where: { userId }
      });

      if (!specialist) {
        return errorResponse(res, 'Access denied. Specialist account required.', 403);
      }

      const overview = await this.analyticsService.getOverviewAnalytics(
        specialist.id,
        startDate as string,
        endDate as string
      );

      return successResponse(res, overview, 'Overview analytics retrieved successfully');
    } catch (error) {
      logger.error('Error getting overview analytics:', error);
      return errorResponse(res, 'Failed to retrieve overview analytics', 500);
    }
  };

  getServicesAnalytics = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return errorResponse(res, 'Authentication required', 401);
      }

      const userId = req.user.id;
      const { startDate, endDate } = req.query;

      // Verify user is a specialist
      const specialist = await prisma.specialist.findUnique({
        where: { userId }
      });

      if (!specialist) {
        return errorResponse(res, 'Access denied. Specialist account required.', 403);
      }

      const servicesAnalytics = await this.analyticsService.getServicesAnalytics(
        specialist.id,
        startDate as string,
        endDate as string
      );

      return successResponse(res, servicesAnalytics, 'Services analytics retrieved successfully');
    } catch (error) {
      logger.error('Error getting services analytics:', error);
      return errorResponse(res, 'Failed to retrieve services analytics', 500);
    }
  };

  getPerformanceAnalytics = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return errorResponse(res, 'Authentication required', 401);
      }

      const userId = req.user.id;
      const { startDate, endDate } = req.query;

      // Verify user is a specialist
      const specialist = await prisma.specialist.findUnique({
        where: { userId }
      });

      if (!specialist) {
        return errorResponse(res, 'Access denied. Specialist account required.', 403);
      }

      const performanceAnalytics = await this.analyticsService.getPerformanceAnalytics(
        specialist.id,
        startDate as string,
        endDate as string
      );

      return successResponse(res, performanceAnalytics, 'Performance analytics retrieved successfully');
    } catch (error) {
      logger.error('Error getting performance analytics:', error);
      return errorResponse(res, 'Failed to retrieve performance analytics', 500);
    }
  };

  // Track profile view
  trackProfileView = async (req: Request, res: Response) => {
    try {
      const { specialistId } = req.params;
      const viewerId = req.user?.id || null; // Authenticated user or anonymous
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');
      const referrer = req.get('Referer');
      const sessionId = req.sessionID || req.get('x-session-id');

      // Check if specialist exists
      const specialist = await prisma.user.findUnique({
        where: { 
          id: specialistId,
          userType: 'SPECIALIST',
          isActive: true
        }
      });

      if (!specialist) {
        return errorResponse(res, 'Specialist not found', 404);
      }

      // Avoid duplicate views from same user/IP in last 30 minutes (optional anti-spam)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const recentView = await prisma.profileView.findFirst({
        where: {
          specialistId,
          createdAt: { gte: thirtyMinutesAgo },
          OR: [
            { viewerId: viewerId },
            { ipAddress: ipAddress }
          ]
        }
      });

      if (recentView) {
        // Don't create duplicate, but return success
        return successResponse(res, { tracked: false, reason: 'Recent view exists' }, 'Profile view noted');
      }

      // Create profile view record
      const profileView = await prisma.profileView.create({
        data: {
          specialistId,
          viewerId,
          ipAddress,
          userAgent,
          referrer,
          sessionId
        }
      });

      return successResponse(res, { tracked: true, id: profileView.id }, 'Profile view tracked successfully');
    } catch (error) {
      logger.error('Error tracking profile view:', error);
      return errorResponse(res, 'Failed to track profile view', 500);
    }
  };

  // Get profile view statistics
  getProfileViewStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return errorResponse(res, 'Authentication required', 401);
      }

      const userId = req.user.id;
      const { period = 'month' } = req.query;

      // Verify user is a specialist
      const specialist = await prisma.specialist.findUnique({
        where: { userId }
      });

      if (!specialist) {
        return errorResponse(res, 'Access denied. Specialist account required.', 403);
      }

      // Calculate date range
      let startDate: Date;
      const endDate = new Date();

      switch (period) {
        case 'week':
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Get total views
      const totalViews = await prisma.profileView.count({
        where: {
          specialistId: userId,
          createdAt: { gte: startDate }
        }
      });

      // Get unique viewers
      const uniqueViewers = await prisma.profileView.findMany({
        where: {
          specialistId: userId,
          createdAt: { gte: startDate }
        },
        distinct: ['viewerId'],
        select: { viewerId: true }
      });

      // Get views by day for trend data
      const viewsByDay = await prisma.$queryRaw`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM profile_views 
        WHERE specialist_id = ${userId} 
        AND created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
      `;

      // Calculate growth compared to previous period
      const previousStartDate = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
      const previousViews = await prisma.profileView.count({
        where: {
          specialistId: userId,
          createdAt: { gte: previousStartDate, lt: startDate }
        }
      });

      const growth = previousViews === 0 ? 0 : ((totalViews - previousViews) / previousViews) * 100;

      const stats = {
        totalViews,
        uniqueViewers: uniqueViewers.length,
        growth: Math.round(growth * 10) / 10, // Round to 1 decimal
        viewsByDay,
        period
      };

      return successResponse(res, stats, 'Profile view statistics retrieved successfully');
    } catch (error) {
      logger.error('Error getting profile view stats:', error);
      return errorResponse(res, 'Failed to retrieve profile view statistics', 500);
    }
  };
}