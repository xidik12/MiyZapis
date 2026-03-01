import webpush from 'web-push';
import { PrismaClient } from '@prisma/client';
import { config } from '@/config';
import { logger } from '@/utils/logger';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  data?: Record<string, any>;
}

type BookingNotificationType = 'new' | 'confirmed' | 'cancelled' | 'reminder';

let vapidInitialized = false;

/**
 * Initialize VAPID keys for Web Push.
 * Reads VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_EMAIL from environment.
 */
export const initializeVapid = (): boolean => {
  const publicKey = config.vapid?.publicKey;
  const privateKey = config.vapid?.privateKey;
  const email = config.vapid?.email;

  if (!publicKey || !privateKey || !email) {
    logger.warn('VAPID keys not configured. Web Push notifications will be disabled.', {
      hasPublicKey: !!publicKey,
      hasPrivateKey: !!privateKey,
      hasEmail: !!email,
    });
    return false;
  }

  try {
    webpush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);
    vapidInitialized = true;
    logger.info('VAPID keys initialized successfully for Web Push');
    return true;
  } catch (error) {
    logger.error('Failed to initialize VAPID keys:', error);
    return false;
  }
};

/**
 * Check whether VAPID has been initialized.
 */
export const isVapidInitialized = (): boolean => vapidInitialized;

/**
 * Save a push subscription for a user.
 */
export const saveSubscription = async (
  prisma: PrismaClient,
  userId: string,
  subscription: PushSubscriptionData,
  userAgent?: string
): Promise<void> => {
  try {
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: userAgent || null,
        updatedAt: new Date(),
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: userAgent || null,
      },
    });

    logger.info('Push subscription saved', { userId, endpoint: subscription.endpoint.substring(0, 50) + '...' });
  } catch (error) {
    logger.error('Failed to save push subscription:', error);
    throw error;
  }
};

/**
 * Remove a push subscription by endpoint.
 */
export const removeSubscription = async (
  prisma: PrismaClient,
  endpoint: string
): Promise<void> => {
  try {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint },
    });
    logger.info('Push subscription removed', { endpoint: endpoint.substring(0, 50) + '...' });
  } catch (error) {
    logger.error('Failed to remove push subscription:', error);
    throw error;
  }
};

/**
 * Send a Web Push notification to all subscriptions of a user.
 * Automatically removes expired subscriptions (410 Gone).
 */
export const sendPushToUser = async (
  prisma: PrismaClient,
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<{ sent: number; failed: number }> => {
  if (!vapidInitialized) {
    logger.debug('VAPID not initialized, skipping web push', { userId });
    return { sent: 0, failed: 0 };
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) {
    logger.debug('No push subscriptions found for user', { userId });
    return { sent: 0, failed: 0 };
  }

  const payload: PushPayload = {
    title,
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data,
  };

  const payloadString = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payloadString,
          {
            TTL: 60 * 60, // 1 hour TTL
          }
        );
        return { success: true, endpoint: sub.endpoint };
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        // 410 Gone or 404 Not Found means the subscription is expired
        if (err.statusCode === 410 || err.statusCode === 404) {
          logger.info('Removing expired push subscription', {
            userId,
            endpoint: sub.endpoint.substring(0, 50) + '...',
            statusCode: err.statusCode,
          });
          await prisma.pushSubscription.deleteMany({
            where: { endpoint: sub.endpoint },
          });
        }
        throw error;
      }
    })
  );

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      sent++;
    } else {
      failed++;
      logger.debug('Push notification delivery failed for one subscription', {
        userId,
        error: result.reason?.message || 'Unknown error',
      });
    }
  });

  logger.info('Push notifications sent', { userId, sent, failed, total: subscriptions.length });
  return { sent, failed };
};

/**
 * Send booking-related push notifications.
 */
export const sendBookingNotification = async (
  prisma: PrismaClient,
  booking: {
    id: string;
    customerId: string;
    specialistId: string;
    scheduledAt: Date;
    service?: { name: string } | null;
    customer?: { firstName: string; lastName: string } | null;
    specialist?: { firstName: string; lastName: string } | null;
  },
  type: BookingNotificationType
): Promise<void> => {
  const serviceName = booking.service?.name || 'Service';
  const customerName = booking.customer
    ? `${booking.customer.firstName} ${booking.customer.lastName}`
    : 'Customer';
  const specialistName = booking.specialist
    ? `${booking.specialist.firstName} ${booking.specialist.lastName}`
    : 'Specialist';

  const scheduledDate = new Date(booking.scheduledAt).toLocaleString();

  switch (type) {
    case 'new': {
      // Notify specialist about new booking
      await sendPushToUser(prisma, booking.specialistId, 'New Booking Request', `${customerName} booked ${serviceName} for ${scheduledDate}`, {
        type: 'BOOKING_NEW',
        bookingId: booking.id,
        url: `/specialist/bookings/${booking.id}`,
      });
      // Notify customer about booking confirmation pending
      await sendPushToUser(prisma, booking.customerId, 'Booking Request Sent', `Your booking for ${serviceName} on ${scheduledDate} has been submitted.`, {
        type: 'BOOKING_PENDING',
        bookingId: booking.id,
        url: `/customer/bookings/${booking.id}`,
      });
      break;
    }
    case 'confirmed': {
      // Notify customer that booking is confirmed
      await sendPushToUser(prisma, booking.customerId, 'Booking Confirmed', `Your booking for ${serviceName} on ${scheduledDate} has been confirmed by ${specialistName}.`, {
        type: 'BOOKING_CONFIRMED',
        bookingId: booking.id,
        url: `/customer/bookings/${booking.id}`,
      });
      break;
    }
    case 'cancelled': {
      // Notify both parties
      await sendPushToUser(prisma, booking.customerId, 'Booking Cancelled', `Your booking for ${serviceName} on ${scheduledDate} has been cancelled.`, {
        type: 'BOOKING_CANCELLED',
        bookingId: booking.id,
        url: `/customer/bookings`,
      });
      await sendPushToUser(prisma, booking.specialistId, 'Booking Cancelled', `The booking for ${serviceName} on ${scheduledDate} with ${customerName} has been cancelled.`, {
        type: 'BOOKING_CANCELLED',
        bookingId: booking.id,
        url: `/specialist/bookings`,
      });
      break;
    }
    case 'reminder': {
      // Remind customer about upcoming booking
      await sendPushToUser(prisma, booking.customerId, 'Booking Reminder', `Reminder: Your appointment for ${serviceName} is scheduled for ${scheduledDate}.`, {
        type: 'BOOKING_REMINDER',
        bookingId: booking.id,
        url: `/customer/bookings/${booking.id}`,
      });
      // Remind specialist about upcoming booking
      await sendPushToUser(prisma, booking.specialistId, 'Upcoming Appointment', `Reminder: You have an appointment for ${serviceName} with ${customerName} at ${scheduledDate}.`, {
        type: 'BOOKING_REMINDER',
        bookingId: booking.id,
        url: `/specialist/bookings/${booking.id}`,
      });
      break;
    }
  }
};

export const pushService = {
  initializeVapid,
  isVapidInitialized,
  saveSubscription,
  removeSubscription,
  sendPushToUser,
  sendBookingNotification,
};

export default pushService;
