// Payment slice - adapted for React Native
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { paymentService } from '../../services/payment.service';
import { Payment, PaymentIntent, PaymentStatus } from '../../types';

interface PaymentState {
  payments: Payment[];
  currentPaymentIntent: PaymentIntent | null;
  paymentMethods: Array<{
    id: string;
    type: 'card' | 'bank_account';
    last4: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
    isDefault: boolean;
  }>;
  isLoading: boolean;
  error: string | null;
}

const initialState: PaymentState = {
  payments: [],
  currentPaymentIntent: null,
  paymentMethods: [],
  isLoading: false,
  error: null,
};

export const createPaymentIntent = createAsyncThunk(
  'payment/createIntent',
  async (
    data: {
      bookingId: string;
      amount: number;
      currency?: string;
      paymentMethod?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      return await paymentService.createPaymentIntent(data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create payment intent');
    }
  }
);

export const confirmPayment = createAsyncThunk(
  'payment/confirm',
  async (paymentId: string, { rejectWithValue }) => {
    try {
      return await paymentService.confirmPayment(paymentId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to confirm payment');
    }
  }
);

export const fetchPaymentMethods = createAsyncThunk(
  'payment/fetchMethods',
  async (_, { rejectWithValue }) => {
    try {
      return await paymentService.getPaymentMethods();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch payment methods');
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentPaymentIntent: (state, action: PayloadAction<PaymentIntent | null>) => {
      state.currentPaymentIntent = action.payload;
    },
    updatePaymentStatus: (
      state,
      action: PayloadAction<{ paymentId: string; status: PaymentStatus }>
    ) => {
      const payment = state.payments.find(p => p.id === action.payload.paymentId);
      if (payment) {
        payment.status = action.payload.status;
      }
    },
    addPayment: (state, action: PayloadAction<Payment>) => {
      state.payments.unshift(action.payload);
    },
    clearPayments: (state) => {
      state.payments = [];
      state.currentPaymentIntent = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPaymentIntent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPaymentIntent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPaymentIntent = action.payload;
      })
      .addCase(createPaymentIntent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(confirmPayment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(confirmPayment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.payments.unshift(action.payload);
        state.currentPaymentIntent = null;
      })
      .addCase(confirmPayment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchPaymentMethods.fulfilled, (state, action) => {
        state.paymentMethods = action.payload;
      });
  },
});

export const {
  clearError,
  setCurrentPaymentIntent,
  updatePaymentStatus,
  addPayment,
  clearPayments,
} = paymentSlice.actions;

export default paymentSlice.reducer;

// Selectors
export const selectPayments = (state: { payment: PaymentState }) => state.payment.payments;
export const selectCurrentPaymentIntent = (state: { payment: PaymentState }) => state.payment.currentPaymentIntent;
export const selectPaymentMethods = (state: { payment: PaymentState }) => state.payment.paymentMethods;
export const selectPaymentLoading = (state: { payment: PaymentState }) => state.payment.isLoading;
export const selectPaymentError = (state: { payment: PaymentState }) => state.payment.error;

