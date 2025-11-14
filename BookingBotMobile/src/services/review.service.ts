// Review service - adapted for React Native
import { apiClient } from './api';
import {
  Review,
  CreateReviewRequest,
  ReviewStats,
} from '../types';

export class ReviewService {
  // Create review
  async createReview(data: CreateReviewRequest): Promise<Review> {
    const response = await apiClient.post<Review>('/reviews', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create review');
    }
    return response.data;
  }

  // Get reviews for a specialist
  async getSpecialistReviews(specialistId: string, filters: {
    page?: number;
    limit?: number;
    rating?: number;
  } = {}): Promise<{
    reviews: Review[];
    stats: ReviewStats;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNext: boolean;
      hasPrev: boolean;
      limit: number;
    };
  }> {
    const params = new URLSearchParams({ specialistId });
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get<{
      reviews: Review[];
      stats: ReviewStats;
      total: number;
      page: number;
      totalPages: number;
    }>(`/reviews?${params}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get reviews');
    }
    
    return {
      reviews: response.data.reviews || [],
      stats: response.data.stats || {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {},
      },
      pagination: {
        currentPage: response.data.page || 1,
        totalPages: response.data.totalPages || 1,
        totalItems: response.data.total || 0,
        hasNext: (response.data.page || 1) < (response.data.totalPages || 1),
        hasPrev: (response.data.page || 1) > 1,
        limit: filters.limit || 20,
      }
    };
  }

  // Get reviews for a service
  async getServiceReviews(serviceId: string): Promise<Review[]> {
    const response = await apiClient.get<{ reviews: Review[] }>(`/reviews/service/${serviceId}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get service reviews');
    }
    return response.data.reviews || [];
  }

  // Update review
  async updateReview(reviewId: string, data: {
    rating?: number;
    comment?: string;
    tags?: string[];
  }): Promise<Review> {
    const response = await apiClient.put<Review>(`/reviews/${reviewId}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update review');
    }
    return response.data;
  }

  // Delete review
  async deleteReview(reviewId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/reviews/${reviewId}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to delete review');
    }
    return response.data;
  }

  // Specialist responds to review
  async respondToReview(reviewId: string, message: string): Promise<Review> {
    const response = await apiClient.post<Review>(`/reviews/${reviewId}/respond`, { message });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to respond to review');
    }
    return response.data;
  }
}

export const reviewService = new ReviewService();

