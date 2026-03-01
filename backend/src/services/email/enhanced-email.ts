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

export class EmailService {
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
          specialist: true,
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
          specialistName: `${booking.specialist.firstName} ${booking.specialist.lastName}`,
          bookingDateTime,
          duration: booking.duration,
          totalAmount: booking.totalAmount,
          currency: booking.customer.currency,
          customerNotes: booking.customerNotes,
          bookingUrl,
          chatUrl,
          // Service location information
          serviceLocation: booking.service.serviceLocation,
          locationNotes: booking.service.locationNotes,
          latitude: (booking.service as Record<string, unknown>).latitude,
          longitude: (booking.service as Record<string, unknown>).longitude,
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
          specialist: true,
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
        specialistName: `${booking.specialist.firstName} ${booking.specialist.lastName}`,
        bookingDateTime,
        bookingUrl,
        hoursUntil: Math.round(hoursUntilBooking),
      };

      return await this.sendTemplateEmail({
        to: booking.customer.email,
        templateKey: 'bookingReminder',
        language,
        data: {
          customerName: booking.customer.firstName,
          serviceName: booking.service.name,
          specialistName: `${booking.specialist.firstName} ${booking.specialist.lastName}`,
          bookingDateTime,
          bookingUrl,
        }
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
          specialist: true,
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
        timeZone: booking.specialist.timezone,
      }).format(new Date(booking.scheduledAt));

      const subject = language === 'uk' 
        ? `Новий запис - ${booking.service.name}`
        : language === 'ru'
        ? `Новая запись - ${booking.service.name}`
        : `New Booking - ${booking.service.name}`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>${language === 'uk' ? 'У вас новий запис!' : language === 'ru' ? 'У вас новая запись!' : 'You have a new booking!'}</h2>
          <p>${language === 'uk' ? 'Привіт' : language === 'ru' ? 'Привет' : 'Hello'} ${booking.specialist.firstName},</p>
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
        to: booking.specialist.email,
        subject,
        html,
      });

    } catch (error) {
      logger.error('Failed to send specialist booking notification:', error);
      return false;
    }
  }

  /**
   * Send booking status change email (rejected, cancelled, completed)
   */
  async sendBookingStatusChangeEmail(
    bookingId: string,
    newStatus: 'REJECTED' | 'CANCELLED' | 'COMPLETED',
    reason?: string,
    language: string = 'en'
  ): Promise<boolean> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          customer: true,
          specialist: true,
          service: true,
        },
      });

      if (!booking) {
        logger.error('Booking not found for status change email:', bookingId);
        return false;
      }

      const bookingUrl = `${config.frontend.url}/bookings/${bookingId}`;

      // Format date and time
      const bookingDateTime = new Intl.DateTimeFormat(
        language === 'uk' ? 'uk-UA' : language === 'ru' ? 'ru-RU' : 'en-US',
        {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: booking.customer.timezone,
        }
      ).format(new Date(booking.scheduledAt));

      const specialistName = `${booking.specialist.firstName} ${booking.specialist.lastName}`;
      const customerName = `${booking.customer.firstName} ${booking.customer.lastName}`;

      if (newStatus === 'CANCELLED') {
        // Use existing bookingCancelled template for both customer and specialist
        const customerResult = await this.sendTemplateEmail({
          to: booking.customer.email,
          templateKey: 'bookingCancelled',
          language,
          data: {
            name: booking.customer.firstName,
            serviceName: booking.service.name,
            bookingDateTime,
            reason: reason || '',
          },
        });

        // Also notify the specialist
        const specialistLang = booking.specialist.language || 'en';
        await this.sendTemplateEmail({
          to: booking.specialist.email,
          templateKey: 'bookingCancelled',
          language: specialistLang,
          data: {
            name: booking.specialist.firstName,
            serviceName: booking.service.name,
            bookingDateTime,
            reason: reason || '',
          },
        });

        return customerResult;
      }

      if (newStatus === 'REJECTED') {
        // Notify the customer that booking was rejected
        const statusText = {
          en: 'Booking Rejected',
          uk: 'Бронювання відхилено',
          ru: 'Бронирование отклонено',
        };
        const messageText = {
          en: `Your booking for ${booking.service.name} with ${specialistName} on ${bookingDateTime} has been rejected by the specialist.`,
          uk: `Ваше бронювання ${booking.service.name} зі спеціалістом ${specialistName} на ${bookingDateTime} було відхилено спеціалістом.`,
          ru: `Ваше бронирование ${booking.service.name} со специалистом ${specialistName} на ${bookingDateTime} было отклонено специалистом.`,
        };
        const lang = language as 'en' | 'uk' | 'ru';

        const subject = statusText[lang] || statusText.en;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #ef4444; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">${subject}</h1>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
              <p style="color: #6b7280; line-height: 1.6;">${messageText[lang] || messageText.en}</p>
              ${reason ? `<div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                <p style="margin: 0; color: #991b1b;"><strong>${lang === 'uk' ? 'Причина' : lang === 'ru' ? 'Причина' : 'Reason'}:</strong> ${reason}</p>
              </div>` : ''}
              <div style="text-align: center; margin: 30px 0;">
                <a href="${bookingUrl}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  ${lang === 'uk' ? 'Переглянути запис' : lang === 'ru' ? 'Посмотреть запись' : 'View Booking'}
                </a>
              </div>
            </div>
          </div>
        `;

        return await this.sendEmail({
          to: booking.customer.email,
          subject: `${subject} - ${booking.service.name}`,
          html,
        });
      }

      if (newStatus === 'COMPLETED') {
        // Notify the customer that booking was completed
        const statusText = {
          en: 'Booking Completed',
          uk: 'Бронювання завершено',
          ru: 'Бронирование завершено',
        };
        const messageText = {
          en: `Your booking for ${booking.service.name} with ${specialistName} has been completed successfully.`,
          uk: `Ваше бронювання ${booking.service.name} зі спеціалістом ${specialistName} було успішно завершено.`,
          ru: `Ваше бронирование ${booking.service.name} со специалистом ${specialistName} было успешно завершено.`,
        };
        const reviewPrompt = {
          en: 'We would love to hear about your experience! Please leave a review for the specialist.',
          uk: 'Ми хотіли б дізнатися про ваш досвід! Будь ласка, залиште відгук про спеціаліста.',
          ru: 'Мы хотели бы узнать о вашем опыте! Пожалуйста, оставьте отзыв о специалисте.',
        };
        const lang = language as 'en' | 'uk' | 'ru';

        const subject = statusText[lang] || statusText.en;
        const reviewUrl = `${config.frontend.url}/bookings/${bookingId}?review=true`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #10b981; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">${subject}</h1>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
              <h2 style="color: #374151;">${lang === 'uk' ? 'Привіт' : lang === 'ru' ? 'Привет' : 'Hello'} ${booking.customer.firstName}!</h2>
              <p style="color: #6b7280; line-height: 1.6;">${messageText[lang] || messageText.en}</p>
              <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
                <p style="margin: 5px 0;"><strong>${lang === 'uk' ? 'Послуга' : lang === 'ru' ? 'Услуга' : 'Service'}:</strong> ${booking.service.name}</p>
                <p style="margin: 5px 0;"><strong>${lang === 'uk' ? 'Спеціаліст' : lang === 'ru' ? 'Специалист' : 'Specialist'}:</strong> ${specialistName}</p>
                <p style="margin: 5px 0;"><strong>${lang === 'uk' ? 'Дата і час' : lang === 'ru' ? 'Дата и время' : 'Date & Time'}:</strong> ${bookingDateTime}</p>
                <p style="margin: 5px 0;"><strong>${lang === 'uk' ? 'Сума' : lang === 'ru' ? 'Сумма' : 'Amount'}:</strong> ${booking.totalAmount} ${booking.customer.currency}</p>
              </div>
              <p style="color: #6b7280; line-height: 1.6;">${reviewPrompt[lang] || reviewPrompt.en}</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${reviewUrl}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  ${lang === 'uk' ? 'Залишити відгук' : lang === 'ru' ? 'Оставить отзыв' : 'Leave a Review'}
                </a>
              </div>
            </div>
          </div>
        `;

        return await this.sendEmail({
          to: booking.customer.email,
          subject: `${subject} - ${booking.service.name}`,
          html,
        });
      }

      return false;
    } catch (error) {
      logger.error('Failed to send booking status change email:', error);
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
   * Send trial expiring warning email (7 days before expiration)
   */
  async sendTrialExpiringWarning(userId: string, language: string = 'en'): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.trialEndDate) {
        logger.error('User not found or no trial end date:', userId);
        return false;
      }

      const now = new Date();
      const endDate = new Date(user.trialEndDate);
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const trialInfoUrl = `${config.frontend.url}/trial-info`;
      const helpUrl = `${config.frontend.url}/help`;

      return await this.sendTemplateEmail({
        to: user.email,
        templateKey: 'trialExpiringWarning',
        language,
        data: {
          firstName: user.firstName,
          daysRemaining,
          trialEndDate: endDate.toLocaleDateString(language === 'uk' ? 'uk-UA' : language === 'ru' ? 'ru-RU' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          isCustomer: user.userType === 'CUSTOMER',
          isSpecialist: user.userType === 'SPECIALIST',
          trialInfoUrl,
          helpUrl,
        },
      });

    } catch (error) {
      logger.error('Failed to send trial expiring warning email:', error);
      return false;
    }
  }

  /**
   * Send trial expired email
   */
  async sendTrialExpired(userId: string, language: string = 'en'): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.trialEndDate) {
        logger.error('User not found or no trial end date:', userId);
        return false;
      }

      const endDate = new Date(user.trialEndDate);
      const dashboardUrl = user.userType === 'SPECIALIST'
        ? `${config.frontend.url}/specialist/dashboard`
        : `${config.frontend.url}/customer/dashboard`;
      const pricingUrl = `${config.frontend.url}/trial-info`;
      const helpUrl = `${config.frontend.url}/help`;

      return await this.sendTemplateEmail({
        to: user.email,
        templateKey: 'trialExpired',
        language,
        data: {
          firstName: user.firstName,
          trialEndDate: endDate.toLocaleDateString(language === 'uk' ? 'uk-UA' : language === 'ru' ? 'ru-RU' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          isCustomer: user.userType === 'CUSTOMER',
          isSpecialist: user.userType === 'SPECIALIST',
          dashboardUrl,
          pricingUrl,
          helpUrl,
        },
      });

    } catch (error) {
      logger.error('Failed to send trial expired email:', error);
      return false;
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
  /**
   * Send verification email (compatibility method for base email API)
   * Used by auth service which passes email + { firstName, verificationLink } directly
   */
  async sendVerificationEmail(email: string, data: { firstName: string; verificationLink: string }): Promise<boolean> {
    try {
      return await this.sendEmail({
        to: email,
        subject: 'Verify Your Email - MiyZapis',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Verify Your Email - MiyZapis</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #007bff; color: white; padding: 20px; text-align: center; }
              .content { padding: 30px 20px; }
              .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header"><h1>Welcome to MiyZapis!</h1></div>
              <div class="content">
                <h2>Hi ${data.firstName}!</h2>
                <p>Thank you for registering with MiyZapis, your trusted booking platform.</p>
                <p>To complete your registration, please click the button below:</p>
                <p style="text-align: center;"><a href="${data.verificationLink}" class="button">Verify Email Address</a></p>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #007bff;">${data.verificationLink}</p>
                <p><strong>This link will expire in 24 hours.</strong></p>
                <p>If you didn't create an account with MiyZapis, you can safely ignore this email.</p>
              </div>
              <div class="footer"><p>&copy; 2024 MiyZapis. All rights reserved.</p></div>
            </div>
          </body>
          </html>`,
        text: `Welcome to MiyZapis!\n\nHi ${data.firstName}!\n\nTo verify your email, visit: ${data.verificationLink}\n\nThis link will expire in 24 hours.`,
      });
    } catch (error) {
      logger.error('Failed to send verification email:', error);
      return false;
    }
  }

  /**
   * Send password reset email (compatibility method for base email API)
   */
  async sendPasswordResetEmail(email: string, data: { firstName: string; resetLink: string }): Promise<boolean> {
    try {
      return await this.sendEmail({
        to: email,
        subject: 'Reset Your Password - MiyZapis',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Reset Your Password - MiyZapis</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
              .content { padding: 30px 20px; }
              .button { display: inline-block; background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header"><h1>Password Reset Request</h1></div>
              <div class="content">
                <h2>Hi ${data.firstName}!</h2>
                <p>We received a request to reset your password for your MiyZapis account.</p>
                <p>Click the button below to reset your password:</p>
                <p style="text-align: center;"><a href="${data.resetLink}" class="button">Reset Password</a></p>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #dc3545;">${data.resetLink}</p>
                <p><strong>This link will expire in 1 hour.</strong></p>
                <p>If you didn't request a password reset, you can safely ignore this email.</p>
              </div>
              <div class="footer"><p>&copy; 2024 MiyZapis. All rights reserved.</p></div>
            </div>
          </body>
          </html>`,
        text: `Password Reset - MiyZapis\n\nHi ${data.firstName}!\n\nTo reset your password, visit: ${data.resetLink}\n\nThis link will expire in 1 hour.`,
      });
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      return false;
    }
  }
}

// Backward compatibility alias
export { EmailService as EnhancedEmailService };

// Export singleton instance
export const emailService = new EmailService();
