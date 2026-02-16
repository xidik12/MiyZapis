import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../services/api.service';

export interface Booking {
  id: string;
  serviceId: string;
  specialistId: string;
  customerId: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalAmount: number;
  notes?: string;
  cancellationReason?: string;
  service: {
    id: string;
    name: string;
    price: number;
    duration: number;
  };
  specialist: {
    id: string;
    name: string;
    avatar?: string;
    phone: string;
    email: string;
  };
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email: string;
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

// Async thunks
export const fetchBookingsAsync = createAsyncThunk(
  'bookings/fetchBookings',
  async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    return await apiService.getBookings(params);
  }
);

export const fetchBookingAsync = createAsyncThunk(
  'bookings/fetchBooking',
  async (id: string) => {
    return await apiService.getBooking(id);
  }
);

export const createBookingAsync = createAsyncThunk(
  'bookings/createBooking',
  async (bookingData: {
    serviceId: string;
    specialistId: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }) => {
    return await apiService.createBooking(bookingData);
  }
);

export const updateBookingAsync = createAsyncThunk(
  'bookings/updateBooking',
  async ({ id, updates }: { id: string; updates: any }) => {
    return await apiService.updateBooking(id, updates);
  }
);

export const cancelBookingAsync = createAsyncThunk(
  'bookings/cancelBooking',
  async ({ id, reason }: { id: string; reason?: string }) => {
    return await apiService.cancelBooking(id, reason);
  }
);

// Normalize backend booking to mini-app Booking interface
const normalizeBooking = (b: any): Booking => {
  const specialist = b.specialist || {};
  const customer = b.customer || {};
  const service = b.service || {};
  return {
    ...b,
    startTime: b.startTime || b.scheduledAt || b.createdAt,
    endTime: b.endTime || b.scheduledAt || b.createdAt,
    totalAmount: b.totalAmount ?? b.amount ?? 0,
    service: {
      id: service.id || b.serviceId || '',
      name: service.name || b.serviceName || 'Service',
      price: service.basePrice ?? service.price ?? 0,
      duration: service.duration ?? 0,
    },
    specialist: {
      id: specialist.id || b.specialistId || '',
      name: specialist.name || (specialist.firstName ? `${specialist.firstName} ${specialist.lastName || ''}`.trim() : ''),
      avatar: specialist.avatar,
      phone: specialist.phoneNumber || specialist.phone || '',
      email: specialist.email || '',
    },
    customer: {
      id: customer.id || b.customerId || '',
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      phone: customer.phoneNumber || customer.phone,
      email: customer.email || '',
    },
  };
};

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
      state.bookings = raw.map(normalizeBooking);
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