import { Markup } from 'telegraf';
import { messages, Lang } from './messages';
import { getMiniAppUrl } from './utils';

export function getCustomerMenuKeyboard(lang: Lang) {
  return Markup.inlineKeyboard([
    [Markup.button.webApp('\ud83d\udcf1 Open MiyZapis App', getMiniAppUrl())],
    [Markup.button.callback(messages[lang].searchServices, 'search_services')],
    [Markup.button.callback(messages[lang].myBookings, 'my_bookings')],
    [
      Markup.button.callback(messages[lang].bookingHistory, 'booking_history'),
      Markup.button.callback(messages[lang].favorites, 'favorites')
    ],
    [
      Markup.button.callback(messages[lang].loyaltyPoints, 'loyalty_points'),
      Markup.button.callback(messages[lang].paymentMethods, 'payment_methods')
    ],
    [
      Markup.button.callback(messages[lang].customerProfile, 'my_profile'),
      Markup.button.callback(messages[lang].settings, 'settings')
    ],
    [Markup.button.callback(messages[lang].help, 'help')]
  ]);
}

export function getSpecialistMenuKeyboard(lang: Lang) {
  return Markup.inlineKeyboard([
    [Markup.button.webApp('\ud83d\udcf1 Open MiyZapis App', getMiniAppUrl())],
    [Markup.button.callback(messages[lang].myServices, 'my_services')],
    [Markup.button.callback(messages[lang].specialistBookings, 'specialist_bookings')],
    [
      Markup.button.callback(messages[lang].addService, 'add_service'),
      Markup.button.callback(messages[lang].manageSchedule, 'manage_schedule')
    ],
    [
      Markup.button.callback(messages[lang].earnings, 'earnings'),
      Markup.button.callback(messages[lang].analytics, 'analytics')
    ],
    [
      Markup.button.callback(messages[lang].reviews, 'reviews'),
      Markup.button.callback(messages[lang].specialistProfile, 'specialist_profile')
    ],
    [
      Markup.button.callback(messages[lang].settings, 'settings'),
      Markup.button.callback(messages[lang].help, 'help')
    ]
  ]);
}

export function getAdminMenuKeyboard(lang: Lang) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('\ud83d\udee1\ufe0f Admin Dashboard', 'admin_panel')],
    [Markup.button.callback(messages[lang].userManagement, 'user_management')],
    [Markup.button.callback(messages[lang].serviceModeration, 'service_moderation')],
    [
      Markup.button.callback(messages[lang].systemStats, 'system_stats'),
      Markup.button.callback(messages[lang].analytics, 'analytics')
    ],
    [
      Markup.button.callback(messages[lang].paymentManagement, 'payment_management'),
      Markup.button.callback(messages[lang].supportTickets, 'support_tickets')
    ],
    [
      Markup.button.callback(messages[lang].notifications, 'send_notifications'),
      Markup.button.callback(messages[lang].settings, 'settings')
    ]
  ]);
}

export function getBookingKeyboard(booking: Record<string, unknown>, userType: string) {
  const keyboard = [];

  if (['PENDING', 'CONFIRMED'].includes(booking.status)) {
    keyboard.push([
      { text: '\u274c Cancel', callback_data: `booking_action_cancel_${booking.id}` }
    ]);
    keyboard.push([
      { text: '\ud83d\udcc5 Reschedule', callback_data: `booking_action_reschedule_${booking.id}` }
    ]);
  }

  if (userType === 'SPECIALIST' && booking.status === 'PENDING') {
    keyboard.push([
      { text: '\u2705 Confirm', callback_data: `booking_action_confirm_${booking.id}` }
    ]);
  }

  if (booking.status === 'COMPLETED' && userType === 'CUSTOMER') {
    keyboard.push([
      { text: '\u2b50 Leave Review', callback_data: `booking_action_review_${booking.id}` }
    ]);
  }

  keyboard.push([
    { text: '\ud83d\udcac Chat', callback_data: `booking_action_chat_${booking.id}` }
  ]);

  keyboard.push([
    { text: '\u25c0\ufe0f Back', callback_data: 'main_menu' }
  ]);

  return keyboard;
}
