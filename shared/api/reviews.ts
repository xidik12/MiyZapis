// ============================================================
// Reviews API Endpoints — Shared between frontend and mini-app
// ============================================================

import type { SharedApiClient } from './client';
import type { Review, CreateReviewRequest, PaginatedResponse } from '../types';

export function createReviewsApi(client: SharedApiClient) {
  return {
    async getReviews(params?: {
      page?: number;
      limit?: number;
      serviceId?: string;
      specialistId?: string;
    }) {
      if (params?.serviceId) {
        return client.get<PaginatedResponse<Review>>(`/reviews/service/${params.serviceId}`, {
          params: { page: params.page, limit: params.limit },
        });
      }
      if (params?.specialistId) {
        return client.get<PaginatedResponse<Review>>(`/reviews/specialist/${params.specialistId}`, {
          params: { page: params.page, limit: params.limit },
        });
      }
      return client.get<PaginatedResponse<Review>>('/reviews/my-reviews', { params });
    },

    async createReview(data: CreateReviewRequest) {
      return client.post<Review>('/reviews', data);
    },

    async getSpecialistReviews(params?: { page?: number; limit?: number }) {
      return client.get<PaginatedResponse<Review>>('/reviews/my-reviews', { params });
    },

    async respondToReview(reviewId: string, response: string) {
      return client.post(`/reviews/${reviewId}/response`, { response });
    },

    async reactToReview(reviewId: string, reactionType: 'LIKE' | 'DISLIKE') {
      return client.post(`/reviews/${reviewId}/react`, { reactionType });
    },

    async reportReview(reviewId: string, reason: string, details?: string) {
      return client.post(`/reviews/${reviewId}/report`, { reason, details });
    },
  };
}

export type ReviewsApi = ReturnType<typeof createReviewsApi>;
