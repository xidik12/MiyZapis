import { useReducer, useCallback } from 'react';
import type { BookingState, BookingAction } from '../types';

const initialState: BookingState = {
  // Core
  specialist: null,
  service: null,
  loading: true,
  currentStep: 0,

  // Date & Time
  selectedDate: null,
  selectedTime: '',
  availableSlots: [],
  availableDates: [],
  slotsLoading: false,
  conflictHint: { active: false },

  // Details
  bookingNotes: '',
  participantCount: 1,
  bookingResult: null,

  // Recurring
  isRecurring: false,
  recurrenceData: null,
  showRecurringModal: false,

  // Payment
  useWalletFirst: true,
  paymentMethod: 'crypto',
  paymentLoading: false,
  paymentResult: null,
  showQRCode: false,
  paymentOptions: null,
  paymentTimeoutId: null,
  paymentTimeRemaining: 0,
  pollingIntervalId: null,

  // Waitlist
  showWaitlistModal: false,
  waitlistNotes: '',
  waitlistPreferredTime: '',
  waitlistLoading: false,
  waitlistJoined: false,

  // Loyalty & Rewards
  loyaltyData: null,
  pointsToEarn: 0,
  redemptions: [],
  selectedRedemptionId: '',
};

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SET_SPECIALIST':
      return { ...state, specialist: action.payload };
    case 'SET_SERVICE':
      return { ...state, service: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_SELECTED_DATE':
      return { ...state, selectedDate: action.payload };
    case 'SET_SELECTED_TIME':
      return { ...state, selectedTime: action.payload };
    case 'SET_AVAILABLE_SLOTS':
      return { ...state, availableSlots: action.payload };
    case 'SET_AVAILABLE_DATES':
      return { ...state, availableDates: action.payload };
    case 'SET_SLOTS_LOADING':
      return { ...state, slotsLoading: action.payload };
    case 'SET_CONFLICT_HINT':
      return { ...state, conflictHint: action.payload };
    case 'SET_BOOKING_NOTES':
      return { ...state, bookingNotes: action.payload };
    case 'SET_PARTICIPANT_COUNT':
      return { ...state, participantCount: action.payload };
    case 'SET_BOOKING_RESULT':
      return { ...state, bookingResult: action.payload };
    case 'SET_IS_RECURRING':
      return { ...state, isRecurring: action.payload };
    case 'SET_RECURRENCE_DATA':
      return { ...state, recurrenceData: action.payload };
    case 'SET_SHOW_RECURRING_MODAL':
      return { ...state, showRecurringModal: action.payload };
    case 'SET_USE_WALLET_FIRST':
      return { ...state, useWalletFirst: action.payload };
    case 'SET_PAYMENT_METHOD':
      return { ...state, paymentMethod: action.payload };
    case 'SET_PAYMENT_LOADING':
      return { ...state, paymentLoading: action.payload };
    case 'SET_PAYMENT_RESULT':
      return { ...state, paymentResult: action.payload };
    case 'SET_SHOW_QR_CODE':
      return { ...state, showQRCode: action.payload };
    case 'SET_PAYMENT_OPTIONS':
      return { ...state, paymentOptions: action.payload };
    case 'SET_PAYMENT_TIMEOUT_ID':
      return { ...state, paymentTimeoutId: action.payload };
    case 'SET_PAYMENT_TIME_REMAINING':
      return { ...state, paymentTimeRemaining: action.payload };
    case 'SET_POLLING_INTERVAL_ID':
      return { ...state, pollingIntervalId: action.payload };
    case 'SET_SHOW_WAITLIST_MODAL':
      return { ...state, showWaitlistModal: action.payload };
    case 'SET_WAITLIST_NOTES':
      return { ...state, waitlistNotes: action.payload };
    case 'SET_WAITLIST_PREFERRED_TIME':
      return { ...state, waitlistPreferredTime: action.payload };
    case 'SET_WAITLIST_LOADING':
      return { ...state, waitlistLoading: action.payload };
    case 'SET_WAITLIST_JOINED':
      return { ...state, waitlistJoined: action.payload };
    case 'SET_LOYALTY_DATA':
      return { ...state, loyaltyData: action.payload };
    case 'SET_POINTS_TO_EARN':
      return { ...state, pointsToEarn: action.payload };
    case 'SET_REDEMPTIONS':
      return { ...state, redemptions: action.payload };
    case 'SET_SELECTED_REDEMPTION_ID':
      return { ...state, selectedRedemptionId: action.payload };
    case 'RESET_PAYMENT_STATE':
      return {
        ...state,
        paymentResult: null,
        showQRCode: false,
        paymentTimeRemaining: 0,
      };
    case 'UPDATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

export const useBookingState = () => {
  const [state, dispatch] = useReducer(bookingReducer, initialState);

  const updateBooking = useCallback((updates: Partial<BookingState>) => {
    dispatch({ type: 'UPDATE', payload: updates });
  }, []);

  const resetPaymentState = useCallback(() => {
    dispatch({ type: 'RESET_PAYMENT_STATE' });
  }, []);

  return {
    bookingState: state,
    dispatch,
    updateBooking,
    resetPaymentState,
  };
};
