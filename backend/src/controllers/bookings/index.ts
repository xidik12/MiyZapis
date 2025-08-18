import { Request, Response } from 'express';
import { BookingService } from '@/services/booking';
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
              field: error.param,
              message: error.msg,
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
              field: error.param,
              message: error.msg,
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