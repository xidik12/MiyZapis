import { Request, Response } from 'express';
import { BookingService } from '@/services/booking';
import { emailService as templatedEmailService } from '@/services/email/enhanced-email';
import { resolveLanguage } from '@/utils/language';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { ErrorCodes, AuthenticatedRequest } from '@/types';
import { validationResult } from 'express-validator';

export class BookingController {
  // Create a new booking
  static async createBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid request data',
            req.headers['x-request-id'] as string,
            errors.array().map(error => ({
              field: 'location' in error ? error.location : 'param' in error ? (error as any).param : undefined,
              message: 'msg' in error ? error.msg : (error as any).message || 'Validation error',
              code: 'INVALID_VALUE',
            }))
          )
        );
        return;
      }

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

      const bookingData = {
        ...req.body,
        customerId: req.user.id,
        scheduledAt: new Date(req.body.scheduledAt),
      };

      const booking = await BookingService.createBooking(bookingData);

      res.status(201).json(
        createSuccessResponse({
          booking,
          autoBooking: booking.service.specialist.autoBooking,
          message: booking.service.specialist.autoBooking 
            ? 'Your booking is automatically confirmed!' 
            : 'Your booking request has been sent and is waiting for specialist confirmation.',
        })
      );
    } catch (error: any) {
      logger.error('Create booking error:', error);

      if (error.message === 'SERVICE_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Service not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'SERVICE_NOT_ACTIVE') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.BUSINESS_RULE_VIOLATION,
            'Service is not active',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'CUSTOMER_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Customer not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'CUSTOMER_NOT_ACTIVE') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.BUSINESS_RULE_VIOLATION,
            'Customer account is not active',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'TIME_SLOT_NOT_AVAILABLE') {
        res.status(409).json(
          createErrorResponse(
            ErrorCodes.BOOKING_CONFLICT,
            'The selected time slot is not available',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'INSUFFICIENT_LOYALTY_POINTS') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.INSUFFICIENT_BALANCE,
            'Insufficient loyalty points',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'CANNOT_BOOK_OWN_SERVICE') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.BUSINESS_RULE_VIOLATION,
            'You cannot book your own service',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'CUSTOMER_ID_REQUIRED') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Customer ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'SERVICE_ID_REQUIRED') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Service ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'SCHEDULED_AT_REQUIRED') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Scheduled time is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'INVALID_DURATION') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Duration must be greater than 0',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'DUPLICATE_BOOKING') {
        res.status(409).json(
          createErrorResponse(
            ErrorCodes.BUSINESS_RULE_VIOLATION,
            'A booking already exists for this time slot',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'SCHEDULED_TIME_MUST_BE_FUTURE') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Scheduled time must be in the future',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to create booking',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get booking by ID
  static async getBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;

      if (!bookingId) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Booking ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const booking = await BookingService.getBooking(bookingId);

      // Check if user has access to this booking
      if (!req.user || (booking.customerId !== req.user.id && booking.specialistId !== req.user.id && req.user.userType !== 'ADMIN')) {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'You do not have permission to access this booking',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.json(
        createSuccessResponse({
          booking,
        })
      );
    } catch (error: any) {
      logger.error('Get booking error:', error);

      if (error.message === 'BOOKING_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Booking not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get booking',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Update booking
  static async updateBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid request data',
            req.headers['x-request-id'] as string,
            errors.array().map(error => ({
              field: 'location' in error ? error.location : 'param' in error ? (error as any).param : undefined,
              message: 'msg' in error ? error.msg : (error as any).message || 'Validation error',
              code: 'INVALID_VALUE',
            }))
          )
        );
        return;
      }

      const { bookingId } = req.params;

      if (!bookingId) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Booking ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // First check if user has access to this booking
      const existingBooking = await BookingService.getBooking(bookingId);
      if (!req.user || (existingBooking.customerId !== req.user.id && existingBooking.specialistId !== req.user.id && req.user.userType !== 'ADMIN')) {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'You do not have permission to update this booking',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const updateData = req.body;
      if (updateData.scheduledAt) {
        updateData.scheduledAt = new Date(updateData.scheduledAt);
      }

      const booking = await BookingService.updateBooking(bookingId, updateData);

      res.json(
        createSuccessResponse({
          booking,
        })
      );
    } catch (error: any) {
      logger.error('Update booking error:', error);

      if (error.message === 'BOOKING_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Booking not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'INVALID_STATUS_TRANSITION') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.BUSINESS_RULE_VIOLATION,
            'Invalid status transition',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to update booking',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Confirm booking (specialist only)
  static async confirmBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;

      if (!bookingId) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Booking ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

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

      const booking = await BookingService.confirmBooking(bookingId, req.user.id);

      // Send confirmation emails and possible reminder
      try {
        const customerLang = resolveLanguage(booking.customer?.language, req.headers['accept-language']);
        const specialistLang = booking.specialist?.language || 'en';
        await templatedEmailService.sendBookingConfirmation(booking.id, customerLang);
        await templatedEmailService.sendSpecialistBookingNotification(booking.id, specialistLang);
        await templatedEmailService.sendBookingReminder(booking.id, customerLang);
      } catch (e) {
        // Don't block success on email errors
      }

      res.json(
        createSuccessResponse({
          booking,
          message: 'Booking confirmed successfully',
        })
      );
    } catch (error: any) {
      logger.error('Confirm booking error:', error);

      if (error.message === 'BOOKING_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Booking not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'SPECIALIST_NOT_AUTHORIZED') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'You do not have permission to confirm this booking',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'BOOKING_NOT_PENDING') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.BUSINESS_RULE_VIOLATION,
            'Only pending bookings can be confirmed',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to confirm booking',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Reject booking (specialist only)
  static async rejectBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      const { reason } = req.body;

      if (!bookingId) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Booking ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

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

      const booking = await BookingService.rejectBooking(bookingId, req.user.id, reason);

      res.json(
        createSuccessResponse({
          booking,
          message: 'Booking rejected successfully',
        })
      );
    } catch (error: any) {
      logger.error('Reject booking error:', error);

      if (error.message === 'BOOKING_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Booking not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'SPECIALIST_NOT_AUTHORIZED') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'You do not have permission to reject this booking',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'BOOKING_NOT_PENDING') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.BUSINESS_RULE_VIOLATION,
            'Only pending bookings can be rejected',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to reject booking',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Cancel booking
  static async cancelBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      const { reason } = req.body;

      if (!bookingId) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Booking ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

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

      // First check if user has access to this booking
      const existingBooking = await BookingService.getBooking(bookingId);
      if (existingBooking.customerId !== req.user.id && existingBooking.specialistId !== req.user.id && req.user.userType !== 'ADMIN') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'You do not have permission to cancel this booking',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const booking = await BookingService.cancelBooking(bookingId, req.user.id, reason);

      res.json(
        createSuccessResponse({
          booking,
          message: 'Booking cancelled successfully',
        })
      );
    } catch (error: any) {
      logger.error('Cancel booking error:', error);

      if (error.message === 'BOOKING_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Booking not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'CANCELLATION_TOO_LATE') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.CANCELLATION_NOT_ALLOWED,
            'Cannot cancel booking less than 24 hours before scheduled time',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'CANCELLATION_NOT_ALLOWED') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.CANCELLATION_NOT_ALLOWED,
            'Booking cannot be cancelled in its current status',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to cancel booking',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get user bookings (customer or specialist)
  static async getUserBookings(req: AuthenticatedRequest, res: Response): Promise<void> {
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
        userType = 'customer',
        status,
        page = 1,
        limit = 20,
      } = req.query;

      // Validate userType parameter
      if (!['customer', 'specialist'].includes(userType as string)) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'userType must be either "customer" or "specialist"',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const result = await BookingService.getUserBookings(
        req.user.id,
        userType as 'customer' | 'specialist',
        status as string,
        parseInt(page as string, 10),
        parseInt(limit as string, 10)
      );

      res.json(
        createSuccessResponse(result, {
          pagination: {
            currentPage: result.page,
            totalPages: result.totalPages,
            totalItems: result.total,
            itemsPerPage: parseInt(limit as string, 10),
            hasNext: result.page < result.totalPages,
            hasPrev: result.page > 1,
          },
        })
      );
    } catch (error: any) {
      logger.error('Get user bookings error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get user bookings',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get booking statistics for a specialist
  static async getSpecialistBookingStats(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { startDate, endDate } = req.query;

      const stats = await BookingService.getSpecialistBookingStats(
        req.user.id,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json(
        createSuccessResponse({
          stats,
        })
      );
    } catch (error: any) {
      logger.error('Get specialist booking stats error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get booking statistics',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Complete booking with payment confirmation (specialist only)
  static async completeBookingWithPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      const { paymentConfirmed, completionNotes, specialistNotes } = req.body;

      if (!bookingId) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Booking ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

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

      if (typeof paymentConfirmed !== 'boolean') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Payment confirmation status is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const booking = await BookingService.completeBookingWithPayment(
        bookingId,
        req.user.id,
        { paymentConfirmed, completionNotes, specialistNotes }
      );

      res.json(
        createSuccessResponse({
          booking,
          message: paymentConfirmed 
            ? 'Booking completed and payment recorded successfully'
            : 'Booking completion cancelled - please ensure payment is received first',
        })
      );
    } catch (error: any) {
      logger.error('Complete booking with payment error:', error);

      if (error.message === 'BOOKING_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Booking not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'SPECIALIST_NOT_AUTHORIZED') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'You do not have permission to complete this booking',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'BOOKING_NOT_IN_PROGRESS') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.BUSINESS_RULE_VIOLATION,
            'Only confirmed or in-progress bookings can be completed',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'PAYMENT_NOT_CONFIRMED') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.BUSINESS_RULE_VIOLATION,
            'Payment must be confirmed to complete booking',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to complete booking',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get all bookings (admin only)
  static async getAllBookings(req: Request, res: Response): Promise<void> {
    try {
      const {
        status,
        specialistId,
        customerId,
        startDate,
        endDate,
        page = 1,
        limit = 20,
      } = req.query;

      // This is a simplified implementation - in production you'd want more sophisticated filtering
      // For now, we'll just get recent bookings
      const result = await BookingService.getUserBookings(
        customerId as string || '',
        'customer',
        status as string,
        parseInt(page as string, 10),
        parseInt(limit as string, 10)
      );

      res.json(
        createSuccessResponse(result, {
          pagination: {
            currentPage: result.page,
            totalPages: result.totalPages,
            totalItems: result.total,
            itemsPerPage: parseInt(limit as string, 10),
            hasNext: result.page < result.totalPages,
            hasPrev: result.page > 1,
          },
        })
      );
    } catch (error: any) {
      logger.error('Get all bookings error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get bookings',
          req.headers['x-request-id'] as string
        )
      );
    }
  }
}
