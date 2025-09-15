import { Request, Response } from 'express';
import { ServiceService } from '@/services/service';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { ErrorCodes, AuthenticatedRequest } from '@/types';
import { validationResult } from 'express-validator';

export class ServiceController {
  // Create a new service (specialist only)
  static async createService(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      if (req.user.userType !== 'SPECIALIST') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'Only specialists can create services',
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

  // Update a service (specialist only)
  static async updateService(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { serviceId } = req.params;

      if (!serviceId) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Service ID is required',
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

      if (error.message === 'UNAUTHORIZED_ACCESS') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'You do not have permission to update this service',
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

  // Delete a service (specialist only)
  static async deleteService(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { serviceId } = req.params;

      if (!serviceId) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Service ID is required',
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

      if (error.message === 'UNAUTHORIZED_ACCESS') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'You do not have permission to delete this service',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'ACTIVE_BOOKINGS_EXIST') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.BUSINESS_RULE_VIOLATION,
            'Cannot delete service with active bookings',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to delete service',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get service by ID
  static async getService(req: Request, res: Response): Promise<void> {
    try {
      const { serviceId } = req.params;

      if (!serviceId) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Service ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const service = await ServiceService.getService(serviceId);

      res.json(
        createSuccessResponse({
          service: {
            id: service.id,
            name: service.name,
            description: service.description,
            category: service.category,
            basePrice: service.basePrice,
            currency: service.currency,
            duration: service.duration,
            requirements: service.requirements ? JSON.parse(service.requirements) : [],
            deliverables: service.deliverables ? JSON.parse(service.deliverables) : [],
            images: service.images ? JSON.parse(service.images) : [],
            isActive: service.isActive,
            requiresApproval: service.requiresApproval,
            maxAdvanceBooking: service.maxAdvanceBooking,
            minAdvanceBooking: service.minAdvanceBooking,
            createdAt: service.createdAt,
            updatedAt: service.updatedAt,
            specialistId: service.specialist.id, // Add specialistId for easier frontend access
            specialist: {
              id: service.specialist.id,
              businessName: service.specialist.businessName,
              bio: service.specialist.bio,
              rating: service.specialist.rating,
              reviewCount: service.specialist.reviewCount,
              completedBookings: service.specialist.completedBookings,
              responseTime: service.specialist.responseTime,
              isVerified: service.specialist.isVerified,
              user: service.specialist.user,
            },
          },
        })
      );
    } catch (error: any) {
      logger.error('Get service error:', error);

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

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get service',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get specialist's services
  static async getSpecialistServices(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { includeInactive } = req.query;

      const services = await ServiceService.getSpecialistServices(
        req.user.id,
        includeInactive === 'true'
      );

      res.json(
        createSuccessResponse({
          services: services.map(service => ({
            id: service.id,
            name: service.name,
            description: service.description,
            category: service.category,
            basePrice: service.basePrice,
            currency: service.currency,
            duration: service.duration,
            requirements: service.requirements ? JSON.parse(service.requirements) : [],
            deliverables: service.deliverables ? JSON.parse(service.deliverables) : [],
            images: service.images ? JSON.parse(service.images) : [],
            isActive: service.isActive,
            requiresApproval: service.requiresApproval,
            maxAdvanceBooking: service.maxAdvanceBooking,
            minAdvanceBooking: service.minAdvanceBooking,
            createdAt: service.createdAt,
            updatedAt: service.updatedAt,
            specialistId: service.specialistId, // Add specialistId for easier frontend access
          })),
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
          'Failed to get specialist services',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Search services
  static async searchServices(req: Request, res: Response): Promise<void> {
    try {
      const {
        query,
        category,
        minPrice,
        maxPrice,
        sortBy = 'newest',
        page = 1,
        limit = 20,
      } = req.query;

      const result = await ServiceService.searchServices(
        query as string,
        category as string,
        minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice ? parseFloat(maxPrice as string) : undefined,
        sortBy as 'price' | 'rating' | 'newest',
        parseInt(page as string, 10),
        parseInt(limit as string, 10)
      );

      res.json(
        createSuccessResponse({
          services: result.services.map(service => ({
            id: service.id,
            name: service.name,
            description: service.description,
            category: service.category,
            basePrice: service.basePrice,
            currency: service.currency,
            duration: service.duration,
            images: service.images ? JSON.parse(service.images) : [],
            specialistId: service.specialist.id, // Add specialistId for easier frontend access
            specialist: {
              id: service.specialist.id,
              businessName: service.specialist.businessName,
              rating: service.specialist.rating,
              reviewCount: service.specialist.reviewCount,
              completedBookings: service.specialist.completedBookings, // expose completed jobs count
              isVerified: service.specialist.isVerified,
              user: {
                id: service.specialist.user.id,
                firstName: service.specialist.user.firstName,
                lastName: service.specialist.user.lastName,
                avatar: service.specialist.user.avatar,
              },
            },
          })),
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
        }, {
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
      logger.error('Search services error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to search services',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get service categories
  static async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await ServiceService.getCategories();

      res.json(
        createSuccessResponse({
          categories,
        })
      );
    } catch (error: any) {
      logger.error('Get categories error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get categories',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get popular services
  static async getPopularServices(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 10 } = req.query;

      const services = await ServiceService.getPopularServices(parseInt(limit as string, 10));

      res.json(
        createSuccessResponse({
          services: services.map(service => ({
            id: service.id,
            name: service.name,
            description: service.description,
            category: service.category,
            basePrice: service.basePrice,
            currency: service.currency,
            duration: service.duration,
            images: service.images ? JSON.parse(service.images) : [],
            specialistId: service.specialist.id, // Add specialistId for easier frontend access
            specialist: {
              id: service.specialist.id,
              businessName: service.specialist.businessName,
              rating: service.specialist.rating,
              reviewCount: service.specialist.reviewCount,
              isVerified: service.specialist.isVerified,
              user: {
                firstName: service.specialist.user.firstName,
                lastName: service.specialist.user.lastName,
                avatar: service.specialist.user.avatar,
              },
            },
          })),
        })
      );
    } catch (error: any) {
      logger.error('Get popular services error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get popular services',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Migration endpoint to fix service currency data
  static async migrateCurrencyData(req: AuthenticatedRequest, res: Response): Promise<void> {
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
            'Only specialists can migrate their service data',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const result = await ServiceService.migrateCurrencyData(req.user.id);

      res.status(200).json(
        createSuccessResponse(
          result,
          { message: 'Service currency data migrated successfully' }
        )
      );
    } catch (error: any) {
      logger.error('Error migrating service currency data:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to migrate service currency data',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get services available for loyalty points
  static async getLoyaltyPointsServices(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const specialistId = req.query.specialistId as string;

      const result = await ServiceService.getLoyaltyPointsServices(page, limit, specialistId);

      res.status(200).json(
        createSuccessResponse(
          result,
          { message: 'Loyalty points services retrieved successfully' }
        )
      );
    } catch (error: any) {
      logger.error('Error getting loyalty points services:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get loyalty points services',
          req.headers['x-request-id'] as string
        )
      );
    }
  }
}
