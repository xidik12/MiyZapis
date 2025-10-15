import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { NotificationService } from '@/services/notification';
import { emailService as templatedEmailService } from '@/services/email/enhanced-email';
import { resolveLanguage } from '@/utils/language';
import LoyaltyService from '@/services/loyalty';
import { specialistSubscriptionService } from '@/services/payment/subscription.service';
import { ReferralService } from '@/services/referral';
import { ReferralProcessingService } from '@/services/referral/processing.service';
import { Booking, User, Service, Specialist } from '@prisma/client';

interface CreateBookingData {
  customerId: string;
  serviceId: string;
  scheduledAt: Date;
  duration?: number; // Optional - will use service duration if not provided
  customerNotes?: string;
  loyaltyPointsUsed?: number;
  rewardRedemptionId?: string;
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

interface TransformedBooking extends Booking {
  customer: Omit<User, 'password'>;
  specialist: Omit<User, 'password'>;
  service: Service;
  customerName: string;
  customerEmail: string | undefined;
  customerPhone: string | undefined;
  serviceName: string;
  date: string;
  time: string;
  amount: number;
  type: string;
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

      // Duration validation will be done after fetching service

      // Validate scheduled time is in the future
      if (data.scheduledAt <= new Date()) {
        throw new Error('SCHEDULED_TIME_MUST_BE_FUTURE');
      }

      // Check for duplicate bookings (same customer, service, and time)
      const existingBooking = await prisma.booking.findFirst({
        where: {
          customerId: data.customerId,
          serviceId: data.serviceId,
          scheduledAt: data.scheduledAt,
          status: {
            not: 'CANCELLED'
          }
        }
      });

      if (existingBooking) {
        logger.warn('Duplicate booking attempt detected', {
          customerId: data.customerId,
          serviceId: data.serviceId,
          scheduledAt: data.scheduledAt,
          existingBookingId: existingBooking.id
        });
        throw new Error('DUPLICATE_BOOKING');
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

      // Prevent specialists from booking their own services
      // service.specialist.userId is the User ID of the specialist who owns the service
      if (data.customerId === service.specialist.userId) {
        throw new Error('CANNOT_BOOK_OWN_SERVICE');
      }

      // Use service duration if not provided, or validate provided duration
      const bookingDuration = data.duration || service.duration;
      if (!bookingDuration || bookingDuration <= 0) {
        throw new Error('INVALID_DURATION');
      }

      // Duration can be any positive number of minutes

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
      const bookingStartTime = data.scheduledAt;
      const bookingEndTime = new Date(bookingStartTime.getTime() + (bookingDuration * 60 * 1000));
      
      logger.info('Checking for booking conflicts', {
        specialistId: service.specialist.userId, // Use User ID for logging consistency
        bookingStartTime: bookingStartTime.toISOString(),
        bookingEndTime: bookingEndTime.toISOString(),
        duration: bookingDuration
      });

      // Use a database transaction + advisory locks to prevent race conditions
      const booking = await prisma.$transaction(async (tx) => {
        // Acquire per-minute advisory locks for the requested time range to serialize
        // concurrent booking attempts for the same specialist and overlapping minutes.
        // This prevents two parallel transactions from both passing the overlap check.
        const specialistUserId = service.specialist.userId;
        const hash32 = (str: string) => {
          let h = 0;
          for (let i = 0; i < str.length; i++) {
            h = (h << 5) - h + str.charCodeAt(i);
            h |= 0; // 32-bit
          }
          return h | 0;
        };
        const specialistKey = hash32(specialistUserId);
        const startMinute = Math.floor(bookingStartTime.getTime() / 60000);
        const endMinute = Math.floor(bookingEndTime.getTime() / 60000);
        for (let m = startMinute; m < endMinute; m++) {
          // Use two-int variant to avoid bigint collisions
          await tx.$executeRawUnsafe('SELECT pg_advisory_xact_lock($1::int, $2::int)', specialistKey, m);
        }
        // Find any existing bookings that overlap with the requested time slot
        const existingBookings = await tx.booking.findMany({
          where: {
            specialistId: service.specialist.userId, // Use User ID, not Specialist ID
            status: {
              in: ['PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS'],
            },
            // Add time range filter to reduce the dataset
            scheduledAt: {
              gte: new Date(bookingStartTime.getTime() - (24 * 60 * 60 * 1000)), // 24 hours before
              lte: new Date(bookingEndTime.getTime() + (24 * 60 * 60 * 1000)), // 24 hours after
            }
          },
          select: {
            id: true,
            scheduledAt: true,
            duration: true,
            status: true
          }
        });

        // Check for time overlap with any existing booking
        const conflictingBooking = existingBookings.find(booking => {
          const existingStart = new Date(booking.scheduledAt);
          const existingEnd = new Date(existingStart.getTime() + (booking.duration * 60 * 1000));
          
          // Two time ranges overlap if: start1 < end2 && start2 < end1
          const hasOverlap = bookingStartTime < existingEnd && existingStart < bookingEndTime;
          
          if (hasOverlap) {
            logger.warn('Booking conflict detected', {
              existingBookingId: booking.id,
              existingStart: existingStart.toISOString(),
              existingEnd: existingEnd.toISOString(),
              requestedStart: bookingStartTime.toISOString(),
              requestedEnd: bookingEndTime.toISOString()
            });
          }
          
          return hasOverlap;
        });

        if (conflictingBooking) {
          throw new Error('TIME_SLOT_NOT_AVAILABLE');
        }

        // Calculate pricing
        const baseAmount = service.basePrice;
        const loyaltyPointsUsed = data.loyaltyPointsUsed || 0;
        const loyaltyDiscount = loyaltyPointsUsed * 0.01; // 1 point = $0.01
        let subtotalAfterPoints = Math.max(0, baseAmount - loyaltyDiscount);

        // Optional: apply approved reward redemption
        let rewardDiscount = 0;
        let rewardRedemptionId: string | undefined = data.rewardRedemptionId;

        const now = new Date();
        if (rewardRedemptionId) {
          const redemption = await tx.rewardRedemption.findUnique({
            where: { id: rewardRedemptionId },
            include: { reward: true }
          });

          if (!redemption) {
            throw new Error('REWARD_REDEMPTION_NOT_FOUND');
          }
          if (redemption.userId !== data.customerId) {
            throw new Error('REWARD_REDEMPTION_NOT_OWNED');
          }
          if (redemption.status !== 'APPROVED') {
            throw new Error('REWARD_REDEMPTION_NOT_APPROVED');
          }
          if (redemption.expiresAt && redemption.expiresAt < new Date()) {
            throw new Error('REWARD_REDEMPTION_EXPIRED');
          }

          // Validate specialist match
          if (redemption.reward.specialistId !== service.specialist.userId) {
            throw new Error('REWARD_NOT_FOR_THIS_SPECIALIST');
          }

          // Validate service applicability if serviceIds restriction exists
          if (redemption.reward.serviceIds) {
            try {
              const allowed: string[] = JSON.parse(redemption.reward.serviceIds);
              if (Array.isArray(allowed) && allowed.length > 0 && !allowed.includes(data.serviceId)) {
                throw new Error('REWARD_NOT_APPLICABLE_TO_SERVICE');
              }
            } catch (_e) {
              // If parsing fails, treat as not restricted
            }
          }

          // Compute reward discount
          if (redemption.reward.type === 'PERCENTAGE_OFF' && redemption.reward.discountPercent) {
            rewardDiscount = (subtotalAfterPoints * redemption.reward.discountPercent) / 100;
          } else if (redemption.reward.type === 'DISCOUNT_VOUCHER' && redemption.reward.discountAmount) {
            rewardDiscount = Math.min(redemption.reward.discountAmount, subtotalAfterPoints);
          } else if (redemption.reward.type === 'FREE_SERVICE') {
            rewardDiscount = subtotalAfterPoints;
          }

          subtotalAfterPoints = Math.max(0, subtotalAfterPoints - rewardDiscount);
        } else {
          // Attempt auto-apply: find an applicable approved redemption for this specialist/service
          const candidate = await tx.rewardRedemption.findFirst({
            where: {
              userId: data.customerId,
              status: 'APPROVED',
              OR: [
                { expiresAt: null },
                { expiresAt: { gte: now } }
              ],
              reward: {
                specialistId: service.specialist.userId,
                isActive: true
              }
            },
            include: { reward: true },
            orderBy: { expiresAt: 'asc' }
          });

          if (candidate) {
            // Validate service applicability
            let applicable = true;
            if (candidate.reward.serviceIds) {
              try {
                const allowed: string[] = JSON.parse(candidate.reward.serviceIds);
                if (Array.isArray(allowed) && allowed.length > 0 && !allowed.includes(data.serviceId)) {
                  applicable = false;
                }
              } catch (_e) { /* ignore */ }
            }

            if (applicable) {
              rewardRedemptionId = candidate.id;
              if (candidate.reward.type === 'PERCENTAGE_OFF' && candidate.reward.discountPercent) {
                rewardDiscount = (subtotalAfterPoints * candidate.reward.discountPercent) / 100;
              } else if (candidate.reward.type === 'DISCOUNT_VOUCHER' && candidate.reward.discountAmount) {
                rewardDiscount = Math.min(candidate.reward.discountAmount, subtotalAfterPoints);
              } else if (candidate.reward.type === 'FREE_SERVICE') {
                rewardDiscount = subtotalAfterPoints;
              }
              subtotalAfterPoints = Math.max(0, subtotalAfterPoints - rewardDiscount);
            }
          }
        }

        const totalAmount = subtotalAfterPoints;
        const depositAmount = totalAmount * 0.2; // 20% deposit
        const remainingAmount = totalAmount - depositAmount;

        // Calculate platform fee (5%)
        const platformFeePercentage = 5.0;
        const platformFeeAmount = totalAmount * (platformFeePercentage / 100);
        const specialistEarnings = totalAmount - platformFeeAmount;

        // Check if customer has enough loyalty points
        if (loyaltyPointsUsed > 0 && customer.loyaltyPoints < loyaltyPointsUsed) {
          throw new Error('INSUFFICIENT_LOYALTY_POINTS');
        }

        // Determine initial booking status based on specialist's auto-booking setting
        const initialStatus = service.specialist.autoBooking ? 'CONFIRMED' : 'PENDING';

        // Create booking within the transaction
        const createdBooking = await tx.booking.create({
          data: {
            customerId: data.customerId,
            specialistId: service.specialist.userId, // Use the User ID, not the Specialist ID
            serviceId: data.serviceId,
            scheduledAt: data.scheduledAt,
            duration: bookingDuration,
            totalAmount,
            depositAmount,
            remainingAmount,
            platformFeePercentage,
            platformFeeAmount,
            specialistEarnings,
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
              loyaltyTierId: true,
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
              loyaltyTierId: true,
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

        // Deduct loyalty points if used - within transaction
        if (loyaltyPointsUsed > 0) {
          await tx.user.update({
            where: { id: data.customerId },
            data: {
              loyaltyPoints: {
                decrement: loyaltyPointsUsed,
              },
            },
          });

          // Create loyalty transaction record
          await tx.loyaltyTransaction.create({
            data: {
              userId: data.customerId,
              type: 'REDEEMED',
              points: -loyaltyPointsUsed,
              reason: 'Booking payment',
              description: `Redeemed ${loyaltyPointsUsed} points for booking`,
              referenceId: createdBooking.id,
            },
          });
        }

        // Mark reward redemption as used and link to booking
        if (rewardRedemptionId && rewardDiscount > 0) {
          await tx.rewardRedemption.update({
            where: { id: rewardRedemptionId },
            data: {
              bookingId: createdBooking.id,
              originalAmount: Math.max(0, baseAmount - loyaltyDiscount),
              discountApplied: rewardDiscount,
              finalAmount: totalAmount,
              status: 'USED',
              usedAt: new Date(),
            }
          });
        }

        return createdBooking;
      });

      // Track referral activity for first booking (if applicable)
      try {
        // Check if this is the customer's first booking
        const customerBookingCount = await prisma.booking.count({
          where: {
            customerId: data.customerId,
            status: { not: 'CANCELLED' }
          }
        });

        if (customerBookingCount === 1) {
          // This is the first booking - check for any pending referrals for this customer
          const pendingReferrals = await prisma.loyaltyReferral.findMany({
            where: {
              referredId: data.customerId,
              status: 'PENDING'
            }
          });

          // Update referrals with first booking ID
          if (pendingReferrals.length > 0) {
            await prisma.loyaltyReferral.updateMany({
              where: {
                referredId: data.customerId,
                status: 'PENDING'
              },
              data: {
                firstBookingId: booking.id
              }
            });

            logger.info('Updated referrals with first booking ID', {
              customerId: data.customerId,
              bookingId: booking.id,
              referralCount: pendingReferrals.length
            });
          }
        }
      } catch (error) {
        // Don't fail booking creation if referral tracking fails
        logger.error('Failed to track referral activity for booking', {
          bookingId: booking.id,
          customerId: data.customerId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Send appropriate notifications based on auto-booking setting
      try {
        if (service.specialist.autoBooking) {
          logger.info('📧 Auto-booking is ON, sending booking confirmed notifications', {
            bookingId: booking.id,
            customerId: booking.customerId,
            specialistId: booking.specialistId
          });
          
          // Auto-booking ON: Send "booking confirmed" notifications
          await BookingService.notificationService.sendNotification(booking.customerId, {
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

          await BookingService.notificationService.sendNotification(booking.specialistId, {
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
          logger.info('📧 Auto-booking is OFF, sending booking pending notifications', {
            bookingId: booking.id,
            customerId: booking.customerId,
            specialistId: booking.specialistId
          });
          
          // Auto-booking OFF: Send "booking pending" notifications
          await BookingService.notificationService.sendNotification(booking.customerId, {
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

          await BookingService.notificationService.sendNotification(booking.specialistId, {
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

        // Attempt to send reminder if within 24 hours (method will self-check)
        try {
          await templatedEmailService.sendBookingReminder(booking.id, booking.customer.language || 'en');
        } catch (e) {
          logger.warn('Booking reminder send attempt skipped/failed', { bookingId: booking.id });
        }
      } catch (notificationError) {
        logger.error('Failed to send booking notifications:', notificationError);
        // Don't throw error as booking was successful
      }

      logger.info('Booking created successfully', { 
        bookingId: booking.id,
        customerId: data.customerId,
        serviceId: data.serviceId,
        totalAmount: booking.totalAmount,
        status: booking.status,
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
              loyaltyTierId: true,
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
              loyaltyTierId: true,
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

      // Allow flexible status transitions for specialist management
      // Only prevent transitions that would cause data integrity issues
      if (data.status) {
        const currentStatus = booking.status;
        const newStatus = data.status;
        
        // Log the transition attempt
        logger.info('Status transition attempt', {
          bookingId: booking.id,
          currentStatus,
          newStatus
        });

        // Very minimal validation - only prevent obviously invalid transitions
        const invalidTransitions = [
          // Don't allow transitions from final states to earlier states without explicit business logic
          // For now, allow all transitions to give specialists full control
        ];

        // For now, allow all status transitions to give specialists maximum flexibility
        // This can be tightened later based on business requirements
        logger.info('Status transition allowed', {
          bookingId: booking.id,
          from: currentStatus,
          to: newStatus
        });
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
              loyaltyTierId: true,
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
              loyaltyTierId: true,
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
          await BookingService.notificationService.sendNotification(booking.customerId, {
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

          await BookingService.notificationService.sendNotification(booking.specialistId, {
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

      // Award loyalty points when booking is completed using centralized service
      if (data.status === 'COMPLETED') {
        // Use centralized loyalty service for consistent point calculation
        await LoyaltyService.processBookingCompletion(booking.id);

        // Process referral completion (if this was a first booking)
        try {
          await ReferralProcessingService.processBookingCompletion(booking.id);
        } catch (error) {
          // Don't fail booking completion if referral processing fails
          logger.error('Failed to process referral completion', {
            bookingId: booking.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

        // Process specialist subscription fees (PAY_PER_USE or MONTHLY_SUBSCRIPTION)
        try {
          const feeResult = await specialistSubscriptionService.processTransactionFee(
            booking.specialistId,
            booking.id
          );

          logger.info('Specialist subscription fee processed', {
            bookingId: booking.id,
            specialistId: booking.specialistId,
            feeCharged: feeResult.feeCharged,
            currency: feeResult.currency,
            method: feeResult.method,
          });
        } catch (subscriptionError) {
          logger.error('Failed to process specialist subscription fee:', {
            error: subscriptionError,
            bookingId: booking.id,
            specialistId: booking.specialistId,
          });
          // Don't throw error as booking completion was successful
        }

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
      const isSpecialistCancellation = cancelledBy === booking.specialistId;

      if (isSpecialistCancellation) {
        // If specialist cancels, customer gets FULL refund ($1) to wallet
        refundAmount = 100; // $1 in cents
      }
      // If customer cancels, they lose the $1 deposit (no refund)

      // Use transaction to ensure atomic operation
      const updatedBooking = await prisma.$transaction(async (tx) => {
        // Update booking status
        const booking = await tx.booking.update({
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
                loyaltyTierId: true,
                language: true,
                currency: true,
                timezone: true,
                walletBalance: true,
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
                loyaltyTierId: true,
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

        // If there's a refund amount, credit customer's wallet
        if (refundAmount > 0 && booking.customerId) {
          await tx.user.update({
            where: { id: booking.customerId },
            data: {
              walletBalance: {
                increment: refundAmount
              }
            }
          });

          // Create wallet transaction record
          await tx.walletTransaction.create({
            data: {
              userId: booking.customerId,
              amount: refundAmount,
              type: 'REFUND',
              description: isSpecialistCancellation
                ? 'Booking cancellation refund (specialist cancelled)'
                : 'Booking cancellation refund',
              relatedBookingId: bookingId,
              status: 'COMPLETED',
              createdAt: new Date()
            }
          });

          logger.info('Refund credited to customer wallet', {
            bookingId,
            customerId: booking.customerId,
            refundAmount,
            cancelledBy: isSpecialistCancellation ? 'specialist' : 'customer'
          });
        }

        return booking;
      });

      // Send localized emails for cancellation
      try {
        const langCustomer = resolveLanguage(updatedBooking.customer?.language, undefined);
        const langSpecialist = updatedBooking.specialist?.language || 'en';

        // Send cancellation email to customer
        if (updatedBooking.customer?.email) {
          const dateStr = new Intl.DateTimeFormat(langCustomer === 'uk' ? 'uk-UA' : langCustomer === 'ru' ? 'ru-RU' : 'en-US', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
            timeZone: updatedBooking.customer.timezone
          }).format(new Date(updatedBooking.scheduledAt));

          // Add refund notice to cancellation reason if applicable
          let cancellationMessage = reason || '';
          if (refundAmount > 0) {
            const refundInDollars = (refundAmount / 100).toFixed(2);
            cancellationMessage += cancellationMessage ? ` A refund of $${refundInDollars} has been credited to your wallet.` : `A refund of $${refundInDollars} has been credited to your wallet.`;
          }

          await templatedEmailService.sendTemplateEmail({
            to: updatedBooking.customer.email!,
            templateKey: 'bookingCancelled',
            language: langCustomer,
            data: {
              name: updatedBooking.customer.firstName,
              serviceName: updatedBooking.service.name,
              bookingDateTime: dateStr,
              reason: cancellationMessage
            }
          });
        }

        // Send cancellation email to specialist
        if (updatedBooking.specialist?.email) {
          const dateStrSpec = new Intl.DateTimeFormat(langSpecialist === 'uk' ? 'uk-UA' : langSpecialist === 'ru' ? 'ru-RU' : 'en-US', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
            timeZone: updatedBooking.specialist.timezone
          }).format(new Date(updatedBooking.scheduledAt));
          await templatedEmailService.sendTemplateEmail({
            to: updatedBooking.specialist.email!,
            templateKey: 'bookingCancelled',
            language: langSpecialist,
            data: {
              name: updatedBooking.specialist.firstName,
              serviceName: updatedBooking.service.name,
              bookingDateTime: dateStrSpec,
              reason: reason || ''
            }
          });
        }
      } catch (e) {
        // non-blocking
        logger.error('Failed to send cancellation emails', { bookingId, error: e });
      }

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
    bookings: TransformedBooking[];
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
                telegramId: true,
                isEmailVerified: true,
                isPhoneVerified: true,
                isActive: true,
                loyaltyPoints: true,
                language: true,
                currency: true,
                timezone: true,
                lastLoginAt: true,
                emailNotifications: true,
                pushNotifications: true,
                telegramNotifications: true,
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
                telegramId: true,
                isEmailVerified: true,
                isPhoneVerified: true,
                isActive: true,
                loyaltyPoints: true,
                language: true,
                currency: true,
                timezone: true,
                lastLoginAt: true,
                emailNotifications: true,
                pushNotifications: true,
                telegramNotifications: true,
                createdAt: true,
                updatedAt: true,
              },
            },
            service: {
              select: {
                id: true,
                name: true,
                description: true,
                basePrice: true,
                currency: true,
                duration: true,
                isActive: true,
                categoryId: true,
                createdAt: true,
                updatedAt: true,
                specialist: true,
              },
            },
            // Include review information for completed bookings
            review: {
              select: {
                id: true,
                rating: true,
                comment: true,
                tags: true,
                isPublic: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
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
          
          // Type field (defaulting to in-person as meetingLink field doesn't exist)
          type: 'in-person',
        };
      });

      return {
        bookings: transformedBookings as TransformedBooking[],
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

  // Complete booking with payment confirmation (specialist action)
  static async completeBookingWithPayment(
    bookingId: string,
    specialistUserId: string,
    data: {
      paymentConfirmed: boolean;
      completionNotes?: string;
      specialistNotes?: string;
    }
  ): Promise<BookingWithDetails> {
    try {
      const booking = await this.getBooking(bookingId);

      // Verify the specialist owns this booking
      if (booking.specialistId !== specialistUserId) {
        throw new Error('SPECIALIST_NOT_AUTHORIZED');
      }

      // Verify booking is in a state that can be completed
      if (!['CONFIRMED', 'IN_PROGRESS'].includes(booking.status)) {
        throw new Error('BOOKING_NOT_IN_PROGRESS');
      }

      // If payment not confirmed, don't complete the booking
      if (!data.paymentConfirmed) {
        throw new Error('PAYMENT_NOT_CONFIRMED');
      }

      // Update booking to COMPLETED with notes
      const updateData: any = {
        status: 'COMPLETED',
        completionNotes: data.completionNotes,
        specialistNotes: data.specialistNotes,
      };

      const completedBooking = await this.updateBooking(bookingId, updateData);

      // Create payment record if payment was confirmed
      if (data.paymentConfirmed) {
        try {
          await prisma.payment.create({
            data: {
              id: `pay_${bookingId}_${Date.now()}`,
              bookingId: booking.id,
              userId: booking.customerId,
              amount: booking.totalAmount,
              currency: 'USD',
              status: 'SUCCEEDED',
              type: 'FULL_PAYMENT',
              paymentMethodType: 'cash',
              metadata: JSON.stringify({
                confirmedBy: specialistUserId,
                completedAt: new Date().toISOString(),
                paymentMethod: 'specialist_confirmed'
              }),
            },
          });

          logger.info('Payment record created for completed booking', {
            bookingId: booking.id,
            amount: booking.totalAmount,
            specialistId: specialistUserId
          });
        } catch (paymentError) {
          logger.error('Failed to create payment record:', paymentError);
          // Don't fail the completion if payment record creation fails
        }
      }

      return completedBooking;
    } catch (error) {
      logger.error('Error completing booking with payment:', error);
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
          .reduce((sum, b) => sum + (b.specialistEarnings || (b.totalAmount * 0.95)), 0), // Use specialistEarnings (after 5% platform fee)
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
