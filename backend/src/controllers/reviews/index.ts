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

  /**
   * React to a review (like/dislike)
   * POST /reviews/:id/react
   */
  static async reactToReview(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const { reaction } = req.body; // 'like', 'dislike', or null

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

      if (reaction !== null && reaction !== 'like' && reaction !== 'dislike') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Reaction must be "like", "dislike", or null',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Check if review exists
      const review = await prisma.review.findUnique({
        where: { id }
      });

      if (!review) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Review not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (reaction === null) {
        // Remove reaction
        await prisma.reviewReaction.deleteMany({
          where: {
            reviewId: id,
            userId: req.user.id
          }
        });

        res.json(
          createSuccessResponse({
            message: 'Reaction removed successfully'
          })
        );
        return;
      }

      // Upsert reaction (create or update)
      await prisma.reviewReaction.upsert({
        where: {
          reviewId_userId: {
            reviewId: id,
            userId: req.user.id
          }
        },
        update: {
          reactionType: reaction
        },
        create: {
          reviewId: id,
          userId: req.user.id,
          reactionType: reaction
        }
      });

      res.json(
        createSuccessResponse({
          message: 'Reaction recorded successfully',
          reaction
        })
      );
    } catch (error: any) {
      logger.error('React to review error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to react to review',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Report a review
   * POST /reviews/:id/report
   */
  static async reportReview(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const { reason, details } = req.body;

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

      if (!reason) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Report reason is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const validReasons = ['spam', 'offensive', 'fake', 'harassment', 'personal_info', 'other'];
      if (!validReasons.includes(reason)) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid report reason',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Check if review exists
      const review = await prisma.review.findUnique({
        where: { id }
      });

      if (!review) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Review not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Check if user already reported this review
      const existingReport = await prisma.reviewReport.findUnique({
        where: {
          reviewId_reportedBy: {
            reviewId: id,
            reportedBy: req.user.id
          }
        }
      });

      if (existingReport) {
        res.status(409).json(
          createErrorResponse(
            ErrorCodes.DUPLICATE_RESOURCE,
            'You have already reported this review',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Create report
      await prisma.reviewReport.create({
        data: {
          reviewId: id,
          reportedBy: req.user.id,
          reason,
          details: details || null,
          status: 'PENDING'
        }
      });

      // TODO: Send notification to admin team

      res.json(
        createSuccessResponse({
          message: 'Report submitted successfully. Our team will review it.'
        })
      );
    } catch (error: any) {
      logger.error('Report review error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to submit report',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * React to a review response (like/dislike)
   * POST /reviews/:reviewId/response/react
   */
  static async reactToResponse(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { reviewId } = req.params;
      const { reaction } = req.body; // 'like', 'dislike', or null

      if (!reviewId) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Review ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (reaction !== null && reaction !== 'like' && reaction !== 'dislike') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Reaction must be "like", "dislike", or null',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Find the review response
      const response = await prisma.reviewResponse.findUnique({
        where: { reviewId }
      });

      if (!response) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Review response not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (reaction === null) {
        // Remove reaction
        await prisma.reviewResponseReaction.deleteMany({
          where: {
            responseId: response.id,
            userId: req.user.id
          }
        });

        res.json(
          createSuccessResponse({
            message: 'Reaction removed successfully'
          })
        );
        return;
      }

      // Upsert reaction (create or update)
      await prisma.reviewResponseReaction.upsert({
        where: {
          responseId_userId: {
            responseId: response.id,
            userId: req.user.id
          }
        },
        update: {
          reactionType: reaction
        },
        create: {
          responseId: response.id,
          userId: req.user.id,
          reactionType: reaction
        }
      });

      res.json(
        createSuccessResponse({
          message: 'Reaction recorded successfully',
          reaction
        })
      );
    } catch (error: any) {
      logger.error('React to response error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to react to response',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Get comments for a review
   * GET /reviews/:reviewId/comments
   */
  static async getReviewComments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;
      const currentUserId = req.user?.id;

      if (!reviewId) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Review ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Get all comments for the review (including nested)
      const comments = await prisma.reviewComment.findMany({
        where: {
          reviewId,
          isDeleted: false
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          reactions: currentUserId ? {
            where: { userId: currentUserId }
          } : false,
          _count: {
            select: {
              replies: {
                where: { isDeleted: false }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      // Format response with engagement data
      const formattedComments = comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        parentId: comment.parentId,
        likeCount: comment.likeCount || 0,
        dislikeCount: comment.dislikeCount || 0,
        userReaction: comment.reactions?.length > 0 ? comment.reactions[0].reactionType : null,
        replyCount: comment._count.replies,
        user: {
          id: comment.user.id,
          firstName: comment.user.firstName,
          lastName: comment.user.lastName,
          avatar: comment.user.avatar
        }
      }));

      res.json(createSuccessResponse({ comments: formattedComments }));
    } catch (error: any) {
      logger.error('Get review comments error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get comments',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Create a comment on a review
   * POST /reviews/:reviewId/comments
   */
  static async createReviewComment(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { reviewId } = req.params;
      const { content, parentId } = req.body;

      if (!reviewId || !content) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Review ID and content are required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (content.trim().length === 0) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Comment content cannot be empty',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Verify review exists
      const review = await prisma.review.findUnique({
        where: { id: reviewId }
      });

      if (!review) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Review not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // If parentId is provided, verify parent comment exists
      if (parentId) {
        const parentComment = await prisma.reviewComment.findUnique({
          where: { id: parentId }
        });

        if (!parentComment) {
          res.status(404).json(
            createErrorResponse(
              ErrorCodes.RESOURCE_NOT_FOUND,
              'Parent comment not found',
              req.headers['x-request-id'] as string
            )
          );
          return;
        }

        if (parentComment.reviewId !== reviewId) {
          res.status(400).json(
            createErrorResponse(
              ErrorCodes.VALIDATION_ERROR,
              'Parent comment does not belong to this review',
              req.headers['x-request-id'] as string
            )
          );
          return;
        }
      }

      // Create comment
      const comment = await prisma.reviewComment.create({
        data: {
          reviewId,
          userId: req.user.id,
          content: content.trim(),
          parentId: parentId || null
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      });

      res.json(
        createSuccessResponse({
          message: 'Comment created successfully',
          comment: {
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt,
            parentId: comment.parentId,
            likeCount: 0,
            dislikeCount: 0,
            userReaction: null,
            replyCount: 0,
            user: comment.user
          }
        })
      );
    } catch (error: any) {
      logger.error('Create review comment error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to create comment',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * React to a comment (like/dislike)
   * POST /reviews/:reviewId/comments/:commentId/react
   */
  static async reactToComment(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { commentId } = req.params;
      const { reaction } = req.body; // 'like', 'dislike', or null

      if (!commentId) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Comment ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (reaction !== null && reaction !== 'like' && reaction !== 'dislike') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Reaction must be "like", "dislike", or null',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Check if comment exists
      const comment = await prisma.reviewComment.findUnique({
        where: { id: commentId }
      });

      if (!comment || comment.isDeleted) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Comment not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (reaction === null) {
        // Remove reaction
        await prisma.reviewCommentReaction.deleteMany({
          where: {
            commentId: commentId,
            userId: req.user.id
          }
        });

        res.json(
          createSuccessResponse({
            message: 'Reaction removed successfully'
          })
        );
        return;
      }

      // Upsert reaction (create or update)
      await prisma.reviewCommentReaction.upsert({
        where: {
          commentId_userId: {
            commentId: commentId,
            userId: req.user.id
          }
        },
        update: {
          reactionType: reaction
        },
        create: {
          commentId: commentId,
          userId: req.user.id,
          reactionType: reaction
        }
      });

      res.json(
        createSuccessResponse({
          message: 'Reaction recorded successfully',
          reaction
        })
      );
    } catch (error: any) {
      logger.error('React to comment error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to react to comment',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Delete a comment
   * DELETE /reviews/:reviewId/comments/:commentId
   */
  static async deleteComment(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { commentId } = req.params;

      if (!commentId) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Comment ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Find comment
      const comment = await prisma.reviewComment.findUnique({
        where: { id: commentId }
      });

      if (!comment || comment.isDeleted) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Comment not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Only allow user to delete their own comments
      if (comment.userId !== req.user.id) {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.FORBIDDEN,
            'You can only delete your own comments',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Soft delete the comment
      await prisma.reviewComment.update({
        where: { id: commentId },
        data: {
          isDeleted: true,
          deletedAt: new Date()
        }
      });

      res.json(
        createSuccessResponse({
          message: 'Comment deleted successfully'
        })
      );
    } catch (error: any) {
      logger.error('Delete comment error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to delete comment',
          req.headers['x-request-id'] as string
        )
      );
    }
  }
}