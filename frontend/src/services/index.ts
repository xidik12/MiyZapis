// API Core
export { apiClient, setAuthTokens, getAuthToken, clearAuthTokens, checkApiHealth, retryRequest } from './api';

// Service Classes
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
export { expenseService } from './expense.service';

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
  get auth() { return authService; },
  get booking() { return bookingService; },
  get service() { return serviceService; },
  get specialist() { return specialistService; },
  get payment() { return paymentService; },
  get notification() { return notificationService; },
  get user() { return userService; },
  get review() { return reviewService; },
  get fileUpload() { return fileUploadService; },
  get messaging() { return messagingService; },
  get analytics() { return analyticsService; },
  get referral() { return referralService; },
  get expense() { return expenseService; },
  // get socket() { return socketService; },
} as const;

export default services;