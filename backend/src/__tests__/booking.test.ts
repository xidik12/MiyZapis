/**
 * Integration tests for the Booking flow.
 *
 * Covers:
 *  - POST /api/v1/bookings         (create booking)
 *  - GET  /api/v1/bookings          (get user bookings)
 *  - GET  /api/v1/bookings/:id      (get single booking)
 *  - PUT  /api/v1/bookings/:id      (update booking / status)
 *  - PUT  /api/v1/bookings/:id/cancel (cancel booking)
 *  - PUT  /api/v1/bookings/:id/confirm (confirm booking)
 *  - PUT  /api/v1/bookings/:id/reject  (reject booking)
 */

import request from 'supertest';
import {
  mockPrisma,
  generateTestToken,
  createTestUser,
  createTestBooking,
  resetAllMocks,
} from './setup';
import { app } from './test-app';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BOOKINGS_URL = '/api/v1/bookings';

// Test user (customer)
const customer = createTestUser({
  id: 'cust0000000000000000001',
  email: 'customer@example.com',
  userType: 'CUSTOMER',
});

// Test specialist user
const specialistUser = createTestUser({
  id: 'spec0000000000000000001',
  email: 'specialist@example.com',
  userType: 'SPECIALIST',
});

// Another customer (for access-denied tests)
const otherCustomer = createTestUser({
  id: 'cust0000000000000000002',
  email: 'other@example.com',
  userType: 'CUSTOMER',
});

const customerToken = generateTestToken(customer);
const specialistToken = generateTestToken(specialistUser);
const otherCustomerToken = generateTestToken(otherCustomer);

// Valid service ID (CUID-like: lowercase alphanumeric, 20-30 chars)
const testServiceId = 'svc00000000000000000001';
const testSpecialistProfileId = 'spprofile0000000000001';

// Full booking object returned by BookingService
function fullBookingResponse(overrides: Record<string, any> = {}) {
  return {
    id: 'booking0000000000000001',
    customerId: customer.id,
    specialistId: specialistUser.id,
    serviceId: testServiceId,
    status: 'PENDING',
    scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    duration: 60,
    totalAmount: 100.0,
    depositAmount: 20.0,
    remainingAmount: 80.0,
    customerNotes: null,
    specialistNotes: null,
    confirmedAt: null,
    completedAt: null,
    cancelledAt: null,
    cancellationReason: null,
    loyaltyPointsUsed: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    customer: {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      avatar: null,
      userType: 'CUSTOMER',
    },
    specialist: {
      id: specialistUser.id,
      email: specialistUser.email,
      firstName: specialistUser.firstName,
      lastName: specialistUser.lastName,
    },
    service: {
      id: testServiceId,
      name: 'Test Service',
      basePrice: 100.0,
      duration: 60,
      specialist: {
        autoBooking: false,
      },
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Booking API', () => {
  beforeEach(() => {
    resetAllMocks();
    // Default: auth middleware finds user in DB
    mockPrisma.user.findUnique.mockImplementation(({ where }: any) => {
      if (where.id === customer.id) return Promise.resolve(customer);
      if (where.id === specialistUser.id) return Promise.resolve(specialistUser);
      if (where.id === otherCustomer.id) return Promise.resolve(otherCustomer);
      return Promise.resolve(null);
    });
  });

  // ======================================================================
  // CREATE BOOKING
  // ======================================================================
  describe('POST /api/v1/bookings', () => {
    const validBookingBody = {
      serviceId: testServiceId,
      scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      duration: 60,
      customerNotes: 'Integration test booking',
    };

    it('should create a booking successfully', async () => {
      // Mock BookingService.createBooking (called via the controller)
      // The service internally does multiple prisma calls. We mock the service
      // module directly for cleaner tests.
      const booking = fullBookingResponse({ customerNotes: 'Integration test booking' });

      // Mock the BookingService
      jest.spyOn(
        require('@/services/booking').BookingService,
        'createBooking'
      ).mockResolvedValue(booking);

      const res = await request(app)
        .post(BOOKINGS_URL)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validBookingBody)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('booking');
      expect(res.body.data.booking.customerId).toBe(customer.id);
      expect(res.body.data.booking.status).toBe('PENDING');
    });

    it('should return auto-booking message when specialist has auto-booking enabled', async () => {
      const booking = fullBookingResponse({
        status: 'CONFIRMED',
        confirmedAt: new Date().toISOString(),
        service: {
          id: testServiceId,
          name: 'Test Service',
          basePrice: 100.0,
          duration: 60,
          specialist: { autoBooking: true },
        },
      });

      jest.spyOn(
        require('@/services/booking').BookingService,
        'createBooking'
      ).mockResolvedValue(booking);

      const res = await request(app)
        .post(BOOKINGS_URL)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validBookingBody)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.autoBooking).toBe(true);
      expect(res.body.data.message).toContain('automatically confirmed');
    });

    it('should reject booking creation without authentication', async () => {
      const res = await request(app)
        .post(BOOKINGS_URL)
        .send(validBookingBody)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    });

    it('should reject booking with missing serviceId', async () => {
      const res = await request(app)
        .post(BOOKINGS_URL)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          duration: 60,
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject booking with missing scheduledAt', async () => {
      const res = await request(app)
        .post(BOOKINGS_URL)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceId: testServiceId,
          duration: 60,
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject booking with past scheduledAt', async () => {
      const res = await request(app)
        .post(BOOKINGS_URL)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceId: testServiceId,
          scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          duration: 60,
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 when service not found', async () => {
      jest.spyOn(
        require('@/services/booking').BookingService,
        'createBooking'
      ).mockRejectedValue(new Error('SERVICE_NOT_FOUND'));

      const res = await request(app)
        .post(BOOKINGS_URL)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validBookingBody)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('should return 409 when time slot is not available', async () => {
      jest.spyOn(
        require('@/services/booking').BookingService,
        'createBooking'
      ).mockRejectedValue(new Error('TIME_SLOT_NOT_AVAILABLE'));

      const res = await request(app)
        .post(BOOKINGS_URL)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validBookingBody)
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('BOOKING_CONFLICT');
    });

    it('should return 400 when user has insufficient loyalty points', async () => {
      jest.spyOn(
        require('@/services/booking').BookingService,
        'createBooking'
      ).mockRejectedValue(new Error('INSUFFICIENT_LOYALTY_POINTS'));

      const res = await request(app)
        .post(BOOKINGS_URL)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ ...validBookingBody, loyaltyPointsUsed: 1000 })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INSUFFICIENT_BALANCE');
    });
  });

  // ======================================================================
  // GET USER BOOKINGS
  // ======================================================================
  describe('GET /api/v1/bookings', () => {
    it('should return user bookings with pagination', async () => {
      const bookingsResult = {
        bookings: [
          fullBookingResponse({ id: 'booking0000000000000001', status: 'PENDING' }),
          fullBookingResponse({ id: 'booking0000000000000002', status: 'CONFIRMED' }),
        ],
        total: 5,
        page: 1,
        totalPages: 3,
      };

      jest.spyOn(
        require('@/services/booking').BookingService,
        'getUserBookings'
      ).mockResolvedValue(bookingsResult);

      const res = await request(app)
        .get(BOOKINGS_URL)
        .set('Authorization', `Bearer ${customerToken}`)
        .query({ page: 1, limit: 2, userType: 'customer' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.bookings).toHaveLength(2);
      expect(res.body.meta.pagination).toBeDefined();
      expect(res.body.meta.pagination.currentPage).toBe(1);
      expect(res.body.meta.pagination.totalItems).toBe(5);
      expect(res.body.meta.pagination.hasNext).toBe(true);
    });

    it('should return empty bookings for user with no bookings', async () => {
      jest.spyOn(
        require('@/services/booking').BookingService,
        'getUserBookings'
      ).mockResolvedValue({
        bookings: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });

      const res = await request(app)
        .get(BOOKINGS_URL)
        .set('Authorization', `Bearer ${customerToken}`)
        .query({ userType: 'customer' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.bookings).toHaveLength(0);
    });

    it('should reject without authentication', async () => {
      const res = await request(app)
        .get(BOOKINGS_URL)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    });

    it('should reject invalid userType parameter', async () => {
      const res = await request(app)
        .get(BOOKINGS_URL)
        .set('Authorization', `Bearer ${customerToken}`)
        .query({ userType: 'invalid' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ======================================================================
  // GET SINGLE BOOKING
  // ======================================================================
  describe('GET /api/v1/bookings/:bookingId', () => {
    const bookingId = 'booking0000000000000001';

    it('should return booking details for the owner', async () => {
      const booking = fullBookingResponse({ id: bookingId });

      jest.spyOn(
        require('@/services/booking').BookingService,
        'getBooking'
      ).mockResolvedValue(booking);

      const res = await request(app)
        .get(`${BOOKINGS_URL}/${bookingId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.booking).toBeDefined();
      expect(res.body.data.booking.id).toBe(bookingId);
    });

    it('should return booking details for the specialist', async () => {
      const booking = fullBookingResponse({ id: bookingId });

      jest.spyOn(
        require('@/services/booking').BookingService,
        'getBooking'
      ).mockResolvedValue(booking);

      const res = await request(app)
        .get(`${BOOKINGS_URL}/${bookingId}`)
        .set('Authorization', `Bearer ${specialistToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.booking.id).toBe(bookingId);
    });

    it('should deny access to a booking owned by another user', async () => {
      const booking = fullBookingResponse({ id: bookingId });

      jest.spyOn(
        require('@/services/booking').BookingService,
        'getBooking'
      ).mockResolvedValue(booking);

      const res = await request(app)
        .get(`${BOOKINGS_URL}/${bookingId}`)
        .set('Authorization', `Bearer ${otherCustomerToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ACCESS_DENIED');
    });

    it('should return 404 for non-existent booking', async () => {
      jest.spyOn(
        require('@/services/booking').BookingService,
        'getBooking'
      ).mockRejectedValue(new Error('BOOKING_NOT_FOUND'));

      const res = await request(app)
        .get(`${BOOKINGS_URL}/${bookingId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('should reject without authentication', async () => {
      const res = await request(app)
        .get(`${BOOKINGS_URL}/${bookingId}`)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    });
  });

  // ======================================================================
  // UPDATE BOOKING
  // ======================================================================
  describe('PUT /api/v1/bookings/:bookingId', () => {
    const bookingId = 'booking0000000000000001';

    it('should update booking notes successfully', async () => {
      const booking = fullBookingResponse({ id: bookingId });
      const updatedBooking = { ...booking, customerNotes: 'Updated notes' };

      jest.spyOn(
        require('@/services/booking').BookingService,
        'getBooking'
      ).mockResolvedValue(booking);

      jest.spyOn(
        require('@/services/booking').BookingService,
        'updateBooking'
      ).mockResolvedValue(updatedBooking);

      const res = await request(app)
        .put(`${BOOKINGS_URL}/${bookingId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ customerNotes: 'Updated notes' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.booking.customerNotes).toBe('Updated notes');
    });

    it('should deny update from another user', async () => {
      const booking = fullBookingResponse({ id: bookingId });

      jest.spyOn(
        require('@/services/booking').BookingService,
        'getBooking'
      ).mockResolvedValue(booking);

      const res = await request(app)
        .put(`${BOOKINGS_URL}/${bookingId}`)
        .set('Authorization', `Bearer ${otherCustomerToken}`)
        .send({ customerNotes: 'Hacked notes' })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ACCESS_DENIED');
    });

    it('should return 400 for invalid status transition', async () => {
      const booking = fullBookingResponse({ id: bookingId });

      jest.spyOn(
        require('@/services/booking').BookingService,
        'getBooking'
      ).mockResolvedValue(booking);

      jest.spyOn(
        require('@/services/booking').BookingService,
        'updateBooking'
      ).mockRejectedValue(new Error('INVALID_STATUS_TRANSITION'));

      const res = await request(app)
        .put(`${BOOKINGS_URL}/${bookingId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'COMPLETED' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('BUSINESS_RULE_VIOLATION');
    });

    it('should reject without authentication', async () => {
      const res = await request(app)
        .put(`${BOOKINGS_URL}/${bookingId}`)
        .send({ customerNotes: 'test' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  // ======================================================================
  // CANCEL BOOKING
  // ======================================================================
  describe('PUT /api/v1/bookings/:bookingId/cancel', () => {
    const bookingId = 'booking0000000000000001';

    it('should cancel a booking successfully', async () => {
      const booking = fullBookingResponse({ id: bookingId, status: 'PENDING' });
      const cancelledBooking = {
        ...booking,
        status: 'CANCELLED',
        cancelledAt: new Date().toISOString(),
        cancellationReason: 'Changed my mind',
      };

      jest.spyOn(
        require('@/services/booking').BookingService,
        'getBooking'
      ).mockResolvedValue(booking);

      jest.spyOn(
        require('@/services/booking').BookingService,
        'cancelBooking'
      ).mockResolvedValue(cancelledBooking);

      const res = await request(app)
        .put(`${BOOKINGS_URL}/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ reason: 'Changed my mind' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.booking.status).toBe('CANCELLED');
      expect(res.body.data.message).toContain('cancelled');
    });

    it('should deny cancellation from another user', async () => {
      const booking = fullBookingResponse({ id: bookingId });

      jest.spyOn(
        require('@/services/booking').BookingService,
        'getBooking'
      ).mockResolvedValue(booking);

      const res = await request(app)
        .put(`${BOOKINGS_URL}/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${otherCustomerToken}`)
        .send({ reason: 'Not my booking' })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ACCESS_DENIED');
    });

    it('should return 400 for late cancellation', async () => {
      const booking = fullBookingResponse({ id: bookingId });

      jest.spyOn(
        require('@/services/booking').BookingService,
        'getBooking'
      ).mockResolvedValue(booking);

      jest.spyOn(
        require('@/services/booking').BookingService,
        'cancelBooking'
      ).mockRejectedValue(new Error('CANCELLATION_TOO_LATE'));

      const res = await request(app)
        .put(`${BOOKINGS_URL}/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ reason: 'Too late' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CANCELLATION_NOT_ALLOWED');
    });

    it('should return 400 when cancellation is not allowed', async () => {
      const booking = fullBookingResponse({ id: bookingId });

      jest.spyOn(
        require('@/services/booking').BookingService,
        'getBooking'
      ).mockResolvedValue(booking);

      jest.spyOn(
        require('@/services/booking').BookingService,
        'cancelBooking'
      ).mockRejectedValue(new Error('CANCELLATION_NOT_ALLOWED'));

      const res = await request(app)
        .put(`${BOOKINGS_URL}/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ reason: 'Cannot cancel' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CANCELLATION_NOT_ALLOWED');
    });

    it('should return 404 when booking not found', async () => {
      jest.spyOn(
        require('@/services/booking').BookingService,
        'getBooking'
      ).mockRejectedValue(new Error('BOOKING_NOT_FOUND'));

      const res = await request(app)
        .put(`${BOOKINGS_URL}/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ reason: 'test' })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('should reject without authentication', async () => {
      const res = await request(app)
        .put(`${BOOKINGS_URL}/${bookingId}/cancel`)
        .send({ reason: 'test' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  // ======================================================================
  // CONFIRM BOOKING (specialist)
  // ======================================================================
  describe('PUT /api/v1/bookings/:bookingId/confirm', () => {
    const bookingId = 'booking0000000000000001';

    it('should confirm booking successfully as specialist', async () => {
      const booking = fullBookingResponse({ id: bookingId, status: 'PENDING' });
      const confirmedBooking = {
        ...booking,
        status: 'CONFIRMED',
        confirmedAt: new Date().toISOString(),
        customer: { ...booking.customer, language: 'en' },
        specialist: { ...booking.specialist, language: 'en' },
      };

      jest.spyOn(
        require('@/services/booking').BookingService,
        'confirmBooking'
      ).mockResolvedValue(confirmedBooking);

      const res = await request(app)
        .put(`${BOOKINGS_URL}/${bookingId}/confirm`)
        .set('Authorization', `Bearer ${specialistToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.booking.status).toBe('CONFIRMED');
      expect(res.body.data.message).toContain('confirmed');
    });

    it('should return 403 when non-specialist tries to confirm', async () => {
      jest.spyOn(
        require('@/services/booking').BookingService,
        'confirmBooking'
      ).mockRejectedValue(new Error('SPECIALIST_NOT_AUTHORIZED'));

      const res = await request(app)
        .put(`${BOOKINGS_URL}/${bookingId}/confirm`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ACCESS_DENIED');
    });

    it('should return 400 when booking is not pending', async () => {
      jest.spyOn(
        require('@/services/booking').BookingService,
        'confirmBooking'
      ).mockRejectedValue(new Error('BOOKING_NOT_PENDING'));

      const res = await request(app)
        .put(`${BOOKINGS_URL}/${bookingId}/confirm`)
        .set('Authorization', `Bearer ${specialistToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('BUSINESS_RULE_VIOLATION');
    });

    it('should reject without authentication', async () => {
      const res = await request(app)
        .put(`${BOOKINGS_URL}/${bookingId}/confirm`)
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  // ======================================================================
  // REJECT BOOKING (specialist)
  // ======================================================================
  describe('PUT /api/v1/bookings/:bookingId/reject', () => {
    const bookingId = 'booking0000000000000001';

    it('should reject booking successfully as specialist', async () => {
      const booking = fullBookingResponse({ id: bookingId, status: 'PENDING' });
      const rejectedBooking = {
        ...booking,
        status: 'CANCELLED',
        cancellationReason: 'Not available',
      };

      jest.spyOn(
        require('@/services/booking').BookingService,
        'rejectBooking'
      ).mockResolvedValue(rejectedBooking);

      const res = await request(app)
        .put(`${BOOKINGS_URL}/${bookingId}/reject`)
        .set('Authorization', `Bearer ${specialistToken}`)
        .send({ reason: 'Not available' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.booking.status).toBe('CANCELLED');
      expect(res.body.data.message).toContain('rejected');
    });

    it('should return 403 when non-specialist tries to reject', async () => {
      jest.spyOn(
        require('@/services/booking').BookingService,
        'rejectBooking'
      ).mockRejectedValue(new Error('SPECIALIST_NOT_AUTHORIZED'));

      const res = await request(app)
        .put(`${BOOKINGS_URL}/${bookingId}/reject`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ reason: 'test' })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ACCESS_DENIED');
    });

    it('should return 400 when booking is not pending', async () => {
      jest.spyOn(
        require('@/services/booking').BookingService,
        'rejectBooking'
      ).mockRejectedValue(new Error('BOOKING_NOT_PENDING'));

      const res = await request(app)
        .put(`${BOOKINGS_URL}/${bookingId}/reject`)
        .set('Authorization', `Bearer ${specialistToken}`)
        .send({ reason: 'test' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('BUSINESS_RULE_VIOLATION');
    });
  });
});
