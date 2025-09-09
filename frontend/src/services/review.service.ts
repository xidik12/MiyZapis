import { apiClient } from './api';
import { API_ENDPOINTS } from '../config/environment';
import { Review, ApiResponse, Pagination } from '../types';

export interface CreateReviewRequest {
  bookingId: string;
  rating: number;
  comment?: string;
  tags?: string[];
  isPublic?: boolean;
}

export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
  tags?: string[];
  isPublic?: boolean;
}

export interface ReviewFilters {
  serviceId?: string;
  specialistId?: string;
  customerId?: string;
  rating?: number;
  isPublic?: boolean;
  isVerified?: boolean;
  withComment?: boolean;
  tags?: string[];
  sortBy?: 'createdAt' | 'rating' | 'helpful';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ReviewResponse {
  id: string;
  message: string;
  createdAt: string;
}

export class ReviewService {
  // Create a new review
  async createReview(data: CreateReviewRequest): Promise<Review> {
    try {
      const response = await apiClient.post<Review>(API_ENDPOINTS.REVIEWS.CREATE, data);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to create review');
      }
      return response.data;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to create review';
      throw new Error(errorMessage);
    }
  }

  // Get reviews with filters
  async getReviews(filters: ReviewFilters = {}): Promise<{ reviews: Review[]; pagination: Pagination }> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response = await apiClient.get<{ reviews: Review[]; pagination: Pagination }>(`${API_ENDPOINTS.REVIEWS.LIST}?${params}`);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get reviews');
      }
      return response.data;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to get reviews';
      throw new Error(errorMessage);
    }
  }

  // Get service reviews
  async getServiceReviews(serviceId: string, filters: Omit<ReviewFilters, 'serviceId'> = {}): Promise<{ reviews: Review[]; pagination: Pagination }> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response = await apiClient.get<any>(`/reviews/service/${serviceId}?${params}`);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to get service reviews');
      }
      const reviews: Review[] = Array.isArray(response.data) ? response.data : (response.data?.reviews || []);
      const pagination: Pagination = response.meta?.pagination || response.data?.pagination || { currentPage: 1, totalPages: 1, totalItems: reviews.length, itemsPerPage: reviews.length, hasNext: false, hasPrev: false };
      return { reviews, pagination };
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to get service reviews';
      throw new Error(errorMessage);
    }
  }

  // Get specialist reviews
  async getSpecialistReviews(specialistId: string, filters: Omit<ReviewFilters, 'specialistId'> = {}): Promise<{ reviews: Review[]; pagination: Pagination }> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response = await apiClient.get<any>(`/reviews/specialist/${specialistId}?${params}`);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to get specialist reviews');
      }
      const reviews: Review[] = Array.isArray(response.data) ? response.data : (response.data?.reviews || []);
      const pagination: Pagination = response.meta?.pagination || response.data?.pagination || { currentPage: 1, totalPages: 1, totalItems: reviews.length, itemsPerPage: reviews.length, hasNext: false, hasPrev: false };
      return { reviews, pagination };
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to get specialist reviews';
      throw new Error(errorMessage);
    }
  }

  // Update a review
  async updateReview(reviewId: string, data: UpdateReviewRequest): Promise<Review> {
    try {
      const response = await apiClient.put<Review>(`${API_ENDPOINTS.REVIEWS.UPDATE}/${reviewId}`, data);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to update review');
      }
      return response.data;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to update review';
      throw new Error(errorMessage);
    }
  }

  // Delete a review
  async deleteReview(reviewId: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<{ message: string }>(`${API_ENDPOINTS.REVIEWS.DELETE}/${reviewId}`);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to delete review');
      }
      return response.data;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to delete review';
      throw new Error(errorMessage);
    }
  }

  // Respond to a review (specialist only)
  async respondToReview(reviewId: string, response: string): Promise<ReviewResponse> {
    try {
      const apiResponse = await apiClient.post<ReviewResponse>(`${API_ENDPOINTS.REVIEWS.RESPOND}/${reviewId}`, { response });
      if (!apiResponse.success || !apiResponse.data) {
        throw new Error(apiResponse.error?.message || 'Failed to respond to review');
      }
      return apiResponse.data;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to respond to review';
      throw new Error(errorMessage);
    }
  }

  // Mark review as helpful
  async markHelpful(reviewId: string): Promise<{ message: string; helpfulCount: number }> {
    try {
      const response = await apiClient.post<{ message: string; helpfulCount: number }>(`/reviews/${reviewId}/helpful`);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to mark review as helpful');
      }
      return response.data;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to mark review as helpful';
      throw new Error(errorMessage);
    }
  }

  // Report a review
  async reportReview(reviewId: string, reason: string, description?: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(`/reviews/${reviewId}/report`, { reason, description });
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to report review');
      }
      return response.data;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to report review';
      throw new Error(errorMessage);
    }
  }
}

export const reviewService = new ReviewService();
