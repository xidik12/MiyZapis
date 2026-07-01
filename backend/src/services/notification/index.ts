import { PrismaClient, User, Notification } from '@prisma/client';
import { emailService as templatedEmailService } from '@/services/email';
import { logger } from '@/utils/logger';
import { config } from '@/config';
import { redis } from '@/config/redis';
import { resolveLanguage } from '@/utils/language';
import axios from 'axios';

interface NotificationData {
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
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
  // Use enhanced templated email service (singleton)

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    // no-op: using templatedEmailService singleton
  }

  private getTranslatedText(key: string, language: string = 'en'): string {
    const translations: Record<string, Record<string, string>> = {
      'greeting': {
        en: 'Hi',
        uk: 'Привіт',
        ru: 'Привет'
      },
      'bookingDetails': {
        en: 'Booking Details:',
        uk: 'Деталі бронювання:',
        ru: 'Детали бронирования:'
      },
      'manageBookings': {
        en: 'You can view and manage your bookings by logging into your MiyZapis account.',
        uk: 'Ви можете переглядати та керувати своїми бронюваннями, увійшовши до свого акаунта МійЗапис.',
        ru: 'Вы можете просматривать и управлять своими бронированиями, войдя в свой аккаунт МояЗапись.'
      },
      'copyright': {
        en: '© 2024 MiyZapis. All rights reserved.',
        uk: '© 2024 МійЗапис. Всі права захищені.',
        ru: '© 2024 МояЗапись. Все права защищены.'
      },
      'automatedEmail': {
        en: 'This is an automated email, please do not reply.',
        uk: 'Це автоматичне повідомлення, будь ласка, не відповідайте.',
        ru: 'Это автоматическое письмо, пожалуйста, не отвечайте.'
      }
    };

    return translations[key]?.[language] || translations[key]?.['en'] || key;
  }

  // Notification-specific translations for i18n keys used by booking service
  private static readonly notificationTranslations: Record<string, Record<string, string>> = {
    'notifications.profileIncomplete.title': {
      en: 'Complete your profile to appear in search',
      uk: 'Заповніть профіль, щоб з’являтися в пошуку',
      ru: 'Заполните профиль, чтобы появляться в поиске',
    },
    'notifications.profileIncomplete.message': {
      en: 'Your profile is missing a few details, so clients can’t find you in search yet. Add your business name, a contact and your location to get listed.',
      uk: 'У вашому профілі бракує кількох деталей, тому клієнти поки не можуть знайти вас у пошуку. Додайте назву бізнесу, контакт і місцезнаходження, щоб потрапити до списку.',
      ru: 'В вашем профиле не хватает нескольких данных, поэтому клиенты пока не могут найти вас в поиске. Добавьте название бизнеса, контакт и местоположение, чтобы попасть в список.',
    },
    'notifications.booking.confirmed.customer.title': {
      en: 'Booking Confirmed', uk: 'Бронювання підтверджено', ru: 'Бронирование подтверждено'
    },
    'notifications.booking.confirmed.customer.message': {
      en: 'Your booking for {{serviceName}} has been confirmed.',
      uk: 'Ваше бронювання послуги "{{serviceName}}" підтверджено.',
      ru: 'Ваше бронирование услуги "{{serviceName}}" подтверждено.'
    },
    'notifications.booking.confirmed.specialist.title': {
      en: 'Booking Confirmed', uk: 'Бронювання підтверджено', ru: 'Бронирование подтверждено'
    },
    'notifications.booking.confirmed.specialist.message': {
      en: 'Booking for {{serviceName}} with {{customerName}} has been confirmed.',
      uk: 'Бронювання послуги "{{serviceName}}" з {{customerName}} підтверджено.',
      ru: 'Бронирование услуги "{{serviceName}}" с {{customerName}} подтверждено.'
    },
    'notifications.booking.awaitingReview.customer.title': {
      en: 'How did your appointment go?', uk: 'Як пройшов ваш запис?', ru: 'Как прошла ваша запись?'
    },
    'notifications.booking.awaitingReview.customer.message': {
      en: 'Please confirm whether your booking happened so we can update your booking history.',
      uk: 'Підтвердіть, чи відбувся запис — ми оновимо історію ваших бронювань.',
      ru: 'Подтвердите, состоялась ли запись — мы обновим историю ваших бронирований.'
    },
    'notifications.booking.awaitingReview.specialist.title': {
      en: 'Confirm or close a past booking', uk: 'Підтвердіть або закрийте минулий запис', ru: 'Подтвердите или закройте прошлую запись'
    },
    'notifications.booking.awaitingReview.specialist.message': {
      en: 'A past appointment is still open. Please mark it Completed or report a no-show.',
      uk: 'Минулий запис ще відкритий. Позначте його як завершений або вкажіть неявку.',
      ru: 'Прошлая запись ещё открыта. Отметьте её как завершённую или укажите неявку.'
    },
    'notifications.booking.pending.customer.title': {
      en: 'Booking Request Sent', uk: 'Запит на бронювання відправлено', ru: 'Запрос на бронирование отправлен'
    },
    'notifications.booking.pending.customer.message': {
      en: 'Your booking request for {{serviceName}} has been sent and is awaiting confirmation.',
      uk: 'Ваш запит на бронювання послуги "{{serviceName}}" відправлено і очікує підтвердження.',
      ru: 'Ваш запрос на бронирование услуги "{{serviceName}}" отправлен и ожидает подтверждения.'
    },
    'notifications.booking.request.specialist.title': {
      en: 'New Booking Request', uk: 'Новий запит на бронювання', ru: 'Новый запрос на бронирование'
    },
    'notifications.booking.request.specialist.message': {
      en: 'You have a new booking request for {{serviceName}} from {{customerName}}.',
      uk: 'Ви отримали новий запит на бронювання послуги "{{serviceName}}" від {{customerName}}.',
      ru: 'Вы получили новый запрос на бронирование услуги "{{serviceName}}" от {{customerName}}.'
    },
    'notifications.booking.confirmedBySpecialist.customer.title': {
      en: 'Booking Confirmed by Specialist', uk: 'Бронювання підтверджено спеціалістом', ru: 'Бронирование подтверждено специалистом'
    },
    'notifications.booking.confirmedBySpecialist.customer.message': {
      en: 'Your booking for {{serviceName}} has been confirmed by the specialist.',
      uk: 'Ваше бронювання послуги "{{serviceName}}" підтверджено спеціалістом.',
      ru: 'Ваше бронирование услуги "{{serviceName}}" подтверждено специалистом.'
    },
    'notifications.booking.confirmedBySpecialist.specialist.title': {
      en: 'Booking Confirmed', uk: 'Бронювання підтверджено', ru: 'Бронирование подтверждено'
    },
    'notifications.booking.confirmedBySpecialist.specialist.message': {
      en: 'You confirmed the booking for {{serviceName}} with {{customerName}}.',
      uk: 'Ви підтвердили бронювання послуги "{{serviceName}}" з {{customerName}}.',
      ru: 'Вы подтвердили бронирование услуги "{{serviceName}}" с {{customerName}}.'
    },

    // ── Lifecycle automation types ────────────────────────────────────────────

    // BOOKING_REMINDER — 30-min heads-up to the customer
    'notifications.booking.reminder.customer.title': {
      en: 'Your appointment is in 30 minutes',
      uk: 'Ваш запис починається через 30 хвилин',
      ru: 'Ваша запись начнётся через 30 минут',
    },
    'notifications.booking.reminder.customer.message': {
      en: 'Reminder: your appointment for {{serviceName}} with {{specialistName}} starts soon. See you there!',
      uk: 'Нагадування: ваш запис на послугу "{{serviceName}}" у {{specialistName}} починається зовсім скоро. До зустрічі!',
      ru: 'Напоминание: ваша запись на услугу "{{serviceName}}" у {{specialistName}} начинается совсем скоро. До встречи!',
    },

    // BOOKING_EXPIRED — auto-cancel because specialist didn't confirm (customer copy)
    'notifications.booking.expired.customer.title': {
      en: 'Booking could not be confirmed',
      uk: 'Бронювання не вдалося підтвердити',
      ru: 'Бронирование не удалось подтвердить',
    },
    'notifications.booking.expired.customer.message': {
      en: 'Unfortunately, {{specialistName}} did not confirm your booking for "{{serviceName}}" in time and it has been automatically cancelled. Please search for another available specialist.',
      uk: 'На жаль, {{specialistName}} не підтвердив ваш запис на "{{serviceName}}" вчасно, тому він був автоматично скасований. Будь ласка, знайдіть іншого доступного спеціаліста.',
      ru: 'К сожалению, {{specialistName}} не подтвердил вашу запись на "{{serviceName}}" вовремя, и она была автоматически отменена. Пожалуйста, найдите другого доступного специалиста.',
    },

    // BOOKING_EXPIRED — specialist missed the window (specialist copy)
    'notifications.booking.expired.specialist.title': {
      en: 'Booking request expired',
      uk: 'Час підтвердження запиту минув',
      ru: 'Время подтверждения запроса истекло',
    },
    'notifications.booking.expired.specialist.message': {
      en: 'A booking request for "{{serviceName}}" was not confirmed in time and has been automatically cancelled.',
      uk: 'Запит на бронювання послуги "{{serviceName}}" не було підтверджено вчасно і його автоматично скасовано.',
      ru: 'Запрос на бронирование услуги "{{serviceName}}" не был подтверждён вовремя и автоматически отменён.',
    },

    // BOOKING_CONFIRM_REQUEST — post-appointment prompt to specialist (did it happen?)
    'notifications.booking.confirmRequest.specialist.title': {
      en: 'Did this appointment take place?',
      uk: 'Чи відбувся цей запис?',
      ru: 'Состоялась ли эта запись?',
    },
    'notifications.booking.confirmRequest.specialist.message': {
      en: 'Your appointment for "{{serviceName}}" with {{customerName}} has ended. Please mark it as Completed or No-show so it is not left open.',
      uk: 'Ваш запис на "{{serviceName}}" з {{customerName}} завершився. Будь ласка, позначте його як виконаний або відсутність, щоб він не залишився відкритим.',
      ru: 'Ваша запись на "{{serviceName}}" с {{customerName}} завершилась. Пожалуйста, отметьте её как выполненную или неявку, чтобы она не оставалась открытой.',
    },

    // BOOKING_RESCHEDULED — already used by booking service; was missing from map
    'notifications.booking.rescheduled.title': {
      en: 'Booking rescheduled',
      uk: 'Запис перенесено',
      ru: 'Запись перенесена',
    },
    'notifications.booking.rescheduled.message': {
      en: 'Your booking for "{{serviceName}}" has been rescheduled to {{date}}.',
      uk: 'Ваш запис на "{{serviceName}}" перенесено на {{date}}.',
      ru: 'Ваша запись на "{{serviceName}}" перенесена на {{date}}.',
    },

    // ── Inventory alerts ──────────────────────────────────────────────────────

    // INVENTORY_LOW_STOCK — product crossed below its reorder threshold after a sale
    'notifications.inventory.lowStock.title': {
      en: 'Low stock alert',
      uk: 'Залишок товару закінчується',
      ru: 'Остаток товара заканчивается',
    },
    'notifications.inventory.lowStock.message': {
      en: '"{{productName}}" is running low — only {{stockQty}} unit(s) left (threshold: {{reorderLevel}}).',
      uk: '"{{productName}}" — залишилося лише {{stockQty}} од. (поріг: {{reorderLevel}}).',
      ru: '"{{productName}}" — осталось только {{stockQty}} ед. (порог: {{reorderLevel}}).',
    },

    // INVENTORY_OUT_OF_STOCK — product reached zero units after a sale
    'notifications.inventory.outOfStock.title': {
      en: 'Out of stock',
      uk: 'Товар закінчився',
      ru: 'Товар закончился',
    },
    'notifications.inventory.outOfStock.message': {
      en: '"{{productName}}" is now out of stock. Restock soon to avoid missed sales.',
      uk: '"{{productName}}" повністю розпродано. Поповніть запас, щоб не втратити продажі.',
      ru: '"{{productName}}" полностью распродан. Пополните запас, чтобы не упустить продажи.',
    },
  };

  /**
   * Resolve i18n key to translated text with variable interpolation.
   * If the text is not an i18n key (doesn't start with 'notifications.'), return as-is.
   */
  private resolveNotificationText(text: string, language: string, interpolateData?: Record<string, any>): string {
    // Check if the text looks like an i18n key
    if (!text.startsWith('notifications.')) {
      return text;
    }

    const translations = NotificationService.notificationTranslations[text];
    if (!translations) {
      return text;
    }

    let resolved = translations[language] || translations['en'] || text;

    // Interpolate {{variables}} from data
    if (interpolateData) {
      Object.entries(interpolateData).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        resolved = resolved.replace(regex, String(value || ''));
      });
    }

    return resolved;
  }

  /**
   * Build details HTML from notification data, filtering out internal fields and non-string values.
   */
  private buildDetailsHtml(data: unknown): string {
    if (!data) return '';
    return `<div style="background:#f9fafb;padding:16px;border-radius:8px;margin:12px 0;">` +
      Object.entries(data)
        .filter(([k, v]) => k !== '_interpolate' && typeof v !== 'object' && v !== null && v !== undefined)
        .map(([k, v]) => `<p><strong>${k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}:</strong> ${v}</p>`)
        .join('') +
      `</div>`;
  }

  async sendNotification(userId: string, data: NotificationData): Promise<Notification> {
    try {
      logger.info('🔔 Starting notification send process', {
        userId,
        type: data.type,
        title: data.title,
        hasEmailTemplate: !!data.emailTemplate,
        hasSMSTemplate: !!data.smsTemplate
      });

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
        logger.error('❌ User not found for notification', { userId });
        throw new Error('User not found');
      }

      logger.info('👤 User found for notification', {
        userId,
        email: user.email ? `${user.email.substring(0, 5)}...` : 'NOT_SET',
        firstName: user.firstName,
        emailNotifications: user.emailNotifications,
        pushNotifications: user.pushNotifications,
        telegramNotifications: user.telegramNotifications
      });

      // Resolve i18n keys early so all downstream channels get translated text
      const userLang = user.language || 'en';
      const interpolateVars = data.data?._interpolate || {};
      data.title = this.resolveNotificationText(data.title, userLang, interpolateVars);
      data.message = this.resolveNotificationText(data.message, userLang, interpolateVars);

      // Create notification record with resolved text
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data ? JSON.stringify(data.data) : null,
        }
      });

      logger.info('📝 Notification record created', {
        notificationId: notification.id,
        userId,
        type: data.type
      });

      // Send via different channels based on user preferences
      const promises = [];

      // Email notification
      if (user.emailNotifications && user.email) {
        logger.info('📧 Queuing email notification', { userId, email: user.email });
        promises.push(this.sendEmailNotification(user, data, notification.id));
      } else {
        logger.info('📧 Skipping email notification', {
          userId,
          emailNotifications: user.emailNotifications,
          hasEmail: !!user.email,
          hasEmailTemplate: !!data.emailTemplate
        });
      }

      // SMS notification
      if (user.phoneNumber && data.smsTemplate) {
        logger.info('📱 Queuing SMS notification', { userId });
        promises.push(this.sendSMSNotification(user, data, notification.id));
      } else {
        logger.info('📱 Skipping SMS notification', {
          userId,
          hasPhoneNumber: !!user.phoneNumber,
          hasSMSTemplate: !!data.smsTemplate
        });
      }

      // Telegram notification
      if (user.telegramNotifications && user.telegramId) {
        logger.info('💬 Queuing Telegram notification', { userId, telegramId: user.telegramId });
        promises.push(this.sendTelegramNotification(user, data, notification.id));
      } else {
        logger.info('💬 Skipping Telegram notification', {
          userId,
          telegramNotifications: user.telegramNotifications,
          hasTelegramId: !!user.telegramId
        });
      }

      // Push notification (via WebSocket or Firebase)
      if (user.pushNotifications) {
        logger.info('🔔 Queuing push notification', { userId });
        promises.push(this.sendPushNotification(user, data, notification.id));
      } else {
        logger.info('🔔 Skipping push notification', {
          userId,
          pushNotifications: user.pushNotifications
        });
      }

      logger.info('📤 Executing notification delivery', {
        userId,
        channelsQueued: promises.length,
        totalChannelsAvailable: 4
      });

      // Execute all notification sends in parallel
      const results = await Promise.allSettled(promises);
      
      // Log results
      results.forEach((result, index) => {
        const channels = ['email', 'sms', 'telegram', 'push'];
        if (result.status === 'rejected') {
          logger.error(`❌ ${channels[index]} notification failed`, {
            userId,
            error: result.reason
          });
        } else {
          logger.info(`✅ ${channels[index]} notification completed`, { userId });
        }
      });

      logger.info('🎉 Notification process completed', {
        userId,
        notificationId: notification.id,
        type: data.type,
        channelsAttempted: promises.length
      });

      return notification;
    } catch (error) {
      logger.error('💥 Error in notification process:', {
        userId,
        type: data.type,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private async sendEmailNotification(
    user: Record<string, unknown>,
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

      // If booking confirmed and we have bookingId, use dedicated templates
      if (data.type === 'BOOKING_CONFIRMED' && data.data?.bookingId) {
        try {
          const booking = await this.prisma.booking.findUnique({
            where: { id: data.data.bookingId },
            select: { id: true, customerId: true, specialistId: true }
          });
          if (booking) {
            const lang = user.language || 'en';
            if (user.id === booking.customerId) {
              emailSent = await templatedEmailService.sendBookingConfirmation(booking.id, lang);
            } else if (user.id === booking.specialistId) {
              emailSent = await templatedEmailService.sendSpecialistBookingNotification(booking.id, lang);
            }
          }
        } catch (e) {
          // Fallthrough to generic template if something goes wrong
          emailSent = false;
        }
      }

      // Resolve i18n keys in title and message
      const userLanguage = user.language || 'en';
      const interpolateData = data.data?._interpolate || {};
      const resolvedTitle = this.resolveNotificationText(data.title, userLanguage, interpolateData);
      const resolvedMessage = this.resolveNotificationText(data.message, userLanguage, interpolateData);

      // Use specific email methods based on notification type
      if (!emailSent && (data.type === 'BOOKING_CONFIRMED' || data.type === 'BOOKING_PENDING' || data.type === 'BOOKING_REQUEST')) {
        const detailsHtml = this.buildDetailsHtml(data.data);

        emailSent = await templatedEmailService.sendTemplateEmail({
          to: user.email,
          templateKey: 'notificationGeneric',
          language: userLanguage,
          data: {
            firstName: user.firstName,
            title: resolvedTitle,
            message: resolvedMessage,
            detailsHtml,
          }
        });
      } else {
        // Other types: generic template
        const detailsHtml = this.buildDetailsHtml(data.data);
        emailSent = await templatedEmailService.sendTemplateEmail({
          to: user.email,
          templateKey: 'notificationGeneric',
          language: userLanguage,
          data: {
            firstName: user.firstName,
            title: resolvedTitle,
            message: resolvedMessage,
            detailsHtml,
          }
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
    user: Record<string, unknown>,
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

  // Build the Telegram inline keyboard for actionable notifications. Returns
  // undefined for non-actionable types (so a plain message is sent). Callback
  // data matches the bot's `booking_action_<action>_<bookingId>` route.
  private buildTelegramActionKeyboard(
    data: NotificationData,
    lang: string
  ): { inline_keyboard: { text: string; callback_data: string }[][] } | undefined {
    const bookingId = (data.data as Record<string, unknown> | undefined)?.bookingId as string | undefined;
    if (!bookingId) return undefined;
    const L = (en: string, uk: string, ru: string) => (lang === 'uk' ? uk : lang === 'ru' ? ru : en);

    if (data.type === 'BOOKING_REQUEST') {
      return {
        inline_keyboard: [[
          { text: L('✅ Confirm', '✅ Підтвердити', '✅ Подтвердить'), callback_data: `booking_action_confirm_${bookingId}` },
          { text: L('❌ Decline', '❌ Відхилити', '❌ Отклонить'), callback_data: `booking_action_cancel_${bookingId}` },
        ]],
      };
    }

    if (data.type === 'BOOKING_AWAITING_REVIEW') {
      // Completed/No-show are specialist-only actions — don't show them to the
      // customer (their copy is informational).
      const actorRole = (data.data as Record<string, unknown> | undefined)?.actorRole;
      if (actorRole === 'CUSTOMER') return undefined;
      return {
        inline_keyboard: [[
          { text: L('✅ Completed', '✅ Відбулося', '✅ Состоялось'), callback_data: `booking_action_complete_${bookingId}` },
          { text: L('🚫 No-show', '🚫 Не прийшов', '🚫 Не пришёл'), callback_data: `booking_action_noshow_${bookingId}` },
        ]],
      };
    }

    // Post-appointment "did it happen?" prompt — same Completed/No-show actions
    if (data.type === 'BOOKING_CONFIRM_REQUEST') {
      return {
        inline_keyboard: [[
          { text: L('✅ Completed', '✅ Відбулося', '✅ Состоялось'), callback_data: `booking_action_complete_${bookingId}` },
          { text: L('🚫 No-show', '🚫 Не прийшов', '🚫 Не пришёл'), callback_data: `booking_action_noshow_${bookingId}` },
        ]],
      };
    }

    return undefined;
  }

  private async sendTelegramNotification(
    user: Record<string, unknown>,
    data: NotificationData,
    notificationId: string
  ): Promise<void> {
    try {
      if (!config.telegram.botToken) {
        logger.warn('Telegram bot token not configured');
        return;
      }

      const message = `*${data.title}*\n\n${data.message}`;

      // Quick-action inline buttons so the user can act straight from the chat
      // (Confirm/Decline a request, mark a past booking Completed/No-show)
      // instead of opening the app. Callback data matches the bot's
      // `booking_action_<action>_<bookingId>` handler.
      const replyMarkup = this.buildTelegramActionKeyboard(data, String(user.language || 'en'));

      await axios.post(`https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`, {
        chat_id: user.telegramId,
        text: message,
        parse_mode: 'Markdown',
        ...(replyMarkup ? { reply_markup: replyMarkup } : {})
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
    user: Record<string, unknown>,
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

      // Send Web Push notification via web-push VAPID
      let webPushSent = false;
      try {
        const { sendPushToUser, isVapidInitialized } = await import('@/services/push');
        if (isVapidInitialized()) {
          const userLang = user.language || 'en';
          const interpolateVars = data.data?._interpolate || {};
          const resolvedTitle = this.resolveNotificationText(data.title, userLang, interpolateVars);
          const resolvedBody = this.resolveNotificationText(data.message, userLang, interpolateVars);

          const result = await sendPushToUser(this.prisma, user.id, resolvedTitle, resolvedBody, {
            type: data.type,
            notificationId,
            ...data.data,
          });
          logger.info('Web Push notification result', { userId: user.id, sent: result.sent, failed: result.failed });
          webPushSent = result.sent > 0;
        }
      } catch (webPushError) {
        logger.warn('Web Push delivery error (non-fatal):', webPushError);
      }

      // Native push (Capacitor apps) via FCM/APNs — gated on FIREBASE_SERVICE_ACCOUNT.
      let nativePushSent = false;
      try {
        const { sendNativePushToUser } = await import('@/services/push/native');
        const userLang = user.language || 'en';
        const interpolateVars = data.data?._interpolate || {};
        const resolvedTitle = this.resolveNotificationText(data.title, userLang, interpolateVars);
        const resolvedBody = this.resolveNotificationText(data.message, userLang, interpolateVars);
        const result = await sendNativePushToUser(this.prisma, user.id as string, resolvedTitle, resolvedBody, {
          type: data.type,
          notificationId,
          ...data.data,
        });
        nativePushSent = result.sent > 0;
        if (result.sent || result.failed) logger.info('Native push result', { userId: user.id, sent: result.sent, failed: result.failed });
      } catch (nativeErr) {
        logger.warn('Native push delivery error (non-fatal):', nativeErr);
      }

      // Only mark pushSent:true when at least one push was actually delivered
      if (webPushSent || nativePushSent) {
        await this.prisma.notification.update({
          where: { id: notificationId },
          data: { pushSent: true }
        });
      }

      logger.info('Push notification queued successfully', {
        userId: user.id,
        type: data.type,
        webPushSent,
      });
    } catch (error) {
      logger.error('Error sending push notification:', error);
    }
  }

  private async sendSMS(options: SMSOptions): Promise<void> {
    // Integrate with SMS provider (Twilio, MessageBird, etc.)
    // Until a real provider is wired up, log and throw so smsSent is NOT marked true.
    logger.info('SMS not sent — no provider configured:', { to: options.to });
    throw new Error('SMS provider not configured');
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
    try {
      const {
        type,
        isRead,
        page = 1,
        limit = 20
      } = filters;

      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = { userId };
      if (type) where.type = type;
      if (isRead !== undefined) where.isRead = isRead;

      logger.info('Fetching user notifications', {
        userId,
        filters,
        where,
        skip,
        limit
      });

      const notifications = await this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      });

      const total = await this.prisma.notification.count({ where });

      logger.info('User notifications fetched successfully', {
        userId,
        notificationsCount: notifications.length,
        total
      });

      // Calculate actual unread count
      const unreadCount = await this.prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });

      return {
        notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Error in getUserNotifications', {
        userId,
        filters,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      // Return empty result instead of throwing
      return {
        notifications: [],
        unreadCount: 0,
        pagination: {
          page: filters.page || 1,
          limit: filters.limit || 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      };
    }
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

  // Schedule a review request notification 2 hours after booking completion
  async scheduleReviewRequest(bookingId: string): Promise<void> {
    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          customer: true,
          service: true,
        },
      });

      if (!booking) {
        logger.warn('Booking not found for review request', { bookingId });
        return;
      }

      // Send review request notification to customer
      await this.sendNotification(booking.customerId, {
        type: 'REVIEW_REQUEST',
        title: 'How was your experience?',
        message: `Your appointment for "${booking.service.name}" is complete! We'd love to hear your feedback.`,
        data: {
          bookingId: booking.id,
          serviceId: booking.serviceId,
          serviceName: booking.service.name,
          actionUrl: `/customer/reviews?bookingId=${booking.id}`,
        },
      });

      logger.info('Review request sent', { bookingId, customerId: booking.customerId });
    } catch (error) {
      logger.error('Error scheduling review request:', error);
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

  private getDefaultBookingMessage(type: string, booking: Record<string, unknown> & { service: { name: string }; scheduledAt: string | Date }): string {
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
