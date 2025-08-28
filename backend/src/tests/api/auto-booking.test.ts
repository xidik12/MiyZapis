import request from 'supertest';
import { app } from '@/app';
import { prisma } from '@/config/database';
import { AuthService } from '@/services/auth';

describe('Auto-booking functionality', () => {
  let customerToken: string;
  let specialistToken: string;
  let autoBookingSpecialistId: string;
  let manualBookingSpecialistId: string;
  let serviceWithAutoBooking: string;
  let serviceWithManualBooking: string;
  let customerId: string;

  beforeAll(async () => {
    // Create test customer
    const customerUser = await prisma.user.create({
      data: {
        email: 'customer@test.com',
        firstName: 'Test',
        lastName: 'Customer',
        password: await AuthService.hashPassword('password'),
        userType: 'CUSTOMER',
        emailNotifications: true,
        isActive: true,
      },
    });
    customerId = customerUser.id;
    customerToken = await AuthService.generateToken(customerUser);

    // Create specialist with auto-booking enabled
    const autoBookingUser = await prisma.user.create({
      data: {
        email: 'auto-specialist@test.com',
        firstName: 'Auto',
        lastName: 'Specialist',
        password: await AuthService.hashPassword('password'),
        userType: 'SPECIALIST',
        emailNotifications: true,
        isActive: true,
      },
    });
    const autoBookingSpecialist = await prisma.specialist.create({
      data: {
        userId: autoBookingUser.id,
        specialties: JSON.stringify(['massage']),
        autoBooking: true, // Auto-booking enabled
        workingHours: JSON.stringify({
          monday: { start: '09:00', end: '17:00' }
        }),
      },
    });
    autoBookingSpecialistId = autoBookingUser.id;

    // Create specialist with manual booking (auto-booking disabled)
    const manualBookingUser = await prisma.user.create({
      data: {
        email: 'manual-specialist@test.com',
        firstName: 'Manual',
        lastName: 'Specialist',
        password: await AuthService.hashPassword('password'),
        userType: 'SPECIALIST',
        emailNotifications: true,
        isActive: true,
      },
    });
    const manualBookingSpecialist = await prisma.specialist.create({
      data: {
        userId: manualBookingUser.id,
        specialties: JSON.stringify(['massage']),
        autoBooking: false, // Auto-booking disabled
        workingHours: JSON.stringify({
          monday: { start: '09:00', end: '17:00' }
        }),
      },
    });
    manualBookingSpecialistId = manualBookingUser.id;
    specialistToken = await AuthService.generateToken(manualBookingUser);

    // Create services
    const autoService = await prisma.service.create({
      data: {
        specialistId: autoBookingSpecialist.id,
        name: 'Auto-booking Massage',
        description: 'Massage with auto-booking',
        category: 'wellness',
        basePrice: 100,
        duration: 60,
        requirements: JSON.stringify([]),
        deliverables: JSON.stringify([]),
        isActive: true,
      },
    });
    serviceWithAutoBooking = autoService.id;

    const manualService = await prisma.service.create({
      data: {
        specialistId: manualBookingSpecialist.id,
        name: 'Manual-booking Massage',
        description: 'Massage with manual booking',
        category: 'wellness',
        basePrice: 100,
        duration: 60,
        requirements: JSON.stringify([]),
        deliverables: JSON.stringify([]),
        isActive: true,
      },
    });
    serviceWithManualBooking = manualService.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.booking.deleteMany({
      where: {
        OR: [
          { customerId },
          { specialistId: autoBookingSpecialistId },
          { specialistId: manualBookingSpecialistId }
        ]
      }
    });
    
    await prisma.service.deleteMany({
      where: {
        OR: [
          { id: serviceWithAutoBooking },
          { id: serviceWithManualBooking }
        ]
      }
    });

    await prisma.specialist.deleteMany({
      where: {
        OR: [
          { userId: autoBookingSpecialistId },
          { userId: manualBookingSpecialistId }
        ]
      }
    });

    await prisma.user.deleteMany({
      where: {
        OR: [
          { id: customerId },
          { id: autoBookingSpecialistId },
          { id: manualBookingSpecialistId }
        ]
      }
    });
  });

  describe('Auto-booking enabled specialist', () => {
    it('should automatically confirm booking when auto-booking is enabled', async () => {
      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceId: serviceWithAutoBooking,
          scheduledAt: scheduledAt.toISOString(),
          duration: 60,
          customerNotes: 'Test auto-booking',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.booking.status).toBe('CONFIRMED');
      expect(response.body.data.booking.confirmedAt).toBeTruthy();
      expect(response.body.data.autoBooking).toBe(true);
      expect(response.body.data.message).toContain('automatically confirmed');
    });
  });

  describe('Auto-booking disabled specialist', () => {
    it('should create pending booking when auto-booking is disabled', async () => {
      const scheduledAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // Day after tomorrow
      
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceId: serviceWithManualBooking,
          scheduledAt: scheduledAt.toISOString(),
          duration: 60,
          customerNotes: 'Test manual booking',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.booking.status).toBe('PENDING');
      expect(response.body.data.booking.confirmedAt).toBeNull();
      expect(response.body.data.autoBooking).toBe(false);
      expect(response.body.data.message).toContain('waiting for specialist confirmation');
    });

    it('should allow specialist to confirm pending booking', async () => {
      // First create a pending booking
      const scheduledAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 3 days from now
      
      const bookingResponse = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceId: serviceWithManualBooking,
          scheduledAt: scheduledAt.toISOString(),
          duration: 60,
        });

      const bookingId = bookingResponse.body.data.booking.id;

      // Specialist confirms the booking
      const confirmResponse = await request(app)
        .put(`/api/bookings/${bookingId}/confirm`)
        .set('Authorization', `Bearer ${specialistToken}`)
        .send();

      expect(confirmResponse.status).toBe(200);
      expect(confirmResponse.body.success).toBe(true);
      expect(confirmResponse.body.data.booking.status).toBe('CONFIRMED');
      expect(confirmResponse.body.data.booking.confirmedAt).toBeTruthy();
      expect(confirmResponse.body.data.message).toContain('confirmed successfully');
    });

    it('should allow specialist to reject pending booking', async () => {
      // First create a pending booking
      const scheduledAt = new Date(Date.now() + 96 * 60 * 60 * 1000); // 4 days from now
      
      const bookingResponse = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceId: serviceWithManualBooking,
          scheduledAt: scheduledAt.toISOString(),
          duration: 60,
        });

      const bookingId = bookingResponse.body.data.booking.id;

      // Specialist rejects the booking
      const rejectResponse = await request(app)
        .put(`/api/bookings/${bookingId}/reject`)
        .set('Authorization', `Bearer ${specialistToken}`)
        .send({
          reason: 'Not available at that time'
        });

      expect(rejectResponse.status).toBe(200);
      expect(rejectResponse.body.success).toBe(true);
      expect(rejectResponse.body.data.booking.status).toBe('CANCELLED');
      expect(rejectResponse.body.data.booking.cancellationReason).toBe('Not available at that time');
    });
  });

  describe('Specialist settings update', () => {
    it('should allow specialist to update auto-booking setting', async () => {
      const response = await request(app)
        .put('/api/specialists/profile')
        .set('Authorization', `Bearer ${specialistToken}`)
        .send({
          autoBooking: true
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify the setting was updated
      const specialist = await prisma.specialist.findUnique({
        where: { userId: manualBookingSpecialistId }
      });
      expect(specialist?.autoBooking).toBe(true);
    });
  });
});