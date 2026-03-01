import { Markup } from 'telegraf';
import { logger } from '@/utils/logger';
import { config } from '@/config';
import { ServiceService } from '@/services/service';
import { BookingService } from '@/services/booking';
import { BotContext } from '../types';
import { messages } from '../messages';
import { getUserLanguage, getSiteUrl, getStatusEmoji, formatMessage } from '../utils';

type InlineButton = { text: string; callback_data: string };

// ── Show Bookings (both customer and specialist) ──

export async function showBookings(ctx: BotContext) {
  const lang = getUserLanguage(ctx);
  const siteUrl = getSiteUrl();

  if (!ctx.session.user) {
    await ctx.reply(messages[lang].loginRequired);
    return;
  }

  try {
    const userRole = ctx.session.userType === 'SPECIALIST' ? 'specialist' : 'customer';
    const bookings = await BookingService.getUserBookings(
      ctx.session.user.id as string,
      userRole,
      undefined,
      1,
      50
    ) as Record<string, unknown>;

    if ((bookings.bookings as unknown[]).length === 0) {
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback(messages[lang].back, 'main_menu')]
      ]);
      await ctx.reply('\ud83d\udcc5 You have no bookings yet.', keyboard);
      return;
    }

    // Count by status
    const statusCounts: Record<string, number> = {};
    for (const b of bookings.bookings) {
      statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
    }

    const statusOrder = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REFUNDED'];
    const lines: string[] = [`\ud83d\udcc5 **My Bookings** (${bookings.total} total)\n`];

    for (const status of statusOrder) {
      const count = statusCounts[status] || 0;
      if (count > 0) {
        lines.push(`${getStatusEmoji(status)} ${status}: **${count}**`);
      }
    }

    lines.push(`\nTap a category below to view details:`);

    const filterButtons: InlineButton[][] = [];
    const row1: InlineButton[] = [];
    const row2: InlineButton[] = [];

    for (const status of statusOrder) {
      const count = statusCounts[status] || 0;
      if (count === 0) continue;
      const btn = { text: `${getStatusEmoji(status)} ${status} (${count})`, callback_data: `bookings_filter_${status}` };
      if (row1.length < 2) row1.push(btn);
      else row2.push(btn);
    }

    if (row1.length > 0) filterButtons.push(row1);
    if (row2.length > 0) filterButtons.push(row2);

    const remaining = statusOrder.filter(s => (statusCounts[s] || 0) > 0).slice(4);
    if (remaining.length > 0) {
      filterButtons.push(remaining.map(s => ({
        text: `${getStatusEmoji(s)} ${s} (${statusCounts[s]})`,
        callback_data: `bookings_filter_${s}`
      })));
    }

    filterButtons.push([{ text: '\ud83d\udccb All Bookings', callback_data: 'bookings_filter_ALL' }]);
    filterButtons.push([
      { text: '\ud83c\udf10 View on Website', url: `${siteUrl}/bookings` },
      { text: '\u25c0\ufe0f Back', callback_data: 'main_menu' }
    ]);

    await ctx.reply(lines.join('\n'), {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: filterButtons }
    });

  } catch (error) {
    logger.error('Error showing bookings:', error);
    await ctx.reply(messages[lang].error);
  }
}

export async function showBookingsByStatus(ctx: BotContext, status: string) {
  const lang = getUserLanguage(ctx);
  const siteUrl = getSiteUrl();

  if (!ctx.session.user) {
    await ctx.reply(messages[lang].loginRequired);
    return;
  }

  try {
    const userRole = ctx.session.userType === 'SPECIALIST' ? 'specialist' : 'customer';
    const statusFilter = status === 'ALL' ? undefined : status;
    const bookings = await BookingService.getUserBookings(
      ctx.session.user.id as string,
      userRole,
      statusFilter,
      1,
      10
    ) as Record<string, unknown>;

    if ((bookings.bookings as unknown[]).length === 0) {
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('\u25c0\ufe0f Back to Bookings', ctx.session.userType === 'SPECIALIST' ? 'specialist_bookings' : 'my_bookings')]
      ]);
      const label = status === 'ALL' ? '' : ` with status ${status}`;
      await ctx.reply(`No bookings found${label}.`, keyboard);
      return;
    }

    const emoji = status === 'ALL' ? '\ud83d\udccb' : getStatusEmoji(status);
    const label = status === 'ALL' ? 'All Bookings' : status;
    const lines: string[] = [`${emoji} **${label}** (${bookings.total})\n`];

    for (const booking of bookings.bookings) {
      const statusEmoji = getStatusEmoji(booking.status);
      const date = new Date(booking.scheduledAt).toLocaleDateString();
      const time = new Date(booking.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      if (ctx.session.userType === 'SPECIALIST') {
        const customer = booking.customer
          ? `${booking.customer.firstName} ${booking.customer.lastName}`
          : 'Customer';
        lines.push(`${statusEmoji} **${booking.service?.name || 'Service'}** \u2014 ${customer}`);
        lines.push(`   \ud83d\udcc5 ${date} ${time} | \ud83d\udcb0 ${booking.totalAmount} ${booking.customer?.currency || 'UAH'}`);
      } else {
        const specialist = booking.specialist?.user
          ? `${booking.specialist.user.firstName} ${booking.specialist.user.lastName}`
          : '';
        lines.push(`${statusEmoji} **${booking.service?.name || 'Service'}** \u2014 ${specialist}`);
        lines.push(`   \ud83d\udcc5 ${date} ${time} | \ud83d\udcb0 ${booking.totalAmount} ${booking.customer?.currency || 'UAH'}`);
      }
    }

    if (bookings.total > 10) {
      lines.push(`\n_Showing 10 of ${bookings.total}_`);
    }

    // Context-appropriate action buttons
    const actionButtons: InlineButton[][] = [];

    if (status === 'PENDING' || status === 'ALL') {
      const pending = bookings.bookings.filter((b: Record<string, unknown>) => b.status === 'PENDING');
      for (const b of pending.slice(0, 4)) {
        const shortId = b.id.slice(-6);
        if (ctx.session.userType === 'SPECIALIST') {
          actionButtons.push([
            { text: `\u2705 Confirm #${shortId}`, callback_data: `booking_action_confirm_${b.id}` },
            { text: `\u274c Cancel #${shortId}`, callback_data: `booking_action_cancel_${b.id}` }
          ]);
        } else {
          actionButtons.push([
            { text: `\u274c Cancel #${shortId}`, callback_data: `booking_action_cancel_${b.id}` },
            { text: `\ud83d\udcc5 Reschedule #${shortId}`, callback_data: `booking_action_reschedule_${b.id}` }
          ]);
        }
      }
    }

    if ((status === 'COMPLETED' || status === 'ALL') && ctx.session.userType !== 'SPECIALIST') {
      const completed = bookings.bookings.filter((b: Record<string, unknown>) => b.status === 'COMPLETED');
      for (const b of completed.slice(0, 3)) {
        actionButtons.push([
          { text: `\u2b50 Review #${b.id.slice(-6)}`, callback_data: `booking_action_review_${b.id}` }
        ]);
      }
    }

    const backTarget = ctx.session.userType === 'SPECIALIST' ? 'specialist_bookings' : 'my_bookings';
    actionButtons.push([{ text: '\u25c0\ufe0f Back to Bookings', callback_data: backTarget }]);

    await ctx.reply(lines.join('\n'), {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: actionButtons }
    });

  } catch (error) {
    logger.error('Error showing bookings by status:', error);
    await ctx.reply(messages[lang].error);
  }
}

// ── Booking History ──

export async function showBookingHistory(ctx: BotContext) {
  const lang = getUserLanguage(ctx);

  if (!ctx.session.user) {
    await ctx.reply(messages[lang].loginRequired);
    return;
  }

  try {
    const bookings = await BookingService.getUserBookings(
      ctx.session.user.id as string,
      'customer',
      'COMPLETED',
      1,
      10
    ) as Record<string, unknown>;

    if ((bookings.bookings as unknown[]).length === 0) {
      await ctx.reply('No completed bookings found.');
      return;
    }

    await ctx.reply(`\ud83d\udcda **Booking History** (${bookings.total} completed)\n`, { parse_mode: 'Markdown' });
    await displayBookings(ctx, bookings.bookings);

  } catch (error) {
    logger.error('Error showing booking history:', error);
    await ctx.reply(messages[lang].error);
  }
}

// ── Specialist Bookings ──

export async function showSpecialistBookings(ctx: BotContext) {
  const lang = getUserLanguage(ctx);
  const siteUrl = getSiteUrl();

  if (!ctx.session.user?.specialist) {
    await ctx.reply(messages[lang].accessDenied);
    return;
  }

  try {
    const bookings = await BookingService.getUserBookings(
      ctx.session.user.id as string,
      'specialist',
      undefined,
      1,
      50
    ) as Record<string, unknown>;

    if ((bookings.bookings as unknown[]).length === 0) {
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback(messages[lang].back, 'main_menu')]
      ]);
      await ctx.reply('\ud83d\udccb No bookings yet.', keyboard);
      return;
    }

    // Count by status
    const statusCounts: Record<string, number> = {};
    for (const b of bookings.bookings) {
      statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
    }

    const statusOrder = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REFUNDED'];
    const lines: string[] = [`\ud83d\udccb **Specialist Bookings** (${bookings.total} total)\n`];

    for (const status of statusOrder) {
      const count = statusCounts[status] || 0;
      if (count > 0) {
        lines.push(`${getStatusEmoji(status)} ${status}: **${count}**`);
      }
    }

    lines.push(`\nTap a category below to view details:`);

    const filterButtons: InlineButton[][] = [];
    const row1: InlineButton[] = [];
    const row2: InlineButton[] = [];

    for (const status of statusOrder) {
      const count = statusCounts[status] || 0;
      if (count === 0) continue;
      const btn = { text: `${getStatusEmoji(status)} ${status} (${count})`, callback_data: `bookings_filter_${status}` };
      if (row1.length < 2) row1.push(btn);
      else row2.push(btn);
    }

    if (row1.length > 0) filterButtons.push(row1);
    if (row2.length > 0) filterButtons.push(row2);

    const remaining = statusOrder.filter(s => (statusCounts[s] || 0) > 0).slice(4);
    if (remaining.length > 0) {
      filterButtons.push(remaining.map(s => ({
        text: `${getStatusEmoji(s)} ${s} (${statusCounts[s]})`,
        callback_data: `bookings_filter_${s}`
      })));
    }

    filterButtons.push([{ text: '\ud83d\udccb All Bookings', callback_data: 'bookings_filter_ALL' }]);
    filterButtons.push([
      { text: '\ud83c\udf10 View on Website', url: `${siteUrl}/specialist/bookings` },
      { text: '\u25c0\ufe0f Back', callback_data: 'main_menu' }
    ]);

    await ctx.reply(lines.join('\n'), {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: filterButtons }
    });

  } catch (error) {
    logger.error('Error showing specialist bookings:', error);
    await ctx.reply(messages[lang].error);
  }
}

// ── Booking Flow ──

export async function startBookingFlow(ctx: BotContext, serviceId: string) {
  const lang = getUserLanguage(ctx);

  if (!ctx.session.user) {
    await ctx.reply(messages[lang].loginRequired);
    return;
  }

  try {
    const service = await ServiceService.getService(serviceId) as any;

    ctx.session.state = 'booking_flow';
    ctx.session.step = 'select_date';
    ctx.session.tempData = { serviceId, service };

    const specialistUser = service.specialist?.user;
    const serviceText = `\ud83d\udcc5 **Booking: ${service.name}**\n\n` +
      `\ud83d\udc64 ${specialistUser?.firstName || ''} ${specialistUser?.lastName || ''}\n` +
      `\u23f1\ufe0f Duration: ${service.duration} minutes\n` +
      `\ud83d\udcb0 Price: ${service.basePrice} ${service.currency}`;

    await ctx.reply(serviceText, { parse_mode: 'Markdown' });

    await showDateSelection(ctx);

  } catch (error) {
    logger.error('Error starting booking flow:', error);
    await ctx.reply(messages[lang].error);
  }
}

export async function showDateSelection(ctx: BotContext) {
  const lang = getUserLanguage(ctx);

  const dates = [];
  const today = new Date();

  for (let i = 1; i <= 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const value = date.toISOString().split('T')[0];

    dates.push({
      text: `${dayName}, ${dateStr}`,
      callback_data: `select_date_${value}`
    });
  }

  const keyboard: InlineButton[][] = [];
  for (let i = 0; i < dates.length; i += 2) {
    const row = [dates[i]];
    if (dates[i + 1]) row.push(dates[i + 1]);
    keyboard.push(row);
  }

  keyboard.push([{ text: messages[lang].back, callback_data: 'main_menu' }]);

  await ctx.reply(messages[lang].selectDate, {
    reply_markup: { inline_keyboard: keyboard }
  });
}

export async function showTimeSelection(ctx: BotContext, selectedDate: string) {
  const lang = getUserLanguage(ctx);

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
  ];

  const keyboard: InlineButton[][] = [];
  for (let i = 0; i < timeSlots.length; i += 3) {
    const row = [];
    for (let j = 0; j < 3 && i + j < timeSlots.length; j++) {
      row.push({
        text: timeSlots[i + j],
        callback_data: `select_time_${timeSlots[i + j]}`
      });
    }
    keyboard.push(row);
  }

  keyboard.push([{ text: messages[lang].back, callback_data: 'booking_select_date' }]);

  ctx.session.tempData!.selectedDate = selectedDate;

  await ctx.reply(messages[lang].selectTime, {
    reply_markup: { inline_keyboard: keyboard }
  });
}

export async function confirmBooking(ctx: BotContext, selectedTime: string) {
  const lang = getUserLanguage(ctx);
  const { service, selectedDate } = ctx.session.tempData!;

  ctx.session.tempData!.selectedTime = selectedTime;

  const bookingDetails = formatMessage(
    (messages[lang] as any).bookingDetails ||
    '\ud83d\udccb Booking Details:\n\n\ud83c\udfea Service: {serviceName}\n\ud83d\udc64 Specialist: {specialistName}\n\ud83d\udcc5 Date: {date}\n\u23f0 Time: {time}\n\ud83d\udcb0 Price: {price} {currency}',
    {
      serviceName: service.name,
      specialistName: `${service.specialist?.user?.firstName || ''} ${service.specialist?.user?.lastName || ''}`,
      date: selectedDate,
      time: selectedTime,
      price: service.basePrice,
      currency: service.currency
    }
  );

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('\u2705 Confirm Booking', 'confirm_booking')],
    [Markup.button.callback('\u274c Cancel', 'cancel_booking')],
    [Markup.button.callback(messages[lang].back, 'booking_select_time')]
  ]);

  await ctx.reply(bookingDetails, keyboard);
}

export async function createBooking(ctx: BotContext, sendNotification: (userId: string, message: string) => Promise<boolean>) {
  const lang = getUserLanguage(ctx);

  try {
    const { serviceId, selectedDate, selectedTime } = ctx.session.tempData!;

    const bookingDateTime = new Date(`${selectedDate} ${selectedTime}`);

    const service = await ServiceService.getService(serviceId as string) as any;

    const booking = await BookingService.createBooking({
      customerId: ctx.session.user.id as string,
      serviceId: serviceId as string,
      scheduledAt: bookingDateTime,
      duration: service.duration,
      totalAmount: service.basePrice,
      notes: 'Booked via Telegram Bot'
    } as any) as any;

    await ctx.reply(messages[lang].bookingConfirmed);

    // Clear session data
    ctx.session.state = null;
    ctx.session.step = null;
    ctx.session.tempData = {};

    // Show payment link if deposit required
    if (booking.depositAmount && Number(booking.depositAmount) > 0) {
      const paymentKeyboard = Markup.inlineKeyboard([
        [Markup.button.url('\ud83d\udcb3 Pay Deposit', `${getSiteUrl()}/booking/${booking.id}/payment`)],
        [Markup.button.callback('\ud83d\udccb My Bookings', 'my_bookings')]
      ]);

      await ctx.reply(
        `\ud83d\udcb3 Deposit required: ${booking.depositAmount} ${booking.customer?.currency || 'UAH'}\n\nPlease complete payment to confirm your booking.`,
        paymentKeyboard
      );
    }

    // Send notification to specialist
    await sendNotification(
      service.specialist.userId,
      `\ud83d\udcc5 New booking received!\n\nService: ${service.name}\nDate: ${selectedDate} at ${selectedTime}\nCustomer: ${ctx.session.user.firstName} ${ctx.session.user.lastName}`
    );

  } catch (error) {
    logger.error('Error creating booking:', error);
    await ctx.reply(messages[lang].error);
  }
}

export async function handleBookingAction(ctx: BotContext, action: string, bookingId: string) {
  const lang = getUserLanguage(ctx);

  try {
    switch (action) {
      case 'cancel':
        await BookingService.cancelBooking(bookingId, ctx.session.user.id as string, 'Cancelled via Telegram');
        await ctx.reply(messages[lang].bookingCancelled);
        break;

      case 'confirm':
        if (ctx.session.userType === 'SPECIALIST') {
          await BookingService.updateBooking(bookingId, { status: 'CONFIRMED' } as any);
          await ctx.reply('\u2705 Booking confirmed!');
        }
        break;

      case 'reschedule':
        ctx.session.state = 'reschedule_booking';
        ctx.session.tempData = { bookingId };
        await showDateSelection(ctx);
        break;

      case 'chat':
        const chatUrl = `${getSiteUrl()}/messages/booking/${bookingId}`;
        const keyboard = Markup.inlineKeyboard([
          [Markup.button.url('\ud83d\udcac Open Chat', chatUrl)]
        ]);
        await ctx.reply('Open chat in web app:', keyboard);
        break;

      case 'review':
        await startReviewFlow(ctx, bookingId);
        break;
    }

  } catch (error) {
    logger.error('Error handling booking action:', error);
    await ctx.reply(messages[lang].error);
  }
}

export async function startReviewFlow(ctx: BotContext, bookingId: string) {
  const lang = getUserLanguage(ctx);

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('\u2b50', 'rate_1'),
      Markup.button.callback('\u2b50\u2b50', 'rate_2'),
      Markup.button.callback('\u2b50\u2b50\u2b50', 'rate_3')
    ],
    [
      Markup.button.callback('\u2b50\u2b50\u2b50\u2b50', 'rate_4'),
      Markup.button.callback('\u2b50\u2b50\u2b50\u2b50\u2b50', 'rate_5')
    ],
    [Markup.button.callback(messages[lang].cancel, 'main_menu')]
  ]);

  ctx.session.state = 'review_flow';
  ctx.session.tempData = { bookingId };

  await ctx.reply('Please rate this service:', keyboard);
}

export async function handleRating(ctx: BotContext, rating: number) {
  const lang = getUserLanguage(ctx);

  try {
    await ctx.reply(`Thank you for rating ${rating} stars! Your review helps improve our services.`);

    ctx.session.state = 'review_comment';
    ctx.session.tempData!.rating = rating;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('\u270d\ufe0f Add Comment', 'add_review_comment')],
      [Markup.button.callback('\u2705 Submit Rating Only', 'submit_rating_only')],
      [Markup.button.callback(messages[lang].cancel, 'main_menu')]
    ]);

    await ctx.reply('Would you like to add a written review?', keyboard);

  } catch (error) {
    logger.error('Error handling rating:', error);
    await ctx.reply(messages[lang].error);
  }
}

export async function handleBookingFlow(ctx: BotContext, text: string, step: string) {
  switch (step) {
    case 'notes':
      ctx.session.tempData!.notes = text;
      await confirmBooking(ctx, ctx.session.tempData!.selectedTime as string);
      break;
  }
}

// ── Display Bookings Helper ──

async function displayBookings(ctx: BotContext, bookings: Record<string, unknown>[]) {
  const lang = getUserLanguage(ctx);

  const lines: string[] = [];
  for (const booking of bookings) {
    const emoji = getStatusEmoji(booking.status);
    const date = new Date(booking.scheduledAt).toLocaleDateString();
    const time = new Date(booking.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    if (ctx.session.userType === 'SPECIALIST') {
      const customer = booking.customer
        ? `${booking.customer.firstName} ${booking.customer.lastName}`
        : 'Customer';
      lines.push(`${emoji} **${booking.service?.name || 'Service'}** \u2014 ${customer}`);
      lines.push(`   \ud83d\udcc5 ${date} ${time} | \ud83d\udcb0 ${booking.totalAmount} ${booking.customer?.currency || 'UAH'} | ${booking.status}`);
    } else {
      const specialist = booking.specialist?.user
        ? `${booking.specialist.user.firstName} ${booking.specialist.user.lastName}`
        : '';
      lines.push(`${emoji} **${booking.service?.name || 'Service'}** \u2014 ${specialist}`);
      lines.push(`   \ud83d\udcc5 ${date} ${time} | \ud83d\udcb0 ${booking.totalAmount} ${booking.customer?.currency || 'UAH'} | ${booking.status}`);
    }
  }

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback(messages[lang].back, 'main_menu')]
  ]);

  await ctx.reply(lines.join('\n'), { parse_mode: 'Markdown', ...keyboard });
}
