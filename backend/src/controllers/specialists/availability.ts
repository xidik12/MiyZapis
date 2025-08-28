import { Request, Response } from 'express';
import {
  AvailabilityService,
  CreateAvailabilityBlockData,
  UpdateAvailabilityBlockData,
  AvailabilityFilters,
} from '@/services/specialist/availability';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { ErrorCodes, AuthenticatedRequest } from '@/types';
import { validationResult } from 'express-validator';
import { prisma } from '@/config/database';

export class AvailabilityController {
  /**
   * Get specialist availability
   * GET /specialists/:id/availability
   */
  static async getSpecialistAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      if (!id) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Specialist ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (!startDate || !endDate) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Start date and end date are required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid date format',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (start >= end) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Start date must be before end date',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const availability = await AvailabilityService.getSpecialistAvailability(id, start, end);

      res.json(
        createSuccessResponse({
          availability,
        })
      );
    } catch (error: any) {
      logger.error('Get specialist availability error:', error);

      if (error.message === 'SPECIALIST_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Specialist not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'SPECIALIST_NOT_ACTIVE') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.BUSINESS_RULE_VIOLATION,
            'Specialist is not active',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get specialist availability',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Create availability block
   * POST /specialists/availability/blocks
   */
  static async createAvailabilityBlock(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      // Get specialist profile
      const specialist = await prisma.specialist.findUnique({
        where: { userId: req.user.id },
      });

      if (!specialist) {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'Only specialists can create availability blocks',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const {
        startDateTime,
        endDateTime,
        isAvailable = true,
        reason,
        isRecurring = false,
        recurringUntil,
        recurringDays,
      } = req.body;

      const data: CreateAvailabilityBlockData = {
        specialistId: specialist.id,
        startDateTime: new Date(startDateTime),
        endDateTime: new Date(endDateTime),
        isAvailable,
        reason,
        isRecurring,
        recurringUntil: recurringUntil ? new Date(recurringUntil) : undefined,
        recurringDays,
      };

      const block = await AvailabilityService.createAvailabilityBlock(data);

      res.status(201).json(
        createSuccessResponse({
          block: {
            ...block,
            recurringDays: block.recurringDays ? JSON.parse(block.recurringDays) : null,
          },
        })
      );
    } catch (error: any) {
      logger.error('Create availability block error:', error);

      if (error.message === 'SPECIALIST_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Specialist not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'INVALID_DATE_RANGE') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid date range: start date must be before end date',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'OVERLAPPING_AVAILABILITY_BLOCK') {
        res.status(409).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_CONFLICT,
            'Overlapping availability block exists',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to create availability block',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Update availability block
   * PUT /specialists/availability/blocks/:id
   */
  static async updateAvailabilityBlock(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { id } = req.params;

      if (!id) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Availability block ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Check if user owns this availability block
      const existingBlock = await prisma.availabilityBlock.findUnique({
        where: { id },
        include: {
          specialist: {
            select: {
              userId: true,
            },
          },
        },
      });

      if (!existingBlock) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Availability block not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (existingBlock.specialist.userId !== req.user.id && req.user.userType !== 'ADMIN') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'You do not have permission to update this availability block',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const updateData: UpdateAvailabilityBlockData = {};

      if (req.body.startDateTime !== undefined) {
        updateData.startDateTime = new Date(req.body.startDateTime);
      }
      if (req.body.endDateTime !== undefined) {
        updateData.endDateTime = new Date(req.body.endDateTime);
      }
      if (req.body.isAvailable !== undefined) {
        updateData.isAvailable = req.body.isAvailable;
      }
      if (req.body.reason !== undefined) {
        updateData.reason = req.body.reason;
      }
      if (req.body.isRecurring !== undefined) {
        updateData.isRecurring = req.body.isRecurring;
      }
      if (req.body.recurringUntil !== undefined) {
        updateData.recurringUntil = req.body.recurringUntil ? new Date(req.body.recurringUntil) : undefined;
      }
      if (req.body.recurringDays !== undefined) {
        updateData.recurringDays = req.body.recurringDays;
      }

      const block = await AvailabilityService.updateAvailabilityBlock(id, updateData);

      res.json(
        createSuccessResponse({
          block: {
            ...block,
            recurringDays: block.recurringDays ? JSON.parse(block.recurringDays) : null,
          },
        })
      );
    } catch (error: any) {
      logger.error('Update availability block error:', error);

      if (error.message === 'AVAILABILITY_BLOCK_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Availability block not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'INVALID_DATE_RANGE') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid date range: start date must be before end date',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to update availability block',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Delete availability block
   * DELETE /specialists/availability/blocks/:id
   */
  static async deleteAvailabilityBlock(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { id } = req.params;

      if (!id) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Availability block ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Check if user owns this availability block
      const existingBlock = await prisma.availabilityBlock.findUnique({
        where: { id },
        include: {
          specialist: {
            select: {
              userId: true,
            },
          },
        },
      });

      if (!existingBlock) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Availability block not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (existingBlock.specialist.userId !== req.user.id && req.user.userType !== 'ADMIN') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'You do not have permission to delete this availability block',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      await AvailabilityService.deleteAvailabilityBlock(id);

      res.json(
        createSuccessResponse({
          message: 'Availability block deleted successfully',
        })
      );
    } catch (error: any) {
      logger.error('Delete availability block error:', error);

      if (error.message === 'AVAILABILITY_BLOCK_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Availability block not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to delete availability block',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Get availability blocks
   * GET /specialists/availability/blocks
   */
  static async getAvailabilityBlocks(req: AuthenticatedRequest, res: Response): Promise<void> {
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
        specialistId,
        startDate,
        endDate,
        isAvailable,
        isRecurring,
        page = 1,
        limit = 20,
      } = req.query;

      const filters: AvailabilityFilters = {};

      // If not admin, only show current user's blocks
      if (req.user.userType !== 'ADMIN') {
        const specialist = await prisma.specialist.findUnique({
          where: { userId: req.user.id },
        });

        if (!specialist) {
          res.status(403).json(
            createErrorResponse(
              ErrorCodes.ACCESS_DENIED,
              'Only specialists can view availability blocks',
              req.headers['x-request-id'] as string
            )
          );
          return;
        }

        filters.specialistId = specialist.id;
      } else if (specialistId) {
        filters.specialistId = specialistId as string;
      }

      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (isAvailable !== undefined) filters.isAvailable = isAvailable === 'true';
      if (isRecurring !== undefined) filters.isRecurring = isRecurring === 'true';

      const result = await AvailabilityService.getAvailabilityBlocks(
        filters,
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
            hasNext: result.hasNext,
            hasPrev: result.hasPrev,
          },
        })
      );
    } catch (error: any) {
      logger.error('Get availability blocks error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get availability blocks',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Get available time slots for a specific date
   * GET /specialists/:id/slots?date=YYYY-MM-DD
   */
  static async getAvailableSlots(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { date } = req.query;

      if (!id) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Specialist ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (!date || typeof date !== 'string') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Date is required in YYYY-MM-DD format',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Parse date and create start/end of day
      const targetDate = new Date(date as string);
      if (isNaN(targetDate.getTime())) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid date format, use YYYY-MM-DD',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Generate standard time slots (every 30 minutes from 9 AM to 6 PM)
      const slots = [];
      const startHour = 9; // 9 AM
      const endHour = 18; // 6 PM
      const slotDuration = 30; // 30 minutes

      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += slotDuration) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          slots.push(timeString);
        }
      }

      // TODO: In the future, filter out unavailable slots based on:
      // - Specialist working hours
      // - Existing bookings
      // - Blocked time slots
      // For now, return all slots as available

      logger.info('Generated available slots', {
        specialistId: id,
        date,
        slotsCount: slots.length,
      });

      res.json(
        createSuccessResponse({
          availableSlots: slots,
          date,
          specialistId: id,
        })
      );
    } catch (error: any) {
      logger.error('Get available slots error:', error);

      if (error.message === 'SPECIALIST_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Specialist not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get available slots',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Check time slot availability
   * POST /specialists/:id/availability/check
   */
  static async checkTimeSlotAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { startDateTime, endDateTime } = req.body;

      if (!id) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Specialist ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (!startDateTime || !endDateTime) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Start date time and end date time are required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const start = new Date(startDateTime);
      const end = new Date(endDateTime);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid date time format',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (start >= end) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Start date time must be before end date time',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const isAvailable = await AvailabilityService.isTimeSlotAvailable(id, start, end);

      res.json(
        createSuccessResponse({
          isAvailable,
          timeSlot: {
            startDateTime: start,
            endDateTime: end,
          },
        })
      );
    } catch (error: any) {
      logger.error('Check time slot availability error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to check time slot availability',
          req.headers['x-request-id'] as string
        )
      );
    }
  }
}