import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { paymentService } from '@/services/payment.service';
import { Payment, PaymentIntent, PaymentStatus } from '@/types';

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

// Async thunks
export const createPaymentIntent = createAsyncThunk(
  'payment/createIntent',
  async (
    data: {
      amount: number;
      currency: string;
      bookingId: string;
      paymentType: 'deposit' | 'full_payment';
      loyaltyPointsUsed?: number;
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

export const confirmPaymentIntent = createAsyncThunk(
  'payment/confirmIntent',
  async (
    { paymentIntentId, paymentMethodId }: { paymentIntentId: string; paymentMethodId: string },
    { rejectWithValue }
  ) => {
    try {
      return await paymentService.confirmPaymentIntent(paymentIntentId, paymentMethodId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to confirm payment');
    }
  }
);

export const fetchPaymentHistory = createAsyncThunk(
  'payment/fetchHistory',
  async (
    filters: {
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
    } = {},
    { rejectWithValue }
  ) => {
    try {
      return await paymentService.getPaymentHistory(filters);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch payment history');
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

export const addPaymentMethod = createAsyncThunk(
  'payment/addMethod',
  async (paymentMethodId: string, { rejectWithValue }) => {
    try {
      return await paymentService.addPaymentMethod(paymentMethodId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add payment method');
    }
  }
);

export const removePaymentMethod = createAsyncThunk(
  'payment/removeMethod',
  async (paymentMethodId: string, { rejectWithValue }) => {
    try {
      await paymentService.removePaymentMethod(paymentMethodId);
      return paymentMethodId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to remove payment method');
    }
  }
);

export const processRefund = createAsyncThunk(
  'payment/processRefund',
  async (
    data: {
      bookingId: string;
      refundType: 'full' | 'partial' | 'deposit_only';
      amount?: number;
      reason: string;
    },
    { rejectWithValue }
  ) => {
    try {
      return await paymentService.processRefund(data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to process refund');
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
    // Create Payment Intent
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
      });

    // Confirm Payment Intent
    builder
      .addCase(confirmPaymentIntent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(confirmPaymentIntent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.payments.unshift(action.payload.payment);
        state.currentPaymentIntent = null;
      })
      .addCase(confirmPaymentIntent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Payment History
    builder
      .addCase(fetchPaymentHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPaymentHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.payments = action.payload.payments;
      })
      .addCase(fetchPaymentHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Payment Methods
    builder
      .addCase(fetchPaymentMethods.fulfilled, (state, action) => {
        state.paymentMethods = action.payload;
      });

    // Add Payment Method
    builder
      .addCase(addPaymentMethod.fulfilled, (state, action) => {
        state.paymentMethods.push(action.payload.paymentMethod);
      });

    // Remove Payment Method
    builder
      .addCase(removePaymentMethod.fulfilled, (state, action) => {
        state.paymentMethods = state.paymentMethods.filter(
          pm => pm.id !== action.payload
        );
      });

    // Process Refund
    builder
      .addCase(processRefund.fulfilled, (state, action) => {
        state.payments.unshift(action.payload.refund);
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