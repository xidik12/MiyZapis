import { type RecurrenceData } from '@/components/modals/RecurringBookingModal';
import { type UserLoyalty } from '@/services/loyalty.service';
import { type RewardRedemption } from '@/services/rewards.service';

export interface BookingStep {
  id: string;
  title: string;
  completed: boolean;
}

export interface AvailableDateInfo {
  date: string;
  dayName: string;
  workingHours: string;
  availableSlots: number;
  totalSlots: number;
}

export interface ConflictHint {
  active: boolean;
  lastTried?: string;
}

export interface BookingState {
  // Core
  specialist: Record<string, unknown>;
  service: Record<string, unknown>;
  loading: boolean;
  currentStep: number;

  // Date & Time
  selectedDate: Date | null;
  selectedTime: string;
  availableSlots: string[];
  availableDates: AvailableDateInfo[];
  slotsLoading: boolean;
  conflictHint: ConflictHint;

  // Details
  bookingNotes: string;
  participantCount: number;
  bookingResult: Record<string, unknown>;

  // Recurring
  isRecurring: boolean;
  recurrenceData: RecurrenceData | null;
  showRecurringModal: boolean;

  // Payment
  useWalletFirst: boolean;
  paymentMethod: 'crypto' | 'paypal';
  paymentLoading: boolean;
  paymentResult: Record<string, unknown>;
  showQRCode: boolean;
  paymentOptions: Record<string, unknown>;
  paymentTimeoutId: NodeJS.Timeout | null;
  paymentTimeRemaining: number;
  pollingIntervalId: NodeJS.Timeout | null;

  // Waitlist
  showWaitlistModal: boolean;
  waitlistNotes: string;
  waitlistPreferredTime: string;
  waitlistLoading: boolean;
  waitlistJoined: boolean;

  // Loyalty & Rewards
  loyaltyData: UserLoyalty | null;
  pointsToEarn: number;
  redemptions: RewardRedemption[];
  selectedRedemptionId: string;
}

export type BookingAction =
  | { type: 'SET_SPECIALIST'; payload: unknown }
  | { type: 'SET_SERVICE'; payload: unknown }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'SET_SELECTED_DATE'; payload: Date | null }
  | { type: 'SET_SELECTED_TIME'; payload: string }
  | { type: 'SET_AVAILABLE_SLOTS'; payload: string[] }
  | { type: 'SET_AVAILABLE_DATES'; payload: AvailableDateInfo[] }
  | { type: 'SET_SLOTS_LOADING'; payload: boolean }
  | { type: 'SET_CONFLICT_HINT'; payload: ConflictHint }
  | { type: 'SET_BOOKING_NOTES'; payload: string }
  | { type: 'SET_PARTICIPANT_COUNT'; payload: number }
  | { type: 'SET_BOOKING_RESULT'; payload: unknown }
  | { type: 'SET_IS_RECURRING'; payload: boolean }
  | { type: 'SET_RECURRENCE_DATA'; payload: RecurrenceData | null }
  | { type: 'SET_SHOW_RECURRING_MODAL'; payload: boolean }
  | { type: 'SET_USE_WALLET_FIRST'; payload: boolean }
  | { type: 'SET_PAYMENT_METHOD'; payload: 'crypto' | 'paypal' }
  | { type: 'SET_PAYMENT_LOADING'; payload: boolean }
  | { type: 'SET_PAYMENT_RESULT'; payload: unknown }
  | { type: 'SET_SHOW_QR_CODE'; payload: boolean }
  | { type: 'SET_PAYMENT_OPTIONS'; payload: unknown }
  | { type: 'SET_PAYMENT_TIMEOUT_ID'; payload: NodeJS.Timeout | null }
  | { type: 'SET_PAYMENT_TIME_REMAINING'; payload: number }
  | { type: 'SET_POLLING_INTERVAL_ID'; payload: NodeJS.Timeout | null }
  | { type: 'SET_SHOW_WAITLIST_MODAL'; payload: boolean }
  | { type: 'SET_WAITLIST_NOTES'; payload: string }
  | { type: 'SET_WAITLIST_PREFERRED_TIME'; payload: string }
  | { type: 'SET_WAITLIST_LOADING'; payload: boolean }
  | { type: 'SET_WAITLIST_JOINED'; payload: boolean }
  | { type: 'SET_LOYALTY_DATA'; payload: UserLoyalty | null }
  | { type: 'SET_POINTS_TO_EARN'; payload: number }
  | { type: 'SET_REDEMPTIONS'; payload: RewardRedemption[] }
  | { type: 'SET_SELECTED_REDEMPTION_ID'; payload: string }
  | { type: 'RESET_PAYMENT_STATE' }
  | { type: 'UPDATE'; payload: Partial<BookingState> };
