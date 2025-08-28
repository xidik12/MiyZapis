import { Request, Response } from 'express';
import { ReviewService, CreateReviewData, UpdateReviewData, ReviewFilters } from '@/services/review';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { ErrorCodes, AuthenticatedRequest } from '@/types';
import { validationResult } from 'express-validator';
import { prisma } from '@/config/database';

export class ReviewController {
  /**
   * Create a new review
   * POST /reviews
   */
  static async createReview(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const reviewData: CreateReviewData = {
        ...req.body,
        customerId: req.user.id,
      };

      const review = await ReviewService.createReview(reviewData);

      res.status(201).json(
        createSuccessResponse({
          review: {
            ...review,
            tags: JSON.parse(review.tags || '[]'),
          },
        })
      );
    } catch (error: any) {
      logger.error('Create review error:', error);

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

      if (error.message === 'NOT_AUTHORIZED_TO_REVIEW') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'You are not authorized to review this booking',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'BOOKING_NOT_COMPLETED') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.BUSINESS_RULE_VIOLATION,
            'Cannot review a booking that is not completed',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'REVIEW_ALREADY_EXISTS') {
        res.status(409).json(
          createErrorResponse(
            ErrorCodes.DUPLICATE_RESOURCE,
            'Review already exists for this booking',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'INVALID_RATING_RANGE') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Rating must be between 1 and 5',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to create review',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Get reviews with filters and pagination
   * GET /reviews
   */
  static async getReviews(req: Request, res: Response): Promise<void> {
    try {
      const {
        specialistId,
        rating,
        minRating,
        maxRating,
        isPublic,
        tags,
        startDate,
        endDate,
        page = 1,
        limit = 20,
      } = req.query;

      const filters: ReviewFilters = {};

      if (specialistId) filters.specialistId = specialistId as string;
      if (rating) filters.rating = parseInt(rating as string, 10);
      if (minRating) filters.minRating = parseInt(minRating as string, 10);
      if (maxRating) filters.maxRating = parseInt(maxRating as string, 10);
      if (isPublic !== undefined) filters.isPublic = isPublic === 'true';
      if (tags) filters.tags = Array.isArray(tags) ? tags as string[] : [tags as string];
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const result = await ReviewService.getReviews(
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
      logger.error('Get reviews error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get reviews',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Get a single review by ID
   * GET /reviews/:id
   */
  static async getReview(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Review ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const review = await ReviewService.getReview(id);

      res.json(
        createSuccessResponse({
          review,
        })
      );
    } catch (error: any) {
      logger.error('Get review error:', error);

      if (error.message === 'REVIEW_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Review not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get review',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Update a review
   * PUT /reviews/:id
   */
  static async updateReview(req: AuthenticatedRequest, res: Response): Promise<void> {
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
            'Review ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Check if user owns the review or is admin
      const existingReview = await ReviewService.getReview(id);
      if (existingReview.customerId !== req.user.id && req.user.userType !== 'ADMIN') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'You do not have permission to update this review',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const updateData: UpdateReviewData = req.body;
      const review = await ReviewService.updateReview(id, updateData);

      res.json(
        createSuccessResponse({
          review: {
            ...review,
            tags: JSON.parse(review.tags || '[]'),
          },
        })
      );
    } catch (error: any) {
      logger.error('Update review error:', error);

      if (error.message === 'REVIEW_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Review not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'INVALID_RATING_RANGE') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Rating must be between 1 and 5',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to update review',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Delete a review
   * DELETE /reviews/:id
   */
  static async deleteReview(req: AuthenticatedRequest, res: Response): Promise<void> {
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
            'Review ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Check if user owns the review or is admin
      const existingReview = await ReviewService.getReview(id);
      if (existingReview.customerId !== req.user.id && req.user.userType !== 'ADMIN') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'You do not have permission to delete this review',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      await ReviewService.deleteReview(id);

      res.json(
        createSuccessResponse({
          message: 'Review deleted successfully',
        })
      );
    } catch (error: any) {
      logger.error('Delete review error:', error);

      if (error.message === 'REVIEW_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Review not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to delete review',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Add specialist response to a review
   * POST /reviews/:id/response
   */
  static async addSpecialistResponse(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const { response } = req.body;

      if (!id) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Review ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (!response || typeof response !== 'string' || response.trim().length === 0) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Response text is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Get specialist ID from user
      const specialist = await prisma.specialist.findUnique({
        where: { userId: req.user.id },
      });

      if (!specialist) {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'Only specialists can respond to reviews',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const review = await ReviewService.addSpecialistResponse(id, specialist.id, response);

      res.json(
        createSuccessResponse({
          review: {
            ...review,
            tags: JSON.parse(review.tags || '[]'),
          },
        })
      );
    } catch (error: any) {
      logger.error('Add specialist response error:', error);

      if (error.message === 'REVIEW_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Review not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'NOT_AUTHORIZED_TO_RESPOND') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'You are not authorized to respond to this review',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to add specialist response',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Get specialist review statistics
   * GET /reviews/specialist/:specialistId/stats
   */
  static async getSpecialistReviewStats(req: Request, res: Response): Promise<void> {
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

      const stats = await ReviewService.getSpecialistReviewStats(specialistId);

      res.json(
        createSuccessResponse({
          stats,
        })
      );
    } catch (error: any) {
      logger.error('Get specialist review stats error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get review statistics',
          req.headers['x-request-id'] as string
        )
      );
    }
  }
}