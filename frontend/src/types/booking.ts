export interface FilterState {
  status: string;
  dateRange: string;
  serviceType: string;
  searchTerm: string;
}

export interface SortState {
  sortBy: 'date' | 'amount' | 'status';
  sortOrder: 'asc' | 'desc';
}

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}

export interface BookingModalState {
  selectedBooking: Booking | null;
  showDetailModal: boolean;
}

export interface ReviewModalState {
  showReviewModal: boolean;
  bookingToReview: Booking | null;
  reviewLoading: boolean;
}

export interface BookingOperations {
  handleRescheduleBooking: (bookingId: string) => void;
  handleCancelBooking: (bookingId: string) => Promise<void>;
  handleBookAgain: (booking: Booking) => Promise<void>;
  handleLeaveReview: (bookingId: string) => void;
}

export interface BookingFilterOperations {
  updateFilters: (filters: Partial<FilterState>) => void;
  setSortBy: (sortBy: 'date' | 'amount' | 'status') => void;
  toggleSortOrder: () => void;
  setCurrentPage: (page: number) => void;
}

export interface BookingTranslationHelpers {
  getTranslatedServiceName: (serviceName: string) => string;
  getTranslatedDuration: (duration: string | number) => string;
}

export interface ReviewSubmissionData {
  rating: number;
  comment: string;
  tags: string[];
}

// Re-export the main Booking type from the main types file
export type { Booking, BookingStatus } from '../types';