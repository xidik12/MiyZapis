import { apiClient } from './api';
import { Pagination, ApiResponse } from '@/types';

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  tags?: string[];
  isVerified: boolean;
  helpfulCount: number;
  isHelpful?: boolean;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  specialist: {
    id: string;
    firstName: string;
    lastName: string;
    businessName?: string;
  };
  service?: {
    id: string;
    name: string;
  };
  booking?: {
    id: string;
    completedAt: string;
  };
  response?: {
    id: string;
    message: string;
    responseText?: string;
    likeCount?: number;
    dislikeCount?: number;
    userReaction?: 'like' | 'dislike' | null;
    createdAt: string;
  };
  likeCount?: number;
  dislikeCount?: number;
  userReaction?: 'like' | 'dislike' | null;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  verifiedReviewsCount: number;
  recommendationRate: number;
}

export interface CreateReviewData {
  bookingId: string;
  rating: number;
  comment?: string;
  tags?: string[];
  isPublic?: boolean;
  wouldRecommend?: boolean;
}

export interface UpdateReviewData {
  rating?: number;
  comment?: string;
  tags?: string[];
  isRecommended?: boolean;
}

export class ReviewsService {
  // Get reviews for a service
  async getServiceReviews(
    serviceId: string,
    page: number = 1,
    limit: number = 20,
    filters: {
      rating?: number;
      sortBy?: 'createdAt' | 'rating' | 'helpful';
      sortOrder?: 'asc' | 'desc';
      verified?: boolean;
      withComment?: boolean;
      tags?: string[];
    } = {}
  ): Promise<{
    reviews: Review[];
    pagination: Pagination & { hasNextPage?: boolean; hasPreviousPage?: boolean; page?: number; total?: number };
    stats: ReviewStats | null;
  }> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    // Only add filter parameters if they have actual values (not undefined)
    if (filters.rating !== undefined) params.append('rating', filters.rating.toString());
    if (filters.sortBy !== undefined) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder !== undefined) params.append('sortOrder', filters.sortOrder);
    if (filters.verified !== undefined) params.append('verified', filters.verified.toString());
    if (filters.withComment !== undefined) params.append('withComment', filters.withComment.toString());
    if (filters.tags && filters.tags.length > 0) params.append('tags', filters.tags.join(','));

    const response = await apiClient.get<any>(`/reviews/service/${serviceId}?${params}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to get service reviews');
    }

    const rawReviews: Review[] = Array.isArray(response.data) ? response.data : (response.data?.reviews || []);
    const meta = response.meta || {};
    const p = meta.pagination || {};

    const pagination: Pagination & { hasNextPage?: boolean; hasPreviousPage?: boolean; page?: number; total?: number } = {
      currentPage: p.currentPage ?? p.page ?? page,
      totalPages: p.totalPages ?? 0,
      totalItems: p.totalItems ?? meta.total ?? 0,
      limit: p.itemsPerPage ?? limit,
      hasNext: p.hasNext ?? p.hasNextPage ?? false,
      hasPrev: p.hasPrev ?? p.hasPreviousPage ?? false,
      // compatibility aliases used by some screens
      hasNextPage: p.hasNext ?? p.hasNextPage ?? false,
      hasPreviousPage: p.hasPrev ?? p.hasPreviousPage ?? false,
      page: p.currentPage ?? p.page ?? page,
      total: p.totalItems ?? meta.total ?? 0,
    };

    const stats: ReviewStats | null = meta.stats ?? response.data?.stats ?? null;

    return { reviews: rawReviews, pagination, stats };
  }

  // Get reviews for a specialist
  async getSpecialistReviews(
    specialistId: string,
    page: number = 1,
    limit: number = 20,
    filters: {
      rating?: number;
      sortBy?: 'createdAt' | 'rating' | 'helpful';
      sortOrder?: 'asc' | 'desc';
      verified?: boolean;
      withComment?: boolean;
      tags?: string[];
    } = {}
  ): Promise<{
    reviews: Review[];
    pagination: Pagination & { hasNextPage?: boolean; hasPreviousPage?: boolean; page?: number; total?: number };
    stats: ReviewStats | null;
  }> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    // Only add filter parameters if they have actual values (not undefined)
    if (filters.rating !== undefined) params.append('rating', filters.rating.toString());
    if (filters.sortBy !== undefined) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder !== undefined) params.append('sortOrder', filters.sortOrder);
    if (filters.verified !== undefined) params.append('verified', filters.verified.toString());
    if (filters.withComment !== undefined) params.append('withComment', filters.withComment.toString());
    if (filters.tags && filters.tags.length > 0) params.append('tags', filters.tags.join(','));

    const response = await apiClient.get<any>(`/reviews/specialist/${specialistId}?${params}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to get specialist reviews');
    }

    const rawReviews: Review[] = Array.isArray(response.data) ? response.data : (response.data?.reviews || []);
    const meta = response.meta || {};
    const p = meta.pagination || {};

    const pagination: Pagination & { hasNextPage?: boolean; hasPreviousPage?: boolean; page?: number; total?: number } = {
      currentPage: p.currentPage ?? p.page ?? page,
      totalPages: p.totalPages ?? 0,
      totalItems: p.totalItems ?? meta.total ?? 0,
      limit: p.itemsPerPage ?? limit,
      hasNext: p.hasNext ?? p.hasNextPage ?? false,
      hasPrev: p.hasPrev ?? p.hasPreviousPage ?? false,
      // compatibility aliases used by some screens
      hasNextPage: p.hasNext ?? p.hasNextPage ?? false,
      hasPreviousPage: p.hasPrev ?? p.hasPreviousPage ?? false,
      page: p.currentPage ?? p.page ?? page,
      total: p.totalItems ?? meta.total ?? 0,
    };

    const stats: ReviewStats | null = meta.stats ?? response.data?.stats ?? null;

    return { reviews: rawReviews, pagination, stats };
  }

  // Get user's own reviews (as a customer)
  async getMyReviews(
    page: number = 1,
    limit: number = 20
  ): Promise<{
    reviews: Review[];
    pagination: Pagination;
  }> {
    try {
      const response = await apiClient.get<{
        reviews: Review[];
        pagination: Pagination;
      }>(`/reviews/my-reviews?page=${page}&limit=${limit}`);

      if (!response.success || !response.data) {
        return {
          reviews: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalItems: 0,
            hasNext: false,
            hasPrev: false,
            limit,
          }
        };
      }
      return response.data;
    } catch (error) {
      // Gracefully degrade if endpoint not available
      return {
        reviews: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          hasNext: false,
          hasPrev: false,
          limit,
        }
      };
    }
  }

  // Get reviews received by current specialist
  async getReceivedReviews(
    page: number = 1,
    limit: number = 20
  ): Promise<{
    reviews: Review[];
    pagination: Pagination & { hasNextPage?: boolean; hasPreviousPage?: boolean; page?: number; total?: number };
    stats: ReviewStats;
  }> {
    try {
      // Get current specialist profile first
      const profileResponse = await apiClient.get<any>('/specialists/profile');
      if (!profileResponse.success || !profileResponse.data) {
        throw new Error('Failed to get specialist profile');
      }
      
      const specialistId = profileResponse.data.id;
      
      // Now get reviews using the specialist ID
      return await this.getSpecialistReviews(specialistId, page, limit);
    } catch (error) {
      console.error('Error getting received reviews:', error);
      // Return empty data if there's an error
      return {
        reviews: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          limit: limit,
          hasNext: false,
          hasPrev: false,
          // compatibility aliases
          hasNextPage: false,
          hasPreviousPage: false,
          page,
          total: 0,
        },
        stats: {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          verifiedReviewsCount: 0,
          recommendationRate: 0,
        }
      };
    }
  }

  // Create a new review
  async createReview(data: CreateReviewData): Promise<Review> {
    const response = await apiClient.post<Review>('/reviews', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create review');
    }
    
    return response.data;
  }

  // Update a review
  async updateReview(reviewId: string, data: UpdateReviewData): Promise<Review> {
    const response = await apiClient.put<Review>(`/reviews/${reviewId}`, data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update review');
    }
    
    return response.data;
  }

  // Delete a review
  async deleteReview(reviewId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/reviews/${reviewId}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to delete review');
    }
    
    return response.data;
  }

  // Mark review as helpful
  async markReviewHelpful(reviewId: string, helpful: boolean): Promise<{ message: string; helpfulCount: number }> {
    const response = await apiClient.post<{ message: string; helpfulCount: number }>(
      `/reviews/${reviewId}/helpful`, 
      { helpful }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to mark review as helpful');
    }
    
    return response.data;
  }

  // React to a review (like/dislike)
  async reactToReview(reviewId: string, reaction: 'like' | 'dislike' | null): Promise<{ message: string; reaction?: string | null }> {
    const response = await apiClient.post<{ message: string; reaction?: string | null }>(
      `/reviews/${reviewId}/react`,
      { reaction }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to react to review');
    }

    return response.data;
  }

  // React to a review response (like/dislike)
  async reactToResponse(reviewId: string, reaction: 'like' | 'dislike' | null): Promise<{ message: string; reaction?: string | null }> {
    const response = await apiClient.post<{ message: string; reaction?: string | null }>(
      `/reviews/${reviewId}/response/react`,
      { reaction }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to react to response');
    }

    return response.data;
  }

  // Report a review
  async reportReview(reviewId: string, reason: string, details?: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      `/reviews/${reviewId}/report`,
      { reason, details }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to report review');
    }

    return response.data;
  }

  // Respond to a review (specialist only)
  async respondToReview(reviewId: string, message: string): Promise<{ message?: string; response: any }> {
    // Backend expects endpoint '/reviews/:id/response' with body { response: string }
    const res = await apiClient.post<any>(
      `/reviews/${reviewId}/response`,
      { response: message }
    );

    if (!res.success) {
      throw new Error(res.error?.message || 'Failed to respond to review');
    }

    // Backend returns { review: { ... , response: { ... } } }
    const reviewObj = res.data?.review || {};
    return { message: res.meta?.message, response: reviewObj.response };
  }

  // Get review statistics for a specialist
  async getSpecialistReviewStats(specialistId: string): Promise<ReviewStats> {
    const response = await apiClient.get<any>(`/reviews/specialist/${specialistId}/stats`);
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to get review statistics');
    }
    
    // Backend returns { stats: { totalReviews, averageRating, ratingDistribution } }
    const payload = response.data || {};
    const data = payload.stats || payload;
    const totalReviews: number = Number(data.totalReviews || 0);
    const averageRating: number = Number.isFinite(data.averageRating) ? data.averageRating : 0;
    const ratingDistribution = data.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    // Derive fields not provided by backend
    const recommendedCount = (ratingDistribution[4] || 0) + (ratingDistribution[5] || 0);
    const recommendationRate = totalReviews > 0 ? recommendedCount / totalReviews : 0;

    const normalized: ReviewStats = {
      totalReviews,
      averageRating,
      ratingDistribution,
      verifiedReviewsCount: Number(data.verifiedReviewsCount || 0),
      recommendationRate,
    };

    return normalized;
  }

  // Get available review tags
  async getReviewTags(): Promise<{ tags: string[] }> {
    const response = await apiClient.get<{ tags: string[] }>('/reviews/tags');
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get review tags');
    }
    
    return response.data;
  }

  // Check if user can review a booking
  async canReviewBooking(bookingId: string): Promise<{ canReview: boolean; reason?: string }> {
    const response = await apiClient.get<{ canReview: boolean; reason?: string }>(`/reviews/can-review/${bookingId}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to check review eligibility');
    }
    
    return response.data;
  }
}

export const reviewsService = new ReviewsService();
