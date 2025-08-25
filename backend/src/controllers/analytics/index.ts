import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AnalyticsService } from '@/services/analytics/index';
import { successResponse, errorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { AuthenticatedRequest } from '@/types';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

const prisma = new PrismaClient();

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

  exportData = async (req: Request, res: Response) => {
    try {
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
}