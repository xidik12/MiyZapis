import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { authenticateToken, requireOwnership } from '@/middleware/auth/jwt';
import { validationResult } from 'express-validator';
import LoyaltyService from '@/services/loyalty';
import {
  validateCreateReview,
  validateUpdateReview,
  validateGetServiceReviews,
  validateGetSpecialistReviews,
  validateGetMyReviews,
  validateReviewId,
  validateMarkReviewHelpful,
  validateReportReview,
  validateRespondToReview
} from '@/middleware/validation/reviews';
import { createSuccessResponse, createErrorResponse, calculatePaginationOffset, createPaginationMeta, formatValidationErrors } from '@/utils/response';
import { ErrorCodes, AuthenticatedRequest } from '@/types';
import { logger } from '@/utils/logger';
import { ReviewController } from '@/controllers/reviews';

const router = Router();

// Get user's own reviews (as a customer)
router.get('/my-reviews', authenticateToken, validateGetMyReviews, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid query parameters',
          req.headers['x-request-id'] as string,
          formatValidationErrors(errors.array())
        )
      );
    }

    const userId = (req as AuthenticatedRequest).user?.id;
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const { skip, take } = calculatePaginationOffset(Number(page), Number(limit));

    // Build order by clause
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'rating') {
      orderBy = { rating: sortOrder };
    } else if (sortBy === 'likes' || sortBy === 'helpful') {
      // Support both 'likes' and 'helpful' (legacy) for sorting
      orderBy = [{ likeCount: 'desc' }, { createdAt: 'desc' }];
    }

    // Get total count
    const totalCount = await prisma.review.count({
      where: { customerId: userId }
    });

    // Get user's reviews with engagement data
    const reviews = await prisma.review.findMany({
      where: { customerId: userId },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        specialist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            businessName: true,
            avatar: true
          }
        },
        booking: {
          select: {
            id: true,
            scheduledAt: true,
            completedAt: true,
            service: {
              select: {
                id: true,
                name: true,
                category: true
              }
            }
          }
        },
        response: {
          include: {
            reactions: {
              where: { userId: userId }
            }
          }
        },
        reactions: {
          where: { userId: userId }
        }
      },
      orderBy,
      skip,
      take
    });

    // Format response data for customer dashboard
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      tags: review.tags ? JSON.parse(review.tags) : [],
      isVerified: review.isVerified,
      isPublic: review.isPublic,
      likeCount: review.likeCount || 0,
      dislikeCount: review.dislikeCount || 0,
      userReaction: review.reactions.length > 0 ? review.reactions[0].reactionType : null,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      customer: review.customer,
      specialist: review.specialist,
      service: review.booking?.service,
      booking: review.booking ? {
        id: review.booking.id,
        scheduledAt: review.booking.scheduledAt,
        completedAt: review.booking.completedAt
      } : undefined,
      response: review.response ? {
        id: review.response.id,
        responseText: review.response.responseText,
        createdAt: review.response.createdAt,
        likeCount: review.response.likeCount || 0,
        dislikeCount: review.response.dislikeCount || 0,
        userReaction: review.response.reactions.length > 0 ? review.response.reactions[0].reactionType : null
      } : undefined
    }));

    const paginationMeta = createPaginationMeta(Number(page), Number(limit), totalCount);

    res.json(createSuccessResponse({
      reviews: formattedReviews,
      pagination: paginationMeta
    }));
  } catch (error) {
    logger.error('Get my reviews error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to get your reviews',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Get service reviews
router.get('/service/:id', validateGetServiceReviews, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid query parameters',
          req.headers['x-request-id'] as string,
          formatValidationErrors(errors.array())
        )
      );
    }

    const { id } = req.params;
    const {
      page = 1,
      limit = 20,
      rating,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      verified,
      withComment,
      tags
    } = req.query;

    const { skip, take } = calculatePaginationOffset(Number(page), Number(limit));

    // Build where clause
    const where: any = {
      booking: {
        serviceId: id
      },
      isPublic: true
    };

    if (rating) {
      where.rating = Number(rating);
    }

    if (verified !== undefined) {
      where.isVerified = verified === 'true';
    }

    if (withComment === 'true') {
      where.comment = { not: null };
    } else if (withComment === 'false') {
      where.comment = null;
    }

    if (tags) {
      const tagArray = (tags as string).split(',').map(tag => tag.trim());
      where.tags = {
        contains: JSON.stringify(tagArray[0]) // Simple implementation
      };
    }

    // Build order by clause
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'rating') {
      orderBy = { rating: sortOrder };
    } else if (sortBy === 'likes' || sortBy === 'helpful') {
      // Support both 'likes' and 'helpful' (legacy) for sorting
      orderBy = [{ likeCount: 'desc' }, { createdAt: 'desc' }];
    } else if (sortBy === 'helpful') {
      // In production, you'd have a helpful count field
      orderBy = { createdAt: sortOrder };
    }

    // Get total count
    const totalCount = await prisma.review.count({ where });

    // Get reviews
    const reviews = await prisma.review.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        booking: {
          select: {
            id: true,
            scheduledAt: true,
            completedAt: true,
            service: {
              select: {
                name: true,
                category: true
              }
            }
          }
        }
      },
      orderBy,
      skip,
      take
    });

    // Format response data
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      tags: review.tags ? JSON.parse(review.tags) : [],
      isVerified: review.isVerified,
      createdAt: review.createdAt,
      customer: {
        id: review.customer.id,
        firstName: review.customer.firstName,
        lastName: review.customer.lastName.charAt(0) + '.', // Privacy protection
        avatar: review.customer.avatar
      },
      booking: {
        serviceName: review.booking.service.name,
        serviceCategory: review.booking.service.category,
        bookingDate: review.booking.scheduledAt
      }
    }));

    // Calculate review statistics
    const allServiceReviews = await prisma.review.findMany({
      where: {
        booking: { serviceId: id },
        isPublic: true
      },
      select: { rating: true, tags: true }
    });

    const stats = {
      totalReviews: allServiceReviews.length,
      averageRating: allServiceReviews.length > 0 ? 
        allServiceReviews.reduce((sum, r) => sum + r.rating, 0) / allServiceReviews.length : 0,
      ratingDistribution: {
        5: allServiceReviews.filter(r => r.rating === 5).length,
        4: allServiceReviews.filter(r => r.rating === 4).length,
        3: allServiceReviews.filter(r => r.rating === 3).length,
        2: allServiceReviews.filter(r => r.rating === 2).length,
        1: allServiceReviews.filter(r => r.rating === 1).length,
      }
    };

    const paginationMeta = createPaginationMeta(Number(page), Number(limit), totalCount);

    res.json(createSuccessResponse(formattedReviews, { 
      pagination: paginationMeta, 
      total: totalCount,
      stats 
    }));
  } catch (error) {
    logger.error('Get service reviews error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to get service reviews',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Create review
router.post('/', authenticateToken, validateCreateReview, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error('Review validation failed:', {
        errors: errors.array(),
        body: req.body,
        userId: (req as AuthenticatedRequest).user?.id,
        headers: req.headers
      });
      return res.status(400).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid review data',
          req.headers['x-request-id'] as string,
          formatValidationErrors(errors.array())
        )
      );
    }

    // Add debug logging for successful validation  
    logger.info('Review validation passed:', {
      body: req.body,
      userId: (req as AuthenticatedRequest).user?.id
    });

    const userId = (req as AuthenticatedRequest).user?.id;
    const {
      bookingId,
      rating,
      comment,
      tags = [],
      isPublic = true,
      wouldRecommend
    } = req.body;

    // Verify booking exists and is completed
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        customerId: userId,
        status: 'COMPLETED'
      },
      include: {
        service: {
          include: {
            specialist: {
              select: {
                id: true,
                rating: true,
                reviewCount: true
              }
            }
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json(
        createErrorResponse(
          ErrorCodes.RESOURCE_NOT_FOUND,
          'Completed booking not found or you do not have permission',
          req.headers['x-request-id'] as string
        )
      );
    }

    // Check if review already exists
    const existingReview = await prisma.review.findUnique({
      where: { bookingId }
    });

    if (existingReview) {
      return res.status(409).json(
        createErrorResponse(
          ErrorCodes.DUPLICATE_RESOURCE,
          'Review already exists for this booking',
          req.headers['x-request-id'] as string
        )
      );
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        bookingId,
        customerId: userId,
        specialistId: booking.service.specialist.id,
        rating,
        comment,
        tags: JSON.stringify(tags),
        isPublic,
        isVerified: true // Auto-verify since it's from a completed booking
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        booking: {
          select: {
            service: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    // Update specialist rating
    const allSpecialistReviews = await prisma.review.findMany({
      where: { specialistId: booking.service.specialist.id },
      select: { rating: true }
    });

    const newAverageRating = allSpecialistReviews.length > 0 ? 
      allSpecialistReviews.reduce((sum, r) => sum + r.rating, 0) / allSpecialistReviews.length : 0;

    await prisma.specialist.update({
      where: { id: booking.service.specialist.id },
      data: {
        rating: Math.round(newAverageRating * 10) / 10, // Round to 1 decimal place
        reviewCount: allSpecialistReviews.length
      }
    });

    // Award loyalty points using the new system (5 for customer, 1 per star for specialist)
    // Use the loyalty service which handles both customer and specialist rewards
    await LoyaltyService.processReviewReward(
      review.id,
      bookingId,
      userId,
      rating,
      comment
    );

    // Create notification for specialist
    await prisma.notification.create({
      data: {
        userId: booking.specialistId,
        type: 'REVIEW_RECEIVED',
        title: 'New Review Received',
        message: `You received a ${rating}-star review for "${booking.service.name}"`,
        data: JSON.stringify({
          reviewId: review.id,
          rating,
          bookingId
        }),
        bookingId
      }
    });

    res.status(201).json(createSuccessResponse({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      tags: JSON.parse(review.tags),
      isPublic: review.isPublic,
      isVerified: review.isVerified,
      loyaltyPointsEarned: 5,
      createdAt: review.createdAt,
      customer: {
        firstName: review.customer.firstName,
        lastName: review.customer.lastName,
        avatar: review.customer.avatar
      },
      serviceName: review.booking.service.name
    }));
  } catch (error) {
    logger.error('Create review error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to create review',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Update review
router.put('/:id', authenticateToken, validateUpdateReview, requireOwnership('reviewId'), async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid review update data',
          req.headers['x-request-id'] as string,
          formatValidationErrors(errors.array())
        )
      );
    }

    const { id } = req.params;
    const updateData: any = {};

    // Only update provided fields
    if (req.body.rating !== undefined) updateData.rating = req.body.rating;
    if (req.body.comment !== undefined) updateData.comment = req.body.comment;
    if (req.body.tags !== undefined) updateData.tags = JSON.stringify(req.body.tags);
    if (req.body.isPublic !== undefined) updateData.isPublic = req.body.isPublic;

    const updatedReview = await prisma.review.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });

    // Recalculate specialist rating if rating was updated
    if (req.body.rating !== undefined) {
      const allSpecialistReviews = await prisma.review.findMany({
        where: { specialistId: updatedReview.specialistId },
        select: { rating: true }
      });

      const newAverageRating = allSpecialistReviews.length > 0 ? 
        allSpecialistReviews.reduce((sum, r) => sum + r.rating, 0) / allSpecialistReviews.length : 0;

      await prisma.specialist.update({
        where: { id: updatedReview.specialistId },
        data: {
          rating: Math.round(newAverageRating * 10) / 10
        }
      });
    }

    res.json(createSuccessResponse({
      id: updatedReview.id,
      rating: updatedReview.rating,
      comment: updatedReview.comment,
      tags: updatedReview.tags ? JSON.parse(updatedReview.tags) : [],
      isPublic: updatedReview.isPublic,
      updatedAt: updatedReview.updatedAt
    }));
  } catch (error) {
    logger.error('Update review error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to update review',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Delete review
router.delete('/:id', authenticateToken, validateReviewId, requireOwnership('reviewId'), async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid review ID',
          req.headers['x-request-id'] as string,
          formatValidationErrors(errors.array())
        )
      );
    }

    const { id } = req.params;

    // Get review details before deletion
    const review = await prisma.review.findUnique({
      where: { id },
      select: {
        specialistId: true,
        customerId: true
      }
    });

    if (!review) {
      return res.status(404).json(
        createErrorResponse(
          ErrorCodes.RESOURCE_NOT_FOUND,
          'Review not found',
          req.headers['x-request-id'] as string
        )
      );
    }

    // Delete the review
    await prisma.review.delete({
      where: { id }
    });

    // Recalculate specialist rating
    const allSpecialistReviews = await prisma.review.findMany({
      where: { specialistId: review.specialistId },
      select: { rating: true }
    });

    const newAverageRating = allSpecialistReviews.length > 0 ? 
      allSpecialistReviews.reduce((sum, r) => sum + r.rating, 0) / allSpecialistReviews.length : 0;

    await prisma.specialist.update({
      where: { id: review.specialistId },
      data: {
        rating: Math.round(newAverageRating * 10) / 10,
        reviewCount: allSpecialistReviews.length
      }
    });

    // Deduct loyalty points that were earned for this review
    await prisma.user.update({
      where: { id: review.customerId },
      data: {
        loyaltyPoints: { decrement: 50 }
      }
    });

    await prisma.loyaltyTransaction.create({
      data: {
        userId: review.customerId,
        type: 'REDEEMED',
        points: -5, // Deduct the new amount (5 points)
        reason: 'Review deletion',
        description: 'Deducted 5 points for deleted review',
        referenceId: id
      }
    });

    res.json(createSuccessResponse({ message: 'Review deleted successfully' }));
  } catch (error) {
    logger.error('Delete review error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to delete review',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Get specialist reviews
router.get('/specialist/:id', validateGetSpecialistReviews, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid query parameters',
          req.headers['x-request-id'] as string,
          formatValidationErrors(errors.array())
        )
      );
    }

    const { id } = req.params;
    const {
      page = 1,
      limit = 20,
      rating,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      verified,
      withComment,
      serviceId
    } = req.query;

    const { skip, take } = calculatePaginationOffset(Number(page), Number(limit));

    // Build where clause
    const where: any = {
      specialistId: id,
      isPublic: true
    };

    if (rating) {
      where.rating = Number(rating);
    }

    if (verified !== undefined) {
      where.isVerified = verified === 'true';
    }

    if (withComment === 'true') {
      where.comment = { not: null };
    } else if (withComment === 'false') {
      where.comment = null;
    }

    if (serviceId) {
      where.booking = {
        serviceId: serviceId
      };
    }

    // Build order by clause
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'rating') {
      orderBy = { rating: sortOrder };
    } else if (sortBy === 'likes' || sortBy === 'helpful') {
      // Support both 'likes' and 'helpful' (legacy) for sorting
      orderBy = [{ likeCount: 'desc' }, { createdAt: 'desc' }];
    }

    // Get total count
    const totalCount = await prisma.review.count({ where });

    // Get current user ID if authenticated
    const currentUserId = (req as AuthenticatedRequest).user?.id;

    // Get reviews
    const reviews = await prisma.review.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        booking: {
          select: {
            id: true,
            scheduledAt: true,
            service: {
              select: {
                id: true,
                name: true,
                category: true
              }
            }
          }
        },
        response: {
          include: {
            reactions: currentUserId ? {
              where: { userId: currentUserId }
            } : false
          }
        },
        reactions: currentUserId ? {
          where: { userId: currentUserId }
        } : false
      },
      orderBy,
      skip,
      take
    });

    // Format response data
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      tags: review.tags ? JSON.parse(review.tags) : [],
      isVerified: review.isVerified,
      likeCount: review.likeCount || 0,
      dislikeCount: review.dislikeCount || 0,
      userReaction: review.reactions && review.reactions.length > 0 ? review.reactions[0].reactionType : null,
      createdAt: review.createdAt,
      customer: {
        id: review.customer.id,
        firstName: review.customer.firstName,
        lastName: review.customer.lastName.charAt(0) + '.', // Privacy protection
        avatar: review.customer.avatar
      },
      service: review.booking.service,
      bookingDate: review.booking.scheduledAt,
      response: review.response ? {
        id: review.response.id,
        responseText: review.response.responseText,
        likeCount: review.response.likeCount || 0,
        dislikeCount: review.response.dislikeCount || 0,
        userReaction: review.response.reactions && review.response.reactions.length > 0 ? review.response.reactions[0].reactionType : null,
        createdAt: review.response.createdAt
      } : null
    }));

    // Calculate review statistics for this specialist
    const allSpecialistReviews = await prisma.review.findMany({
      where: {
        specialistId: id,
        isPublic: true
      },
      select: { rating: true, tags: true, createdAt: true }
    });

    const stats = {
      totalReviews: allSpecialistReviews.length,
      averageRating: allSpecialistReviews.length > 0 ? 
        allSpecialistReviews.reduce((sum, r) => sum + r.rating, 0) / allSpecialistReviews.length : 0,
      ratingDistribution: {
        5: allSpecialistReviews.filter(r => r.rating === 5).length,
        4: allSpecialistReviews.filter(r => r.rating === 4).length,
        3: allSpecialistReviews.filter(r => r.rating === 3).length,
        2: allSpecialistReviews.filter(r => r.rating === 2).length,
        1: allSpecialistReviews.filter(r => r.rating === 1).length,
      },
      recentTrend: allSpecialistReviews
        .slice(0, 10)
        .reduce((sum, r) => sum + r.rating, 0) / Math.min(10, allSpecialistReviews.length) || 0
    };

    const paginationMeta = createPaginationMeta(Number(page), Number(limit), totalCount);

    res.json(createSuccessResponse(formattedReviews, { 
      pagination: paginationMeta, 
      total: totalCount,
      stats 
    }));
  } catch (error) {
    logger.error('Get specialist reviews error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to get specialist reviews',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Mark review as helpful (for future implementation)
router.post('/:id/helpful', authenticateToken, validateMarkReviewHelpful, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid helpful data',
          req.headers['x-request-id'] as string,
          formatValidationErrors(errors.array())
        )
      );
    }

    // This is a placeholder for helpful functionality
    // In production, you'd have a separate table to track helpful votes
    res.json(createSuccessResponse({
      message: 'Helpful vote recorded',
      reviewId: req.params.id,
      helpful: req.body.helpful
    }));
  } catch (error) {
    logger.error('Mark review helpful error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to mark review as helpful',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Report review
router.post('/:id/report', authenticateToken, validateReportReview, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid report data',
          req.headers['x-request-id'] as string,
          formatValidationErrors(errors.array())
        )
      );
    }

    const userId = (req as AuthenticatedRequest).user?.id;
    const { id } = req.params;
    const { reason, description } = req.body;

    // In production, you'd have a reports table
    // For now, we'll create a notification for admin
    await prisma.notification.create({
      data: {
        userId: 'admin-user-id', // Would be actual admin user ID
        type: 'REVIEW_REPORTED',
        title: 'Review Reported',
        message: `Review ${id} has been reported for: ${reason}`,
        data: JSON.stringify({
          reviewId: id,
          reportedBy: userId,
          reason,
          description
        })
      }
    });

    res.json(createSuccessResponse({
      message: 'Review report submitted successfully',
      reviewId: id,
      reason
    }));
  } catch (error) {
    logger.error('Report review error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to report review',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Specialist response to review
router.post('/:id/response', authenticateToken, validateRespondToReview, ReviewController.addSpecialistResponse);

// Review engagement endpoints
router.post('/:id/react', authenticateToken, ReviewController.reactToReview);
router.post('/:reviewId/response/react', authenticateToken, ReviewController.reactToResponse);
router.post('/:id/report', authenticateToken, ReviewController.reportReview);

// Enhanced endpoints using service pattern
router.get('/enhanced', ReviewController.getReviews);
router.get('/enhanced/:id', ReviewController.getReview);
router.post('/enhanced', authenticateToken, validateCreateReview, ReviewController.createReview);
router.put('/enhanced/:id', authenticateToken, validateUpdateReview, ReviewController.updateReview);
router.delete('/enhanced/:id', authenticateToken, ReviewController.deleteReview);
router.get('/specialist/:specialistId/stats', ReviewController.getSpecialistReviewStats);

export default router;