import { PrismaClient, User, Notification } from '@prisma/client';
import nodemailer from 'nodemailer';
import { logger } from '@/utils/logger';
import { config } from '@/config';
import { redis } from '@/config/redis';
import { EmailService } from '@/services/email';
import axios from 'axios';

interface NotificationData {
  type: string;
  title: string;
  message: string;
  data?: any;
  emailTemplate?: string;
  smsTemplate?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SMSOptions {
  to: string;
  message: string;
}

export class NotificationService {
  private prisma: PrismaClient;
  private emailService: EmailService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.emailService = new EmailService();
  }

  async sendNotification(userId: string, data: NotificationData): Promise<Notification> {
    try {
      // Get user preferences
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          phoneNumber: true,
          telegramId: true,
          emailNotifications: true,
          pushNotifications: true,
          telegramNotifications: true,
          language: true,
          firstName: true,
          lastName: true,
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Create notification record
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data ? JSON.stringify(data.data) : null,
        }
      });

      // Send via different channels based on user preferences
      const promises = [];

      // Email notification
      if (user.emailNotifications && user.email && data.emailTemplate) {
        promises.push(this.sendEmailNotification(user, data, notification.id));
      }

      // SMS notification
      if (user.phoneNumber && data.smsTemplate) {
        promises.push(this.sendSMSNotification(user, data, notification.id));
      }

      // Telegram notification
      if (user.telegramNotifications && user.telegramId) {
        promises.push(this.sendTelegramNotification(user, data, notification.id));
      }

      // Push notification (via WebSocket or Firebase)
      if (user.pushNotifications) {
        promises.push(this.sendPushNotification(user, data, notification.id));
      }

      // Execute all notification sends in parallel
      await Promise.allSettled(promises);

      return notification;
    } catch (error) {
      logger.error('Error sending notification:', error);
      throw error;
    }
  }

  private async sendEmailNotification(
    user: any,
    data: NotificationData,
    notificationId: string
  ): Promise<void> {
    try {
      logger.info('Attempting to send email notification', {
        userId: user.id,
        email: user.email,
        type: data.type,
        emailTemplate: data.emailTemplate
      });

      let emailSent = false;

      // Use specific email methods based on notification type
      if (data.type === 'BOOKING_CONFIRMED' || data.type === 'BOOKING_PENDING' || data.type === 'BOOKING_REQUEST') {
        // Create a simple booking notification email
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${data.title}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .booking-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${data.title}</h1>
            </div>
            <div class="content">
              <h2>Hi ${user.firstName}!</h2>
              <p>${data.message}</p>
              
              <div class="booking-details">
                <h3>Booking Details:</h3>
                ${data.data ? Object.entries(data.data).map(([key, value]) => 
                  `<p><strong>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> ${value}</p>`
                ).join('') : ''}
              </div>
              
              <p>You can view and manage your bookings by logging into your MiyZapis account.</p>
            </div>
            <div class="footer">
              <p>© 2024 MiyZapis. All rights reserved.</p>
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
        `;

        emailSent = await this.emailService.sendEmail({
          to: user.email,
          subject: data.title,
          html,
          text: `${data.title}\n\nHi ${user.firstName}!\n\n${data.message}\n\nBooking Details:\n${data.data ? Object.entries(data.data).map(([key, value]) => `${key}: ${value}`).join('\n') : ''}`
        });
      } else {
        // Fallback for other notification types
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${data.title}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${data.title}</h1>
            </div>
            <div class="content">
              <h2>Hi ${user.firstName}!</h2>
              <p>${data.message}</p>
            </div>
            <div class="footer">
              <p>© 2024 MiyZapis. All rights reserved.</p>
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
        `;

        emailSent = await this.emailService.sendEmail({
          to: user.email,
          subject: data.title,
          html,
          text: `${data.title}\n\nHi ${user.firstName}!\n\n${data.message}`
        });
      }

      if (emailSent) {
        // Update notification status
        await this.prisma.notification.update({
          where: { id: notificationId },
          data: { emailSent: true }
        });

        logger.info('Email notification sent successfully', {
          userId: user.id,
          email: user.email,
          type: data.type
        });
      } else {
        logger.warn('Email notification failed to send', {
          userId: user.id,
          email: user.email,
          type: data.type
        });
      }
    } catch (error) {
      logger.error('Error sending email notification:', {
        error: error instanceof Error ? error.message : String(error),
        userId: user.id,
        email: user.email,
        type: data.type
      });
    }
  }

  private async sendSMSNotification(
    user: any,
    data: NotificationData,
    notificationId: string
  ): Promise<void> {
    try {
      logger.info('Attempting to send SMS notification', {
        userId: user.id,
        phoneNumber: user.phoneNumber ? `${user.phoneNumber.substring(0, 5)}...` : 'NOT_SET',
        type: data.type
      });

      if (!user.phoneNumber) {
        logger.warn('User has no phone number, skipping SMS notification', {
          userId: user.id,
          type: data.type
        });
        return;
      }

      // Create simple SMS message
      let smsMessage = `${data.title}\n\nHi ${user.firstName}!\n\n${data.message}`;

      // Add booking details for booking notifications
      if (data.data && (data.type === 'BOOKING_CONFIRMED' || data.type === 'BOOKING_PENDING' || data.type === 'BOOKING_REQUEST')) {
        smsMessage += `\n\nService: ${data.data.serviceName || 'N/A'}`;
        if (data.data.scheduledAt) {
          smsMessage += `\nDate: ${new Date(data.data.scheduledAt).toLocaleDateString()}`;
        }
      }

      smsMessage += '\n\n- MiyZapis';

      // Send SMS (integrate with SMS provider)
      try {
        await this.sendSMS({
          to: user.phoneNumber,
          message: smsMessage
        });

        // Update notification status
        await this.prisma.notification.update({
          where: { id: notificationId },
          data: { smsSent: true }
        });

        logger.info('SMS notification sent successfully', {
          userId: user.id,
          phoneNumber: user.phoneNumber.substring(0, 5) + '...',
          type: data.type
        });
      } catch (smsError) {
        logger.warn('SMS sending failed (provider issue)', {
          userId: user.id,
          type: data.type,
          error: smsError instanceof Error ? smsError.message : String(smsError)
        });
      }
    } catch (error) {
      logger.error('Error sending SMS notification:', {
        error: error instanceof Error ? error.message : String(error),
        userId: user.id,
        type: data.type
      });
    }
  }

  private async sendTelegramNotification(
    user: any,
    data: NotificationData,
    notificationId: string
  ): Promise<void> {
    try {
      if (!config.telegram.botToken) {
        logger.warn('Telegram bot token not configured');
        return;
      }

      const message = `*${data.title}*\n\n${data.message}`;

      await axios.post(`https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`, {
        chat_id: user.telegramId,
        text: message,
        parse_mode: 'Markdown'
      });

      // Update notification status
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { telegramSent: true }
      });

      logger.info('Telegram notification sent successfully', {
        userId: user.id,
        telegramId: user.telegramId,
        type: data.type
      });
    } catch (error) {
      logger.error('Error sending Telegram notification:', error);
    }
  }

  private async sendPushNotification(
    user: any,
    data: NotificationData,
    notificationId: string
  ): Promise<void> {
    try {
      // Store notification in Redis for real-time delivery
      if (redis) {
        await redis.lpush(
          `notifications:${user.id}`,
          JSON.stringify({
            id: notificationId,
            type: data.type,
            title: data.title,
            message: data.message,
            data: data.data,
            timestamp: new Date().toISOString()
          })
        );

        // Keep only last 100 notifications per user
        await redis.ltrim(`notifications:${user.id}`, 0, 99);
      }

      // Update notification status
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { pushSent: true }
      });

      logger.info('Push notification queued successfully', {
        userId: user.id,
        type: data.type
      });
    } catch (error) {
      logger.error('Error sending push notification:', error);
    }
  }

  private async sendSMS(options: SMSOptions): Promise<void> {
    // Integrate with SMS provider (Twilio, MessageBird, etc.)
    // This is a placeholder implementation
    logger.info('SMS would be sent:', options);
  }

  private replaceTemplateVariables(template: string, variables: Record<string, any>): string {
    let result = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value || ''));
    });

    return result;
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId
      }
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
  }

  async getUserNotifications(
    userId: string,
    filters: {
      type?: string;
      isRead?: boolean;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<any> {
    const {
      type,
      isRead,
      page = 1,
      limit = 20
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (type) where.type = type;
    if (isRead !== undefined) where.isRead = isRead;

    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const total = await this.prisma.notification.count({ where });

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });
  }

  // Bulk notification methods for admin/system use
  async sendBulkNotification(
    userIds: string[],
    data: NotificationData
  ): Promise<void> {
    const promises = userIds.map(userId => 
      this.sendNotification(userId, data).catch(error => 
        logger.error(`Failed to send notification to user ${userId}:`, error)
      )
    );

    await Promise.allSettled(promises);
  }

  async sendNotificationToAllUsers(data: NotificationData): Promise<void> {
    // Get all active users in batches
    const batchSize = 100;
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const users = await this.prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
        skip,
        take: batchSize
      });

      if (users.length === 0) {
        hasMore = false;
        break;
      }

      const userIds = users.map(user => user.id);
      await this.sendBulkNotification(userIds, data);

      skip += batchSize;
      hasMore = users.length === batchSize;
    }
  }

  // Booking-specific notification helpers
  async sendBookingNotification(
    bookingId: string,
    type: string,
    customTitle?: string,
    customMessage?: string
  ): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        specialist: true,
        service: true
      }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    const notificationData: NotificationData = {
      type,
      title: customTitle || this.getDefaultBookingTitle(type),
      message: customMessage || this.getDefaultBookingMessage(type, booking),
      data: {
        bookingId: booking.id,
        serviceId: booking.serviceId,
        specialistId: booking.specialistId,
        customerId: booking.customerId,
        scheduledAt: booking.scheduledAt,
        serviceName: booking.service.name
      },
      emailTemplate: this.getBookingEmailTemplate(type),
      smsTemplate: this.getBookingSMSTemplate(type)
    };

    // Send to customer and specialist
    await Promise.all([
      this.sendNotification(booking.customerId, notificationData),
      this.sendNotification(booking.specialistId, notificationData)
    ]);
  }

  private getDefaultBookingTitle(type: string): string {
    const titles: Record<string, string> = {
      'BOOKING_CREATED': 'Нове бронювання',
      'BOOKING_CONFIRMED': 'Бронювання підтверджено',
      'BOOKING_PENDING': 'Запит на бронювання відправлено',
      'BOOKING_REQUEST': 'Новий запит на бронювання',
      'BOOKING_CANCELLED': 'Бронювання скасовано',
      'BOOKING_COMPLETED': 'Послуга завершена',
      'PAYMENT_RECEIVED': 'Оплата отримана',
      'REVIEW_RECEIVED': 'Новий відгук'
    };

    return titles[type] || 'Сповіщення';
  }

  private getDefaultBookingMessage(type: string, booking: any): string {
    const serviceName = booking.service.name;
    const scheduledAt = new Date(booking.scheduledAt).toLocaleString('uk-UA');

    const messages: Record<string, string> = {
      'BOOKING_CREATED': `Створено нове бронювання на послугу "${serviceName}" на ${scheduledAt}`,
      'BOOKING_CONFIRMED': `Ваше бронювання на послугу "${serviceName}" підтверджено на ${scheduledAt}`,
      'BOOKING_PENDING': `Ваш запит на бронювання послуги "${serviceName}" відправлено спеціалісту і очікує підтвердження`,
      'BOOKING_REQUEST': `Новий запит на бронювання послуги "${serviceName}" на ${scheduledAt} - потрібне ваше підтвердження`,
      'BOOKING_CANCELLED': `Бронювання на послугу "${serviceName}" було скасовано`,
      'BOOKING_COMPLETED': `Послуга "${serviceName}" успішно завершена`,
      'PAYMENT_RECEIVED': `Оплата за послугу "${serviceName}" отримана`,
      'REVIEW_RECEIVED': `Отримано новий відгук для послуги "${serviceName}"`
    };

    return messages[type] || 'У вас нове сповіщення';
  }

  private getBookingEmailTemplate(type: string): string {
    const templates: Record<string, string> = {
      'BOOKING_CREATED': 'booking_created',
      'BOOKING_CONFIRMED': 'booking_confirmed',
      'BOOKING_PENDING': 'booking_pending',
      'BOOKING_REQUEST': 'specialist_booking_request',
      'BOOKING_CANCELLED': 'booking_cancelled',
      'BOOKING_COMPLETED': 'booking_completed',
      'PAYMENT_RECEIVED': 'payment_received',
      'REVIEW_RECEIVED': 'review_received'
    };

    return templates[type] || 'general_notification';
  }

  private getBookingSMSTemplate(type: string): string {
    const templates: Record<string, string> = {
      'BOOKING_CREATED': 'booking_created_sms',
      'BOOKING_CONFIRMED': 'booking_confirmed_sms',
      'BOOKING_PENDING': 'booking_pending_sms',
      'BOOKING_REQUEST': 'specialist_booking_request_sms',
      'BOOKING_CANCELLED': 'booking_cancelled_sms',
      'BOOKING_COMPLETED': 'booking_completed_sms'
    };

    return templates[type] || 'general_notification_sms';
  }
}