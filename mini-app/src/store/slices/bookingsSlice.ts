import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../services/api.service';

// Matches backend response from getUserBookings() exactly
export interface Booking {
  id: string;
  serviceId: string;
  specialistId: string;
  customerId: string;
  scheduledAt: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalAmount: number;
  notes?: string;
  cancellationReason?: string;
  // Flattened fields from backend transform
  customerName?: string;
  serviceName?: string;
  date?: string;
  time?: string;
  amount?: number;
  service?: {
    id: string;
    name: string;
    basePrice: number;
    duration: number;
  };
  specialist?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    phoneNumber?: string;
    email?: string;
  };
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    email?: string;
  };
  payment?: {
    id: string;
    status: string;
    amount: number;
    paymentMethod: string;
  };
  review?: {
    id: string;
    rating: number;
    comment?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface BookingsState {
  bookings: Booking[];
  selectedBooking: Booking | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    status?: string;
    startDate?: string;
    endDate?: string;
  };
}

const initialState: BookingsState = {
  bookings: [],
  selectedBooking: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {},
};

// Backend returns Prisma Decimal fields as strings — convert to numbers
const normalizeBookingAmounts = (booking: Record<string, unknown>) => ({
  ...booking,
  status: typeof booking.status === 'string' ? booking.status.toLowerCase() : booking.status,
  totalAmount: Number(booking.totalAmount) || 0,
  amount: Number(booking.amount) || Number(booking.totalAmount) || 0,
  depositAmount: Number(booking.depositAmount) || 0,
  remainingAmount: Number(booking.remainingAmount) || 0,
  service: booking.service ? {
    ...booking.service,
    basePrice: Number(booking.service.basePrice) || Number(booking.service.price) || 0,
    price: Number(booking.service.price) || Number(booking.service.basePrice) || 0,
  } : booking.service,
});

// Async thunks
export const fetchBookingsAsync = createAsyncThunk(
  'bookings/fetchBookings',
  async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    userType?: 'customer' | 'specialist';
  }) => {
    const response: Record<string, unknown> = await apiService.getBookings(params);
    // API returns { bookings: [...], total, page, totalPages }
    if (response?.bookings) {
      return {
        bookings: response.bookings.map(normalizeBookingAmounts),
        total: response.total,
        page: response.page,
        totalPages: response.totalPages,
      };
    }
    if (Array.isArray(response)) {
      return { bookings: response.map(normalizeBookingAmounts), total: response.length, page: 1, totalPages: 1 };
    }
    return response;
  }
);

export const fetchBookingAsync = createAsyncThunk(
  'bookings/fetchBooking',
  async (id: string) => {
    const raw: Record<string, unknown> = await apiService.getBooking(id);
    return normalizeBookingAmounts(raw);
  }
);

export const createBookingAsync = createAsyncThunk(
  'bookings/createBooking',
  async (bookingData: {
    serviceId: string;
    specialistId: string;
    scheduledAt: string;
    notes?: string;
  }) => {
    return await apiService.createBooking(bookingData);
  }
);

export const updateBookingAsync = createAsyncThunk(
  'bookings/updateBooking',
  async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
    return await apiService.updateBooking(id, updates);
  }
);

export const cancelBookingAsync = createAsyncThunk(
  'bookings/cancelBooking',
  async ({ id, reason }: { id: string; reason?: string }) => {
    return await apiService.cancelBooking(id, reason);
  }
);

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setSelectedBooking: (state, action) => {
      state.selectedBooking = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateBookingStatus: (state, action) => {
      const { bookingId, status } = action.payload;
      const booking = state.bookings.find(b => b.id === bookingId);
      if (booking) {
        booking.status = status;
      }
      if (state.selectedBooking?.id === bookingId) {
        state.selectedBooking.status = status;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Bookings
    builder.addCase(fetchBookingsAsync.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchBookingsAsync.fulfilled, (state, action) => {
      state.isLoading = false;
      const p = action.payload as any;
      const raw = p.items || p.bookings || (Array.isArray(p) ? p : []);
      state.bookings = raw;
      if (p.pagination) {
        state.pagination = p.pagination;
      } else if (p.totalPages !== undefined) {
        state.pagination = { page: p.page || 1, limit: p.limit || 10, total: p.total || 0, totalPages: p.totalPages || 0 };
      }
    });
    builder.addCase(fetchBookingsAsync.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to fetch bookings';
    });

    // Fetch Booking
    builder.addCase(fetchBookingAsync.fulfilled, (state, action) => {
      state.selectedBooking = action.payload;
    });

    // Create Booking
    builder.addCase(createBookingAsync.pending, (state) => {
      state.isCreating = true;
      state.error = null;
    });
    builder.addCase(createBookingAsync.fulfilled, (state, action) => {
      state.isCreating = false;
      state.bookings.unshift(action.payload);
    });
    builder.addCase(createBookingAsync.rejected, (state, action) => {
      state.isCreating = false;
      state.error = action.error.message || 'Failed to create booking';
    });

    // Update Booking
    builder.addCase(updateBookingAsync.pending, (state) => {
      state.isUpdating = true;
    });
    builder.addCase(updateBookingAsync.fulfilled, (state, action) => {
      state.isUpdating = false;
      const index = state.bookings.findIndex(b => b.id === action.payload.id);
      if (index !== -1) {
        state.bookings[index] = action.payload;
      }
      if (state.selectedBooking?.id === action.payload.id) {
        state.selectedBooking = action.payload;
      }
    });
    builder.addCase(updateBookingAsync.rejected, (state, action) => {
      state.isUpdating = false;
      state.error = action.error.message || 'Failed to update booking';
    });

    // Cancel Booking
    builder.addCase(cancelBookingAsync.fulfilled, (state, action) => {
      const index = state.bookings.findIndex(b => b.id === action.payload.id);
      if (index !== -1) {
        state.bookings[index] = action.payload;
      }
      if (state.selectedBooking?.id === action.payload.id) {
        state.selectedBooking = action.payload;
      }
    });
  },
});

export const {
  setFilters,
  clearFilters,
  setSelectedBooking,
  clearError,
  updateBookingStatus,
} = bookingsSlice.actions;
export default bookingsSlice.reducer;