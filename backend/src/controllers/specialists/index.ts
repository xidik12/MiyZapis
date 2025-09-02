import { Request, Response } from 'express';
import { SpecialistService } from '@/services/specialist';
import { ServiceService } from '@/services/service';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { ErrorCodes, AuthenticatedRequest } from '@/types';
import { validationResult } from 'express-validator';
import { prisma } from '@/config/database';

export class SpecialistController {
  // Create specialist profile
  static async createProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const specialist = await SpecialistService.createProfile(req.user.id, req.body);

      res.status(201).json(
        createSuccessResponse({
          specialist,
        })
      );
    } catch (error: any) {
      logger.error('Create specialist profile error:', error);

      if (error.message === 'USER_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'User not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'USER_NOT_SPECIALIST') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.BUSINESS_RULE_VIOLATION,
            'User must be a specialist to create a specialist profile',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'SPECIALIST_PROFILE_EXISTS') {
        res.status(409).json(
          createErrorResponse(
            ErrorCodes.DUPLICATE_RESOURCE,
            'Specialist profile already exists',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to create specialist profile',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Update specialist profile
  static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Enhanced logging for frontend debugging
      logger.info('Specialist profile update request received', {
        userId: req.user?.id,
        requestBody: req.body,
        contentType: req.headers['content-type'],
        userAgent: req.headers['user-agent'],
        requestId: req.headers['x-request-id'],
        timestamp: new Date().toISOString()
      });

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

      const specialist = await SpecialistService.updateProfile(req.user.id, req.body);

      // Enhanced logging for successful updates
      logger.info('Specialist profile updated successfully', {
        userId: req.user.id,
        specialistId: specialist.id,
        updatedFields: Object.keys(req.body),
        beforeUpdatedAt: specialist.updatedAt,
        requestId: req.headers['x-request-id']
      });

      res.json(
        createSuccessResponse({
          specialist,
        })
      );
    } catch (error: any) {
      logger.error('Update specialist profile error:', error);

      if (error.message === 'SPECIALIST_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Specialist profile not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to update specialist profile',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get own specialist profile
  static async getMyProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const specialist = await SpecialistService.getProfileByUserId(req.user.id);

      res.json(
        createSuccessResponse({
          specialist,
        })
      );
    } catch (error: any) {
      logger.error('Get my specialist profile error:', error);

      if (error.message === 'SPECIALIST_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Specialist profile not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get specialist profile',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get specialist profile by ID
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const { specialistId } = req.params;

      if (!specialistId) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Specialist ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const specialist = await SpecialistService.getProfile(specialistId);

      res.json(
        createSuccessResponse({
          specialist,
        })
      );
    } catch (error: any) {
      logger.error('Get specialist profile error:', error);

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
          'Failed to get specialist profile',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get public specialist profile by ID (alias for getProfile)
  static async getPublicProfile(req: Request, res: Response): Promise<void> {
    try {
      const { specialistId } = req.params;

      if (!specialistId) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Specialist ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const specialist = await SpecialistService.getProfile(specialistId);

      res.json(
        createSuccessResponse({
          specialist,
        })
      );
    } catch (error: any) {
      logger.error('Get public specialist profile error:', error);

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
          'Failed to get specialist profile',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Search specialists
  static async searchSpecialists(req: Request, res: Response): Promise<void> {
    try {
      const {
        query,
        specialties,
        city,
        minRating,
        sortBy = 'rating',
        page = 1,
        limit = 20,
      } = req.query;

      const parsedSpecialties = specialties 
        ? (typeof specialties === 'string' ? [specialties] : specialties as string[])
        : undefined;

      const result = await SpecialistService.searchSpecialists(
        query as string,
        parsedSpecialties,
        city as string,
        minRating ? parseFloat(minRating as string) : undefined,
        sortBy as 'rating' | 'reviews' | 'newest',
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
      logger.error('Search specialists error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to search specialists',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get specialist analytics
  static async getAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { startDate, endDate, period } = req.query;

      // Get specialist ID from user
      const specialist = await SpecialistService.getProfileByUserId(req.user.id);

      // Handle date filtering more intelligently
      let analyticsStartDate: Date | undefined;
      let analyticsEndDate: Date | undefined;

      if (startDate && endDate) {
        analyticsStartDate = new Date(startDate as string);
        analyticsEndDate = new Date(endDate as string);
      } else if (period) {
        // Handle predefined periods
        const now = new Date();
        switch (period) {
          case 'daily':
            analyticsStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            analyticsEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            break;
          case 'weekly':
            analyticsStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            analyticsEndDate = now;
            break;
          case 'monthly':
            analyticsStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
            analyticsEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            break;
          case 'yearly':
            analyticsStartDate = new Date(now.getFullYear(), 0, 1);
            analyticsEndDate = new Date(now.getFullYear() + 1, 0, 1);
            break;
          default:
            // For any other period or 'all-time', don't apply date filters
            break;
        }
      }
      // If no date parameters provided, show all-time data

      const analytics = await SpecialistService.getAnalytics(
        specialist.id,
        analyticsStartDate,
        analyticsEndDate
      );

      res.json(
        createSuccessResponse({
          analytics,
          // Add debugging info for date filtering
          debug: {
            dateFiltering: {
              startDate: analyticsStartDate?.toISOString(),
              endDate: analyticsEndDate?.toISOString(),
              period: period,
              hasDateFilter: !!(analyticsStartDate && analyticsEndDate)
            }
          }
        })
      );
    } catch (error: any) {
      logger.error('Get specialist analytics error:', error);

      if (error.message === 'SPECIALIST_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Specialist profile not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get specialist analytics',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Toggle verification (admin only)
  static async toggleVerification(req: Request, res: Response): Promise<void> {
    try {
      const { specialistId } = req.params;

      if (!specialistId) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Specialist ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const specialist = await SpecialistService.toggleVerification(specialistId);

      res.json(
        createSuccessResponse({
          specialist,
          message: `Specialist ${specialist.isVerified ? 'verified' : 'unverified'} successfully`,
        })
      );
    } catch (error: any) {
      logger.error('Toggle specialist verification error:', error);

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
          'Failed to toggle specialist verification',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get specialist's services
  static async getServices(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const services = await ServiceService.getSpecialistServices(req.user.id, true);

      res.json(
        createSuccessResponse({
          services,
        })
      );
    } catch (error: any) {
      logger.error('Get specialist services error:', error);

      if (error.message === 'SPECIALIST_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Specialist profile not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get services',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Create new service
  static async createService(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
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

      const service = await ServiceService.createService(req.user.id, req.body);

      res.status(201).json(
        createSuccessResponse({
          service,
        })
      );
    } catch (error: any) {
      logger.error('Create service error:', error);

      if (error.message === 'SPECIALIST_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Specialist profile not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to create service',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Update service
  static async updateService(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
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

      const { serviceId } = req.params;

      const service = await ServiceService.updateService(serviceId, req.user.id, req.body);

      res.json(
        createSuccessResponse({
          service,
        })
      );
    } catch (error: any) {
      logger.error('Update service error:', error);

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

      if (error.message === 'SPECIALIST_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Specialist profile not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'UNAUTHORIZED_ACCESS') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.FORBIDDEN,
            'You can only update your own services',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to update service',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Delete service
  static async deleteService(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { serviceId } = req.params;

      await ServiceService.deleteService(serviceId, req.user.id);

      res.json(
        createSuccessResponse({
          message: 'Service deleted successfully',
        })
      );
    } catch (error: any) {
      logger.error('Delete service error:', error);

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

      if (error.message === 'SPECIALIST_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Specialist profile not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'UNAUTHORIZED_ACCESS') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.FORBIDDEN,
            'You can only delete your own services',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'ACTIVE_BOOKINGS_EXIST') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Cannot delete service with active bookings. Only pending, confirmed, or in-progress bookings prevent deletion.',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Log the full error for debugging
      logger.error('Unhandled service deletion error:', {
        message: error.message,
        stack: error.stack,
        serviceId: req.params.serviceId,
        userId: req.user?.id
      });

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to delete service',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Restore service
  static async restoreService(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { serviceId } = req.params;

      const restoredService = await ServiceService.restoreService(serviceId, req.user.id);

      res.json(
        createSuccessResponse({
          message: 'Service restored successfully',
          service: restoredService,
        })
      );
    } catch (error: any) {
      logger.error('Restore service error:', error);

      if (error.message === 'DELETED_SERVICE_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Deleted service not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'SPECIALIST_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Specialist profile not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'UNAUTHORIZED_ACCESS') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.FORBIDDEN,
            'You can only restore your own services',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to restore service',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Toggle service status
  static async toggleServiceStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { serviceId } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'isActive must be a boolean',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const service = await ServiceService.updateService(serviceId, req.user.id, { isActive });

      res.json(
        createSuccessResponse({
          service,
          message: `Service ${isActive ? 'activated' : 'deactivated'} successfully`,
        })
      );
    } catch (error: any) {
      logger.error('Toggle service status error:', error);

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

      if (error.message === 'SPECIALIST_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Specialist profile not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'UNAUTHORIZED_ACCESS') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.FORBIDDEN,
            'You can only modify your own services',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to update service status',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get blocked time slots
  static async getBlockedSlots(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      // Get specialist by userId
      const specialist = await SpecialistService.getProfileByUserId(req.user.id);

      const { startDate, endDate } = req.query;

      const where: any = {
        specialistId: specialist.id,
      };

      if (startDate || endDate) {
        where.startDateTime = {};
        if (startDate) {
          where.startDateTime.gte = new Date(startDate as string);
        }
        if (endDate) {
          where.startDateTime.lte = new Date(endDate as string);
        }
      }

      const blockedSlots = await prisma.availabilityBlock.findMany({
        where,
        orderBy: { startDateTime: 'asc' },
      });

      res.json(
        createSuccessResponse({
          blockedSlots,
        })
      );
    } catch (error: any) {
      logger.error('Get blocked slots error:', error);

      if (error.message === 'SPECIALIST_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Specialist profile not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get blocked slots',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Block time slot
  static async blockTimeSlot(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
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

      // Get specialist by userId
      const specialist = await SpecialistService.getProfileByUserId(req.user.id);

      const { startDateTime, endDateTime, reason, recurring } = req.body;

      const blockedSlot = await prisma.availabilityBlock.create({
        data: {
          specialistId: specialist.id,
          startDateTime: new Date(startDateTime),
          endDateTime: new Date(endDateTime),
          isAvailable: false,
          reason: reason || 'Blocked time',
          isRecurring: recurring || false,
        },
      });

      res.status(201).json(
        createSuccessResponse({
          message: 'Time slot blocked successfully',
          blockedSlot,
        })
      );
    } catch (error: any) {
      logger.error('Block time slot error:', error);

      if (error.message === 'SPECIALIST_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Specialist profile not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to block time slot',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Unblock time slot
  static async unblockTimeSlot(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { blockId } = req.params;

      // Get specialist by userId
      const specialist = await SpecialistService.getProfileByUserId(req.user.id);

      // Check if block exists and belongs to this specialist
      const existingBlock = await prisma.availabilityBlock.findFirst({
        where: {
          id: blockId,
          specialistId: specialist.id,
        },
      });

      if (!existingBlock) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Blocked slot not found or you do not have access to it',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      await prisma.availabilityBlock.delete({
        where: { id: blockId },
      });

      res.json(
        createSuccessResponse({
          message: 'Time slot unblocked successfully',
        })
      );
    } catch (error: any) {
      logger.error('Unblock time slot error:', error);

      if (error.message === 'SPECIALIST_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Specialist profile not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to unblock time slot',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get services for a specific specialist (public route)
  static async getSpecialistServices(req: Request, res: Response): Promise<void> {
    try {
      const { specialistId } = req.params;

      if (!specialistId) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Specialist ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Get specialist first to verify they exist
      const specialist = await SpecialistService.getProfile(specialistId);
      
      // Get only active services for public view
      const services = await ServiceService.getServicesBySpecialistId(specialistId);

      res.json(
        createSuccessResponse({
          services,
        })
      );
    } catch (error: any) {
      logger.error('Get specialist services error:', error);

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
          'Failed to get specialist services',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get revenue breakdown
  static async getRevenueBreakdown(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      if (req.user.userType !== 'SPECIALIST') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'Only specialists can access revenue data',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const { period = 'month' } = req.query;

      // Validate period parameter
      if (!['day', 'week', 'month', 'year'].includes(period as string)) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid period parameter. Must be one of: day, week, month, year',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Import PaymentService
      const { PaymentService } = await import('@/services/payment');

      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;
      let endDate: Date = new Date();

      switch (period) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case 'week':
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          startDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
          endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear() + 1, 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      }

      // Get earnings data using the payment service
      const earningsData = await PaymentService.getSpecialistEarnings(req.user.id, {
        fromDate: startDate,
        toDate: endDate,
      });

      // Get earnings trends for breakdown
      const trendsData = await PaymentService.getEarningsTrends(req.user.id, {
        period: period as string,
        groupBy: period === 'year' ? 'month' : 'day',
      });

      // Get additional analytics for comprehensive earnings dashboard
      const specialist = await SpecialistService.getProfileByUserId(req.user.id);
      const analytics = await SpecialistService.getAnalytics(
        specialist.id,
        startDate,
        endDate
      );

      // Calculate earnings-specific metrics
      const currentMonth = new Date();
      const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      const lastMonthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);
      
      const lastMonthEarnings = await PaymentService.getSpecialistEarnings(req.user.id, {
        fromDate: lastMonth,
        toDate: lastMonthEnd,
      });

      const monthlyGrowthPercentage = lastMonthEarnings.totalEarnings > 0 
        ? ((earningsData.totalEarnings - lastMonthEarnings.totalEarnings) / lastMonthEarnings.totalEarnings) * 100 
        : earningsData.totalEarnings > 0 ? 100 : 0;

      // Format response data to match frontend expectations
      const responseData = {
        // Main earnings metrics
        totalEarnings: earningsData.totalEarnings || 0,
        thisMonth: earningsData.totalEarnings || 0,
        pending: earningsData.pendingEarnings || 0,
        lastPayout: 0, // TODO: Implement payout tracking
        
        // Secondary metrics
        completedBookings: analytics.completedBookings,
        activeClients: analytics.activeClients,
        averageBookingValue: analytics.averageBookingValue,
        monthlyGrowth: monthlyGrowthPercentage,
        
        // Chart data
        breakdown: trendsData.trends.map(trend => ({
          date: trend.date,
          revenue: trend.earnings,
          bookings: trend.bookingCount,
        })),
        
        // Detailed analytics
        performanceMetrics: {
          conversionRate: analytics.conversionRate,
          repeatCustomers: 0, // TODO: Calculate repeat customers
          avgSessionValue: analytics.averageBookingValue,
        },
        
        timeAnalysis: {
          peakHours: 'No data', // TODO: Implement peak hours analysis
          bestDay: 'No data',   // TODO: Implement best day analysis
          avgBookingDuration: 90, // TODO: Calculate from service data
        },
        
        growthInsights: {
          monthlyGrowth: monthlyGrowthPercentage,
          newCustomers: 0, // TODO: Calculate new vs returning customers
          revenueTrend: monthlyGrowthPercentage > 0 ? 'Increasing' : 'Stable',
        },
        
        // Legacy fields for backwards compatibility
        totalRevenue: earningsData.totalEarnings || 0,
        pendingRevenue: earningsData.pendingEarnings || 0,
        paidRevenue: earningsData.totalEarnings - (earningsData.pendingEarnings || 0),
        platformFee: (earningsData.totalEarnings || 0) * 0.1,
        netRevenue: (earningsData.totalEarnings || 0) * 0.9,
        
        // Recent payments for payouts section
        recentPayouts: earningsData.payments.slice(0, 5).map(payment => ({
          id: payment.id,
          amount: payment.amount,
          date: payment.createdAt,
          status: payment.status,
          type: payment.type,
        })),
      };

      res.json(
        createSuccessResponse(responseData)
      );
    } catch (error: any) {
      logger.error('Get revenue breakdown error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get revenue breakdown',
          req.headers['x-request-id'] as string
        )
      );
    }
  }
}