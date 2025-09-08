import nodemailer, { Transporter } from 'nodemailer';
import { logger } from '@/utils/logger';
import { config } from '@/config';
import { getEmailTemplate, replacePlaceholders } from './templates';
import { prisma } from '@/config/database';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

interface TemplateEmailOptions {
  to: string | string[];
  templateKey: string;
  language?: string;
  data: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export class EnhancedEmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  private initializeTransporter() {
    try {
      if (!config.email.smtp.host || !config.email.smtp.auth.user) {
        logger.warn('Email service not configured - emails will be logged instead of sent');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: config.email.smtp.secure,
        auth: {
          user: config.email.smtp.auth.user,
          pass: config.email.smtp.auth.pass,
        },
        tls: {
          rejectUnauthorized: false, // For development
        },
      });

      this.isConfigured = true;
      logger.info('Email service initialized successfully');

      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error('Email transporter verification failed:', error);
          this.isConfigured = false;
        } else {
          logger.info('Email transporter verified successfully');
        }
      });

    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Send email with template
   */
  async sendTemplateEmail(options: TemplateEmailOptions): Promise<boolean> {
    try {
      const { to, templateKey, language = 'en', data, attachments } = options;

      // Get email template
      const template = getEmailTemplate(templateKey, language);
      
      // Replace placeholders
      const subject = replacePlaceholders(template.subject, data);
      const html = replacePlaceholders(template.html, data);
      const text = replacePlaceholders(template.text, data);

      // Send email
      return await this.sendEmail({
        to,
        subject,
        html,
        text,
        attachments,
      });

    } catch (error) {
      logger.error('Failed to send template email:', error);
      return false;
    }
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const { to, subject, html, text, attachments } = options;

      if (!this.isConfigured || !this.transporter) {
        logger.warn('Email not configured - logging email instead:', {
          to,
          subject,
          textPreview: text?.substring(0, 100),
        });
        return true; // Return true for development
      }

      const recipients = Array.isArray(to) ? to : [to];

      // Send to each recipient
      for (const recipient of recipients) {
        const mailOptions = {
          from: config.email.from,
          to: recipient,
          subject,
          html,
          text,
          attachments,
        };

        const result = await this.transporter.sendMail(mailOptions);
        
        // Log email sent
        await this.logEmail({
          recipient,
          subject,
          status: 'SENT',
          messageId: result.messageId,
        });

        logger.info('Email sent successfully', {
          to: recipient,
          subject,
          messageId: result.messageId,
        });
      }

      return true;

    } catch (error) {
      logger.error('Failed to send email:', error);

      // Log failed email
      if (options.to) {
        const recipient = Array.isArray(options.to) ? options.to[0] : options.to;
        await this.logEmail({
          recipient,
          subject: options.subject,
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      return false;
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(userId: string, language: string = 'en'): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        logger.error('User not found for welcome email:', userId);
        return false;
      }

      const dashboardUrl = `${config.frontend.url}/dashboard`;
      const helpUrl = `${config.frontend.url}/help`;

      return await this.sendTemplateEmail({
        to: user.email,
        templateKey: 'welcome',
        language,
        data: {
          firstName: user.firstName,
          lastName: user.lastName,
          dashboardUrl,
          helpUrl,
        },
      });

    } catch (error) {
      logger.error('Failed to send welcome email:', error);
      return false;
    }
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(userId: string, token: string, language: string = 'en'): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        logger.error('User not found for email verification:', userId);
        return false;
      }

      const verificationUrl = `${config.frontend.url}/auth/verify-email?token=${token}`;

      return await this.sendTemplateEmail({
        to: user.email,
        templateKey: 'emailVerification',
        language,
        data: {
          firstName: user.firstName,
          verificationUrl,
        },
      });

    } catch (error) {
      logger.error('Failed to send email verification:', error);
      return false;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(userId: string, token: string, language: string = 'en'): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        logger.error('User not found for password reset:', userId);
        return false;
      }

      const resetUrl = `${config.frontend.url}/auth/reset-password?token=${token}`;

      return await this.sendTemplateEmail({
        to: user.email,
        templateKey: 'passwordReset',
        language,
        data: {
          firstName: user.firstName,
          resetUrl,
        },
      });

    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      return false;
    }
  }

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmation(bookingId: string, language: string = 'en'): Promise<boolean> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          customer: true,
          specialist: {
            include: {
              user: true,
            },
          },
          service: true,
        },
      });

      if (!booking) {
        logger.error('Booking not found for confirmation email:', bookingId);
        return false;
      }

      const bookingUrl = `${config.frontend.url}/bookings/${bookingId}`;
      const chatUrl = `${config.frontend.url}/messages/booking/${bookingId}`;

      // Format date and time
      const bookingDateTime = new Intl.DateTimeFormat(language === 'uk' ? 'uk-UA' : language === 'ru' ? 'ru-RU' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: booking.customer.timezone,
      }).format(new Date(booking.scheduledAt));

      return await this.sendTemplateEmail({
        to: booking.customer.email,
        templateKey: 'bookingConfirmation',
        language,
        data: {
          customerName: booking.customer.firstName,
          serviceName: booking.service.name,
          specialistName: `${booking.specialist.user.firstName} ${booking.specialist.user.lastName}`,
          bookingDateTime,
          duration: booking.duration,
          totalAmount: booking.totalAmount,
          currency: booking.customer.currency,
          customerNotes: booking.customerNotes,
          bookingUrl,
          chatUrl,
        },
      });

    } catch (error) {
      logger.error('Failed to send booking confirmation email:', error);
      return false;
    }
  }

  /**
   * Send booking reminder email
   */
  async sendBookingReminder(bookingId: string, language: string = 'en'): Promise<boolean> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          customer: true,
          specialist: {
            include: {
              user: true,
            },
          },
          service: true,
        },
      });

      if (!booking || booking.status !== 'CONFIRMED') {
        return false;
      }

      // Check if booking is within 24 hours
      const now = new Date();
      const bookingTime = new Date(booking.scheduledAt);
      const hoursUntilBooking = (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilBooking > 24 || hoursUntilBooking < 0) {
        return false; // Too early or booking already passed
      }

      const bookingUrl = `${config.frontend.url}/bookings/${bookingId}`;

      // Format date and time
      const bookingDateTime = new Intl.DateTimeFormat(language === 'uk' ? 'uk-UA' : language === 'ru' ? 'ru-RU' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: booking.customer.timezone,
      }).format(new Date(booking.scheduledAt));

      // Create reminder email content (simplified)
      const reminderData = {
        customerName: booking.customer.firstName,
        serviceName: booking.service.name,
        specialistName: `${booking.specialist.user.firstName} ${booking.specialist.user.lastName}`,
        bookingDateTime,
        bookingUrl,
        hoursUntil: Math.round(hoursUntilBooking),
      };

      const subject = language === 'uk' 
        ? `Нагадування про запис завтра - ${booking.service.name}`
        : language === 'ru'
        ? `Напоминание о записи завтра - ${booking.service.name}`
        : `Booking Reminder Tomorrow - ${booking.service.name}`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>${language === 'uk' ? 'Нагадування про ваш запис' : language === 'ru' ? 'Напоминание о вашей записи' : 'Booking Reminder'}</h2>
          <p>${language === 'uk' ? 'Привіт' : language === 'ru' ? 'Привет' : 'Hello'} ${booking.customer.firstName},</p>
          <p>${language === 'uk' 
            ? `Нагадуємо, що у вас є запис завтра:`
            : language === 'ru' 
            ? `Напоминаем, что у вас есть запись завтра:`
            : 'This is a reminder that you have a booking tomorrow:'
          }</p>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>${language === 'uk' ? 'Послуга' : language === 'ru' ? 'Услуга' : 'Service'}:</strong> ${booking.service.name}</p>
            <p><strong>${language === 'uk' ? 'Спеціаліст' : language === 'ru' ? 'Специалист' : 'Specialist'}:</strong> ${reminderData.specialistName}</p>
            <p><strong>${language === 'uk' ? 'Дата і час' : language === 'ru' ? 'Дата и время' : 'Date & Time'}:</strong> ${bookingDateTime}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${bookingUrl}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              ${language === 'uk' ? 'Переглянути запис' : language === 'ru' ? 'Посмотреть запись' : 'View Booking'}
            </a>
          </div>
        </div>
      `;

      return await this.sendEmail({
        to: booking.customer.email,
        subject,
        html,
      });

    } catch (error) {
      logger.error('Failed to send booking reminder email:', error);
      return false;
    }
  }

  /**
   * Send specialist notification email for new booking
   */
  async sendSpecialistBookingNotification(bookingId: string, language: string = 'en'): Promise<boolean> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          customer: true,
          specialist: {
            include: {
              user: true,
            },
          },
          service: true,
        },
      });

      if (!booking) {
        return false;
      }

      const bookingUrl = `${config.frontend.url}/specialist/bookings/${bookingId}`;

      // Format date and time
      const bookingDateTime = new Intl.DateTimeFormat(language === 'uk' ? 'uk-UA' : language === 'ru' ? 'ru-RU' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: booking.specialist.user.timezone,
      }).format(new Date(booking.scheduledAt));

      const subject = language === 'uk' 
        ? `Новий запис - ${booking.service.name}`
        : language === 'ru'
        ? `Новая запись - ${booking.service.name}`
        : `New Booking - ${booking.service.name}`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>${language === 'uk' ? 'У вас новий запис!' : language === 'ru' ? 'У вас новая запись!' : 'You have a new booking!'}</h2>
          <p>${language === 'uk' ? 'Привіт' : language === 'ru' ? 'Привет' : 'Hello'} ${booking.specialist.user.firstName},</p>
          <p>${language === 'uk' 
            ? `У вас новий запис від клієнта:`
            : language === 'ru' 
            ? `У вас новая запись от клиента:`
            : 'You have a new booking from a customer:'
          }</p>
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>${language === 'uk' ? 'Клієнт' : language === 'ru' ? 'Клиент' : 'Customer'}:</strong> ${booking.customer.firstName} ${booking.customer.lastName}</p>
            <p><strong>${language === 'uk' ? 'Послуга' : language === 'ru' ? 'Услуга' : 'Service'}:</strong> ${booking.service.name}</p>
            <p><strong>${language === 'uk' ? 'Дата і час' : language === 'ru' ? 'Дата и время' : 'Date & Time'}:</strong> ${bookingDateTime}</p>
            <p><strong>${language === 'uk' ? 'Сума' : language === 'ru' ? 'Сумма' : 'Amount'}:</strong> ${booking.totalAmount} ${booking.customer.currency}</p>
            ${booking.customerNotes ? `<p><strong>${language === 'uk' ? 'Примітки клієнта' : language === 'ru' ? 'Примечания клиента' : 'Customer Notes'}:</strong> ${booking.customerNotes}</p>` : ''}
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${bookingUrl}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              ${language === 'uk' ? 'Переглянути запис' : language === 'ru' ? 'Посмотреть запись' : 'View Booking'}
            </a>
          </div>
        </div>
      `;

      return await this.sendEmail({
        to: booking.specialist.user.email,
        subject,
        html,
      });

    } catch (error) {
      logger.error('Failed to send specialist booking notification:', error);
      return false;
    }
  }

  /**
   * Log email to database
   */
  private async logEmail(data: {
    recipient: string;
    subject: string;
    status: 'SENT' | 'FAILED';
    messageId?: string;
    error?: string;
  }) {
    try {
      await prisma.emailLog.create({
        data: {
          recipient: data.recipient,
          subject: data.subject,
          status: data.status,
          messageId: data.messageId,
          error: data.error,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Failed to log email:', error);
    }
  }

  /**
   * Get email statistics
   */
  async getEmailStats(days: number = 30): Promise<{
    totalSent: number;
    totalFailed: number;
    successRate: number;
    recentEmails: Array<{
      recipient: string;
      subject: string;
      status: string;
      sentAt: Date;
    }>;
  }> {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const [totalSent, totalFailed, recentEmails] = await Promise.all([
        prisma.emailLog.count({
          where: {
            status: 'SENT',
            sentAt: { gte: fromDate },
          },
        }),
        prisma.emailLog.count({
          where: {
            status: 'FAILED',
            sentAt: { gte: fromDate },
          },
        }),
        prisma.emailLog.findMany({
          where: {
            sentAt: { gte: fromDate },
          },
          select: {
            recipient: true,
            subject: true,
            status: true,
            sentAt: true,
          },
          orderBy: { sentAt: 'desc' },
          take: 20,
        }),
      ]);

      const total = totalSent + totalFailed;
      const successRate = total > 0 ? (totalSent / total) * 100 : 100;

      return {
        totalSent,
        totalFailed,
        successRate: Math.round(successRate * 100) / 100,
        recentEmails,
      };

    } catch (error) {
      logger.error('Failed to get email stats:', error);
      return {
        totalSent: 0,
        totalFailed: 0,
        successRate: 0,
        recentEmails: [],
      };
    }
  }
}

// Export singleton instance
export const emailService = new EnhancedEmailService();