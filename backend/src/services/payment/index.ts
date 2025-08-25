import { Payment, Booking, PaymentMethod } from '@prisma/client';
import { logger } from '@/utils/logger';
import { config } from '@/config';
import { prisma } from '@/config/database';

interface PaymentIntentData {
  bookingId: string;
  amount: number;
  currency: string;
  paymentMethodType?: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

interface RefundData {
  paymentId: string;
  amount?: number;
  reason?: string;
}

export class PaymentService {
  // Create a mock payment intent for development (when Stripe is not configured)
  static async createPaymentIntent(data: PaymentIntentData): Promise<any> {
    try {
      const { bookingId, amount, currency, paymentMethodType = 'card', customerId, metadata = {} } = data;

      // Validate required parameters
      if (!bookingId) {
        throw new Error('BOOKING_ID_REQUIRED');
      }

      if (!amount || amount <= 0) {
        throw new Error('INVALID_AMOUNT');
      }

      if (!currency) {
        throw new Error('CURRENCY_REQUIRED');
      }

      // Get booking details
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          customer: true,
          specialist: true,
          service: true,
        },
      });

      if (!booking) {
        throw new Error('BOOKING_NOT_FOUND');
      }

      // Verify booking belongs to customer
      if (customerId && booking.customerId !== customerId) {
        throw new Error('UNAUTHORIZED_ACCESS');
      }

      // Check if booking already has a successful payment
      const existingPayment = await prisma.payment.findFirst({
        where: {
          bookingId,
          status: { in: ['SUCCEEDED', 'PROCESSING'] },
        },
      });

      if (existingPayment) {
        throw new Error('PAYMENT_ALREADY_EXISTS');
      }

      // For development without Stripe, create a mock payment intent
      const paymentIntentId = `pi_mock_${Date.now()}`;
      const clientSecret = `${paymentIntentId}_secret_mock`;

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          userId: booking.customerId,
          bookingId,
          status: 'PENDING',
          type: amount === booking.totalAmount ? 'FULL_PAYMENT' : 'DEPOSIT',
          amount,
          currency,
          stripePaymentIntentId: paymentIntentId,
          paymentMethodType,
          metadata: JSON.stringify(metadata),
        },
      });

      logger.info('Mock payment intent created', {
        paymentId: payment.id,
        bookingId,
        amount,
      });

      return {
        paymentId: payment.id,
        clientSecret,
        stripePaymentIntentId: paymentIntentId,
        amount,
        currency,
      };
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      throw error;
    }
  }

  // Confirm payment (mock implementation for development)
  static async confirmPayment(paymentIntentId: string): Promise<Payment> {
    try {
      // Find payment record
      const payment = await prisma.payment.findFirst({
        where: { stripePaymentIntentId: paymentIntentId },
        include: {
          booking: {
            include: {
              customer: true,
              specialist: true,
              service: true,
            },
          },
        },
      });

      if (!payment) {
        throw new Error('PAYMENT_NOT_FOUND');
      }

      // Mock successful payment
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCEEDED',
          updatedAt: new Date(),
        },
        include: {
          booking: {
            include: {
              customer: true,
              specialist: true,
              service: true,
            },
          },
        },
      });

      // Handle successful payment
      await PaymentService.handleSuccessfulPayment(updatedPayment);

      logger.info('Payment confirmed successfully', { paymentId: payment.id });

      return updatedPayment;
    } catch (error) {
      logger.error('Error confirming payment:', error);
      throw error;
    }
  }

  // Handle successful payment side effects
  private static async handleSuccessfulPayment(payment: Payment & { booking: any }): Promise<void> {
    try {
      const { booking } = payment;

      // Update booking status
      let newBookingStatus = booking.status;

      if (payment.type === 'FULL_PAYMENT') {
        newBookingStatus = 'CONFIRMED';
      } else if (payment.type === 'DEPOSIT') {
        newBookingStatus = 'PENDING_PAYMENT';
      }

      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: newBookingStatus },
      });

      // Award loyalty points (5% of payment amount)
      const loyaltyPoints = Math.floor(payment.amount * 0.05);
      if (loyaltyPoints > 0) {
        await prisma.user.update({
          where: { id: booking.customerId },
          data: {
            loyaltyPoints: { increment: loyaltyPoints },
          },
        });

        await prisma.loyaltyTransaction.create({
          data: {
            userId: booking.customerId,
            type: 'EARNED',
            points: loyaltyPoints,
            reason: 'Booking payment',
            description: `Earned ${loyaltyPoints} points for booking payment`,
            referenceId: booking.id,
          },
        });
      }

      logger.info('Payment processed successfully', {
        paymentId: payment.id,
        bookingId: booking.id,
        amount: payment.amount,
        currency: payment.currency,
      });
    } catch (error) {
      logger.error('Error handling successful payment:', error);
      throw error;
    }
  }

  // Get payment details
  static async getPaymentDetails(paymentId: string, userId: string): Promise<Payment | null> {
    try {
      return await prisma.payment.findFirst({
        where: {
          id: paymentId,
          userId,
        },
        include: {
          booking: {
            include: {
              service: {
                select: {
                  name: true,
                  duration: true,
                },
              },
              specialist: {
                select: {
                  businessName: true,
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    } catch (error) {
      logger.error('Error getting payment details:', error);
      throw error;
    }
  }

  // Get payment history with advanced filtering
  static async getPaymentHistory(
    userId: string,
    filters: {
      status?: string;
      type?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
      minAmount?: number;
      maxAmount?: number;
      bookingId?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{
    payments: Payment[];
    total: number;
    page: number;
    totalPages: number;
    statistics: {
      totalAmount: number;
      completedAmount: number;
      pendingAmount: number;
      refundedAmount: number;
      averageAmount: number;
    };
  }> {
    try {
      const { 
        status, 
        type, 
        startDate, 
        endDate, 
        page = 1, 
        limit = 20,
        minAmount,
        maxAmount,
        bookingId,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      const skip = (page - 1) * limit;

      const where: any = { userId };
      if (status) where.status = status;
      if (type) where.type = type;
      if (bookingId) where.bookingId = bookingId;
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      if (minAmount !== undefined || maxAmount !== undefined) {
        where.amount = {};
        if (minAmount !== undefined) where.amount.gte = minAmount;
        if (maxAmount !== undefined) where.amount.lte = maxAmount;
      }

      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      const [payments, total, stats] = await Promise.all([
        prisma.payment.findMany({
          where,
          include: {
            booking: {
              include: {
                service: {
                  select: {
                    name: true,
                    category: true,
                  },
                },
                specialist: {
                  select: {
                    firstName: true,
                    lastName: true,
                    specialist: {
                      select: {
                        businessName: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.payment.count({ where }),
        prisma.payment.aggregate({
          where,
          _sum: { amount: true },
          _avg: { amount: true },
        }),
      ]);

      // Get status-specific statistics
      const [completedStats, pendingStats, refundedStats] = await Promise.all([
        prisma.payment.aggregate({
          where: { ...where, status: 'SUCCEEDED' },
          _sum: { amount: true },
        }),
        prisma.payment.aggregate({
          where: { ...where, status: { in: ['PENDING', 'PROCESSING'] } },
          _sum: { amount: true },
        }),
        prisma.payment.aggregate({
          where: { ...where, type: 'REFUND' },
          _sum: { amount: true },
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        payments,
        total,
        page,
        totalPages,
        statistics: {
          totalAmount: stats._sum.amount || 0,
          completedAmount: completedStats._sum.amount || 0,
          pendingAmount: pendingStats._sum.amount || 0,
          refundedAmount: Math.abs(refundedStats._sum.amount || 0),
          averageAmount: stats._avg.amount || 0,
        },
      };
    } catch (error) {
      logger.error('Error getting payment history:', error);
      throw error;
    }
  }

  // Get user payments with pagination
  static async getUserPayments(
    userId: string,
    filters: {
      status?: string;
      type?: string;
      fromDate?: Date;
      toDate?: Date;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    payments: Payment[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const { status, type, fromDate, toDate, page = 1, limit = 20 } = filters;

      const skip = (page - 1) * limit;

      const where: any = { userId };
      if (status) where.status = status;
      if (type) where.type = type;
      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) where.createdAt.gte = fromDate;
        if (toDate) where.createdAt.lte = toDate;
      }

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          include: {
            booking: {
              include: {
                service: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.payment.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        payments,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error('Error getting user payments:', error);
      throw error;
    }
  }

  // Get earnings overview
  static async getEarningsOverview(specialistId: string): Promise<{
    totalEarnings: number;
    thisMonth: number;
    lastMonth: number;
    growthRate: number;
    totalBookings: number;
    completedBookings: number;
    averageBookingValue: number;
    topServices: Array<{
      serviceName: string;
      earnings: number;
      bookingCount: number;
    }>;
    recentPayments: Payment[];
  }> {
    try {
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const where = {
        booking: { specialistId },
        status: 'SUCCEEDED',
        type: { in: ['FULL_PAYMENT', 'DEPOSIT'] },
      };

      const [
        totalEarningsResult,
        thisMonthResult,
        lastMonthResult,
        totalBookings,
        completedBookings,
        topServicesResult,
        recentPayments,
      ] = await Promise.all([
        // Total earnings
        prisma.payment.aggregate({
          where,
          _sum: { amount: true },
        }),
        // This month earnings
        prisma.payment.aggregate({
          where: {
            ...where,
            createdAt: { gte: startOfThisMonth },
          },
          _sum: { amount: true },
        }),
        // Last month earnings
        prisma.payment.aggregate({
          where: {
            ...where,
            createdAt: {
              gte: startOfLastMonth,
              lte: endOfLastMonth,
            },
          },
          _sum: { amount: true },
        }),
        // Total bookings
        prisma.booking.count({
          where: { specialistId },
        }),
        // Completed bookings
        prisma.booking.count({
          where: { specialistId, status: 'COMPLETED' },
        }),
        // Top earning services
        prisma.payment.groupBy({
          by: ['bookingId'],
          where,
          _sum: { amount: true },
          orderBy: { _sum: { amount: 'desc' } },
          take: 5,
        }),
        // Recent payments
        prisma.payment.findMany({
          where,
          include: {
            booking: {
              include: {
                service: { select: { name: true } },
                customer: { select: { firstName: true, lastName: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

      // Get service details for top services
      const bookingIds = topServicesResult.map(item => item.bookingId).filter(Boolean);
      const serviceDetails = await prisma.booking.findMany({
        where: { id: { in: bookingIds } },
        include: { service: true },
      });

      const serviceMap = new Map();
      serviceDetails.forEach(booking => {
        const serviceName = booking.service.name;
        if (!serviceMap.has(serviceName)) {
          serviceMap.set(serviceName, { earnings: 0, bookingCount: 0 });
        }
        const topService = topServicesResult.find(ts => ts.bookingId === booking.id);
        if (topService) {
          const currentService = serviceMap.get(serviceName)!;
          serviceMap.set(serviceName, {
            earnings: currentService.earnings + (topService._sum.amount || 0),
            bookingCount: currentService.bookingCount + 1
          });
        }
      });

      const topServices = Array.from(serviceMap.entries()).map(([serviceName, data]) => ({
        serviceName,
        earnings: data.earnings,
        bookingCount: data.bookingCount,
      }));

      const totalEarnings = totalEarningsResult._sum.amount || 0;
      const thisMonth = thisMonthResult._sum.amount || 0;
      const lastMonth = lastMonthResult._sum.amount || 0;
      const growthRate = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;
      const averageBookingValue = completedBookings > 0 ? totalEarnings / completedBookings : 0;

      return {
        totalEarnings,
        thisMonth,
        lastMonth,
        growthRate,
        totalBookings,
        completedBookings,
        averageBookingValue,
        topServices,
        recentPayments,
      };
    } catch (error) {
      logger.error('Error getting earnings overview:', error);
      throw error;
    }
  }

  // Get earnings trends
  static async getEarningsTrends(
    specialistId: string,
    options: {
      period?: string;
      groupBy?: string;
    } = {}
  ): Promise<{
    trends: Array<{
      date: string;
      earnings: number;
      bookingCount: number;
    }>;
    totalEarnings: number;
    averageDaily: number;
    peakDay: { date: string; earnings: number };
  }> {
    try {
      const { period = 'month', groupBy = 'day' } = options;

      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const payments = await prisma.payment.findMany({
        where: {
          booking: { specialistId },
          status: 'SUCCEEDED',
          type: { in: ['FULL_PAYMENT', 'DEPOSIT'] },
          createdAt: { gte: startDate },
        },
        include: {
          booking: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      // Group payments by date
      const trendsMap = new Map();
      
      payments.forEach(payment => {
        let dateKey: string;
        
        if (groupBy === 'day') {
          dateKey = payment.createdAt.toISOString().split('T')[0];
        } else if (groupBy === 'week') {
          const weekStart = new Date(payment.createdAt);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          dateKey = weekStart.toISOString().split('T')[0];
        } else if (groupBy === 'month') {
          dateKey = `${payment.createdAt.getFullYear()}-${String(payment.createdAt.getMonth() + 1).padStart(2, '0')}`;
        } else {
          dateKey = payment.createdAt.toISOString().split('T')[0];
        }

        if (!trendsMap.has(dateKey)) {
          trendsMap.set(dateKey, { earnings: 0, bookingCount: 0 });
        }
        
        const currentTrend = trendsMap.get(dateKey)!;
        trendsMap.set(dateKey, {
          earnings: currentTrend.earnings + payment.amount,
          bookingCount: currentTrend.bookingCount + 1
        });
      });

      const trends = Array.from(trendsMap.entries())
        .map(([date, data]) => ({
          date,
          earnings: data.earnings,
          bookingCount: data.bookingCount,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const totalEarnings = trends.reduce((sum, trend) => sum + trend.earnings, 0);
      const averageDaily = trends.length > 0 ? totalEarnings / trends.length : 0;
      const peakDay = trends.reduce(
        (peak, current) => (current.earnings > peak.earnings ? current : peak),
        { date: '', earnings: 0 }
      );

      return {
        trends,
        totalEarnings,
        averageDaily,
        peakDay,
      };
    } catch (error) {
      logger.error('Error getting earnings trends:', error);
      throw error;
    }
  }

  // Get earnings analytics
  static async getEarningsAnalytics(specialistId: string): Promise<{
    customerAnalytics: {
      totalCustomers: number;
      newCustomers: number;
      returningCustomers: number;
      topCustomers: Array<{
        name: string;
        totalSpent: number;
        bookingCount: number;
      }>;
    };
    serviceAnalytics: {
      topServices: Array<{
        serviceName: string;
        revenue: number;
        bookingCount: number;
        averagePrice: number;
      }>;
      categoryBreakdown: Array<{
        category: string;
        revenue: number;
        percentage: number;
      }>;
    };
    timeAnalytics: {
      busyHours: Array<{
        hour: number;
        bookingCount: number;
        revenue: number;
      }>;
      busyDays: Array<{
        day: string;
        bookingCount: number;
        revenue: number;
      }>;
    };
  }> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [
        totalCustomersResult,
        newCustomersResult,
        returningCustomersResult,
        topCustomersResult,
        serviceAnalyticsResult,
        bookingsWithTime,
      ] = await Promise.all([
        // Total customers
        prisma.booking.findMany({
          where: { specialistId },
          select: { customerId: true },
          distinct: ['customerId'],
        }),
        // New customers (first booking in last 30 days)
        prisma.booking.findMany({
          where: {
            specialistId,
            createdAt: { gte: thirtyDaysAgo },
          },
          select: { customerId: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        }),
        // Returning customers
        prisma.$queryRaw`
          SELECT "customerId", COUNT(*) as booking_count
          FROM bookings 
          WHERE "specialistId" = ${specialistId}
          GROUP BY "customerId"
          HAVING COUNT(*) > 1
        `,
        // Top customers by spending
        prisma.payment.groupBy({
          by: ['userId'],
          where: {
            booking: { specialistId },
            status: 'SUCCEEDED',
          },
          _sum: { amount: true },
          _count: true,
          orderBy: { _sum: { amount: 'desc' } },
          take: 10,
        }),
        // Service analytics
        prisma.payment.findMany({
          where: {
            booking: { specialistId },
            status: 'SUCCEEDED',
          },
          include: {
            booking: {
              include: {
                service: true,
              },
            },
          },
        }),
        // Bookings with time data
        prisma.booking.findMany({
          where: { specialistId },
          select: {
            scheduledAt: true,
            totalAmount: true,
          },
        }),
      ]);

      // Process customer analytics
      const customerIds = new Set(newCustomersResult.map(b => b.customerId));
      const firstBookings = new Map();
      newCustomersResult.forEach(booking => {
        if (!firstBookings.has(booking.customerId)) {
          firstBookings.set(booking.customerId, booking.createdAt);
        }
      });

      const newCustomers = Array.from(firstBookings.values()).filter(
        date => date >= thirtyDaysAgo
      ).length;

      // Get top customer details
      const topCustomerIds = topCustomersResult.map(c => c.userId);
      const customerDetails = await prisma.user.findMany({
        where: { id: { in: topCustomerIds } },
        select: { id: true, firstName: true, lastName: true },
      });

      const topCustomers = topCustomersResult.map(customer => {
        const details = customerDetails.find(d => d.id === customer.userId);
        return {
          name: details ? `${details.firstName} ${details.lastName}` : 'Unknown',
          totalSpent: customer._sum.amount || 0,
          bookingCount: customer._count,
        };
      });

      // Process service analytics
      const serviceMap = new Map();
      const categoryMap = new Map();

      serviceAnalyticsResult.forEach(payment => {
        const service = payment.booking.service;
        const serviceName = service.name;
        const category = service.category;

        if (!serviceMap.has(serviceName)) {
          serviceMap.set(serviceName, { revenue: 0, bookingCount: 0 });
        }
        const currentService = serviceMap.get(serviceName)!;
        serviceMap.set(serviceName, {
          revenue: currentService.revenue + payment.amount,
          bookingCount: currentService.bookingCount + 1
        });

        if (!categoryMap.has(category)) {
          categoryMap.set(category, 0);
        }
        categoryMap.set(category, (categoryMap.get(category) || 0) + payment.amount);
      });

      const topServices = Array.from(serviceMap.entries()).map(([serviceName, data]) => ({
        serviceName,
        revenue: data.revenue,
        bookingCount: data.bookingCount,
        averagePrice: data.bookingCount > 0 ? data.revenue / data.bookingCount : 0,
      })).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

      const totalRevenue = Array.from(categoryMap.values()).reduce((sum, val) => sum + val, 0);
      const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, revenue]) => ({
        category,
        revenue,
        percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
      }));

      // Process time analytics
      const hourlyData = new Map();
      const dailyData = new Map();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      bookingsWithTime.forEach(booking => {
        const hour = booking.scheduledAt.getHours();
        const day = dayNames[booking.scheduledAt.getDay()];

        if (!hourlyData.has(hour)) {
          hourlyData.set(hour, { bookingCount: 0, revenue: 0 });
        }
        const currentHour = hourlyData.get(hour)!;
        hourlyData.set(hour, {
          bookingCount: currentHour.bookingCount + 1,
          revenue: currentHour.revenue + booking.totalAmount
        });

        if (!dailyData.has(day)) {
          dailyData.set(day, { bookingCount: 0, revenue: 0 });
        }
        const currentDay = dailyData.get(day)!;
        dailyData.set(day, {
          bookingCount: currentDay.bookingCount + 1,
          revenue: currentDay.revenue + booking.totalAmount
        });
      });

      const busyHours = Array.from(hourlyData.entries()).map(([hour, data]) => ({
        hour,
        bookingCount: data.bookingCount,
        revenue: data.revenue,
      })).sort((a, b) => b.bookingCount - a.bookingCount);

      const busyDays = Array.from(dailyData.entries()).map(([day, data]) => ({
        day,
        bookingCount: data.bookingCount,
        revenue: data.revenue,
      })).sort((a, b) => b.bookingCount - a.bookingCount);

      return {
        customerAnalytics: {
          totalCustomers: totalCustomersResult.length,
          newCustomers,
          returningCustomers: (returningCustomersResult as any[]).length,
          topCustomers,
        },
        serviceAnalytics: {
          topServices,
          categoryBreakdown,
        },
        timeAnalytics: {
          busyHours,
          busyDays,
        },
      };
    } catch (error) {
      logger.error('Error getting earnings analytics:', error);
      throw error;
    }
  }

  // Get specialist earnings
  static async getSpecialistEarnings(
    specialistId: string,
    filters: {
      fromDate?: Date;
      toDate?: Date;
    } = {}
  ): Promise<{
    totalEarnings: number;
    totalTransactions: number;
    payments: Payment[];
    currency: string;
  }> {
    try {
      const { fromDate, toDate } = filters;

      const where: any = {
        booking: { specialistId },
        status: 'SUCCEEDED',
        type: { in: ['FULL_PAYMENT', 'DEPOSIT'] },
      };

      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) where.createdAt.gte = fromDate;
        if (toDate) where.createdAt.lte = toDate;
      }

      // Get total earnings
      const totalEarnings = await prisma.payment.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      });

      // Get recent payments
      const payments = await prisma.payment.findMany({
        where,
        include: {
          booking: {
            include: {
              service: {
                select: {
                  name: true,
                },
              },
              customer: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      return {
        totalEarnings: totalEarnings._sum.amount || 0,
        totalTransactions: totalEarnings._count,
        payments,
        currency: payments[0]?.currency || 'USD',
      };
    } catch (error) {
      logger.error('Error getting specialist earnings:', error);
      throw error;
    }
  }

  // Process refund (mock implementation)
  static async processRefund(data: RefundData): Promise<any> {
    try {
      const { paymentId, amount, reason = 'Refund requested' } = data;

      // Get payment details
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          booking: {
            include: {
              customer: true,
              service: true,
            },
          },
        },
      });

      if (!payment) {
        throw new Error('PAYMENT_NOT_FOUND');
      }

      if (payment.status !== 'SUCCEEDED') {
        throw new Error('CANNOT_REFUND_UNSUCCESSFUL_PAYMENT');
      }

      // Calculate refund amount
      const refundAmount = amount || payment.amount;

      if (refundAmount > payment.amount) {
        throw new Error('REFUND_AMOUNT_EXCEEDS_PAYMENT');
      }

      // Create refund payment record
      const refundPayment = await prisma.payment.create({
        data: {
          userId: payment.userId,
          bookingId: payment.bookingId,
          status: 'SUCCEEDED',
          type: 'REFUND',
          amount: -refundAmount, // Negative amount for refund
          currency: payment.currency,
          metadata: JSON.stringify({ reason, originalPaymentId: payment.id }),
        },
      });

      // Update booking status if full refund
      if (payment.bookingId && refundAmount === payment.amount) {
        await prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'REFUNDED' },
        });
      }

      logger.info('Refund processed successfully', {
        paymentId: payment.id,
        refundPaymentId: refundPayment.id,
        refundAmount,
      });

      return {
        refundId: refundPayment.id,
        amount: refundAmount,
        currency: payment.currency,
        status: 'SUCCEEDED',
      };
    } catch (error) {
      logger.error('Error processing refund:', error);
      throw error;
    }
  }

  // Get user payment methods
  static async getUserPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      return await prisma.paymentMethod.findMany({
        where: {
          userId,
          isActive: true,
        },
        orderBy: [
          { isDefault: 'desc' }, // Default payment method first
          { createdAt: 'asc' }, // Then by creation date
        ],
      });
    } catch (error) {
      logger.error('Error getting user payment methods:', error);
      throw error;
    }
  }

  // Add payment method
  static async addPaymentMethod(data: {
    userId: string;
    type: string;
    cardLast4?: string;
    cardBrand?: string;
    cardExpMonth?: number;
    cardExpYear?: number;
    nickname?: string;
    stripeCustomerId?: string;
    stripePaymentMethodId?: string;
  }): Promise<PaymentMethod> {
    try {
      const {
        userId,
        type,
        cardLast4,
        cardBrand,
        cardExpMonth,
        cardExpYear,
        nickname,
        stripeCustomerId,
        stripePaymentMethodId,
      } = data;

      // Check if this is the user's first payment method to make it default
      const existingMethods = await prisma.paymentMethod.count({
        where: { userId, isActive: true },
      });

      const isFirstMethod = existingMethods === 0;

      const paymentMethod = await prisma.paymentMethod.create({
        data: {
          userId,
          type,
          cardLast4,
          cardBrand,
          cardExpMonth,
          cardExpYear,
          nickname,
          stripeCustomerId,
          stripePaymentMethodId,
          isDefault: isFirstMethod, // Make first payment method default
        },
      });

      logger.info('Payment method added successfully', {
        paymentMethodId: paymentMethod.id,
        userId,
        type,
      });

      return paymentMethod;
    } catch (error) {
      logger.error('Error adding payment method:', error);
      throw error;
    }
  }

  // Update payment method
  static async updatePaymentMethod(
    methodId: string,
    userId: string,
    data: {
      nickname?: string;
      cardExpMonth?: number;
      cardExpYear?: number;
    }
  ): Promise<PaymentMethod | null> {
    try {
      const paymentMethod = await prisma.paymentMethod.findFirst({
        where: { id: methodId, userId, isActive: true },
      });

      if (!paymentMethod) {
        return null;
      }

      const updatedPaymentMethod = await prisma.paymentMethod.update({
        where: { id: methodId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      logger.info('Payment method updated successfully', {
        paymentMethodId: methodId,
        userId,
      });

      return updatedPaymentMethod;
    } catch (error) {
      logger.error('Error updating payment method:', error);
      throw error;
    }
  }

  // Delete payment method
  static async deletePaymentMethod(methodId: string, userId: string): Promise<boolean> {
    try {
      const paymentMethod = await prisma.paymentMethod.findFirst({
        where: { id: methodId, userId, isActive: true },
      });

      if (!paymentMethod) {
        return false;
      }

      // Soft delete - mark as inactive
      await prisma.paymentMethod.update({
        where: { id: methodId },
        data: {
          isActive: false,
          isDefault: false, // Remove default status when deleting
          updatedAt: new Date(),
        },
      });

      // If this was the default payment method, set another one as default
      if (paymentMethod.isDefault) {
        const nextPaymentMethod = await prisma.paymentMethod.findFirst({
          where: { userId, isActive: true },
          orderBy: { createdAt: 'asc' },
        });

        if (nextPaymentMethod) {
          await prisma.paymentMethod.update({
            where: { id: nextPaymentMethod.id },
            data: { isDefault: true },
          });
        }
      }

      logger.info('Payment method deleted successfully', {
        paymentMethodId: methodId,
        userId,
      });

      return true;
    } catch (error) {
      logger.error('Error deleting payment method:', error);
      throw error;
    }
  }

  // Set default payment method
  static async setDefaultPaymentMethod(methodId: string, userId: string): Promise<PaymentMethod | null> {
    try {
      const paymentMethod = await prisma.paymentMethod.findFirst({
        where: { id: methodId, userId, isActive: true },
      });

      if (!paymentMethod) {
        return null;
      }

      // Transaction to ensure atomicity
      await prisma.$transaction(async (tx) => {
        // Remove default status from all user's payment methods
        await tx.paymentMethod.updateMany({
          where: { userId, isActive: true },
          data: { isDefault: false },
        });

        // Set this payment method as default
        await tx.paymentMethod.update({
          where: { id: methodId },
          data: { isDefault: true },
        });
      });

      const updatedPaymentMethod = await prisma.paymentMethod.findUnique({
        where: { id: methodId },
      });

      logger.info('Default payment method set successfully', {
        paymentMethodId: methodId,
        userId,
      });

      return updatedPaymentMethod;
    } catch (error) {
      logger.error('Error setting default payment method:', error);
      throw error;
    }
  }
}