/**
 * Test setup file for integration tests.
 *
 * Mocks heavy infrastructure dependencies (Prisma, Redis, email, logger,
 * Telegram bot, config) so that Express route handlers can be exercised
 * via supertest without connecting to real databases or external services.
 */

import jwt from 'jsonwebtoken';

// ----------------------------------------------------------------
// 1. Environment variables required by @/config validation (Zod)
// ----------------------------------------------------------------
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // let OS pick a port
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-jwt-secret-that-is-at-least-32-characters-long';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-that-is-at-least-32-characters-long';
process.env.JWT_REFRESH_EXPIRES_IN = '30d';
process.env.SESSION_SECRET = 'test-session-secret-that-is-at-least-32-characters-long';
process.env.REDIS_DISABLED = 'true';

// ----------------------------------------------------------------
// 2. Mock logger (suppress console noise during tests)
// ----------------------------------------------------------------
const noopLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
};

jest.mock('@/utils/logger', () => ({
  logger: noopLogger,
  requestLogger: (_req: any, _res: any, next: any) => next(),
}));

// ----------------------------------------------------------------
// 3. Mock Redis
// ----------------------------------------------------------------
const mockRedis = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  incr: jest.fn().mockResolvedValue(1),
  expire: jest.fn().mockResolvedValue(1),
  ttl: jest.fn().mockResolvedValue(900),
  keys: jest.fn().mockResolvedValue([]),
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  quit: jest.fn().mockResolvedValue(undefined),
  status: 'ready',
  on: jest.fn(),
};

const mockCacheUtils = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
};

jest.mock('@/config/redis', () => ({
  redis: mockRedis,
  cacheUtils: mockCacheUtils,
  testRedisConnection: jest.fn().mockResolvedValue(true),
  closeRedisConnection: jest.fn().mockResolvedValue(undefined),
}));

// ----------------------------------------------------------------
// 4. Mock Prisma client
// ----------------------------------------------------------------
export const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  specialist: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  service: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
  booking: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  payment: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  paymentMethod: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  refreshToken: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  emailVerificationToken: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  loyaltyTransaction: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  walletTransaction: {
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  cryptoPayment: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  review: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  notification: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $queryRaw: jest.fn(),
  $transaction: jest.fn().mockImplementation(async (fn: any) => {
    if (typeof fn === 'function') {
      return fn(mockPrisma);
    }
    // Array of promises
    return Promise.all(fn);
  }),
};

jest.mock('@/config/database', () => ({
  prisma: mockPrisma,
  testDatabaseConnection: jest.fn().mockResolvedValue(true),
  closeDatabaseConnection: jest.fn().mockResolvedValue(undefined),
}));

// ----------------------------------------------------------------
// 5. Mock email service
// ----------------------------------------------------------------
jest.mock('@/services/email/enhanced-email', () => ({
  emailService: {
    sendEmailVerification: jest.fn().mockResolvedValue(true),
    sendPasswordReset: jest.fn().mockResolvedValue(true),
    sendBookingConfirmation: jest.fn().mockResolvedValue(true),
    sendSpecialistBookingNotification: jest.fn().mockResolvedValue(true),
    sendBookingReminder: jest.fn().mockResolvedValue(true),
    sendBookingCancellation: jest.fn().mockResolvedValue(true),
  },
}));

// ----------------------------------------------------------------
// 6. Mock Telegram bot
// ----------------------------------------------------------------
jest.mock('@/bot', () => ({
  bot: {
    telegram: {
      sendMessage: jest.fn(),
      getMe: jest.fn().mockResolvedValue({ id: 1, is_bot: true, first_name: 'Test' }),
    },
    launch: jest.fn(),
    stop: jest.fn(),
  },
}));

jest.mock('@/services/telegram/enhanced-bot', () => ({
  enhancedTelegramBot: {
    launch: jest.fn(),
    stop: jest.fn(),
  },
}));

// ----------------------------------------------------------------
// 7. Mock workers
// ----------------------------------------------------------------
jest.mock('@/workers/bookingReminderWorker', () => ({
  startBookingReminderWorker: jest.fn(),
}));

jest.mock('@/workers/subscription.worker', () => ({
  subscriptionWorker: {
    start: jest.fn(),
    stop: jest.fn(),
  },
}));

// ----------------------------------------------------------------
// 8. Mock notification service
// ----------------------------------------------------------------
jest.mock('@/services/notification', () => {
  const MockNotificationService = jest.fn().mockImplementation(() => ({
    sendNotification: jest.fn().mockResolvedValue(undefined),
    createNotification: jest.fn().mockResolvedValue(undefined),
    notifyUser: jest.fn().mockResolvedValue(undefined),
    notifyBookingCreated: jest.fn().mockResolvedValue(undefined),
    notifyBookingConfirmed: jest.fn().mockResolvedValue(undefined),
    notifyBookingCancelled: jest.fn().mockResolvedValue(undefined),
    notifyBookingCompleted: jest.fn().mockResolvedValue(undefined),
    sendBookingReminder: jest.fn().mockResolvedValue(undefined),
  }));
  return { NotificationService: MockNotificationService };
});

// ----------------------------------------------------------------
// 9. Mock referral service
// ----------------------------------------------------------------
jest.mock('@/services/referral', () => ({
  ReferralService: {
    getReferralByCode: jest.fn(),
    processReferralCompletion: jest.fn(),
  },
}));

jest.mock('@/services/referral/processing.service', () => ({
  ReferralProcessingService: {
    processReferralCompletion: jest.fn(),
  },
}));

// ----------------------------------------------------------------
// 10. Mock loyalty service
// ----------------------------------------------------------------
jest.mock('@/services/loyalty', () => ({
  __esModule: true,
  default: {
    addPoints: jest.fn().mockResolvedValue(undefined),
    deductPoints: jest.fn().mockResolvedValue(undefined),
    getPointsBalance: jest.fn().mockResolvedValue(0),
  },
}));

// ----------------------------------------------------------------
// 11. Mock subscription service
// ----------------------------------------------------------------
jest.mock('@/services/payment/subscription.service', () => ({
  specialistSubscriptionService: {
    checkBookingLimit: jest.fn().mockResolvedValue({ allowed: true }),
    recordBooking: jest.fn().mockResolvedValue(undefined),
  },
}));

// ----------------------------------------------------------------
// 12. Mock WebSocket manager
// ----------------------------------------------------------------
jest.mock('@/services/websocket/websocket-manager', () => ({
  WebSocketManager: {
    getInstance: jest.fn().mockReturnValue({
      emitToUser: jest.fn(),
      emitToRoom: jest.fn(),
      broadcast: jest.fn(),
    }),
    emitToUser: jest.fn(),
    emitToRoom: jest.fn(),
    broadcast: jest.fn(),
    emitPaymentComplete: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/services/websocket/enhanced-websocket', () => ({
  EnhancedWebSocket: jest.fn(),
}));

// ----------------------------------------------------------------
// 13. Mock payment sub-services
// ----------------------------------------------------------------
jest.mock('@/services/payment/coinbase.service', () => ({
  coinbaseCommerceService: {
    createCharge: jest.fn().mockResolvedValue({}),
    getCharge: jest.fn().mockResolvedValue({}),
    verifyWebhook: jest.fn().mockReturnValue(true),
  },
  CoinbaseCommerceService: jest.fn(),
}));

jest.mock('@/services/payment/coinbase-onramp.service', () => ({
  coinbaseOnrampService: {
    createSession: jest.fn().mockResolvedValue({}),
    getSession: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('@/services/payment/paypal.service', () => ({
  paypalService: {
    createOrder: jest.fn().mockResolvedValue({}),
    captureOrder: jest.fn().mockResolvedValue({}),
    getOrderDetails: jest.fn().mockResolvedValue({}),
    refundPayment: jest.fn().mockResolvedValue({}),
  },
  PayPalService: jest.fn(),
}));

jest.mock('@/services/payment/wayforpay.service', () => ({
  wayforpayService: {
    createInvoice: jest.fn().mockResolvedValue({}),
    getPaymentStatus: jest.fn().mockResolvedValue({}),
    verifyWebhook: jest.fn().mockReturnValue(true),
  },
  WayForPayService: jest.fn(),
}));

jest.mock('@/services/payment/booking-payment.service', () => ({
  bookingPaymentService: {
    createDepositPayment: jest.fn().mockResolvedValue({}),
    getBookingPaymentStatus: jest.fn().mockResolvedValue({}),
    getPaymentStatus: jest.fn().mockResolvedValue({}),
    cancelBooking: jest.fn().mockResolvedValue({}),
    syncCryptoPaymentStatus: jest.fn().mockResolvedValue(undefined),
    getDepositConfiguration: jest.fn().mockResolvedValue({ amountUSD: 500 }),
  },
}));

jest.mock('@/services/payment/wallet.service', () => ({
  walletService: {
    getBalance: jest.fn().mockResolvedValue({ balance: 0, currency: 'USD' }),
    getTransactions: jest.fn().mockResolvedValue({ transactions: [], total: 0 }),
    credit: jest.fn().mockResolvedValue(undefined),
    debit: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/services/payment/aba.service', () => ({
  abaService: {
    createPayment: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('@/services/payment/khqr.service', () => ({
  khqrService: {
    generateQR: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('@/services/payment/ukrainian-payments', () => ({
  ukrainianPaymentService: {
    createPayment: jest.fn().mockResolvedValue({}),
  },
}));

// ----------------------------------------------------------------
// 14. Mock S3 service
// ----------------------------------------------------------------
jest.mock('@/services/s3.service', () => ({
  s3Service: {
    uploadFile: jest.fn().mockResolvedValue({ url: 'https://s3.example.com/test.jpg' }),
    deleteFile: jest.fn().mockResolvedValue(undefined),
    getSignedUrl: jest.fn().mockResolvedValue('https://s3.example.com/signed/test.jpg'),
  },
}));

// ----------------------------------------------------------------
// 15. Mock file upload service
// ----------------------------------------------------------------
jest.mock('@/services/fileUpload', () => ({
  FileUploadService: {
    uploadFile: jest.fn().mockResolvedValue({ url: '/uploads/test.jpg' }),
    deleteFile: jest.fn().mockResolvedValue(undefined),
  },
}));

// ----------------------------------------------------------------
// 16. Mock analytics service (class constructor)
// ----------------------------------------------------------------
jest.mock('@/services/analytics', () => {
  const MockAnalyticsService = jest.fn().mockImplementation(() => ({
    getDashboard: jest.fn().mockResolvedValue({}),
    trackEvent: jest.fn().mockResolvedValue(undefined),
    getAnalytics: jest.fn().mockResolvedValue({}),
    getBookingAnalytics: jest.fn().mockResolvedValue({}),
    getRevenueAnalytics: jest.fn().mockResolvedValue({}),
    getUserAnalytics: jest.fn().mockResolvedValue({}),
  }));
  return { AnalyticsService: MockAnalyticsService };
});

// ----------------------------------------------------------------
// 16b. Mock help service (class constructor)
// ----------------------------------------------------------------
jest.mock('@/services/help', () => {
  const MockHelpService = jest.fn().mockImplementation(() => ({
    getArticles: jest.fn().mockResolvedValue([]),
    getArticle: jest.fn().mockResolvedValue(null),
    getFAQs: jest.fn().mockResolvedValue([]),
    submitTicket: jest.fn().mockResolvedValue({}),
  }));
  return { HelpService: MockHelpService };
});

// ----------------------------------------------------------------
// 16c. Mock messaging service (class constructor)
// ----------------------------------------------------------------
jest.mock('@/services/messaging', () => {
  const MockMessagingService = jest.fn().mockImplementation(() => ({
    getConversations: jest.fn().mockResolvedValue([]),
    getMessages: jest.fn().mockResolvedValue([]),
    sendMessage: jest.fn().mockResolvedValue({}),
    markAsRead: jest.fn().mockResolvedValue(undefined),
  }));
  return { MessagingService: MockMessagingService };
});

// ----------------------------------------------------------------
// 16d. Mock favorites service (class constructor)
// ----------------------------------------------------------------
jest.mock('@/services/favorites', () => {
  const MockFavoritesService = jest.fn().mockImplementation(() => ({
    getFavoriteSpecialists: jest.fn().mockResolvedValue([]),
    getFavoriteServices: jest.fn().mockResolvedValue([]),
    addFavorite: jest.fn().mockResolvedValue({}),
    removeFavorite: jest.fn().mockResolvedValue(undefined),
    isFavorite: jest.fn().mockResolvedValue(false),
  }));
  return { FavoritesService: MockFavoritesService };
});

// ----------------------------------------------------------------
// 16e. Mock fileUpload service (class constructor)
// ----------------------------------------------------------------
jest.mock('@/services/fileUpload', () => {
  const MockFileUploadService = jest.fn().mockImplementation(() => ({
    uploadFile: jest.fn().mockResolvedValue({ url: '/uploads/test.jpg', id: 'file-id' }),
    deleteFile: jest.fn().mockResolvedValue(undefined),
    getFile: jest.fn().mockResolvedValue(null),
    getUserFiles: jest.fn().mockResolvedValue([]),
  }));
  return { FileUploadService: MockFileUploadService };
});

// ----------------------------------------------------------------
// 16f. Mock advertisement service
// ----------------------------------------------------------------
jest.mock('@/services/advertisement', () => {
  const MockAdvertisementService = jest.fn().mockImplementation(() => ({
    getAds: jest.fn().mockResolvedValue([]),
    createAd: jest.fn().mockResolvedValue({}),
  }));
  return { AdvertisementService: MockAdvertisementService };
});

// ----------------------------------------------------------------
// 16g. Mock premium-listing service
// ----------------------------------------------------------------
jest.mock('@/services/premium-listing', () => {
  const MockPremiumListingService = jest.fn().mockImplementation(() => ({
    getListings: jest.fn().mockResolvedValue([]),
    createListing: jest.fn().mockResolvedValue({}),
  }));
  return { PremiumListingService: MockPremiumListingService };
});

// ----------------------------------------------------------------
// 16h. Mock rewards service
// ----------------------------------------------------------------
jest.mock('@/services/rewards', () => ({
  __esModule: true,
  default: {
    getRewards: jest.fn().mockResolvedValue([]),
    redeemReward: jest.fn().mockResolvedValue({}),
  },
  RewardsService: jest.fn().mockImplementation(() => ({
    getRewards: jest.fn().mockResolvedValue([]),
    redeemReward: jest.fn().mockResolvedValue({}),
  })),
}));

// ----------------------------------------------------------------
// 16i. Mock review service
// ----------------------------------------------------------------
jest.mock('@/services/review', () => {
  const MockReviewService = jest.fn().mockImplementation(() => ({
    getReviews: jest.fn().mockResolvedValue([]),
    createReview: jest.fn().mockResolvedValue({}),
  }));
  return { ReviewService: MockReviewService };
});

// ----------------------------------------------------------------
// 16j. Mock employee service
// ----------------------------------------------------------------
jest.mock('@/services/employee.service', () => ({
  employeeService: {
    getEmployees: jest.fn().mockResolvedValue([]),
    createEmployee: jest.fn().mockResolvedValue({}),
  },
  EmployeeService: jest.fn().mockImplementation(() => ({
    getEmployees: jest.fn().mockResolvedValue([]),
    createEmployee: jest.fn().mockResolvedValue({}),
  })),
}));

// ----------------------------------------------------------------
// 16k. Mock payment.controller (dynamically imported by core.controller)
// ----------------------------------------------------------------
jest.mock('@/controllers/payment.controller', () => {
  const mockPaymentControllerInstance = {
    getPaymentStatus: jest.fn().mockImplementation(async (req: any, res: any) => {
      const { paymentId } = req.params;
      const userId = req.user?.id;

      // Default: return a simple status response
      res.status(200).json({
        success: true,
        data: {
          paymentId,
          status: 'PENDING',
          amount: 100,
          currency: 'USD',
        },
      });
    }),
    createPaymentIntent: jest.fn(),
    createBookingDeposit: jest.fn(),
    getBookingPaymentStatus: jest.fn(),
    cancelBooking: jest.fn(),
    getWalletBalance: jest.fn(),
    getWalletTransactions: jest.fn(),
  };
  return {
    paymentController: mockPaymentControllerInstance,
    PaymentController: jest.fn().mockImplementation(() => mockPaymentControllerInstance),
    __mockPaymentController: mockPaymentControllerInstance,
  };
});

// ----------------------------------------------------------------
// 17. Mock Telegram bot-service
// ----------------------------------------------------------------
jest.mock('@/services/telegram/bot-service', () => ({
  TelegramBotService: jest.fn(),
}));

// ----------------------------------------------------------------
// 18. Mock security middleware (simplify for tests)
// ----------------------------------------------------------------
jest.mock('@/middleware/security', () => ({
  securityHeaders: (_req: any, _res: any, next: any) => next(),
  corsOptions: { origin: '*' },
  requestId: (req: any, _res: any, next: any) => {
    req.id = req.headers['x-request-id'] || 'test-request-id';
    next();
  },
  sanitizeInput: (_req: any, _res: any, next: any) => next(),
  trustProxy: (_req: any, _res: any, next: any) => next(),
  validateContentLength: () => (_req: any, _res: any, next: any) => next(),
  generateCSRFToken: (_req: any, _res: any, next: any) => next(),
  getCSRFToken: (_req: any, res: any) => res.json({ token: 'test-csrf' }),
}));

// ----------------------------------------------------------------
// 19. Mock error handlers
// ----------------------------------------------------------------
jest.mock('@/middleware/error', () => ({
  errorHandler: (err: any, _req: any, res: any, _next: any) => {
    res.status(err.status || 500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: err.message },
    });
  },
  notFoundHandler: (_req: any, res: any) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  },
}));

// ----------------------------------------------------------------
// Helper utilities for tests
// ----------------------------------------------------------------

const TEST_JWT_SECRET = 'test-jwt-secret-that-is-at-least-32-characters-long';
const TEST_JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-that-is-at-least-32-characters-long';

/**
 * Create a valid JWT access token for a given user.
 */
export function generateTestToken(user: {
  id: string;
  email: string;
  userType: string;
}): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      userType: user.userType,
    },
    TEST_JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Create a valid JWT refresh token for a given user.
 */
export function generateTestRefreshToken(user: {
  id: string;
}, tokenId: string = 'test-token-id'): string {
  return jwt.sign(
    {
      userId: user.id,
      tokenId,
    },
    TEST_JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );
}

/**
 * Create an expired JWT access token.
 */
export function generateExpiredToken(user: {
  id: string;
  email: string;
  userType: string;
}): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      userType: user.userType,
    },
    TEST_JWT_SECRET,
    { expiresIn: '0s' }
  );
}

/**
 * Factory for creating test user objects matching the Prisma User model.
 */
export function createTestUser(overrides: Partial<{
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: string;
  isActive: boolean;
  isEmailVerified: boolean;
  loyaltyPoints: number;
  avatar: string | null;
  phoneNumber: string | null;
  telegramId: string | null;
  language: string;
  currency: string;
  timezone: string;
  walletBalance: number;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  return {
    id: 'test-user-id-123456789',
    email: 'test@example.com',
    password: '$2a$12$hashedpassword', // bcrypt hash placeholder
    firstName: 'Test',
    lastName: 'User',
    userType: 'CUSTOMER',
    isActive: true,
    isEmailVerified: true,
    loyaltyPoints: 0,
    avatar: null,
    phoneNumber: null,
    telegramId: null,
    language: 'en',
    currency: 'USD',
    timezone: 'UTC',
    walletBalance: 0,
    emailNotifications: true,
    pushNotifications: true,
    telegramNotifications: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

/**
 * Factory for creating test booking objects.
 */
export function createTestBooking(overrides: Partial<Record<string, any>> = {}) {
  return {
    id: 'test-booking-id-12345',
    customerId: 'test-user-id-123456789',
    specialistId: 'test-specialist-id-123',
    serviceId: 'test-service-id-1234567',
    status: 'PENDING',
    scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    duration: 60,
    totalAmount: 100.0,
    depositAmount: 20.0,
    remainingAmount: 80.0,
    basePrice: 100.0,
    currency: 'USD',
    customerNotes: null,
    specialistNotes: null,
    completionNotes: null,
    confirmedAt: null,
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
    cancellationReason: null,
    cancelledBy: null,
    loyaltyPointsUsed: 0,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

/**
 * Factory for creating test payment objects.
 */
export function createTestPayment(overrides: Partial<Record<string, any>> = {}) {
  return {
    id: 'test-payment-id-1234567',
    userId: 'test-user-id-123456789',
    bookingId: 'test-booking-id-12345',
    amount: 100.0,
    currency: 'USD',
    status: 'PENDING',
    paymentMethod: 'card',
    paymentIntentId: 'pi_mock_123',
    clientSecret: 'pi_mock_123_secret_mock',
    metadata: {},
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

/**
 * Reset all mock implementations to defaults between tests.
 */
export function resetAllMocks() {
  jest.clearAllMocks();
}

// Re-export mocks for easy access
export { mockRedis, mockCacheUtils };
