import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { randomUUID } from 'crypto';

// Test database URL
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'file:./test.db';

// Create test Prisma client
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: TEST_DATABASE_URL,
    },
  },
});

// Global test setup
export async function setupTestDatabase() {
  try {
    // Push the schema to test database
    execSync('npx prisma db push --force-reset', {
      env: {
        ...process.env,
        DATABASE_URL: TEST_DATABASE_URL,
      },
      stdio: 'inherit',
    });

    console.log('✅ Test database setup complete');
  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    throw error;
  }
}

// Global test teardown
export async function teardownTestDatabase() {
  try {
    await testPrisma.$disconnect();
    console.log('✅ Test database disconnected');
  } catch (error) {
    console.error('❌ Test database teardown failed:', error);
  }
}

// Clear all test data
export async function clearTestData() {
  const tablenames = await testPrisma.$queryRaw<
    Array<{ name: string }>
  >`SELECT name FROM sqlite_master WHERE type='table';`;

  const tables = tablenames
    .map(({ name }) => name)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"${name}"`)
    .join(', ');

  try {
    await testPrisma.$executeRawUnsafe(`DELETE FROM ${tables}`);
  } catch (error) {
    console.log({ error });
  }
}

// Test data factories
export const testFactories = {
  user: {
    customer: () => ({
      id: randomUUID(),
      email: `customer-${randomUUID()}@test.com`,
      firstName: 'John',
      lastName: 'Customer',
      password: '$2b$10$test.hash.password',
      userType: 'CUSTOMER' as const,
      isActive: true,
      isEmailVerified: true,
      loyaltyPoints: 100,
      language: 'en',
      currency: 'USD',
      timezone: 'UTC',
    }),

    specialist: () => ({
      id: randomUUID(),
      email: `specialist-${randomUUID()}@test.com`,
      firstName: 'Jane',
      lastName: 'Specialist',
      password: '$2b$10$test.hash.password',
      userType: 'SPECIALIST' as const,
      isActive: true,
      isEmailVerified: true,
      loyaltyPoints: 0,
      language: 'en',
      currency: 'USD',
      timezone: 'UTC',
    }),

    admin: () => ({
      id: randomUUID(),
      email: `admin-${randomUUID()}@test.com`,
      firstName: 'Admin',
      lastName: 'User',
      password: '$2b$10$test.hash.password',
      userType: 'ADMIN' as const,
      isActive: true,
      isEmailVerified: true,
      loyaltyPoints: 0,
      language: 'en',
      currency: 'USD',
      timezone: 'UTC',
    }),
  },

  specialist: (userId: string) => ({
    id: randomUUID(),
    userId,
    businessName: 'Test Business',
    bio: 'Test specialist bio',
    specialties: JSON.stringify(['haircut', 'massage']),
    city: 'Kyiv',
    country: 'Ukraine',
    rating: 4.5,
    reviewCount: 10,
    responseTime: 2.5,
    isVerified: true,
  }),

  service: (specialistId: string) => ({
    id: randomUUID(),
    specialistId,
    name: 'Test Service',
    description: 'Test service description',
    category: 'haircut',
    basePrice: 100.0,
    currency: 'USD',
    duration: 60,
    isActive: true,
    requiresApproval: false,
    maxAdvanceBooking: 30,
    minAdvanceBooking: 1,
  }),

  booking: (customerId: string, specialistId: string, serviceId: string) => ({
    id: randomUUID(),
    customerId,
    specialistId,
    serviceId,
    status: 'PENDING' as const,
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    duration: 60,
    basePrice: 100.0,
    totalAmount: 100.0,
    depositAmount: 20.0,
    currency: 'USD',
  }),

  payment: (userId: string, bookingId: string) => ({
    id: randomUUID(),
    userId,
    bookingId,
    status: 'SUCCEEDED' as const,
    type: 'FULL_PAYMENT' as const,
    amount: 100.0,
    currency: 'USD',
    stripePaymentIntentId: `pi_test_${randomUUID()}`,
  }),

  conversation: (customerId: string, specialistId: string, bookingId?: string) => ({
    id: randomUUID(),
    customerId,
    specialistId,
    bookingId,
    status: 'ACTIVE' as const,
    customerUnreadCount: 0,
    specialistUnreadCount: 0,
  }),

  message: (conversationId: string, senderId: string, receiverId: string) => ({
    id: randomUUID(),
    conversationId,
    senderId,
    receiverId,
    content: 'Test message content',
    messageType: 'TEXT' as const,
    isRead: false,
  }),

  review: (bookingId: string, customerId: string, specialistId: string) => ({
    id: randomUUID(),
    bookingId,
    customerId,
    specialistId,
    rating: 5,
    comment: 'Great service!',
    tags: JSON.stringify(['professional', 'punctual']),
  }),

  notification: (userId: string) => ({
    id: randomUUID(),
    userId,
    type: 'BOOKING_CONFIRMED',
    title: 'Test Notification',
    message: 'This is a test notification',
    isRead: false,
    data: JSON.stringify({ bookingId: randomUUID() }),
  }),
};

// Create test data helper
export class TestDataBuilder {
  private data: Record<string, unknown> = {};

  async createCustomer() {
    const userData = testFactories.user.customer();
    const user = await testPrisma.user.create({ data: userData });
    this.data.customer = user;
    return this;
  }

  async createSpecialist() {
    const userData = testFactories.user.specialist();
    const user = await testPrisma.user.create({ data: userData });
    
    const specialistData = testFactories.specialist(user.id);
    const specialist = await testPrisma.specialist.create({ data: specialistData // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test factory data is intentionally partial
      as any });
    
    this.data.specialist = { ...user, specialistProfile: specialist };
    return this;
  }

  async createAdmin() {
    const userData = testFactories.user.admin();
    const user = await testPrisma.user.create({ data: userData });
    this.data.admin = user;
    return this;
  }

  async createService() {
    if (!this.data.specialist) {
      await this.createSpecialist();
    }

    const serviceData = testFactories.service(this.data.specialist.specialistProfile.id);
    const service = await testPrisma.service.create({ data: serviceData // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test factory data is intentionally partial
      as any });
    this.data.service = service;
    return this;
  }

  async createBooking() {
    if (!this.data.customer) {
      await this.createCustomer();
    }
    if (!this.data.specialist) {
      await this.createSpecialist();
    }
    if (!this.data.service) {
      await this.createService();
    }

    const bookingData = testFactories.booking(
      this.data.customer.id,
      this.data.specialist.id,
      this.data.service.id
    );
    
    const booking = await testPrisma.booking.create({ data: bookingData // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test factory data is intentionally partial
      as any });
    this.data.booking = booking;
    return this;
  }

  async createPayment() {
    if (!this.data.customer) {
      await this.createCustomer();
    }
    if (!this.data.booking) {
      await this.createBooking();
    }

    const paymentData = testFactories.payment(this.data.customer.id, this.data.booking.id);
    const payment = await testPrisma.payment.create({ data: paymentData });
    this.data.payment = payment;
    return this;
  }

  async createConversation() {
    if (!this.data.customer) {
      await this.createCustomer();
    }
    if (!this.data.specialist) {
      await this.createSpecialist();
    }

    const conversationData = testFactories.conversation(
      this.data.customer.id,
      this.data.specialist.id,
      this.data.booking?.id
    );
    
    const conversation = await testPrisma.conversation.create({ data: conversationData });
    this.data.conversation = conversation;
    return this;
  }

  async createMessage() {
    if (!this.data.conversation) {
      await this.createConversation();
    }

    const messageData = testFactories.message(
      this.data.conversation.id,
      this.data.customer.id,
      this.data.specialist.id
    );
    
    const message = await testPrisma.message.create({ data: messageData });
    this.data.message = message;
    return this;
  }

  async createReview() {
    if (!this.data.booking) {
      await this.createBooking();
    }

    const reviewData = testFactories.review(
      this.data.booking.id,
      this.data.customer.id,
      this.data.specialist.id
    );
    
    const review = await testPrisma.review.create({ data: reviewData });
    this.data.review = review;
    return this;
  }

  build() {
    return this.data;
  }

  // Helper methods to get specific data
  getCustomer() {
    return this.data.customer;
  }

  getSpecialist() {
    return this.data.specialist;
  }

  getAdmin() {
    return this.data.admin;
  }

  getService() {
    return this.data.service;
  }

  getBooking() {
    return this.data.booking;
  }

  getPayment() {
    return this.data.payment;
  }

  getConversation() {
    return this.data.conversation;
  }

  getMessage() {
    return this.data.message;
  }

  getReview() {
    return this.data.review;
  }
}

// JWT token helpers for tests
export function createTestJWT(user: Record<string, unknown>) {
  const jwt = require('jsonwebtoken');
  const payload = {
    userId: user.id,
    email: user.email,
    userType: user.userType,
    platform: 'web',
  };
  
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET || 'test-secret', {
    expiresIn: '1h',
  });
}

// API test helpers
export function createAuthHeaders(user: Record<string, unknown>) {
  const token = createTestJWT(user);
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// Mock external services
export const mockServices = {
  email: {
    sendEmail: jest.fn().mockResolvedValue(true),
    sendTemplateEmail: jest.fn().mockResolvedValue(true),
  },
  
  telegram: {
    sendNotification: jest.fn().mockResolvedValue(true),
  },
  
  payment: {
    createPaymentIntent: jest.fn().mockResolvedValue({
      paymentId: 'test_payment_id',
      clientSecret: 'test_client_secret',
    }),
    confirmPayment: jest.fn().mockResolvedValue({
      status: 'succeeded',
    }),
  },
  
  upload: {
    processUpload: jest.fn().mockResolvedValue({
      id: 'test_file_id',
      url: 'https://test.com/file.jpg',
    }),
  },
};

// Test environment setup
export function setupTestEnvironment() {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  process.env.JWT_ACCESS_SECRET = 'test-access-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  
  // Mock external services
  jest.mock('@/services/email', () => ({
    emailService: mockServices.email,
  }));
  
  jest.mock('@/bot', () => ({
    bot: mockServices.telegram,
  }));
  
  jest.mock('@/services/payment', () => ({
    PaymentService: mockServices.payment,
  }));
  
  jest.mock('@/services/fileUpload', () => ({
    FileUploadService: mockServices.upload,
  }));
}

// Test database seeding
export async function seedTestDatabase() {
  const builder = new TestDataBuilder();
  
  // Create admin user
  await builder.createAdmin();
  
  // Create sample customers
  for (let i = 0; i < 5; i++) {
    await new TestDataBuilder().createCustomer();
  }
  
  // Create sample specialists with services
  for (let i = 0; i < 3; i++) {
    const specialistBuilder = new TestDataBuilder();
    await specialistBuilder.createSpecialist();
    await specialistBuilder.createService();
  }
  
  console.log('✅ Test database seeded');
}

// Performance test helpers
export class PerformanceTimer {
  private startTime: bigint = 0n;
  private measurements: Record<string, number[]> = {};

  start() {
    this.startTime = process.hrtime.bigint();
  }

  end(label: string) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - this.startTime) / 1000000; // Convert to milliseconds
    
    if (!this.measurements[label]) {
      this.measurements[label] = [];
    }
    
    this.measurements[label].push(duration);
    return duration;
  }

  getStats(label: string) {
    const times = this.measurements[label] || [];
    if (times.length === 0) return null;

    const sum = times.reduce((a, b) => a + b, 0);
    const avg = sum / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    return { avg, min, max, count: times.length };
  }

  getAllStats() {
    const stats: Record<string, any> = {};
    for (const label in this.measurements) {
      stats[label] = this.getStats(label);
    }
    return stats;
  }

  reset() {
    this.measurements = {};
  }
}

// Load testing utilities
export class LoadTester {
  private results: Array<{
    timestamp: number;
    duration: number;
    success: boolean;
    error?: string;
  }> = [];

  async runConcurrent(
    testFn: () => Promise<any>,
    concurrency: number,
    iterations: number
  ) {
    const promises: Promise<void>[] = [];
    
    for (let i = 0; i < concurrency; i++) {
      promises.push(this.runIterations(testFn, iterations));
    }
    
    await Promise.all(promises);
    return this.getResults();
  }

  private async runIterations(testFn: () => Promise<any>, iterations: number) {
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      
      try {
        await testFn();
        
        this.results.push({
          timestamp: startTime,
          duration: Date.now() - startTime,
          success: true,
        });
      } catch (error) {
        this.results.push({
          timestamp: startTime,
          duration: Date.now() - startTime,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  getResults() {
    const successfulResults = this.results.filter(r => r.success);
    const failedResults = this.results.filter(r => !r.success);
    
    const durations = successfulResults.map(r => r.duration);
    const avgDuration = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;
    
    const minDuration = durations.length > 0 ? Math.min(...durations) : 0;
    const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;
    
    // Calculate percentiles
    const sortedDurations = [...durations].sort((a, b) => a - b);
    const p95 = sortedDurations[Math.floor(sortedDurations.length * 0.95)] || 0;
    const p99 = sortedDurations[Math.floor(sortedDurations.length * 0.99)] || 0;
    
    return {
      total: this.results.length,
      successful: successfulResults.length,
      failed: failedResults.length,
      successRate: (successfulResults.length / this.results.length) * 100,
      avgDuration,
      minDuration,
      maxDuration,
      p95Duration: p95,
      p99Duration: p99,
      errors: failedResults.map(r => r.error),
    };
  }

  reset() {
    this.results = [];
  }
}