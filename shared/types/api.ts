// ============================================================
// API Response Types — Canonical definitions for MiyZapis
// Merged from frontend/src/types/index.ts and mini-app/src/types/index.ts
// ============================================================

import type { ServiceCategory } from './service';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  meta?: {
    pagination?: Pagination;
    filters?: AvailableFilters;
  };
  pagination?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any> | Array<{
    field: string;
    message: string;
    code: string;
  }>;
  requestId?: string;
  timestamp?: string;
}

// Mini-app pagination format
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Frontend pagination format
export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
  limit: number;
}

// Mini-app paginated response format
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Search & Filter Types
export interface SearchFilters {
  query?: string;
  category?: string;
  // Frontend format
  minPrice?: number;
  maxPrice?: number;
  specialties?: string[];
  // Mini-app format
  location?: string | {
    latitude: number;
    longitude: number;
    radius: number;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  availability?: string | {
    date: string;
    time?: string;
  };
  sortBy?: 'rating' | 'price' | 'reviews' | 'distance' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  services: any[];
  specialists: any[];
  pagination: Pagination;
  filters: AvailableFilters;
}

export interface AvailableFilters {
  categories: ServiceCategory[];
  priceRanges: PriceRange[];
  specialties: string[];
  locations: string[];
}

export interface PriceRange {
  min: number;
  max: number;
  count: number;
}
