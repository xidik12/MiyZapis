type Language = 'en' | 'uk' | 'ru';

const errorMessages: Record<string, Record<Language, string>> = {
  // HTTP status code errors
  'INVALID_REQUEST': {
    en: 'Invalid request data',
    uk: 'Невірні дані запиту',
    ru: 'Неверные данные запроса',
  },
  'AUTH_FAILED': {
    en: 'Authentication failed. Please log in again.',
    uk: 'Помилка авторизації. Будь ласка, увійдіть знову.',
    ru: 'Ошибка авторизации. Пожалуйста, войдите снова.',
  },
  'FORBIDDEN': {
    en: 'You do not have permission to perform this action',
    uk: 'У вас немає дозволу на виконання цієї дії',
    ru: 'У вас нет разрешения на выполнение этого действия',
  },
  'NOT_FOUND': {
    en: 'The requested resource was not found',
    uk: 'Запитаний ресурс не знайдено',
    ru: 'Запрашиваемый ресурс не найден',
  },
  'CONFLICT': {
    en: 'A conflict occurred',
    uk: 'Виник конфлікт',
    ru: 'Произошел конфликт',
  },
  'UNPROCESSABLE': {
    en: 'Unable to process the request',
    uk: 'Неможливо обробити запит',
    ru: 'Невозможно обработать запрос',
  },
  'RATE_LIMITED': {
    en: 'Too many requests. Please try again later',
    uk: 'Забагато запитів. Спробуйте пізніше',
    ru: 'Слишком много запросов. Попробуйте позже',
  },
  'SERVER_ERROR': {
    en: 'Server error. Please try again later',
    uk: 'Помилка сервера. Спробуйте пізніше',
    ru: 'Ошибка сервера. Попробуйте позже',
  },
  'NETWORK_ERROR': {
    en: 'Network error. Please check your connection',
    uk: 'Помилка мережі. Перевірте підключення',
    ru: 'Ошибка сети. Проверьте подключение',
  },
  'UNEXPECTED_ERROR': {
    en: 'An unexpected error occurred',
    uk: 'Сталася неочікувана помилка',
    ru: 'Произошла непредвиденная ошибка',
  },
  // Booking-specific errors
  'BOOKING_CONFLICT': {
    en: 'This time slot is already booked',
    uk: 'Цей час вже зайнятий',
    ru: 'Это время уже занято',
  },
  'BOOKING_NOT_FOUND': {
    en: 'Booking not found',
    uk: 'Бронювання не знайдено',
    ru: 'Бронирование не найдено',
  },
  'BOOKING_CANCELLED': {
    en: 'This booking has been cancelled',
    uk: 'Це бронювання було скасовано',
    ru: 'Это бронирование было отменено',
  },
  // Auth-specific errors
  'INVALID_CREDENTIALS': {
    en: 'Invalid email or password',
    uk: 'Невірна електронна пошта або пароль',
    ru: 'Неверный email или пароль',
  },
  'EMAIL_IN_USE': {
    en: 'This email is already registered',
    uk: 'Ця електронна пошта вже зареєстрована',
    ru: 'Этот email уже зарегистрирован',
  },
  'TOKEN_EXPIRED': {
    en: 'Your session has expired. Please log in again.',
    uk: 'Ваша сесія закінчилася. Будь ласка, увійдіть знову.',
    ru: 'Ваша сессия истекла. Пожалуйста, войдите снова.',
  },
  // Payment errors
  'PAYMENT_FAILED': {
    en: 'Payment processing failed',
    uk: 'Помилка обробки платежу',
    ru: 'Ошибка обработки платежа',
  },
  'INSUFFICIENT_FUNDS': {
    en: 'Insufficient funds',
    uk: 'Недостатньо коштів',
    ru: 'Недостаточно средств',
  },
};

function getCurrentLanguage(): Language {
  const stored = localStorage.getItem('booking-language');
  if (stored === 'uk' || stored === 'ru') return stored;
  return 'en';
}

export function getErrorMessage(code: string, fallback?: string): string {
  const lang = getCurrentLanguage();
  const messages = errorMessages[code];
  if (messages) {
    return messages[lang] || messages.en;
  }
  return fallback || errorMessages.UNEXPECTED_ERROR[lang];
}

export function getHttpErrorMessage(status: number, apiMessage?: string): string {
  const lang = getCurrentLanguage();

  // If the API returned a translated message or a specific message, use it
  if (apiMessage && errorMessages[apiMessage]) {
    return errorMessages[apiMessage][lang] || errorMessages[apiMessage].en;
  }

  switch (status) {
    case 400:
      return apiMessage || errorMessages.INVALID_REQUEST[lang];
    case 401:
      return errorMessages.AUTH_FAILED[lang];
    case 403:
      return errorMessages.FORBIDDEN[lang];
    case 404:
      return errorMessages.NOT_FOUND[lang];
    case 409:
      return apiMessage || errorMessages.CONFLICT[lang];
    case 422:
      return apiMessage || errorMessages.UNPROCESSABLE[lang];
    case 429:
      return errorMessages.RATE_LIMITED[lang];
    default:
      if (status >= 500) return errorMessages.SERVER_ERROR[lang];
      return errorMessages.UNEXPECTED_ERROR[lang];
  }
}
