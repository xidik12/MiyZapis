import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { bookingService, BookingFilters } from '@/services/booking.service';
import { Booking, BookingStatus, CreateBookingRequest } from '@/types';

interface BookingState {
  bookings: Booking[];
  currentBooking: Booking | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: BookingState = {
  bookings: [],
  currentBooking: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchBookings = createAsyncThunk(
  'booking/fetchBookings',
  async (filters: BookingFilters = {}, { rejectWithValue }) => {
    try {
      return await bookingService.getBookings(filters);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch bookings');
    }
  }
);

export const fetchBooking = createAsyncThunk(
  'booking/fetchBooking',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      return await bookingService.getBooking(bookingId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch booking');
    }
  }
);

export const createBooking = createAsyncThunk(
  'booking/createBooking',
  async (data: CreateBookingRequest, { rejectWithValue }) => {
    try {
      return await bookingService.createBooking(data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create booking');
    }
  }
);

export const cancelBooking = createAsyncThunk(
  'booking/cancelBooking',
  async ({ bookingId, reason }: { bookingId: string; reason?: string }, { rejectWithValue }) => {
    try {
      return await bookingService.cancelBooking(bookingId, reason);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to cancel booking');
    }
  }
);

export const updateBookingStatus = createAsyncThunk(
  'booking/updateBookingStatus',
  async ({ bookingId, status, notes }: { bookingId: string; status: string; notes?: string }, { rejectWithValue }) => {
    try {
      const updateData: { status: string; specialistNotes?: string } = { status };
      if (notes) {
        updateData.specialistNotes = notes;
      }
      return await bookingService.updateBooking(bookingId, updateData);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update booking status');
    }
  }
);

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentBooking: (state, action: PayloadAction<Booking | null>) => {
      state.currentBooking = action.payload;
    },
    updateBookingLocal: (state, action: PayloadAction<{
      bookingId: string;
      status: BookingStatus;
      booking?: Booking;
    }>) => {
      const { bookingId, status, booking } = action.payload;
      const existingBooking = state.bookings.find(b => b.id === bookingId);
      
      if (existingBooking) {
        existingBooking.status = status;
        if (booking) {
          Object.assign(existingBooking, booking);
        }
      } else if (booking) {
        state.bookings.push(booking);
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Bookings
    builder
      .addCase(fetchBookings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bookings = action.payload.bookings;
        state.error = null;
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Single Booking
    builder
      .addCase(fetchBooking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBooking = action.payload;
        state.error = null;
      })
      .addCase(fetchBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create Booking
    builder
      .addCase(createBooking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bookings.push(action.payload.booking);
        state.currentBooking = action.payload.booking;
        state.error = null;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Cancel Booking
    builder
      .addCase(cancelBooking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.bookings.findIndex(b => b.id === action.payload.booking.id);
        if (index !== -1) {
          state.bookings[index] = action.payload.booking;
        }
        if (state.currentBooking?.id === action.payload.booking.id) {
          state.currentBooking = action.payload.booking;
        }
        state.error = null;
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update Booking Status
      .addCase(updateBookingStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateBookingStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedBooking = action.payload;
        const existingBooking = state.bookings.find(b => b.id === updatedBooking.id);
        if (existingBooking) {
          Object.assign(existingBooking, updatedBooking);
        }
        if (state.currentBooking?.id === updatedBooking.id) {
          state.currentBooking = updatedBooking;
        }
      })
      .addCase(updateBookingStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setCurrentBooking, updateBookingLocal } = bookingSlice.actions;
export default bookingSlice.reducer;