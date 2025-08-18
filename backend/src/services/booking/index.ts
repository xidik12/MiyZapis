import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { Booking, User, Service, Specialist } from '@prisma/client';

interface CreateBookingData {
  customerId: string;
  serviceId: string;
  scheduledAt: Date;
  duration: number;
  customerNotes?: string;
  loyaltyPointsUsed?: number;
}

interface UpdateBookingData {
  status?: string;
  scheduledAt?: Date;
  duration?: number;
  customerNotes?: string;
  specialistNotes?: string;
  preparationNotes?: string;
  completionNotes?: string;
}

interface BookingWithDetails extends Booking {
  customer: Omit<User, 'password'>;
  specialist: Omit<User, 'password'>;
  service: Service & {
    specialist: Specialist;
  };
}

export class BookingService {
  // Create a new booking
  static async createBooking(data: CreateBookingData): Promise<BookingWithDetails> {
    try {
      // Validate service exists and is active
      const service = await prisma.service.findUnique({
        where: { id: data.serviceId },
        include: {
          specialist: true,
        },
      });

      if (!service) {
        throw new Error('SERVICE_NOT_FOUND');
      }

      if (!service.isActive) {
        throw new Error('SERVICE_NOT_ACTIVE');
      }

      // Validate customer exists
      const customer = await prisma.user.findUnique({
        where: { id: data.customerId },
      });

      if (!customer) {
        throw new Error('CUSTOMER_NOT_FOUND');
      }

      if (!customer.isActive) {
        throw new Error('CUSTOMER_NOT_ACTIVE');
      }

      // Check if specialist is available at the requested time
      const conflictingBooking = await prisma.booking.findFirst({
        where: {
          specialistId: service.specialist.userId,
          scheduledAt: {
            lte: new Date(data.scheduledAt.getTime() + (data.duration * 60 * 1000)),
          },
          AND: {
            OR: [
              {
                scheduledAt: {
                  gte: data.scheduledAt,
                },
              },
              {
                // Check if the new booking overlaps with existing ones
                scheduledAt: {
                  lte: data.scheduledAt,
                },
                // This is a simplified check - in production, you'd want more sophisticated overlap detection
              },
            ],
          },
          status: {
            in: ['PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS'],
          },
        },
      });

      if (conflictingBooking) {
        throw new Error('TIME_SLOT_NOT_AVAILABLE');
      }

      // Calculate pricing
      const baseAmount = service.basePrice;
      const loyaltyPointsUsed = data.loyaltyPointsUsed || 0;
      const loyaltyDiscount = loyaltyPointsUsed * 0.01; // 1 point = $0.01
      const totalAmount = Math.max(0, baseAmount - loyaltyDiscount);
      const depositAmount = totalAmount * 0.2; // 20% deposit
      const remainingAmount = totalAmount - depositAmount;

      // Check if customer has enough loyalty points
      if (loyaltyPointsUsed > 0 && customer.loyaltyPoints < loyaltyPointsUsed) {
        throw new Error('INSUFFICIENT_LOYALTY_POINTS');
      }

      // Create booking
      const booking = await prisma.booking.create({
        data: {
          customerId: data.customerId,
          specialistId: service.specialist.userId,
          serviceId: data.serviceId,
          scheduledAt: data.scheduledAt,
          duration: data.duration,
          totalAmount,
          depositAmount,
          remainingAmount,
          loyaltyPointsUsed,
          customerNotes: data.customerNotes,
          deliverables: JSON.stringify([]), // Empty deliverables initially
          status: 'PENDING', // Will be updated to PENDING_PAYMENT after payment intent creation
        },
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
              userType: true,
              phoneNumber: true,
              isEmailVerified: true,
              isPhoneVerified: true,
              isActive: true,
              loyaltyPoints: true,
              language: true,
              currency: true,
              timezone: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          specialist: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
              userType: true,
              phoneNumber: true,
              isEmailVerified: true,
              isPhoneVerified: true,
              isActive: true,
              loyaltyPoints: true,
              language: true,
              currency: true,
              timezone: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          service: {
            include: {
              specialist: true,
            },
          },
        },
      });

      // Deduct loyalty points if used
      if (loyaltyPointsUsed > 0) {
        await prisma.user.update({
          where: { id: data.customerId },
          data: {
            loyaltyPoints: {
              decrement: loyaltyPointsUsed,
            },
          },
        });

        // Create loyalty transaction record
        await prisma.loyaltyTransaction.create({
          data: {
            userId: data.customerId,
            type: 'REDEEMED',
            points: -loyaltyPointsUsed,
            reason: 'Booking payment',
            description: `Redeemed ${loyaltyPointsUsed} points for booking ${booking.id}`,
            referenceId: booking.id,
          },
        });
      }

      logger.info('Booking created successfully', { 
        bookingId: booking.id,
        customerId: data.customerId,
        serviceId: data.serviceId,
        totalAmount,
      });

      return booking as BookingWithDetails;
    } catch (error) {
      logger.error('Error creating booking:', error);
      throw error;
    }
  }

  // Get booking by ID
  static async getBooking(bookingId: string): Promise<BookingWithDetails> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
              userType: true,
              phoneNumber: true,
              isEmailVerified: true,
              isPhoneVerified: true,
              isActive: true,
              loyaltyPoints: true,
              language: true,
              currency: true,
              timezone: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          specialist: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
              userType: true,
              phoneNumber: true,
              isEmailVerified: true,
              isPhoneVerified: true,
              isActive: true,
              loyaltyPoints: true,
              language: true,
              currency: true,
              timezone: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          service: {
            include: {
              specialist: true,
            },
          },
        },
      });

      if (!booking) {
        throw new Error('BOOKING_NOT_FOUND');
      }

      return booking as BookingWithDetails;
    } catch (error) {
      logger.error('Error getting booking:', error);
      throw error;
    }
  }

  // Update booking
  static async updateBooking(
    bookingId: string,
    data: UpdateBookingData
  ): Promise<BookingWithDetails> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        throw new Error('BOOKING_NOT_FOUND');
      }

      // Validate status transitions
      if (data.status) {
        const allowedTransitions = {
          PENDING: ['PENDING_PAYMENT', 'CANCELLED'],
          PENDING_PAYMENT: ['CONFIRMED', 'CANCELLED'],
          CONFIRMED: ['IN_PROGRESS', 'CANCELLED'],
          IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
          COMPLETED: [], // Cannot change from completed
          CANCELLED: [], // Cannot change from cancelled
          REFUNDED: [], // Cannot change from refunded
        };

        if (!allowedTransitions[booking.status as keyof typeof allowedTransitions]?.includes(data.status)) {
          throw new Error('INVALID_STATUS_TRANSITION');
        }
      }

      // Prepare update data
      const updateData: any = {
        ...data,
        updatedAt: new Date(),
      };

      // Set timestamps based on status
      if (data.status) {
        switch (data.status) {
          case 'CONFIRMED':
            updateData.confirmedAt = new Date();
            break;
          case 'IN_PROGRESS':
            updateData.startedAt = new Date();
            break;
          case 'COMPLETED':
            updateData.completedAt = new Date();
            break;
          case 'CANCELLED':
            updateData.cancelledAt = new Date();
            break;
        }
      }

      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: updateData,
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
              userType: true,
              phoneNumber: true,
              isEmailVerified: true,
              isPhoneVerified: true,
              isActive: true,
              loyaltyPoints: true,
              language: true,
              currency: true,
              timezone: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          specialist: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
              userType: true,
              phoneNumber: true,
              isEmailVerified: true,
              isPhoneVerified: true,
              isActive: true,
              loyaltyPoints: true,
              language: true,
              currency: true,
              timezone: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          service: {
            include: {
              specialist: true,
            },
          },
        },
      });

      // Award loyalty points when booking is completed
      if (data.status === 'COMPLETED') {
        const pointsEarned = Math.floor(booking.totalAmount * 0.1); // 10% of total amount as points
        
        await prisma.user.update({
          where: { id: booking.customerId },
          data: {
            loyaltyPoints: {
              increment: pointsEarned,
            },
          },
        });

        // Create loyalty transaction record
        await prisma.loyaltyTransaction.create({
          data: {
            userId: booking.customerId,
            type: 'EARNED',
            points: pointsEarned,
            reason: 'Booking completion',
            description: `Earned ${pointsEarned} points for completing booking ${booking.id}`,
            referenceId: booking.id,
          },
        });

        // Update specialist metrics
        await prisma.specialist.update({
          where: { userId: booking.specialistId },
          data: {
            completedBookings: {
              increment: 1,
            },
          },
        });
      }

      logger.info('Booking updated successfully', { 
        bookingId,
        status: data.status,
      });

      return updatedBooking as BookingWithDetails;
    } catch (error) {
      logger.error('Error updating booking:', error);
      throw error;
    }
  }

  // Cancel booking
  static async cancelBooking(
    bookingId: string,
    cancelledBy: string,
    reason?: string
  ): Promise<BookingWithDetails> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        throw new Error('BOOKING_NOT_FOUND');
      }

      // Check if cancellation is allowed
      const now = new Date();
      const scheduledTime = new Date(booking.scheduledAt);
      const hoursUntilBooking = (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilBooking < 24) {
        throw new Error('CANCELLATION_TOO_LATE');
      }

      if (!['PENDING', 'PENDING_PAYMENT', 'CONFIRMED'].includes(booking.status)) {
        throw new Error('CANCELLATION_NOT_ALLOWED');
      }

      // Calculate refund amount
      let refundAmount = 0;
      if (booking.status === 'CONFIRMED') {
        // Refund deposit minus cancellation fee (10%)
        refundAmount = booking.depositAmount * 0.9;
      }

      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy,
          cancellationReason: reason,
          refundAmount,
          updatedAt: new Date(),
        },
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
              userType: true,
              phoneNumber: true,
              isEmailVerified: true,
              isPhoneVerified: true,
              isActive: true,
              loyaltyPoints: true,
              language: true,
              currency: true,
              timezone: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          specialist: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
              userType: true,
              phoneNumber: true,
              isEmailVerified: true,
              isPhoneVerified: true,
              isActive: true,
              loyaltyPoints: true,
              language: true,
              currency: true,
              timezone: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          service: {
            include: {
              specialist: true,
            },
          },
        },
      });

      // Refund loyalty points if they were used
      if (booking.loyaltyPointsUsed > 0) {
        await prisma.user.update({
          where: { id: booking.customerId },
          data: {
            loyaltyPoints: {
              increment: booking.loyaltyPointsUsed,
            },
          },
        });

        // Create loyalty transaction record
        await prisma.loyaltyTransaction.create({
          data: {
            userId: booking.customerId,
            type: 'EARNED',
            points: booking.loyaltyPointsUsed,
            reason: 'Booking cancellation refund',
            description: `Refunded ${booking.loyaltyPointsUsed} points for cancelled booking ${booking.id}`,
            referenceId: booking.id,
          },
        });
      }

      logger.info('Booking cancelled successfully', { 
        bookingId,
        cancelledBy,
        refundAmount,
      });

      return updatedBooking as BookingWithDetails;
    } catch (error) {
      logger.error('Error cancelling booking:', error);
      throw error;
    }
  }

  // Get bookings for a user (customer or specialist)
  static async getUserBookings(
    userId: string,
    userType: 'customer' | 'specialist',
    status?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    bookings: BookingWithDetails[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const where: any = {};
      
      if (userType === 'customer') {
        where.customerId = userId;
      } else {
        where.specialistId = userId;
      }

      if (status) {
        where.status = status;
      }

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where,
          include: {
            customer: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
                userType: true,
                phoneNumber: true,
                isEmailVerified: true,
                isPhoneVerified: true,
                isActive: true,
                loyaltyPoints: true,
                language: true,
                currency: true,
                timezone: true,
                createdAt: true,
                updatedAt: true,
              },
            },
            specialist: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
                userType: true,
                phoneNumber: true,
                isEmailVerified: true,
                isPhoneVerified: true,
                isActive: true,
                loyaltyPoints: true,
                language: true,
                currency: true,
                timezone: true,
                createdAt: true,
                updatedAt: true,
              },
            },
            service: {
              include: {
                specialist: true,
              },
            },
          },
          orderBy: { scheduledAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.booking.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        bookings: bookings as BookingWithDetails[],
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error('Error getting user bookings:', error);
      throw error;
    }
  }

  // Get booking statistics for a specialist
  static async getSpecialistBookingStats(
    specialistId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalBookings: number;
    pendingBookings: number;
    confirmedBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalRevenue: number;
    averageBookingValue: number;
  }> {
    try {
      const where: any = {
        specialistId,
      };

      if (startDate && endDate) {
        where.createdAt = {
          gte: startDate,
          lte: endDate,
        };
      }

      const bookings = await prisma.booking.findMany({
        where,
        select: {
          status: true,
          totalAmount: true,
        },
      });

      const stats = {
        totalBookings: bookings.length,
        pendingBookings: bookings.filter(b => b.status === 'PENDING').length,
        confirmedBookings: bookings.filter(b => b.status === 'CONFIRMED').length,
        completedBookings: bookings.filter(b => b.status === 'COMPLETED').length,
        cancelledBookings: bookings.filter(b => b.status === 'CANCELLED').length,
        totalRevenue: bookings
          .filter(b => b.status === 'COMPLETED')
          .reduce((sum, b) => sum + b.totalAmount, 0),
        averageBookingValue: 0,
      };

      stats.averageBookingValue = stats.completedBookings > 0 
        ? stats.totalRevenue / stats.completedBookings 
        : 0;

      return stats;
    } catch (error) {
      logger.error('Error getting specialist booking stats:', error);
      throw error;
    }
  }
}