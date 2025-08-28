import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { NotificationService } from '@/services/notification';
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
  private static notificationService = new NotificationService(prisma);

  // Create a new booking
  static async createBooking(data: CreateBookingData): Promise<BookingWithDetails> {
    try {
      // Validate required fields
      if (!data.customerId) {
        throw new Error('CUSTOMER_ID_REQUIRED');
      }

      if (!data.serviceId) {
        throw new Error('SERVICE_ID_REQUIRED');
      }

      if (!data.scheduledAt) {
        throw new Error('SCHEDULED_AT_REQUIRED');
      }

      if (!data.duration || data.duration <= 0) {
        throw new Error('INVALID_DURATION');
      }

      // Validate scheduled time is in the future
      if (data.scheduledAt <= new Date()) {
        throw new Error('SCHEDULED_TIME_MUST_BE_FUTURE');
      }

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

      // Determine initial booking status based on specialist's auto-booking setting
      const initialStatus = service.specialist.autoBooking ? 'CONFIRMED' : 'PENDING';
      
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
          status: initialStatus, // Auto-booking: CONFIRMED if autoBooking enabled, otherwise PENDING
          confirmedAt: service.specialist.autoBooking ? new Date() : null, // Auto-confirm if auto-booking
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

      // Send appropriate notifications based on auto-booking setting
      try {
        if (service.specialist.autoBooking) {
          // Auto-booking ON: Send "booking confirmed" notifications
          await this.notificationService.sendNotification(booking.customerId, {
            type: 'BOOKING_CONFIRMED',
            title: 'Your booking is confirmed',
            message: `Your booking for ${service.name} on ${new Date(booking.scheduledAt).toLocaleDateString()} is automatically confirmed.`,
            data: {
              bookingId: booking.id,
              serviceName: service.name,
              scheduledAt: booking.scheduledAt,
              status: 'CONFIRMED'
            },
            emailTemplate: 'booking_confirmed',
            smsTemplate: 'booking_confirmed_sms'
          });

          await this.notificationService.sendNotification(booking.specialistId, {
            type: 'BOOKING_CONFIRMED',
            title: 'You have been booked',
            message: `You have been booked for ${service.name} on ${new Date(booking.scheduledAt).toLocaleDateString()}.`,
            data: {
              bookingId: booking.id,
              serviceName: service.name,
              scheduledAt: booking.scheduledAt,
              customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
              status: 'CONFIRMED'
            },
            emailTemplate: 'specialist_booking_confirmed',
            smsTemplate: 'specialist_booking_confirmed_sms'
          });
        } else {
          // Auto-booking OFF: Send "booking pending" notifications
          await this.notificationService.sendNotification(booking.customerId, {
            type: 'BOOKING_PENDING',
            title: 'Your booking request has been sent',
            message: `Your booking request for ${service.name} has been sent to the specialist and is waiting for confirmation.`,
            data: {
              bookingId: booking.id,
              serviceName: service.name,
              scheduledAt: booking.scheduledAt,
              status: 'PENDING'
            },
            emailTemplate: 'booking_pending',
            smsTemplate: 'booking_pending_sms'
          });

          await this.notificationService.sendNotification(booking.specialistId, {
            type: 'BOOKING_REQUEST',
            title: 'New booking request requires confirmation',
            message: `New booking request for ${service.name} on ${new Date(booking.scheduledAt).toLocaleDateString()} - requires your confirmation.`,
            data: {
              bookingId: booking.id,
              serviceName: service.name,
              scheduledAt: booking.scheduledAt,
              customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
              status: 'PENDING'
            },
            emailTemplate: 'specialist_booking_request',
            smsTemplate: 'specialist_booking_request_sms'
          });
        }
      } catch (notificationError) {
        logger.error('Failed to send booking notifications:', notificationError);
        // Don't throw error as booking was successful
      }

      logger.info('Booking created successfully', { 
        bookingId: booking.id,
        customerId: data.customerId,
        serviceId: data.serviceId,
        totalAmount,
        status: initialStatus,
        autoBooking: service.specialist.autoBooking,
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

      // Validate status transitions (more flexible for specialist management)
      if (data.status) {
        const allowedTransitions = {
          // Pending bookings can go to any status except completed (need confirmation first)
          PENDING: ['PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'IN_PROGRESS'],
          pending: ['PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'IN_PROGRESS', 'pending_payment', 'confirmed', 'cancelled', 'in_progress'],
          
          // Pending payment can be confirmed or cancelled
          PENDING_PAYMENT: ['CONFIRMED', 'CANCELLED', 'PENDING'],
          pending_payment: ['CONFIRMED', 'CANCELLED', 'PENDING', 'confirmed', 'cancelled', 'pending'],
          
          // Confirmed bookings can progress or be cancelled
          CONFIRMED: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
          confirmed: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'in_progress', 'completed', 'cancelled'],
          
          // In progress can be completed or cancelled
          IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
          in_progress: ['COMPLETED', 'CANCELLED', 'completed', 'cancelled'],
          
          // Completed bookings can be reopened by specialists if needed
          COMPLETED: ['CANCELLED'], // Allow cancellation for refunds
          completed: ['CANCELLED', 'cancelled'],
          
          // Cancelled bookings can be reactivated
          CANCELLED: ['PENDING', 'CONFIRMED'],
          cancelled: ['PENDING', 'CONFIRMED', 'pending', 'confirmed'],
          
          // No show can be reactivated
          NO_SHOW: ['PENDING', 'CONFIRMED', 'CANCELLED'],
          
          // Refunded stays final
          REFUNDED: [],
        };

        const currentStatus = booking.status;
        const newStatus = data.status;
        
        // Check if transition is allowed
        const allowedForCurrentStatus = allowedTransitions[currentStatus as keyof typeof allowedTransitions];
        if (allowedForCurrentStatus && !allowedForCurrentStatus.includes(newStatus)) {
          logger.warn('Invalid status transition attempt', {
            bookingId: booking.id,
            currentStatus,
            attemptedStatus: newStatus,
            allowedTransitions: allowedForCurrentStatus
          });
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

      // Send notifications for status changes
      try {
        if (data.status === 'CONFIRMED' && booking.status === 'PENDING') {
          // Booking was confirmed by specialist
          await this.notificationService.sendNotification(booking.customerId, {
            type: 'BOOKING_CONFIRMED',
            title: 'Your booking is confirmed',
            message: `Your booking for ${updatedBooking.service.name} on ${new Date(booking.scheduledAt).toLocaleDateString()} has been confirmed by the specialist.`,
            data: {
              bookingId: booking.id,
              serviceName: updatedBooking.service.name,
              scheduledAt: booking.scheduledAt,
              status: 'CONFIRMED'
            },
            emailTemplate: 'booking_confirmed',
            smsTemplate: 'booking_confirmed_sms'
          });

          await this.notificationService.sendNotification(booking.specialistId, {
            type: 'BOOKING_CONFIRMED',
            title: 'Booking confirmed',
            message: `You have confirmed the booking for ${updatedBooking.service.name} on ${new Date(booking.scheduledAt).toLocaleDateString()}.`,
            data: {
              bookingId: booking.id,
              serviceName: updatedBooking.service.name,
              scheduledAt: booking.scheduledAt,
              customerName: `${updatedBooking.customer.firstName} ${updatedBooking.customer.lastName}`,
              status: 'CONFIRMED'
            },
            emailTemplate: 'specialist_booking_confirmed',
            smsTemplate: 'specialist_booking_confirmed_sms'
          });
        }
      } catch (notificationError) {
        logger.error('Failed to send booking status update notifications:', notificationError);
        // Don't throw error as booking update was successful
      }

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

      // Transform bookings to include flattened fields for frontend compatibility
      const transformedBookings = bookings.map(booking => {
        const scheduledDate = new Date(booking.scheduledAt);
        return {
          ...booking,
          // Flattened customer fields
          customerName: booking.customer ? `${booking.customer.firstName} ${booking.customer.lastName}`.trim() : 'Unknown Customer',
          customerEmail: booking.customer?.email,
          customerPhone: booking.customer?.phoneNumber,
          
          // Flattened service fields  
          serviceName: booking.service?.name || 'Unknown Service',
          
          // Flattened date/time fields
          date: scheduledDate.toISOString().split('T')[0], // YYYY-MM-DD format
          time: scheduledDate.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
          
          // Amount field (frontend expects 'amount' not 'totalAmount')
          amount: booking.totalAmount,
          
          // Type field (based on meetingLink presence)
          type: booking.meetingLink ? 'online' : 'in-person',
        };
      });

      return {
        bookings: transformedBookings as BookingWithDetails[],
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error('Error getting user bookings:', error);
      throw error;
    }
  }

  // Confirm a pending booking (specialist action)
  static async confirmBooking(
    bookingId: string,
    specialistUserId: string
  ): Promise<BookingWithDetails> {
    try {
      const booking = await this.getBooking(bookingId);

      // Verify the specialist owns this booking
      if (booking.specialistId !== specialistUserId) {
        throw new Error('SPECIALIST_NOT_AUTHORIZED');
      }

      // Verify booking is in PENDING status
      if (booking.status !== 'PENDING') {
        throw new Error('BOOKING_NOT_PENDING');
      }

      // Update booking to CONFIRMED
      return await this.updateBooking(bookingId, { status: 'CONFIRMED' });
    } catch (error) {
      logger.error('Error confirming booking:', error);
      throw error;
    }
  }

  // Reject a pending booking (specialist action)
  static async rejectBooking(
    bookingId: string,
    specialistUserId: string,
    reason?: string
  ): Promise<BookingWithDetails> {
    try {
      const booking = await this.getBooking(bookingId);

      // Verify the specialist owns this booking
      if (booking.specialistId !== specialistUserId) {
        throw new Error('SPECIALIST_NOT_AUTHORIZED');
      }

      // Verify booking is in PENDING status
      if (booking.status !== 'PENDING') {
        throw new Error('BOOKING_NOT_PENDING');
      }

      // Cancel the booking with rejection reason
      return await this.cancelBooking(bookingId, specialistUserId, reason || 'Booking rejected by specialist');
    } catch (error) {
      logger.error('Error rejecting booking:', error);
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