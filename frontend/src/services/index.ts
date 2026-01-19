// API Core
export { apiClient, setAuthTokens, getAuthToken, clearAuthTokens, checkApiHealth, retryRequest } from './api';

// Import services for local usage
import { authService as _authService } from './auth.service';
import { bookingService as _bookingService } from './booking.service';
import { serviceService as _serviceService } from './service.service';
import { specialistService as _specialistService } from './specialist.service';
import { paymentService as _paymentService } from './payment.service';
import { notificationService as _notificationService } from './notification.service';
import { userService as _userService } from './user.service';
import { reviewService as _reviewService } from './review.service';
import { fileUploadService as _fileUploadService } from './fileUpload.service';
import { messagingService as _messagingService } from './messaging.service';
import { analyticsService as _analyticsService } from './analytics.service';
import { referralService as _referralService } from './referral.service';
import { locationService as _locationService } from './location.service';
import { expenseService as _expenseService } from './expense.service';

// Re-export Service Classes
export { authService } from './auth.service';
export { bookingService } from './booking.service';
export { serviceService } from './service.service';
export { specialistService } from './specialist.service';
export { paymentService } from './payment.service';
export { notificationService } from './notification.service';
export { userService } from './user.service';
export { reviewService } from './review.service';
export { fileUploadService } from './fileUpload.service';
export { messagingService } from './messaging.service';
export { analyticsService } from './analytics.service';
export { referralService } from './referral.service';
export { locationService } from './location.service';
export { expenseService } from './expense.service';
export type { Expense, ExpenseSummary, ExpenseCategory, RecurringFrequency, CreateExpenseData, UpdateExpenseData } from './expense.service';
export { EXPENSE_CATEGORIES, RECURRING_FREQUENCIES, CATEGORY_CONFIG, RECURRING_CONFIG } from './expense.service';

// Socket Service
// export {
//   socketService,
//   connectSocket,
//   disconnectSocket,
//   isSocketConnected,
//   onBookingUpdate,
//   onNewNotification,
//   onPaymentUpdate,
//   onAvailabilityUpdate
// } from './socket.service';

// Create a services object for easy access - using lazy loading to avoid circular imports
export const services = {
  get auth() { return _authService; },
  get booking() { return _bookingService; },
  get service() { return _serviceService; },
  get specialist() { return _specialistService; },
  get payment() { return _paymentService; },
  get notification() { return _notificationService; },
  get user() { return _userService; },
  get review() { return _reviewService; },
  get fileUpload() { return _fileUploadService; },
  get messaging() { return _messagingService; },
  get analytics() { return _analyticsService; },
  get referral() { return _referralService; },
  get location() { return _locationService; },
  get expense() { return _expenseService; },
  // get socket() { return socketService; },
} as const;

export default services;