import { Review, Specialist } from '@prisma/client';
import { logger } from '@/utils/logger';
import { prisma } from '@/config/database';
import LoyaltyService from '@/services/loyalty';

export interface CreateReviewData {
  bookingId: string;
  customerId: string;
  rating: number;
  comment?: string;
  tags?: string[];
}

export interface UpdateReviewData {
  rating?: number;
  comment?: string;
  tags?: string[];
  isPublic?: boolean;
}

export interface ReviewFilters {
  specialistId?: string;
  rating?: number;
  minRating?: number;
  maxRating?: number;
  isPublic?: boolean;
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
}

export interface ReviewWithBooking extends Review {
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  booking: {
    id: string;
    service: {
      name: string;
      category: string;
    };
    scheduledAt: Date;
  };
}

export class ReviewService {
  /**
   * Create a new review
   */
  static async createReview(data: CreateReviewData): Promise<Review> {
    try {
      // Validate booking exists and is completed
      const booking = await prisma.booking.findUnique({
        where: { id: data.bookingId },
        include: {
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

      if (booking.customerId !== data.customerId) {
        throw new Error('NOT_AUTHORIZED_TO_REVIEW');
      }

      if (booking.status !== 'COMPLETED') {
        throw new Error('BOOKING_NOT_COMPLETED');
      }

      // Check if review already exists
      const existingReview = await prisma.review.findUnique({
        where: { bookingId: data.bookingId },
      });

      if (existingReview) {
        throw new Error('REVIEW_ALREADY_EXISTS');
      }

      // Validate rating
      if (data.rating < 1 || data.rating > 5) {
        throw new Error('INVALID_RATING_RANGE');
      }

      // Create review
      const review = await prisma.review.create({
        data: {
          bookingId: data.bookingId,
          customerId: data.customerId,
          specialistId: booking.service.specialist.id,
          rating: data.rating,
          comment: data.comment,
          tags: JSON.stringify(data.tags || []),
          isVerified: true, // Verified since it's from a completed booking
        },
      });

      // Update specialist rating
      await this.updateSpecialistRating(booking.service.specialist.id);

      // Award specialist 1-5 points based on rating received
      try {
        const specialistUserId = booking.service.specialist.userId;
        if (specialistUserId) {
          const ratingPoints = Math.max(1, Math.min(5, data.rating));
          await LoyaltyService.earnPoints({
            userId: specialistUserId,
            points: ratingPoints,
            reason: 'REVIEW_RECEIVED',
            description: `Received ${ratingPoints}-star review for booking ${data.bookingId}`,
            referenceId: data.bookingId,
          });
        }
      } catch (awardErr) {
        // Non-fatal: log and continue
        logger.warn('Failed to award specialist review points', {
          error: awardErr instanceof Error ? awardErr.message : awardErr,
          bookingId: data.bookingId,
          rating: data.rating,
        });
      }

      logger.info(`Review created: ${review.id} for booking ${data.bookingId}`);
      return review;
    } catch (error) {
      logger.error('Error creating review:', error);
      throw error;
    }
  }

  /**
   * Get reviews with filters and pagination
   */
  static async getReviews(
    filters: ReviewFilters = {},
    page: number = 1,
    limit: number = 20
  ) {
    try {
      const where: Record<string, unknown> = {
        isPublic: true, // Only show public reviews by default
      };

      if (filters.specialistId) {
        where.specialistId = filters.specialistId;
      }

      if (filters.rating) {
        where.rating = filters.rating;
      }

      if (filters.minRating) {
        where.rating = { ...where.rating, gte: filters.minRating };
      }

      if (filters.maxRating) {
        where.rating = { ...where.rating, lte: filters.maxRating };
      }

      if (filters.isPublic !== undefined) {
        where.isPublic = filters.isPublic;
      }

      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.createdAt.lte = filters.endDate;
        }
      }

      if (filters.tags && filters.tags.length > 0) {
        // For SQLite, we need to use string search for JSON
        where.tags = {
          contains: filters.tags[0], // Simplified for SQLite
        };
      }

      const offset = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where,
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            booking: {
              select: {
                id: true,
                service: {
                  select: {
                    name: true,
                    category: true,
                  },
                },
                scheduledAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        prisma.review.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        reviews: reviews.map(review => ({
          ...review,
          tags: JSON.parse(review.tags || '[]'),
        })),
        page,
        totalPages,
        total,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    } catch (error) {
      logger.error('Error getting reviews:', error);
      throw error;
    }
  }

  /**
   * Get a single review by ID
   */
  static async getReview(id: string): Promise<ReviewWithBooking> {
    try {
      const review = await prisma.review.findUnique({
        where: { id },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          booking: {
            select: {
              id: true,
              service: {
                select: {
                  name: true,
                  category: true,
                },
              },
              scheduledAt: true,
            },
          },
        },
      });

      if (!review) {
        throw new Error('REVIEW_NOT_FOUND');
      }

      return {
        ...review,
        tags: JSON.parse(review.tags || '[]'),
      } as ReviewWithBooking;
    } catch (error) {
      logger.error('Error getting review:', error);
      throw error;
    }
  }

  /**
   * Update a review
   */
  static async updateReview(id: string, data: UpdateReviewData): Promise<Review> {
    try {
      // Check if review exists
      const existingReview = await prisma.review.findUnique({
        where: { id },
      });

      if (!existingReview) {
        throw new Error('REVIEW_NOT_FOUND');
      }

      // Validate rating if provided
      if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
        throw new Error('INVALID_RATING_RANGE');
      }

      const updateData: Record<string, unknown> = {};

      if (data.rating !== undefined) {
        updateData.rating = data.rating;
      }

      if (data.comment !== undefined) {
        updateData.comment = data.comment;
      }

      if (data.tags !== undefined) {
        updateData.tags = JSON.stringify(data.tags);
      }

      if (data.isPublic !== undefined) {
        updateData.isPublic = data.isPublic;
      }

      const review = await prisma.review.update({
        where: { id },
        data: updateData,
      });

      // Update specialist rating if rating changed
      if (data.rating !== undefined) {
        await this.updateSpecialistRating(existingReview.specialistId);
      }

      logger.info(`Review updated: ${id}`);
      return review;
    } catch (error) {
      logger.error('Error updating review:', error);
      throw error;
    }
  }

  /**
   * Delete a review
   */
  static async deleteReview(id: string): Promise<void> {
    try {
      const review = await prisma.review.findUnique({
        where: { id },
      });

      if (!review) {
        throw new Error('REVIEW_NOT_FOUND');
      }

      await prisma.review.delete({
        where: { id },
      });

      // Update specialist rating
      await this.updateSpecialistRating(review.specialistId);

      logger.info(`Review deleted: ${id}`);
    } catch (error) {
      logger.error('Error deleting review:', error);
      throw error;
    }
  }

  /**
   * Add specialist response to a review
   */
  static async addSpecialistResponse(
    reviewId: string,
    specialistId: string,
    response: string
  ): Promise<Review> {
    try {
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
      });

      if (!review) {
        throw new Error('REVIEW_NOT_FOUND');
      }

      if (review.specialistId !== specialistId) {
        throw new Error('NOT_AUTHORIZED_TO_RESPOND');
      }

      // For now, we'll store the response in the comment field with a prefix
      // In a full implementation, you might want to add a separate response field
      const updatedComment = review.comment
        ? `${review.comment}\n\n--- Specialist Response ---\n${response}`
        : `--- Specialist Response ---\n${response}`;

      const updatedReview = await prisma.review.update({
        where: { id: reviewId },
        data: {
          comment: updatedComment,
        },
      });

      logger.info(`Specialist response added to review: ${reviewId}`);
      return updatedReview;
    } catch (error) {
      logger.error('Error adding specialist response:', error);
      throw error;
    }
  }

  /**
   * Get specialist review statistics
   */
  static async getSpecialistReviewStats(specialistId: string) {
    try {
      const stats = await prisma.review.groupBy({
        by: ['rating'],
        where: {
          specialistId,
          isPublic: true,
        },
        _count: {
          rating: true,
        },
      });

      const totalReviews = stats.reduce((sum, stat) => sum + stat._count.rating, 0);
      const averageRating = totalReviews > 0
        ? stats.reduce((sum, stat) => sum + (stat.rating * stat._count.rating), 0) / totalReviews
        : 0;

      const ratingDistribution = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };

      stats.forEach(stat => {
        ratingDistribution[stat.rating as keyof typeof ratingDistribution] = stat._count.rating;
      });

      return {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
      };
    } catch (error) {
      logger.error('Error getting specialist review stats:', error);
      throw error;
    }
  }

  /**
   * Update specialist rating based on reviews
   */
  private static async updateSpecialistRating(specialistId: string): Promise<void> {
    try {
      const stats = await this.getSpecialistReviewStats(specialistId);

      await prisma.specialist.update({
        where: { id: specialistId },
        data: {
          rating: stats.averageRating,
          reviewCount: stats.totalReviews,
        },
      });

      logger.info(`Specialist rating updated: ${specialistId}`);
    } catch (error) {
      logger.error('Error updating specialist rating:', error);
      throw error;
    }
  }
}
