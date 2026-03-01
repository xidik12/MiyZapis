// ============================================================
// Review Types — Canonical definitions for MiyZapis
// Merged from frontend/src/types/index.ts and mini-app/src/types/index.ts
// ============================================================

import { BaseEntity, User } from './user';
import type { Booking } from './booking';
import type { Service } from './service';
import type { Specialist } from './specialist';

export interface Review extends BaseEntity {
  bookingId: string;
  booking?: Booking;
  customerId: string;
  customer?: User;
  specialistId: string;
  specialist?: Specialist;
  serviceId?: string;
  service?: Service;
  rating: number; // 1-5
  comment?: string;
  tags?: string[];
  images?: string[];
  isVerified: boolean;
  response?: SpecialistResponse;
}

export interface SpecialistResponse {
  id?: string;
  reviewId?: string;
  // Frontend uses 'message', mini-app uses 'response'
  message?: string;
  response?: string;
  createdAt: string;
}

export interface CreateReviewRequest {
  bookingId: string;
  rating: number;
  comment?: string;
  tags?: string[];
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    [key: number]: number;
  };
}
