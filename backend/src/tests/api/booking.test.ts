import request from 'supertest';
import { app } from '../../server';
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestData,
  TestDataBuilder,
  createAuthHeaders,
  testPrisma,
  PerformanceTimer,
  LoadTester,
} from '../setup';

describe('Booking API', () => {
  let testData: any;
  let customer: any;
  let specialist: any;
  let service: any;
  const timer = new PerformanceTimer();

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestData();
    
    // Create test data
    const builder = new TestDataBuilder();
    await builder.createCustomer();
    await builder.createSpecialist();
    await builder.createService();
    
    testData = builder.build();
    customer = testData.customer;
    specialist = testData.specialist;
    service = testData.service;
  });

  describe('POST /api/v1/bookings', () => {
    it('should create a new booking successfully', async () => {
      timer.start();

      const bookingData = {
        serviceId: service.id,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        duration: 60,
        customerNotes: 'Test booking notes',
      };

      const response = await request(app)
        .post('/api/v1/bookings')
        .set(createAuthHeaders(customer))
        .send(bookingData)
        .expect(201);

      const duration = timer.end('create-booking');

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('booking');
      expect(response.body.data.booking).toMatchObject({
        customerId: customer.id,
        serviceId: service.id,
        status: 'PENDING',
        customerNotes: 'Test booking notes',
      });

      // Performance assertion
      expect(duration).toBeLessThan(1000); // Should complete within 1 second

      // Verify booking was created in database
      const dbBooking = await testPrisma.booking.findUnique({
        where: { id: response.body.data.booking.id },
      });
      
      expect(dbBooking).toBeTruthy();
      expect(dbBooking?.status).toBe('PENDING');
    });

    it('should fail with invalid service ID', async () => {
      const bookingData = {
        serviceId: 'invalid-uuid',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        duration: 60,
      };

      const response = await request(app)
        .post('/api/v1/bookings')
        .set(createAuthHeaders(customer))
        .send(bookingData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should fail with past scheduled time', async () => {
      const bookingData = {
        serviceId: service.id,
        scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        duration: 60,
      };

      const response = await request(app)
        .post('/api/v1/bookings')
        .set(createAuthHeaders(customer))
        .send(bookingData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should require authentication', async () => {
      const bookingData = {
        serviceId: service.id,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        duration: 60,
      };

      const response = await request(app)
        .post('/api/v1/bookings')
        .send(bookingData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    });

    it('should handle concurrent booking requests', async () => {
      const loadTester = new LoadTester();
      
      const bookingData = {
        serviceId: service.id,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        duration: 60,
        customerNotes: 'Load test booking',
      };

      const testFn = async () => {
        const response = await request(app)
          .post('/api/v1/bookings')
          .set(createAuthHeaders(customer))
          .send({
            ...bookingData,
            scheduledAt: new Date(Date.now() + Math.random() * 72 * 60 * 60 * 1000).toISOString(),
          });
        
        if (response.status !== 201) {
          throw new Error(`Request failed with status ${response.status}`);
        }
      };

      const results = await loadTester.runConcurrent(testFn, 5, 2); // 5 concurrent, 2 iterations each

      expect(results.successRate).toBeGreaterThan(80); // At least 80% success rate
      expect(results.avgDuration).toBeLessThan(2000); // Average response under 2 seconds
    });
  });

  describe('GET /api/v1/bookings/:bookingId', () => {
    let booking: any;

    beforeEach(async () => {
      const builder = new TestDataBuilder();
      await builder.createCustomer();
      await builder.createSpecialist();
      await builder.createService();
      await builder.createBooking();
      
      const data = builder.build();
      customer = data.customer;
      booking = data.booking;
    });

    it('should get booking details successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/bookings/${booking.id}`)
        .set(createAuthHeaders(customer))
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('booking');
      expect(response.body.data.booking).toMatchObject({
        id: booking.id,
        customerId: customer.id,
        status: booking.status,
      });
    });

    it('should return 404 for non-existent booking', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .get(`/api/v1/bookings/${nonExistentId}`)
        .set(createAuthHeaders(customer))
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('should deny access to other users bookings', async () => {
      // Create another customer
      const otherBuilder = new TestDataBuilder();
      await otherBuilder.createCustomer();
      const otherCustomer = otherBuilder.getCustomer();

      const response = await request(app)
        .get(`/api/v1/bookings/${booking.id}`)
        .set(createAuthHeaders(otherCustomer))
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.code).toBe('ACCESS_DENIED');
    });
  });

  describe('PUT /api/v1/bookings/:bookingId', () => {
    let booking: any;

    beforeEach(async () => {
      const builder = new TestDataBuilder();
      await builder.createCustomer();
      await builder.createSpecialist();
      await builder.createService();
      await builder.createBooking();
      
      const data = builder.build();
      customer = data.customer;
      booking = data.booking;
    });

    it('should update booking successfully', async () => {
      const updateData = {
        scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        customerNotes: 'Updated notes',
      };

      const response = await request(app)
        .put(`/api/v1/bookings/${booking.id}`)
        .set(createAuthHeaders(customer))
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.booking.customerNotes).toBe('Updated notes');

      // Verify update in database
      const dbBooking = await testPrisma.booking.findUnique({
        where: { id: booking.id },
      });
      
      expect(dbBooking?.customerNotes).toBe('Updated notes');
    });

    it('should prevent invalid status transitions', async () => {
      // First set booking to COMPLETED
      await testPrisma.booking.update({
        where: { id: booking.id },
        data: { status: 'COMPLETED' },
      });

      const response = await request(app)
        .put(`/api/v1/bookings/${booking.id}`)
        .set(createAuthHeaders(customer))
        .send({ status: 'PENDING' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.code).toBe('BUSINESS_RULE_VIOLATION');
    });
  });

  describe('DELETE /api/v1/bookings/:bookingId/cancel', () => {
    let booking: any;

    beforeEach(async () => {
      const builder = new TestDataBuilder();
      await builder.createCustomer();
      await builder.createSpecialist();
      await builder.createService();
      await builder.createBooking();
      
      const data = builder.build();
      customer = data.customer;
      booking = data.booking;
    });

    it('should cancel booking successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/bookings/${booking.id}/cancel`)
        .set(createAuthHeaders(customer))
        .send({ reason: 'Test cancellation' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.booking.status).toBe('CANCELLED');

      // Verify cancellation in database
      const dbBooking = await testPrisma.booking.findUnique({
        where: { id: booking.id },
      });
      
      expect(dbBooking?.status).toBe('CANCELLED');
    });

    it('should prevent late cancellation', async () => {
      // Set booking to be in 1 hour (within 24-hour cancellation policy)
      await testPrisma.booking.update({
        where: { id: booking.id },
        data: { 
          scheduledAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
        },
      });

      const response = await request(app)
        .delete(`/api/v1/bookings/${booking.id}/cancel`)
        .set(createAuthHeaders(customer))
        .send({ reason: 'Late cancellation attempt' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.code).toBe('CANCELLATION_NOT_ALLOWED');
    });
  });

  describe('GET /api/v1/bookings/user/bookings', () => {
    beforeEach(async () => {
      // Create multiple bookings for testing pagination and filtering
      const builder = new TestDataBuilder();
      await builder.createCustomer();
      await builder.createSpecialist();
      await builder.createService();
      
      customer = builder.getCustomer();
      service = builder.getService();
      specialist = builder.getSpecialist();

      // Create 3 bookings with different statuses
      for (let i = 0; i < 3; i++) {
        await testPrisma.booking.create({
          data: {
            id: `booking-${i}`,
            customerId: customer.id,
            specialistId: specialist.id,
            serviceId: service.id,
            status: i === 0 ? 'PENDING' : i === 1 ? 'CONFIRMED' : 'COMPLETED',
            scheduledAt: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
            duration: 60,
            basePrice: 100.0,
            totalAmount: 100.0,
            depositAmount: 20.0,
            currency: 'USD',
          },
        });
      }
    });

    it('should get user bookings with pagination', async () => {
      timer.start();

      const response = await request(app)
        .get('/api/v1/bookings/user/bookings')
        .query({ page: 1, limit: 2, userType: 'customer' })
        .set(createAuthHeaders(customer))
        .expect(200);

      const duration = timer.end('get-user-bookings');

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.bookings).toHaveLength(2);
      expect(response.body.meta.pagination).toMatchObject({
        currentPage: 1,
        totalItems: 3,
        itemsPerPage: 2,
        hasNext: true,
        hasPrev: false,
      });

      // Performance assertion
      expect(duration).toBeLessThan(500); // Should complete within 500ms
    });

    it('should filter bookings by status', async () => {
      const response = await request(app)
        .get('/api/v1/bookings/user/bookings')
        .query({ status: 'PENDING', userType: 'customer' })
        .set(createAuthHeaders(customer))
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.bookings).toHaveLength(1);
      expect(response.body.data.bookings[0].status).toBe('PENDING');
    });

    it('should return empty array for user with no bookings', async () => {
      // Create a new customer with no bookings
      const newBuilder = new TestDataBuilder();
      await newBuilder.createCustomer();
      const newCustomer = newBuilder.getCustomer();

      const response = await request(app)
        .get('/api/v1/bookings/user/bookings')
        .query({ userType: 'customer' })
        .set(createAuthHeaders(newCustomer))
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.bookings).toHaveLength(0);
      expect(response.body.data.total).toBe(0);
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle high load of booking requests', async () => {
      const loadTester = new LoadTester();
      
      // Create multiple services for testing
      const services = [];
      for (let i = 0; i < 5; i++) {
        const serviceData = {
          id: `service-${i}`,
          specialistId: specialist.specialistProfile.id,
          name: `Test Service ${i}`,
          description: 'Test service description',
          category: 'haircut',
          basePrice: 100.0,
          currency: 'USD',
          duration: 60,
          isActive: true,
          requiresApproval: false,
          maxAdvanceBooking: 30,
          minAdvanceBooking: 1,
        };
        
        const createdService = await testPrisma.service.create({ data: serviceData });
        services.push(createdService);
      }

      const testFn = async () => {
        const randomService = services[Math.floor(Math.random() * services.length)];
        const bookingData = {
          serviceId: randomService.id,
          scheduledAt: new Date(Date.now() + Math.random() * 72 * 60 * 60 * 1000).toISOString(),
          duration: 60,
          customerNotes: 'Load test booking',
        };

        const response = await request(app)
          .post('/api/v1/bookings')
          .set(createAuthHeaders(customer))
          .send(bookingData);
        
        if (response.status !== 201) {
          throw new Error(`Request failed with status ${response.status}: ${response.body.error?.message || 'Unknown error'}`);
        }
        
        return response.body;
      };

      const results = await loadTester.runConcurrent(testFn, 10, 5); // 10 concurrent, 5 iterations each

      // Performance assertions
      expect(results.successRate).toBeGreaterThan(90); // At least 90% success rate
      expect(results.avgDuration).toBeLessThan(3000); // Average response under 3 seconds
      expect(results.p95Duration).toBeLessThan(5000); // 95th percentile under 5 seconds
      expect(results.failed).toBeLessThan(results.total * 0.1); // Less than 10% failures

      console.log('Load test results:', results);
    }, 30000); // 30 second timeout for load test

    it('should have consistent response times for booking retrieval', async () => {
      // Create a booking first
      const builder = new TestDataBuilder();
      await builder.createCustomer();
      await builder.createSpecialist();
      await builder.createService();
      await builder.createBooking();
      
      const testCustomer = builder.getCustomer();
      const testBooking = builder.getBooking();

      const timer = new PerformanceTimer();
      const iterations = 20;

      // Run multiple requests to measure consistency
      for (let i = 0; i < iterations; i++) {
        timer.start();
        
        const response = await request(app)
          .get(`/api/v1/bookings/${testBooking.id}`)
          .set(createAuthHeaders(testCustomer))
          .expect(200);

        timer.end('booking-retrieval');

        expect(response.body).toHaveProperty('success', true);
      }

      const stats = timer.getStats('booking-retrieval');
      expect(stats).toBeTruthy();
      expect(stats!.avg).toBeLessThan(200); // Average under 200ms
      expect(stats!.max).toBeLessThan(500); // Max under 500ms
      expect(stats!.count).toBe(iterations);

      console.log('Booking retrieval performance:', stats);
    });
  });

  describe('Business Rules and Edge Cases', () => {
    it('should prevent double booking in the same time slot', async () => {
      const scheduledTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      // Create first booking
      const firstBookingData = {
        serviceId: service.id,
        scheduledAt: scheduledTime.toISOString(),
        duration: 60,
      };

      await request(app)
        .post('/api/v1/bookings')
        .set(createAuthHeaders(customer))
        .send(firstBookingData)
        .expect(201);

      // Try to create second booking at the same time
      const secondBookingData = {
        serviceId: service.id,
        scheduledAt: scheduledTime.toISOString(),
        duration: 60,
      };

      const response = await request(app)
        .post('/api/v1/bookings')
        .set(createAuthHeaders(customer))
        .send(secondBookingData)
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.code).toBe('BOOKING_CONFLICT');
    });

    it('should handle booking with loyalty points correctly', async () => {
      // Give customer loyalty points
      await testPrisma.user.update({
        where: { id: customer.id },
        data: { loyaltyPoints: 500 },
      });

      const bookingData = {
        serviceId: service.id,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        duration: 60,
        loyaltyPointsUsed: 100,
      };

      const response = await request(app)
        .post('/api/v1/bookings')
        .set(createAuthHeaders(customer))
        .send(bookingData)
        .expect(201);

      expect(response.body.data.booking.loyaltyPointsUsed).toBe(100);

      // Check that loyalty points were deducted
      const updatedCustomer = await testPrisma.user.findUnique({
        where: { id: customer.id },
      });
      
      expect(updatedCustomer?.loyaltyPoints).toBe(400); // 500 - 100
    });

    it('should prevent using more loyalty points than available', async () => {
      // Give customer limited loyalty points
      await testPrisma.user.update({
        where: { id: customer.id },
        data: { loyaltyPoints: 50 },
      });

      const bookingData = {
        serviceId: service.id,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        duration: 60,
        loyaltyPointsUsed: 100, // More than available
      };

      const response = await request(app)
        .post('/api/v1/bookings')
        .set(createAuthHeaders(customer))
        .send(bookingData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.code).toBe('INSUFFICIENT_BALANCE');
    });
  });

  afterAll(async () => {
    // Log performance summary
    const allStats = timer.getAllStats();
    console.log('\n📊 Performance Summary:');
    console.table(allStats);
  });
});