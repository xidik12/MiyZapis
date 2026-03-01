import { PrismaClient } from '@prisma/client';

export class AdminService {
  constructor(private prisma: PrismaClient) {}

  // Get dashboard statistics
  async getDashboardStats(period: string = '30d') {
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
      this.prisma.user.count({ where: { isActive: true } }),
      
      this.prisma.specialist.count({
        where: { user: { isActive: true } }
      }),
      
      this.prisma.service.count({ where: { isActive: true } }),
      
      this.prisma.booking.count(),
      
      this.prisma.payment.aggregate({
        where: { status: 'SUCCEEDED' },
        _sum: { amount: true }
      }),

      // Active metrics
      this.prisma.user.count({
        where: {
          isActive: true,
          lastLoginAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      }),

      this.prisma.booking.count({
        where: { status: 'COMPLETED' }
      }),

      // Period-specific metrics
      this.prisma.user.count({
        where: {
          createdAt: { gte: startDate },
          isActive: true
        }
      }),

      this.prisma.booking.count({
        where: { createdAt: { gte: startDate } }
      }),

      this.prisma.payment.aggregate({
        where: {
          status: 'SUCCEEDED',
          createdAt: { gte: startDate }
        },
        _sum: { amount: true }
      })
    ]);

    return {
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
        newUsers: newUsersThisPeriod,
        newBookings: newBookingsThisPeriod,
        revenue: revenueThisPeriod._sum.amount || 0
      }
    };
  }

  // Get recent activity
  async getRecentActivity(limit: number = 10) {
    const [recentBookings, recentUsers] = await Promise.all([
      this.prisma.booking.findMany({
        take: limit,
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
              id: true,
            }
          },
          service: {
            select: {
              name: true
            }
          }
        }
      }),

      this.prisma.user.findMany({
        take: limit,
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
      })
    ]);

    return {
      recentBookings,
      recentUsers
    };
  }

  // Get top specialists
  async getTopSpecialists(limit: number = 10) {
    return await this.prisma.specialist.findMany({
      take: limit,
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
  }

  // Get service category stats
  async getServiceCategoryStats() {
    return await this.prisma.service.groupBy({
      by: ['category'],
      _count: {
        id: true
      },
      _avg: {
        basePrice: true
      }
    });
  }

  // Manage users (activate/deactivate/delete)
  async manageUsers(action: string, userIds: string[]) {
    if (action === 'delete') {
      // Handle delete with email modification to avoid conflicts
      const usersToDelete = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true }
      });
      
      for (const user of usersToDelete) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            isActive: false,
            email: `${user.email}_deleted_${user.id}`
          }
        });
      }
      
      return { count: usersToDelete.length };
    }

    // Handle activate/deactivate
    let updateData: Record<string, unknown> = {};
    switch (action) {
      case 'activate':
        updateData = { isActive: true };
        break;
      case 'deactivate':
        updateData = { isActive: false };
        break;
    }

    const result = await this.prisma.user.updateMany({
      where: { 
        id: { in: userIds },
        userType: { not: 'ADMIN' } // Prevent admin accounts from being managed
      },
      data: updateData
    });

    return { count: result.count };
  }

  // Get system health metrics
  async getSystemHealthMetrics() {
    const [totalUsers, activeUsers, totalBookings, todayBookings] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),
      this.prisma.booking.count(),
      this.prisma.booking.count({
        where: {
          createdAt: {
            gte: new Date(new Date().toDateString())
          }
        }
      })
    ]);

    return {
      totalUsers,
      activeUsers,
      totalBookings,
      todayBookings
    };
  }
}

export default AdminService;