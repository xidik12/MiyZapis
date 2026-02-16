import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../services/api.service';

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  specialistId: string;
  serviceId: string;
  rating: number;
  comment?: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  service: {
    id: string;
    name: string;
  };
  specialist: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ReviewsState {
  reviews: Review[];
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const initialState: ReviewsState = {
  reviews: [],
  isLoading: false,
  isCreating: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

// Async thunks
export const fetchReviewsAsync = createAsyncThunk(
  'reviews/fetchReviews',
  async (params?: {
    page?: number;
    limit?: number;
    serviceId?: string;
    specialistId?: string;
  }) => {
    return await apiService.getReviews(params);
  }
);

export const createReviewAsync = createAsyncThunk(
  'reviews/createReview',
  async (reviewData: {
    bookingId: string;
    rating: number;
    comment?: string;
  }) => {
    return await apiService.createReview(reviewData);
  }
);

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Reviews
    builder.addCase(fetchReviewsAsync.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchReviewsAsync.fulfilled, (state, action) => {
      state.isLoading = false;
      const data = action.payload as any;
      state.reviews = data.reviews || data.items || (Array.isArray(data) ? data : []);
      state.pagination = data.pagination || {
        page: 1,
        limit: 10,
        total: state.reviews.length,
        totalPages: 1,
      };
    });
    builder.addCase(fetchReviewsAsync.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to fetch reviews';
    });

    // Create Review
    builder.addCase(createReviewAsync.pending, (state) => {
      state.isCreating = true;
      state.error = null;
    });
    builder.addCase(createReviewAsync.fulfilled, (state, action) => {
      state.isCreating = false;
      state.reviews.unshift(action.payload);
    });
    builder.addCase(createReviewAsync.rejected, (state, action) => {
      state.isCreating = false;
      state.error = action.error.message || 'Failed to create review';
    });
  },
});

export const { clearError } = reviewsSlice.actions;
export default reviewsSlice.reducer;