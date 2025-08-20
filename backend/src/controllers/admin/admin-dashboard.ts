import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { ErrorCodes, AuthenticatedRequest } from '@/types';

export class AdminController {
  // Get dashboard statistics
  static async getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { period = '30d' } = req.query;
      
      // Calculate date range based on period
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      // Get key metrics
      const [
        totalUsers,
        totalSpecialists,
        totalServices,
        totalBookings,
        totalRevenue,
        activeUsers,
        completedBookings,
        newUsersThisPeriod,
        newBookingsThisPeriod,
        revenueThisPeriod
      ] = await Promise.all([
        // Total counts
        prisma.user.count({ where: { isActive: true } }),
        
        prisma.specialist.count({
          where: { user: { isActive: true } }
        }),
        
        prisma.service.count({ where: { isActive: true } }),
        
        prisma.booking.count(),
        
        prisma.payment.aggregate({
          where: { status: 'SUCCEEDED' },
          _sum: { amount: true }
        }),

        // Active metrics
        prisma.user.count({
          where: {
            isActive: true,
            lastActiveAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        }),

        prisma.booking.count({
          where: { status: 'COMPLETED' }
        }),

        // Period-specific metrics
        prisma.user.count({
          where: {
            createdAt: { gte: startDate },
            isActive: true
          }
        }),

        prisma.booking.count({
          where: { createdAt: { gte: startDate } }
        }),

        prisma.payment.aggregate({
          where: {
            status: 'SUCCEEDED',
            createdAt: { gte: startDate }
          },
          _sum: { amount: true }
        })
      ]);

      // Calculate growth rates
      const previousPeriodStart = new Date(startDate);
      previousPeriodStart.setTime(previousPeriodStart.getTime() - (startDate.getTime() - new Date(startDate.getTime() - (now.getTime() - startDate.getTime())).getTime()));

      const [previousUsers, previousBookings, previousRevenue] = await Promise.all([
        prisma.user.count({
          where: {
            createdAt: {
              gte: previousPeriodStart,
              lt: startDate
            }
          }
        }),

        prisma.booking.count({
          where: {
            createdAt: {
              gte: previousPeriodStart,
              lt: startDate
            }
          }
        }),

        prisma.payment.aggregate({
          where: {
            status: 'SUCCEEDED',
            createdAt: {
              gte: previousPeriodStart,
              lt: startDate
            }
          },
          _sum: { amount: true }
        })
      ]);

      const calculateGrowthRate = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      // Get recent activity
      const recentBookings = await prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          specialist: {
            select: {
              businessName: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          service: {
            select: {
              name: true
            }
          }
        }
      });

      const recentUsers = await prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          userType: true,
          createdAt: true,
          isActive: true
        }
      });

      // Get service categories performance
      const categoryStats = await prisma.service.groupBy({
        by: ['category'],
        _count: {
          id: true
        },
        _avg: {
          basePrice: true
        }
      });

      // Get specialist leaderboard
      const topSpecialists = await prisma.specialist.findMany({
        take: 10,
        orderBy: [
          { rating: 'desc' },
          { reviewCount: 'desc' }
        ],
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          _count: {
            select: {
              services: true
            }
          }
        }
      });

      const stats = {
        overview: {
          totalUsers,
          totalSpecialists,
          totalServices,
          totalBookings,
          totalRevenue: totalRevenue._sum.amount || 0,
          activeUsers,
          completedBookings,
          conversionRate: totalUsers > 0 ? (totalBookings / totalUsers) * 100 : 0
        },
        
        growth: {
          newUsers: {
            current: newUsersThisPeriod,
            previous: previousUsers,
            growthRate: calculateGrowthRate(newUsersThisPeriod, previousUsers)
          },
          newBookings: {
            current: newBookingsThisPeriod,
            previous: previousBookings,
            growthRate: calculateGrowthRate(newBookingsThisPeriod, previousBookings)
          },
          revenue: {
            current: revenueThisPeriod._sum.amount || 0,
            previous: previousRevenue._sum.amount || 0,
            growthRate: calculateGrowthRate(
              revenueThisPeriod._sum.amount || 0, 
              previousRevenue._sum.amount || 0
            )
          }
        },

        recentActivity: {
          bookings: recentBookings,
          users: recentUsers
        },

        analytics: {
          categoryStats,
          topSpecialists: topSpecialists.map(specialist => ({
            id: specialist.id,
            name: `${specialist.user.firstName} ${specialist.user.lastName}`,
            email: specialist.user.email,
            businessName: specialist.businessName,
            rating: specialist.rating,
            reviewCount: specialist.reviewCount,
            servicesCount: specialist._count.services,
            isVerified: specialist.isVerified
          }))
        }
      };

      res.json(createSuccessResponse({ stats }));

    } catch (error) {
      logger.error('Admin dashboard stats error:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to fetch dashboard statistics',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get detailed user analytics
  static async getUserAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { period = '30d', userType } = req.query;
      
      const periodDays = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365
      }[period as string] || 30;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      // Build where clause
      const where: any = {
        createdAt: { gte: startDate }
      };
      
      if (userType && ['CUSTOMER', 'SPECIALIST', 'ADMIN'].includes(userType as string)) {
        where.userType = userType;
      }

      // Get user registration trends
      const userTrends = await prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          user_type,
          COUNT(*) as count
        FROM users 
        WHERE created_at >= ${startDate}
        GROUP BY DATE(created_at), user_type
        ORDER BY date ASC
      `;

      // Get user engagement metrics
      const engagementStats = await prisma.user.groupBy({
        by: ['userType'],
        where: {
          lastActiveAt: { gte: startDate }
        },
        _count: {
          id: true
        }
      });

      // Get user geographic distribution (if location data available)
      const geographicStats = await prisma.user.groupBy({
        by: ['timezone'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      });

      // Get user platform distribution
      const platformStats = await prisma.authToken.groupBy({
        by: ['platform'],
        where: {
          createdAt: { gte: startDate }
        },
        _count: { id: true }
      });

      res.json(createSuccessResponse({
        userTrends,
        engagementStats,
        geographicStats,
        platformStats
      }));

    } catch (error) {
      logger.error('User analytics error:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to fetch user analytics',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get booking analytics
  static async getBookingAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { period = '30d' } = req.query;
      
      const periodDays = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365
      }[period as string] || 30;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      // Booking status distribution
      const statusStats = await prisma.booking.groupBy({
        by: ['status'],
        where: {
          createdAt: { gte: startDate }
        },
        _count: { id: true },
        _sum: { totalAmount: true }
      });

      // Booking trends over time
      const bookingTrends = await prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          status,
          COUNT(*) as count,
          AVG(total_amount) as avg_amount
        FROM bookings 
        WHERE created_at >= ${startDate}
        GROUP BY DATE(created_at), status
        ORDER BY date ASC
      `;

      // Popular services
      const popularServices = await prisma.booking.groupBy({
        by: ['serviceId'],
        where: {
          createdAt: { gte: startDate }
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      });

      // Get service details for popular services
      const serviceIds = popularServices.map(item => item.serviceId);
      const services = await prisma.service.findMany({
        where: { id: { in: serviceIds } },
        select: {
          id: true,
          name: true,
          category: true,
          basePrice: true,
          currency: true
        }
      });

      const popularServicesWithDetails = popularServices.map(stat => {
        const service = services.find(s => s.id === stat.serviceId);
        return {
          ...stat,
          service
        };
      });

      // Peak hours analysis
      const hourlyStats = await prisma.$queryRaw`
        SELECT 
          EXTRACT(hour FROM scheduled_at) as hour,
          COUNT(*) as count
        FROM bookings 
        WHERE created_at >= ${startDate}
          AND status IN ('CONFIRMED', 'COMPLETED')
        GROUP BY EXTRACT(hour FROM scheduled_at)
        ORDER BY hour ASC
      `;

      // Average booking value by category
      const categoryRevenue = await prisma.$queryRaw`
        SELECT 
          s.category,
          COUNT(b.id) as booking_count,
          AVG(b.total_amount) as avg_amount,
          SUM(b.total_amount) as total_revenue
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        WHERE b.created_at >= ${startDate}
          AND b.status IN ('CONFIRMED', 'COMPLETED')
        GROUP BY s.category
        ORDER BY total_revenue DESC
      `;

      res.json(createSuccessResponse({
        statusStats,
        bookingTrends,
        popularServices: popularServicesWithDetails,
        hourlyStats,
        categoryRevenue
      }));

    } catch (error) {
      logger.error('Booking analytics error:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to fetch booking analytics',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get financial analytics
  static async getFinancialAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { period = '30d' } = req.query;
      
      const periodDays = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365
      }[period as string] || 30;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      // Revenue trends
      const revenueTrends = await prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          type,
          SUM(amount) as total_amount,
          COUNT(*) as transaction_count
        FROM payments 
        WHERE created_at >= ${startDate}
          AND status = 'SUCCEEDED'
        GROUP BY DATE(created_at), type
        ORDER BY date ASC
      `;

      // Payment method distribution
      const paymentMethodStats = await prisma.payment.groupBy({
        by: ['paymentMethodType'],
        where: {
          createdAt: { gte: startDate },
          status: 'SUCCEEDED'
        },
        _count: { id: true },
        _sum: { amount: true }
      });

      // Currency distribution
      const currencyStats = await prisma.payment.groupBy({
        by: ['currency'],
        where: {
          createdAt: { gte: startDate },
          status: 'SUCCEEDED'
        },
        _count: { id: true },
        _sum: { amount: true }
      });

      // Top earning specialists
      const topEarningSpecialists = await prisma.$queryRaw`
        SELECT 
          s.id,
          s.business_name,
          u.first_name,
          u.last_name,
          u.email,
          SUM(p.amount) as total_earnings,
          COUNT(p.id) as transaction_count,
          AVG(p.amount) as avg_transaction
        FROM payments p
        JOIN bookings b ON p.booking_id = b.id
        JOIN specialists s ON b.specialist_id = s.user_id
        JOIN users u ON s.user_id = u.id
        WHERE p.created_at >= ${startDate}
          AND p.status = 'SUCCEEDED'
          AND p.type IN ('FULL_PAYMENT', 'DEPOSIT')
        GROUP BY s.id, s.business_name, u.first_name, u.last_name, u.email
        ORDER BY total_earnings DESC
        LIMIT 10
      `;

      // Refund analysis
      const refundStats = await prisma.payment.aggregate({
        where: {
          createdAt: { gte: startDate },
          type: 'REFUND'
        },
        _count: { id: true },
        _sum: { amount: true }
      });

      const totalTransactions = await prisma.payment.count({
        where: {
          createdAt: { gte: startDate },
          status: 'SUCCEEDED',
          type: { in: ['FULL_PAYMENT', 'DEPOSIT'] }
        }
      });

      const refundRate = totalTransactions > 0 
        ? (refundStats._count.id / totalTransactions) * 100 
        : 0;

      res.json(createSuccessResponse({
        revenueTrends,
        paymentMethodStats,
        currencyStats,
        topEarningSpecialists,
        refundStats: {
          ...refundStats,
          refundRate: Math.round(refundRate * 100) / 100
        }
      }));

    } catch (error) {
      logger.error('Financial analytics error:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to fetch financial analytics',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Manage users
  static async manageUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { action, userIds } = req.body;
      
      if (!['activate', 'deactivate', 'delete'].includes(action)) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid action. Must be activate, deactivate, or delete',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (!Array.isArray(userIds) || userIds.length === 0) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'User IDs array is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      let updateData: any = {};
      
      switch (action) {
        case 'activate':
          updateData = { isActive: true };
          break;
        case 'deactivate':
          updateData = { isActive: false };
          break;
        case 'delete':
          updateData = { 
            isActive: false, 
            email: prisma.$raw`CONCAT(email, '_deleted_', id)`,
            deletedAt: new Date() 
          };
          break;
      }

      const result = await prisma.user.updateMany({
        where: { 
          id: { in: userIds },
          userType: { not: 'ADMIN' } // Prevent admin accounts from being managed
        },
        data: updateData
      });

      logger.info(`Admin ${action} users`, {
        adminId: req.user?.id,
        userIds,
        count: result.count
      });

      res.json(createSuccessResponse({
        message: `Successfully ${action}d ${result.count} users`,
        affectedCount: result.count
      }));

    } catch (error) {
      logger.error('User management error:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to manage users',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get system health
  static async getSystemHealth(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const checks = [];

      // Database health
      try {
        await prisma.$queryRaw`SELECT 1`;
        checks.push({
          name: 'Database',
          status: 'healthy',
          responseTime: 'good'
        });
      } catch (error) {
        checks.push({
          name: 'Database',
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Redis health (if configured)
      try {
        const { redis } = await import('@/config/redis');
        await redis.ping();
        checks.push({
          name: 'Redis',
          status: 'healthy',
          responseTime: 'good'
        });
      } catch (error) {
        checks.push({
          name: 'Redis',
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Not configured'
        });
      }

      // System metrics
      const systemMetrics = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        version: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || 'development'
      };

      // Application metrics
      const appMetrics = {
        totalUsers: await prisma.user.count(),
        activeUsers: await prisma.user.count({
          where: {
            lastActiveAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        }),
        totalBookings: await prisma.booking.count(),
        todayBookings: await prisma.booking.count({
          where: {
            createdAt: {
              gte: new Date(new Date().toDateString())
            }
          }
        })
      };

      res.json(createSuccessResponse({
        healthChecks: checks,
        systemMetrics,
        appMetrics,
        timestamp: new Date().toISOString(),
        overallStatus: checks.every(check => check.status === 'healthy') ? 'healthy' : 'degraded'
      }));

    } catch (error) {
      logger.error('System health check error:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to check system health',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get audit logs
  static async getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { 
        page = 1, 
        limit = 50, 
        action, 
        userId, 
        entityType,
        startDate,
        endDate 
      } = req.query;

      const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
      const take = parseInt(limit as string, 10);

      const where: any = {};

      if (action) where.action = action;
      if (userId) where.userId = userId;
      if (entityType) where.entityType = entityType;

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
      }

      const [auditLogs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                userType: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take
        }),
        prisma.auditLog.count({ where })
      ]);

      const totalPages = Math.ceil(total / take);

      res.json(createSuccessResponse({
        auditLogs,
        pagination: {
          currentPage: parseInt(page as string, 10),
          totalPages,
          totalItems: total,
          itemsPerPage: take,
          hasNext: parseInt(page as string, 10) < totalPages,
          hasPrev: parseInt(page as string, 10) > 1
        }
      }));

    } catch (error) {
      logger.error('Audit logs error:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to fetch audit logs',
          req.headers['x-request-id'] as string
        )
      );
    }
  }
}