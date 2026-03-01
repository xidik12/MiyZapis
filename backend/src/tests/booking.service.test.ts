/**
 * Unit tests for BookingService - focused on status transition state machine.
 *
 * Strategy: mock every external dependency at the module level so we can
 * import BookingService in isolation and exercise its pure logic (status
 * validation, error codes) without hitting a real database.
 */

// ---------------------------------------------------------------------------
// Module mocks  (must be declared before any import that triggers the modules)
// ---------------------------------------------------------------------------

const mockPrisma = {
  booking: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  service: {
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  specialist: {
    update: jest.fn(),
  },
  loyaltyTransaction: {
    create: jest.fn(),
  },
  loyaltyReferral: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
  payment: {
    create: jest.fn(),
  },
  walletTransaction: {
    create: jest.fn(),
  },
  rewardRedemption: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((fn: (tx: Record<string, unknown>) => Promise<unknown>) => fn(mockPrisma)),
  $executeRaw: jest.fn(),
};

jest.mock('@/config/database', () => ({
  prisma: mockPrisma,
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/services/notification', () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    sendNotification: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('@/services/email', () => ({
  emailService: {
    sendTemplateEmail: jest.fn().mockResolvedValue(undefined),
    sendBookingReminder: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/utils/language', () => ({
  resolveLanguage: jest.fn().mockReturnValue('en'),
}));

jest.mock('@/services/loyalty', () => ({
  __esModule: true,
  default: {
    processBookingCompletion: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/services/payment/subscription.service', () => ({
  specialistSubscriptionService: {
    processTransactionFee: jest.fn().mockResolvedValue({
      feeCharged: 0,
      currency: 'USD',
      method: 'PAY_PER_USE',
    }),
  },
}));

jest.mock('@/services/referral', () => ({
  ReferralService: {},
}));

jest.mock('@/services/referral/processing.service', () => ({
  ReferralProcessingService: {
    processBookingCompletion: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/utils/groupSessions', () => ({
  generateGroupSessionId: jest.fn().mockReturnValue('group-session-123'),
  canAccommodateParticipants: jest.fn().mockResolvedValue(true),
  logGroupSessionInfo: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Import under test  (after mocks are in place)
// ---------------------------------------------------------------------------

import { BookingService } from '@/services/booking';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal booking row that satisfies the fields read by updateBooking / cancelBooking. */
function makeBooking(overrides: Record<string, any> = {}) {
  return {
    id: 'booking-1',
    customerId: 'customer-1',
    specialistId: 'specialist-1',
    serviceId: 'service-1',
    status: 'PENDING',
    scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 h from now
    duration: 60,
    totalAmount: 100,
    depositAmount: 20,
    remainingAmount: 80,
    loyaltyPointsUsed: 0,
    customerNotes: null,
    specialistNotes: null,
    preparationNotes: null,
    completionNotes: null,
    confirmedAt: null,
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
    cancelledBy: null,
    cancellationReason: null,
    refundAmount: 0,
    deliverables: '[]',
    participantCount: 1,
    groupSessionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/** A fully-populated booking (with relations) returned by prisma.booking.update. */
function makeBookingWithDetails(overrides: Record<string, any> = {}) {
  const base = makeBooking(overrides);
  return {
    ...base,
    customer: {
      id: base.customerId,
      email: 'customer@test.com',
      firstName: 'John',
      lastName: 'Customer',
      avatar: null,
      userType: 'CUSTOMER',
      phoneNumber: null,
      isEmailVerified: true,
      isPhoneVerified: false,
      isActive: true,
      loyaltyPoints: 100,
      loyaltyTierId: null,
      language: 'en',
      currency: 'USD',
      timezone: 'UTC',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    specialist: {
      id: base.specialistId,
      email: 'specialist@test.com',
      firstName: 'Jane',
      lastName: 'Specialist',
      avatar: null,
      userType: 'SPECIALIST',
      phoneNumber: null,
      isEmailVerified: true,
      isPhoneVerified: false,
      isActive: true,
      loyaltyPoints: 0,
      loyaltyTierId: null,
      language: 'en',
      currency: 'USD',
      timezone: 'UTC',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    service: {
      id: base.serviceId,
      name: 'Test Service',
      description: 'desc',
      basePrice: 100,
      currency: 'USD',
      duration: 60,
      isActive: true,
      categoryId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      specialist: {
        id: 'specialist-profile-1',
        userId: base.specialistId,
        businessName: 'Test Business',
        autoBooking: false,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BookingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // updateBooking  --  status transition state machine
  // =========================================================================
  describe('updateBooking - status transition state machine', () => {
    // The complete transition map implemented in BookingService:
    //   PENDING          -> PENDING_PAYMENT, CONFIRMED, CANCELLED, REJECTED
    //   PENDING_PAYMENT  -> CONFIRMED, CANCELLED
    //   CONFIRMED        -> IN_PROGRESS, CANCELLED, NO_SHOW
    //   IN_PROGRESS      -> COMPLETED, CANCELLED
    //   COMPLETED        -> (none)
    //   CANCELLED        -> (none)
    //   REJECTED         -> (none)
    //   NO_SHOW          -> (none)

    // ----- Valid transitions ------------------------------------------------

    const validTransitions: Array<[string, string]> = [
      // From PENDING
      ['PENDING', 'PENDING_PAYMENT'],
      ['PENDING', 'CONFIRMED'],
      ['PENDING', 'CANCELLED'],
      ['PENDING', 'REJECTED'],
      // From PENDING_PAYMENT
      ['PENDING_PAYMENT', 'CONFIRMED'],
      ['PENDING_PAYMENT', 'CANCELLED'],
      // From CONFIRMED
      ['CONFIRMED', 'IN_PROGRESS'],
      ['CONFIRMED', 'CANCELLED'],
      ['CONFIRMED', 'NO_SHOW'],
      // From IN_PROGRESS
      ['IN_PROGRESS', 'COMPLETED'],
      ['IN_PROGRESS', 'CANCELLED'],
    ];

    it.each(validTransitions)(
      'allows transition from %s to %s',
      async (fromStatus, toStatus) => {
        const existingBooking = makeBooking({ status: fromStatus });
        const updatedBookingWithDetails = makeBookingWithDetails({
          status: toStatus,
        });

        mockPrisma.booking.findUnique.mockResolvedValue(existingBooking);
        mockPrisma.booking.update.mockResolvedValue(updatedBookingWithDetails);
        // For COMPLETED status -- additional side-effect calls
        mockPrisma.specialist.update.mockResolvedValue({});
        mockPrisma.booking.count.mockResolvedValue(0);

        const result = await BookingService.updateBooking('booking-1', {
          status: toStatus,
        });

        expect(result).toBeDefined();
        expect(result.status).toBe(toStatus);
        // Verify prisma.booking.update was called with the new status
        expect(mockPrisma.booking.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 'booking-1' },
            data: expect.objectContaining({ status: toStatus }),
          }),
        );
      },
    );

    // ----- Invalid transitions from non-final states -----------------------

    const invalidTransitionsFromActive: Array<[string, string]> = [
      ['PENDING', 'COMPLETED'],
      ['PENDING', 'IN_PROGRESS'],
      ['PENDING', 'NO_SHOW'],
      ['PENDING_PAYMENT', 'PENDING'],
      ['PENDING_PAYMENT', 'REJECTED'],
      ['PENDING_PAYMENT', 'IN_PROGRESS'],
      ['PENDING_PAYMENT', 'COMPLETED'],
      ['PENDING_PAYMENT', 'NO_SHOW'],
      ['CONFIRMED', 'PENDING'],
      ['CONFIRMED', 'PENDING_PAYMENT'],
      ['CONFIRMED', 'COMPLETED'],
      ['CONFIRMED', 'REJECTED'],
      ['IN_PROGRESS', 'PENDING'],
      ['IN_PROGRESS', 'CONFIRMED'],
      ['IN_PROGRESS', 'PENDING_PAYMENT'],
      ['IN_PROGRESS', 'REJECTED'],
      ['IN_PROGRESS', 'NO_SHOW'],
    ];

    it.each(invalidTransitionsFromActive)(
      'rejects transition from %s to %s',
      async (fromStatus, toStatus) => {
        const existingBooking = makeBooking({ status: fromStatus });
        mockPrisma.booking.findUnique.mockResolvedValue(existingBooking);

        await expect(
          BookingService.updateBooking('booking-1', { status: toStatus }),
        ).rejects.toThrow(
          `Invalid status transition from ${fromStatus} to ${toStatus}`,
        );

        // prisma.booking.update must NOT have been called
        expect(mockPrisma.booking.update).not.toHaveBeenCalled();
      },
    );

    // ----- Final states cannot transition to anything ----------------------

    const finalStates = ['COMPLETED', 'CANCELLED', 'REJECTED', 'NO_SHOW'];
    const allStatuses = [
      'PENDING',
      'PENDING_PAYMENT',
      'CONFIRMED',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
      'REJECTED',
      'NO_SHOW',
    ];

    // Build pairs of (finalState, anyTarget)
    const finalStateTransitions: Array<[string, string]> = [];
    for (const finalState of finalStates) {
      for (const target of allStatuses) {
        if (target !== finalState) {
          // transitioning to itself is also blocked (empty allowed list)
          finalStateTransitions.push([finalState, target]);
        }
      }
    }
    // Also include transitioning to itself
    for (const finalState of finalStates) {
      finalStateTransitions.push([finalState, finalState]);
    }

    it.each(finalStateTransitions)(
      'prevents transition from final state %s to %s',
      async (fromStatus, toStatus) => {
        const existingBooking = makeBooking({ status: fromStatus });
        mockPrisma.booking.findUnique.mockResolvedValue(existingBooking);

        await expect(
          BookingService.updateBooking('booking-1', { status: toStatus }),
        ).rejects.toThrow(
          `Invalid status transition from ${fromStatus} to ${toStatus}`,
        );

        expect(mockPrisma.booking.update).not.toHaveBeenCalled();
      },
    );
  });

  // =========================================================================
  // updateBooking  --  booking not found
  // =========================================================================
  describe('updateBooking - booking not found', () => {
    it('throws BOOKING_NOT_FOUND when booking does not exist', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null);

      await expect(
        BookingService.updateBooking('nonexistent', { status: 'CONFIRMED' }),
      ).rejects.toThrow('BOOKING_NOT_FOUND');
    });
  });

  // =========================================================================
  // updateBooking  --  non-status updates pass through
  // =========================================================================
  describe('updateBooking - non-status fields', () => {
    it('updates notes without triggering status validation', async () => {
      const existingBooking = makeBooking({ status: 'CONFIRMED' });
      const updatedBooking = makeBookingWithDetails({
        status: 'CONFIRMED',
        specialistNotes: 'Bring towels',
      });

      mockPrisma.booking.findUnique.mockResolvedValue(existingBooking);
      mockPrisma.booking.update.mockResolvedValue(updatedBooking);

      const result = await BookingService.updateBooking('booking-1', {
        specialistNotes: 'Bring towels',
      });

      expect(result.specialistNotes).toBe('Bring towels');
      expect(mockPrisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            specialistNotes: 'Bring towels',
          }),
        }),
      );
    });
  });

  // =========================================================================
  // updateBooking  --  timestamp side-effects
  // =========================================================================
  describe('updateBooking - timestamp updates', () => {
    it('sets confirmedAt when transitioning to CONFIRMED', async () => {
      const existingBooking = makeBooking({ status: 'PENDING' });
      const updatedBooking = makeBookingWithDetails({ status: 'CONFIRMED' });

      mockPrisma.booking.findUnique.mockResolvedValue(existingBooking);
      mockPrisma.booking.update.mockResolvedValue(updatedBooking);

      await BookingService.updateBooking('booking-1', { status: 'CONFIRMED' });

      const updateCall = mockPrisma.booking.update.mock.calls[0][0];
      expect(updateCall.data.confirmedAt).toBeInstanceOf(Date);
    });

    it('sets startedAt when transitioning to IN_PROGRESS', async () => {
      const existingBooking = makeBooking({ status: 'CONFIRMED' });
      const updatedBooking = makeBookingWithDetails({ status: 'IN_PROGRESS' });

      mockPrisma.booking.findUnique.mockResolvedValue(existingBooking);
      mockPrisma.booking.update.mockResolvedValue(updatedBooking);

      await BookingService.updateBooking('booking-1', {
        status: 'IN_PROGRESS',
      });

      const updateCall = mockPrisma.booking.update.mock.calls[0][0];
      expect(updateCall.data.startedAt).toBeInstanceOf(Date);
    });

    it('sets completedAt when transitioning to COMPLETED', async () => {
      const existingBooking = makeBooking({ status: 'IN_PROGRESS' });
      const updatedBooking = makeBookingWithDetails({ status: 'COMPLETED' });

      mockPrisma.booking.findUnique.mockResolvedValue(existingBooking);
      mockPrisma.booking.update.mockResolvedValue(updatedBooking);
      mockPrisma.specialist.update.mockResolvedValue({});

      await BookingService.updateBooking('booking-1', { status: 'COMPLETED' });

      const updateCall = mockPrisma.booking.update.mock.calls[0][0];
      expect(updateCall.data.completedAt).toBeInstanceOf(Date);
    });

    it('sets cancelledAt when transitioning to CANCELLED', async () => {
      const existingBooking = makeBooking({ status: 'PENDING' });
      const updatedBooking = makeBookingWithDetails({ status: 'CANCELLED' });

      mockPrisma.booking.findUnique.mockResolvedValue(existingBooking);
      mockPrisma.booking.update.mockResolvedValue(updatedBooking);

      await BookingService.updateBooking('booking-1', { status: 'CANCELLED' });

      const updateCall = mockPrisma.booking.update.mock.calls[0][0];
      expect(updateCall.data.cancelledAt).toBeInstanceOf(Date);
    });
  });

  // =========================================================================
  // confirmBooking
  // =========================================================================
  describe('confirmBooking', () => {
    it('confirms a PENDING booking when specialist is authorized', async () => {
      // confirmBooking calls getBooking internally (findUnique with include)
      // then calls updateBooking (findUnique again, then update)
      const bookingWithDetails = makeBookingWithDetails({ status: 'PENDING' });
      const confirmedBooking = makeBookingWithDetails({ status: 'CONFIRMED' });

      // First call: getBooking (findUnique with include)
      // Second call: updateBooking (findUnique without include)
      mockPrisma.booking.findUnique
        .mockResolvedValueOnce(bookingWithDetails) // getBooking
        .mockResolvedValueOnce(makeBooking({ status: 'PENDING' })); // updateBooking lookup
      mockPrisma.booking.update.mockResolvedValue(confirmedBooking);

      const result = await BookingService.confirmBooking(
        'booking-1',
        'specialist-1',
      );

      expect(result.status).toBe('CONFIRMED');
    });

    it('throws SPECIALIST_NOT_AUTHORIZED when specialist does not own booking', async () => {
      const bookingWithDetails = makeBookingWithDetails({ status: 'PENDING' });
      mockPrisma.booking.findUnique.mockResolvedValue(bookingWithDetails);

      await expect(
        BookingService.confirmBooking('booking-1', 'other-specialist'),
      ).rejects.toThrow('SPECIALIST_NOT_AUTHORIZED');
    });

    it('throws BOOKING_NOT_PENDING when booking is not in PENDING status', async () => {
      const bookingWithDetails = makeBookingWithDetails({ status: 'CONFIRMED' });
      mockPrisma.booking.findUnique.mockResolvedValue(bookingWithDetails);

      await expect(
        BookingService.confirmBooking('booking-1', 'specialist-1'),
      ).rejects.toThrow('BOOKING_NOT_PENDING');
    });
  });

  // =========================================================================
  // cancelBooking
  // =========================================================================
  describe('cancelBooking', () => {
    it('throws BOOKING_NOT_FOUND when booking does not exist', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null);

      await expect(
        BookingService.cancelBooking('nonexistent', 'customer-1'),
      ).rejects.toThrow('BOOKING_NOT_FOUND');
    });

    it('throws CANCELLATION_NOT_ALLOWED for bookings in IN_PROGRESS status', async () => {
      const booking = makeBooking({ status: 'IN_PROGRESS' });
      mockPrisma.booking.findUnique.mockResolvedValue(booking);

      await expect(
        BookingService.cancelBooking('booking-1', 'customer-1'),
      ).rejects.toThrow('CANCELLATION_NOT_ALLOWED');
    });

    it('throws CANCELLATION_NOT_ALLOWED for bookings in COMPLETED status', async () => {
      const booking = makeBooking({ status: 'COMPLETED' });
      mockPrisma.booking.findUnique.mockResolvedValue(booking);

      await expect(
        BookingService.cancelBooking('booking-1', 'customer-1'),
      ).rejects.toThrow('CANCELLATION_NOT_ALLOWED');
    });

    it('throws CANCELLATION_TOO_LATE when booking is within 24 hours', async () => {
      const booking = makeBooking({
        status: 'PENDING',
        scheduledAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 h from now
      });
      mockPrisma.booking.findUnique.mockResolvedValue(booking);

      await expect(
        BookingService.cancelBooking('booking-1', 'customer-1'),
      ).rejects.toThrow('CANCELLATION_TOO_LATE');
    });

    it('cancels a PENDING booking that is more than 24 hours away', async () => {
      const booking = makeBooking({
        status: 'PENDING',
        scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 h
      });
      const cancelledBooking = makeBookingWithDetails({
        status: 'CANCELLED',
        cancelledBy: 'customer-1',
        cancelledAt: new Date(),
      });

      mockPrisma.booking.findUnique.mockResolvedValue(booking);
      // $transaction calls its callback with mockPrisma
      mockPrisma.booking.update.mockResolvedValue(cancelledBooking);

      const result = await BookingService.cancelBooking(
        'booking-1',
        'customer-1',
        'Changed my mind',
      );

      expect(result.status).toBe('CANCELLED');
      expect(mockPrisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'CANCELLED',
            cancellationReason: 'Changed my mind',
          }),
        }),
      );
    });

    it('gives full refund when specialist cancels', async () => {
      const booking = makeBooking({
        status: 'CONFIRMED',
        scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      });
      const cancelledBooking = makeBookingWithDetails({
        status: 'CANCELLED',
        cancelledBy: 'specialist-1',
        refundAmount: 100,
      });

      mockPrisma.booking.findUnique.mockResolvedValue(booking);
      mockPrisma.booking.update.mockResolvedValue(cancelledBooking);
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.walletTransaction.create.mockResolvedValue({});

      const result = await BookingService.cancelBooking(
        'booking-1',
        'specialist-1', // same as booking.specialistId -> full refund
      );

      expect(result.status).toBe('CANCELLED');
      // The update should include refundAmount = 100 (specialist cancellation)
      expect(mockPrisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            refundAmount: 100,
          }),
        }),
      );
    });

    it('gives no refund when customer cancels', async () => {
      const booking = makeBooking({
        status: 'PENDING',
        scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      });
      const cancelledBooking = makeBookingWithDetails({
        status: 'CANCELLED',
        cancelledBy: 'customer-1',
        refundAmount: 0,
      });

      mockPrisma.booking.findUnique.mockResolvedValue(booking);
      mockPrisma.booking.update.mockResolvedValue(cancelledBooking);

      await BookingService.cancelBooking('booking-1', 'customer-1');

      expect(mockPrisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            refundAmount: 0,
          }),
        }),
      );
      // No wallet transaction should be created for zero refund
      expect(mockPrisma.walletTransaction.create).not.toHaveBeenCalled();
    });

    it('refunds loyalty points when booking with loyalty points is cancelled', async () => {
      const booking = makeBooking({
        status: 'PENDING',
        scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        loyaltyPointsUsed: 50,
      });
      const cancelledBooking = makeBookingWithDetails({
        ...booking,
        status: 'CANCELLED',
      });

      mockPrisma.booking.findUnique.mockResolvedValue(booking);
      mockPrisma.booking.update.mockResolvedValue(cancelledBooking);
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.loyaltyTransaction.create.mockResolvedValue({});

      await BookingService.cancelBooking('booking-1', 'customer-1');

      // Should increment user's loyalty points
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'customer-1' },
          data: expect.objectContaining({
            loyaltyPoints: { increment: 50 },
          }),
        }),
      );

      // Should create a loyalty transaction record for the refund
      expect(mockPrisma.loyaltyTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'customer-1',
            type: 'EARNED',
            points: 50,
          }),
        }),
      );
    });
  });
});
