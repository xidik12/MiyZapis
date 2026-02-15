/**
 * Integration tests for the Payment flow.
 *
 * Covers:
 *  - POST /api/v1/payments/intent          (create payment intent)
 *  - GET  /api/v1/payments/history         (get payment history)
 *  - GET  /api/v1/payments/:paymentId/status (get payment status)
 *  - GET  /api/v1/payments/my              (get user payments)
 *  - GET  /api/v1/payments/:paymentId      (get payment details)
 *  - POST /api/v1/payments/confirm         (confirm payment)
 *  - GET  /api/v1/payments/wallet/balance  (wallet balance)
 */

import request from 'supertest';
import {
  mockPrisma,
  generateTestToken,
  createTestUser,
  createTestPayment,
  createTestBooking,
  resetAllMocks,
} from './setup';
import { app } from './test-app';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PAYMENTS_URL = '/api/v1/payments';

const customer = createTestUser({
  id: 'paycust00000000000000001',
  email: 'paycustomer@example.com',
  userType: 'CUSTOMER',
});

const specialistUser = createTestUser({
  id: 'payspec00000000000000001',
  email: 'payspecialist@example.com',
  userType: 'SPECIALIST',
});

const customerToken = generateTestToken(customer);
const specialistToken = generateTestToken(specialistUser);

const testBookingId = 'paybooking000000000001';
const testPaymentId = 'payment0000000000000001';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Payment API', () => {
  beforeEach(() => {
    resetAllMocks();
    // Auth middleware: resolve test users
    mockPrisma.user.findUnique.mockImplementation(({ where }: any) => {
      if (where.id === customer.id) return Promise.resolve(customer);
      if (where.id === specialistUser.id) return Promise.resolve(specialistUser);
      return Promise.resolve(null);
    });
  });

  // ======================================================================
  // CREATE PAYMENT INTENT
  // ======================================================================
  describe('POST /api/v1/payments/intent', () => {
    const validPaymentIntentBody = {
      bookingId: testBookingId,
      amount: 100.0,
      currency: 'USD',
      paymentMethodType: 'card',
    };

    it('should create a payment intent successfully', async () => {
      const paymentIntent = {
        id: testPaymentId,
        bookingId: testBookingId,
        amount: 100.0,
        currency: 'USD',
        status: 'PENDING',
        paymentIntentId: 'pi_mock_123',
        clientSecret: 'pi_mock_123_secret',
      };

      jest.spyOn(
        require('@/services/payment').PaymentService,
        'createPaymentIntent'
      ).mockResolvedValue(paymentIntent);

      const res = await request(app)
        .post(`${PAYMENTS_URL}/intent`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validPaymentIntentBody)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('paymentIntent');
      expect(res.body.data.paymentIntent.bookingId).toBe(testBookingId);
      expect(res.body.data.paymentIntent.amount).toBe(100.0);
      expect(res.body.data.paymentIntent.status).toBe('PENDING');
    });

    it('should reject without authentication', async () => {
      const res = await request(app)
        .post(`${PAYMENTS_URL}/intent`)
        .send(validPaymentIntentBody)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    });

    it('should return 404 when booking not found', async () => {
      jest.spyOn(
        require('@/services/payment').PaymentService,
        'createPaymentIntent'
      ).mockRejectedValue(new Error('BOOKING_NOT_FOUND'));

      const res = await request(app)
        .post(`${PAYMENTS_URL}/intent`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validPaymentIntentBody)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('should return 403 when user does not own the booking', async () => {
      jest.spyOn(
        require('@/services/payment').PaymentService,
        'createPaymentIntent'
      ).mockRejectedValue(new Error('UNAUTHORIZED_ACCESS'));

      const res = await request(app)
        .post(`${PAYMENTS_URL}/intent`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validPaymentIntentBody)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ACCESS_DENIED');
    });

    it('should return 409 when payment already exists for booking', async () => {
      jest.spyOn(
        require('@/services/payment').PaymentService,
        'createPaymentIntent'
      ).mockRejectedValue(new Error('PAYMENT_ALREADY_EXISTS'));

      const res = await request(app)
        .post(`${PAYMENTS_URL}/intent`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validPaymentIntentBody)
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DUPLICATE_RESOURCE');
    });

    it('should return 400 when booking ID is missing', async () => {
      jest.spyOn(
        require('@/services/payment').PaymentService,
        'createPaymentIntent'
      ).mockRejectedValue(new Error('BOOKING_ID_REQUIRED'));

      const res = await request(app)
        .post(`${PAYMENTS_URL}/intent`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ amount: 100, currency: 'USD' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when amount is invalid', async () => {
      jest.spyOn(
        require('@/services/payment').PaymentService,
        'createPaymentIntent'
      ).mockRejectedValue(new Error('INVALID_AMOUNT'));

      const res = await request(app)
        .post(`${PAYMENTS_URL}/intent`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ ...validPaymentIntentBody, amount: -5 })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ======================================================================
  // GET PAYMENT HISTORY
  // ======================================================================
  describe('GET /api/v1/payments/history', () => {
    it('should return payment history with pagination', async () => {
      const paymentsResult = {
        payments: [
          createTestPayment({
            id: 'payment0000000000000001',
            status: 'SUCCEEDED',
            amount: 100.0,
          }),
          createTestPayment({
            id: 'payment0000000000000002',
            status: 'PENDING',
            amount: 50.0,
          }),
        ],
        total: 10,
        page: 1,
        totalPages: 5,
      };

      jest.spyOn(
        require('@/services/payment').PaymentService,
        'getPaymentHistory'
      ).mockResolvedValue(paymentsResult);

      const res = await request(app)
        .get(`${PAYMENTS_URL}/history`)
        .set('Authorization', `Bearer ${customerToken}`)
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.payments).toHaveLength(2);
    });

    it('should filter payment history by status', async () => {
      const paymentsResult = {
        payments: [
          createTestPayment({
            id: 'payment0000000000000001',
            status: 'SUCCEEDED',
          }),
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      jest.spyOn(
        require('@/services/payment').PaymentService,
        'getPaymentHistory'
      ).mockResolvedValue(paymentsResult);

      const res = await request(app)
        .get(`${PAYMENTS_URL}/history`)
        .set('Authorization', `Bearer ${customerToken}`)
        .query({ status: 'completed' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.payments).toHaveLength(1);
    });

    it('should return empty array when no payments found', async () => {
      jest.spyOn(
        require('@/services/payment').PaymentService,
        'getPaymentHistory'
      ).mockResolvedValue({
        payments: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });

      const res = await request(app)
        .get(`${PAYMENTS_URL}/history`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.payments).toHaveLength(0);
    });

    it('should reject without authentication', async () => {
      const res = await request(app)
        .get(`${PAYMENTS_URL}/history`)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    });
  });

  // ======================================================================
  // GET PAYMENT STATUS
  // ======================================================================
  describe('GET /api/v1/payments/:paymentId/status', () => {
    it('should return payment status successfully', async () => {
      // CorePaymentController.getPaymentStatus delegates to the dynamically
      // imported paymentController from @/controllers/payment.controller.
      // That module is mocked in setup.ts to return a 200 response by default.
      const res = await request(app)
        .get(`${PAYMENTS_URL}/${testPaymentId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBeDefined();
    });

    it('should return 404 for non-existent payment', async () => {
      // Override the mock to return 404
      const { __mockPaymentController } = require('@/controllers/payment.controller');
      __mockPaymentController.getPaymentStatus.mockImplementationOnce(
        async (req: any, res: any) => {
          res.status(404).json({
            success: false,
            error: { code: 'RESOURCE_NOT_FOUND', message: 'Payment not found' },
          });
        }
      );

      const res = await request(app)
        .get(`${PAYMENTS_URL}/${testPaymentId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('should reject without authentication', async () => {
      const res = await request(app)
        .get(`${PAYMENTS_URL}/${testPaymentId}/status`)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    });
  });

  // ======================================================================
  // GET USER PAYMENTS (GET /payments/my)
  // ======================================================================
  describe('GET /api/v1/payments/my', () => {
    it('should return user payments', async () => {
      const payments = [
        createTestPayment({ id: 'payment0000000000000001', status: 'SUCCEEDED' }),
        createTestPayment({ id: 'payment0000000000000002', status: 'PENDING' }),
      ];

      jest.spyOn(
        require('@/services/payment').PaymentService,
        'getUserPayments'
      ).mockResolvedValue(payments);

      const res = await request(app)
        .get(`${PAYMENTS_URL}/my`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('should reject without authentication', async () => {
      const res = await request(app)
        .get(`${PAYMENTS_URL}/my`)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    });
  });

  // ======================================================================
  // GET PAYMENT DETAILS
  // ======================================================================
  describe('GET /api/v1/payments/:paymentId', () => {
    it('should return payment details', async () => {
      const payment = createTestPayment({
        id: testPaymentId,
        status: 'SUCCEEDED',
        booking: createTestBooking(),
      });

      jest.spyOn(
        require('@/services/payment').PaymentService,
        'getPaymentDetails'
      ).mockResolvedValue(payment);

      const res = await request(app)
        .get(`${PAYMENTS_URL}/${testPaymentId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('should return 404 for non-existent payment', async () => {
      // CorePaymentController.getPaymentDetails checks if result is null/falsy
      // and returns 404, so we mock resolving with null (not rejecting)
      jest.spyOn(
        require('@/services/payment').PaymentService,
        'getPaymentDetails'
      ).mockResolvedValue(null);

      const res = await request(app)
        .get(`${PAYMENTS_URL}/nonexistent0000000000001`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('should reject without authentication', async () => {
      const res = await request(app)
        .get(`${PAYMENTS_URL}/${testPaymentId}`)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    });
  });

  // ======================================================================
  // CONFIRM PAYMENT
  // ======================================================================
  describe('POST /api/v1/payments/confirm', () => {
    it('should confirm a payment successfully', async () => {
      const confirmedPayment = createTestPayment({
        id: testPaymentId,
        status: 'SUCCEEDED',
      });

      jest.spyOn(
        require('@/services/payment').PaymentService,
        'confirmPayment'
      ).mockResolvedValue(confirmedPayment);

      const res = await request(app)
        .post(`${PAYMENTS_URL}/confirm`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ paymentIntentId: 'pi_mock_123' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should reject without authentication', async () => {
      const res = await request(app)
        .post(`${PAYMENTS_URL}/confirm`)
        .send({ paymentIntentId: 'pi_mock_123' })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    });
  });

  // ======================================================================
  // WALLET BALANCE
  // ======================================================================
  describe('GET /api/v1/payments/wallet/balance', () => {
    it('should return wallet balance', async () => {
      jest.spyOn(
        require('@/services/payment').PaymentService,
        'getWalletBalance'
      ).mockResolvedValue({
        balance: 250.0,
        currency: 'USD',
      });

      const res = await request(app)
        .get(`${PAYMENTS_URL}/wallet/balance`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should reject without authentication', async () => {
      const res = await request(app)
        .get(`${PAYMENTS_URL}/wallet/balance`)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    });
  });

  // ======================================================================
  // WALLET TRANSACTIONS
  // ======================================================================
  describe('GET /api/v1/payments/wallet/transactions', () => {
    it('should return wallet transactions', async () => {
      jest.spyOn(
        require('@/services/payment').PaymentService,
        'getWalletTransactions'
      ).mockResolvedValue({
        transactions: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });

      const res = await request(app)
        .get(`${PAYMENTS_URL}/wallet/transactions`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should reject without authentication', async () => {
      const res = await request(app)
        .get(`${PAYMENTS_URL}/wallet/transactions`)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    });
  });

  // ======================================================================
  // SPECIALIST EARNINGS (requires specialist role)
  // ======================================================================
  describe('GET /api/v1/payments/earnings/my', () => {
    it('should return specialist earnings', async () => {
      jest.spyOn(
        require('@/services/payment').PaymentService,
        'getSpecialistEarnings'
      ).mockResolvedValue({
        totalEarnings: 5000.0,
        currency: 'USD',
        period: '2025-01',
        transactions: [],
      });

      const res = await request(app)
        .get(`${PAYMENTS_URL}/earnings/my`)
        .set('Authorization', `Bearer ${specialistToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should reject for non-specialist users', async () => {
      const res = await request(app)
        .get(`${PAYMENTS_URL}/earnings/my`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should reject without authentication', async () => {
      const res = await request(app)
        .get(`${PAYMENTS_URL}/earnings/my`)
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  // ======================================================================
  // MOCK PAYMENT SUCCESS (development endpoint)
  // ======================================================================
  describe('POST /api/v1/payments/mock/success', () => {
    it('should create a mock successful payment', async () => {
      // CorePaymentController.mockPaymentSuccess calls
      // PaymentService.confirmPayment(paymentIntentId) under the hood.
      // It expects { paymentIntentId } in the request body.
      const mockPayment = createTestPayment({
        id: testPaymentId,
        status: 'SUCCEEDED',
      });

      jest.spyOn(
        require('@/services/payment').PaymentService,
        'confirmPayment'
      ).mockResolvedValue(mockPayment);

      const res = await request(app)
        .post(`${PAYMENTS_URL}/mock/success`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ paymentIntentId: 'pi_mock_123' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Mock payment completed successfully');
    });

    it('should reject without authentication', async () => {
      const res = await request(app)
        .post(`${PAYMENTS_URL}/mock/success`)
        .send({ paymentIntentId: 'pi_mock_123' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });
});
