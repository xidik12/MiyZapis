import type { Locale } from './categories';

/**
 * Comprehensive translation strings for the entire MiyZapis mini-app.
 * Organized by page/feature for easy maintenance.
 */

// Common/shared strings used across multiple pages
export const commonStrings: Record<string, Record<Locale, string>> = {
  // Actions
  cancel: { en: 'Cancel', uk: 'Скасувати', ru: 'Отменить' },
  save: { en: 'Save', uk: 'Зберегти', ru: 'Сохранить' },
  saveChanges: { en: 'Save Changes', uk: 'Зберегти зміни', ru: 'Сохранить изменения' },
  delete: { en: 'Delete', uk: 'Видалити', ru: 'Удалить' },
  edit: { en: 'Edit', uk: 'Редагувати', ru: 'Редактировать' },
  continue: { en: 'Continue', uk: 'Продовжити', ru: 'Продолжить' },
  confirm: { en: 'Confirm', uk: 'Підтвердити', ru: 'Подтвердить' },
  back: { en: 'Back', uk: 'Назад', ru: 'Назад' },
  close: { en: 'Close', uk: 'Закрити', ru: 'Закрыть' },
  viewAll: { en: 'View All', uk: 'Переглянути все', ru: 'Посмотреть все' },
  search: { en: 'Search', uk: 'Пошук', ru: 'Поиск' },
  filter: { en: 'Filter', uk: 'Фільтр', ru: 'Фильтр' },
  sort: { en: 'Sort', uk: 'Сортувати', ru: 'Сортировать' },
  apply: { en: 'Apply', uk: 'Застосувати', ru: 'Применить' },
  clearAll: { en: 'Clear All', uk: 'Очистити все', ru: 'Очистить все' },
  loading: { en: 'Loading...', uk: 'Завантаження...', ru: 'Загрузка...' },
  noResults: { en: 'No results found', uk: 'Результатів не знайдено', ru: 'Результатов не найдено' },
  error: { en: 'Error', uk: 'Помилка', ru: 'Ошибка' },
  success: { en: 'Success', uk: 'Успішно', ru: 'Успешно' },
  retry: { en: 'Retry', uk: 'Повторити', ru: 'Повторить' },

  // Time
  min: { en: 'min', uk: 'хв', ru: 'мин' },
  hour: { en: 'hour', uk: 'година', ru: 'час' },
  hours: { en: 'hours', uk: 'годин', ru: 'часов' },
  day: { en: 'day', uk: 'день', ru: 'день' },
  days: { en: 'days', uk: 'днів', ru: 'дней' },
  at: { en: 'at', uk: 'о', ru: 'в' },

  // Status
  pending: { en: 'Pending', uk: 'Очікує', ru: 'Ожидает' },
  confirmed: { en: 'Confirmed', uk: 'Підтверджено', ru: 'Подтверждено' },
  completed: { en: 'Completed', uk: 'Завершено', ru: 'Завершено' },
  cancelled: { en: 'Cancelled', uk: 'Скасовано', ru: 'Отменено' },
  active: { en: 'Active', uk: 'Активний', ru: 'Активный' },
  inactive: { en: 'Inactive', uk: 'Неактивний', ru: 'Неактивный' },

  // Empty states
  noDataYet: { en: 'No data yet', uk: 'Даних поки немає', ru: 'Данных пока нет' },
  comingSoon: { en: 'Coming Soon', uk: 'Незабаром', ru: 'Скоро' },

  // Other
  bookings: { en: 'bookings', uk: 'записів', ru: 'записей' },
};

// Bookings page
export const bookingsStrings: Record<string, Record<Locale, string>> = {
  title: { en: 'My Bookings', uk: 'Мої записи', ru: 'Мои записи' },
  upcoming: { en: 'Upcoming', uk: 'Майбутні', ru: 'Предстоящие' },
  past: { en: 'Past', uk: 'Минулі', ru: 'Прошлые' },
  bookNew: { en: 'Book New', uk: 'Новий запис', ru: 'Новая запись' },
  noUpcoming: { en: 'No upcoming bookings', uk: 'Немає майбутніх записів', ru: 'Нет предстоящих записей' },
  noPast: { en: 'No past bookings', uk: 'Немає минулих записів', ru: 'Нет прошлых записей' },
  bookFirst: { en: 'Book your first service', uk: 'Забронюйте свою першу послугу', ru: 'Забронируйте первую услугу' },
  cancelBooking: { en: 'Cancel Booking', uk: 'Скасувати запис', ru: 'Отменить запись' },
  confirmCancel: { en: 'Are you sure you want to cancel this booking?', uk: 'Ви впевнені, що хочете скасувати цей запис?', ru: 'Вы уверены, что хотите отменить эту запись?' },
  cancelled: { en: 'Booking cancelled successfully', uk: 'Запис успішно скасовано', ru: 'Запись успешно отменена' },
  cancelFailed: { en: 'Failed to cancel booking', uk: 'Не вдалося скасувати запис', ru: 'Не удалось отменить запись' },
  reschedule: { en: 'Reschedule', uk: 'Перенести', ru: 'Перенести' },
  viewDetails: { en: 'View Details', uk: 'Деталі', ru: 'Детали' },
  message: { en: 'Message', uk: 'Повідомлення', ru: 'Сообщение' },
  call: { en: 'Call', uk: 'Подзвонити', ru: 'Позвонить' },
  leaveReview: { en: 'Leave Review', uk: 'Залишити відгук', ru: 'Оставить отзыв' },
};

// Booking flow
export const bookingFlowStrings: Record<string, Record<Locale, string>> = {
  selectService: { en: 'Select Service', uk: 'Обрати послугу', ru: 'Выбрать услугу' },
  dateTime: { en: 'Date & Time', uk: 'Дата і час', ru: 'Дата и время' },
  details: { en: 'Details', uk: 'Деталі', ru: 'Детали' },
  payment: { en: 'Payment', uk: 'Оплата', ru: 'Оплата' },
  contactInfo: { en: 'Contact Information', uk: 'Контактна інформація', ru: 'Контактная информация' },
  firstName: { en: 'First Name', uk: 'Ім\'я', ru: 'Имя' },
  lastName: { en: 'Last Name', uk: 'Прізвище', ru: 'Фамилия' },
  phoneNumber: { en: 'Phone Number', uk: 'Номер телефону', ru: 'Номер телефона' },
  email: { en: 'Email', uk: 'Електронна пошта', ru: 'Эл. почта' },
  specialNotes: { en: 'Special Notes', uk: 'Особливі примітки', ru: 'Особые примечания' },
  bookingSummary: { en: 'Booking Summary', uk: 'Підсумок бронювання', ru: 'Итог бронирования' },
  service: { en: 'Service', uk: 'Послуга', ru: 'Услуга' },
  specialist: { en: 'Specialist', uk: 'Спеціаліст', ru: 'Специалист' },
  duration: { en: 'Duration', uk: 'Тривалість', ru: 'Длительность' },
  total: { en: 'Total', uk: 'Всього', ru: 'Итого' },
  paymentMethod: { en: 'Payment Method', uk: 'Спосіб оплати', ru: 'Способ оплаты' },
  telegramPayments: { en: 'Telegram Payments', uk: 'Telegram Payments', ru: 'Telegram Payments' },
  processing: { en: 'Processing...', uk: 'Обробка...', ru: 'Обработка...' },
  bookAppointment: { en: 'Book Appointment', uk: 'Забронювати', ru: 'Забронировать' },
  bookAndPay: { en: 'Book & Pay', uk: 'Забронювати та оплатити', ru: 'Забронировать и оплатить' },
  selectDate: { en: 'Select a date', uk: 'Оберіть дату', ru: 'Выберите дату' },
  selectTime: { en: 'Select a time slot', uk: 'Оберіть час', ru: 'Выберите время' },
  noSlotsAvailable: { en: 'No time slots available', uk: 'Немає доступних слотів', ru: 'Нет доступных слотов' },
  bookingSuccess: { en: 'Booking created successfully!', uk: 'Запис успішно створено!', ru: 'Запись успешно создана!' },
  bookingFailed: { en: 'Failed to create booking', uk: 'Не вдалося створити запис', ru: 'Не удалось создать запись' },
};

// Search page
export const searchStrings: Record<string, Record<Locale, string>> = {
  searchServices: { en: 'Search services', uk: 'Пошук послуг', ru: 'Поиск услуг' },
  searchSpecialists: { en: 'Search specialists', uk: 'Пошук спеціалістів', ru: 'Поиск специалистов' },
  filters: { en: 'Filters', uk: 'Фільтри', ru: 'Фильтры' },
  category: { en: 'Category', uk: 'Категорія', ru: 'Категория' },
  priceRange: { en: 'Price Range', uk: 'Діапазон цін', ru: 'Диапазон цен' },
  sortBy: { en: 'Sort By', uk: 'Сортувати за', ru: 'Сортировать по' },
  minimumRating: { en: 'Minimum Rating', uk: 'Мінімальний рейтинг', ru: 'Минимальный рейтинг' },
  mostPopular: { en: 'Most Popular', uk: 'Найпопулярніші', ru: 'Самые популярные' },
  priceLowToHigh: { en: 'Price: Low to High', uk: 'Ціна: від низької', ru: 'Цена: от низкой' },
  priceHighToLow: { en: 'Price: High to Low', uk: 'Ціна: від високої', ru: 'Цена: от высокой' },
  highestRated: { en: 'Highest Rated', uk: 'Найвищий рейтинг', ru: 'Высший рейтинг' },
  newest: { en: 'Newest', uk: 'Найновіші', ru: 'Новейшие' },
  resultsFound: { en: 'results found', uk: 'результатів знайдено', ru: 'результатов найдено' },
  noServices: { en: 'No services found', uk: 'Послуг не знайдено', ru: 'Услуг не найдено' },
  tryDifferent: { en: 'Try different filters', uk: 'Спробуйте інші фільтри', ru: 'Попробуйте другие фильтры' },
  applyFilters: { en: 'Apply Filters', uk: 'Застосувати фільтри', ru: 'Применить фильтры' },
};

// Service detail page
export const serviceDetailStrings: Record<string, Record<Locale, string>> = {
  description: { en: 'Description', uk: 'Опис', ru: 'Описание' },
  verifiedSpecialist: { en: 'Verified specialist', uk: 'Перевірений спеціаліст', ru: 'Проверенный специалист' },
  reviews: { en: 'Reviews', uk: 'Відгуки', ru: 'Отзывы' },
  bookNow: { en: 'Book Now', uk: 'Забронювати', ru: 'Забронировать' },
  addToFavorites: { en: 'Add to Favorites', uk: 'Додати в обране', ru: 'Добавить в избранное' },
  removeFromFavorites: { en: 'Remove from Favorites', uk: 'Видалити з обраного', ru: 'Удалить из избранного' },
  message: { en: 'Message', uk: 'Написати', ru: 'Написать' },
  call: { en: 'Call', uk: 'Подзвонити', ru: 'Позвонить' },
  email: { en: 'Email', uk: 'Email', ru: 'Email' },
  noImage: { en: 'No image available', uk: 'Зображення недоступне', ru: 'Изображение недоступно' },
  noReviews: { en: 'No reviews yet', uk: 'Відгуків поки немає', ru: 'Отзывов пока нет' },
  beFirst: { en: 'Be the first to review', uk: 'Будьте першим, хто залишить відгук', ru: 'Будьте первым, кто оставит отзыв' },
};

// Profile page
export const profileStrings: Record<string, Record<Locale, string>> = {
  profile: { en: 'Profile', uk: 'Профіль', ru: 'Профиль' },
  editProfile: { en: 'Edit Profile', uk: 'Редагувати профіль', ru: 'Редактировать профиль' },
  settings: { en: 'Settings & Preferences', uk: 'Налаштування', ru: 'Настройки' },
  signOut: { en: 'Sign Out', uk: 'Вийти', ru: 'Выйти' },
  wallet: { en: 'Wallet', uk: 'Гаманець', ru: 'Кошелёк' },
  favorites: { en: 'Favorites', uk: 'Обрані', ru: 'Избранное' },
  rewards: { en: 'Rewards', uk: 'Нагороди', ru: 'Награды' },
  community: { en: 'Community', uk: 'Спільнота', ru: 'Сообщество' },
  myReviews: { en: 'My reviews', uk: 'Мої відгуки', ru: 'Мои отзывы' },
  balance: { en: 'Balance & payments', uk: 'Баланс та платежі', ru: 'Баланс и платежи' },
  savedServices: { en: 'Saved services', uk: 'Збережені послуги', ru: 'Сохранённые услуги' },
  loyaltyPoints: { en: 'Loyalty points', uk: 'Бонусні бали', ru: 'Бонусные баллы' },
  postsAndTips: { en: 'Posts & tips', uk: 'Пости та поради', ru: 'Посты и советы' },
  totalBookings: { en: 'Total', uk: 'Всього', ru: 'Всего' },
  completedBookings: { en: 'Completed', uk: 'Завершені', ru: 'Завершённые' },
  avgRating: { en: 'Avg Rating', uk: 'Серед. рейтинг', ru: 'Ср. рейтинг' },
  recentBookings: { en: 'Recent Bookings', uk: 'Останні записи', ru: 'Последние записи' },
  noBookingsYet: { en: 'No bookings yet', uk: 'Записів поки немає', ru: 'Записей пока нет' },
  bookFirstService: { en: 'Book Your First Service', uk: 'Забронюйте першу послугу', ru: 'Забронируйте первую услугу' },
  avatarUpload: { en: 'Avatar upload feature will be available soon.', uk: 'Функція завантаження аватара буде доступна незабаром.', ru: 'Функция загрузки аватара будет доступна скоро.' },
  quickActions: { en: 'Quick Actions', uk: 'Швидкі дії', ru: 'Быстрые действия' },
};

// Specialist dashboard
export const specialistDashboardStrings: Record<string, Record<Locale, string>> = {
  welcomeBack: { en: 'Welcome back', uk: 'З поверненням', ru: 'С возвращением' },
  overview: { en: 'Here\'s your business overview', uk: 'Огляд вашого бізнесу', ru: 'Обзор вашего бизнеса' },
  totalBookings: { en: 'Total Bookings', uk: 'Всього записів', ru: 'Всего записей' },
  totalRevenue: { en: 'Total Revenue', uk: 'Загальний дохід', ru: 'Общий доход' },
  rating: { en: 'Rating', uk: 'Рейтинг', ru: 'Рейтинг' },
  completionRate: { en: 'Completion Rate', uk: 'Рівень завершення', ru: 'Уровень завершения' },
  thisMonth: { en: 'This Month', uk: 'Цього місяця', ru: 'В этом месяце' },
  revenue: { en: 'Revenue', uk: 'Дохід', ru: 'Доход' },
  recentBookings: { en: 'Recent Bookings', uk: 'Останні записи', ru: 'Последние записи' },
  quickActions: { en: 'Quick Actions', uk: 'Швидкі дії', ru: 'Быстрые действия' },
  schedule: { en: 'Schedule', uk: 'Розклад', ru: 'Расписание' },
  earnings: { en: 'Earnings', uk: 'Заробіток', ru: 'Заработок' },
  analytics: { en: 'Analytics', uk: 'Аналітика', ru: 'Аналитика' },
  performance: { en: 'Performance', uk: 'Продуктивність', ru: 'Производительность' },
  responseTime: { en: 'Response Time', uk: 'Час відповіді', ru: 'Время ответа' },
  averageRating: { en: 'Average Rating', uk: 'Середній рейтинг', ru: 'Средний рейтинг' },
};

// Settings page
export const settingsStrings: Record<string, Record<Locale, string>> = {
  title: { en: 'Settings', uk: 'Налаштування', ru: 'Настройки' },
  preferences: { en: 'Preferences', uk: 'Налаштування', ru: 'Предпочтения' },
  notifications: { en: 'Notifications', uk: 'Сповіщення', ru: 'Уведомления' },
  language: { en: 'Language', uk: 'Мова', ru: 'Язык' },
  darkMode: { en: 'Dark Mode', uk: 'Темна тема', ru: 'Тёмная тема' },
  support: { en: 'Support', uk: 'Підтримка', ru: 'Поддержка' },
  privacySecurity: { en: 'Privacy & Security', uk: 'Конфіденційність і безпека', ru: 'Конфиденциальность и безопасность' },
  helpSupport: { en: 'Help & Support', uk: 'Допомога та підтримка', ru: 'Помощь и поддержка' },
  channels: { en: 'Channels', uk: 'Канали', ru: 'Каналы' },
  sms: { en: 'SMS', uk: 'SMS', ru: 'SMS' },
  pushNotifications: { en: 'Push Notifications', uk: 'Push-сповіщення', ru: 'Push-уведомления' },
  telegram: { en: 'Telegram', uk: 'Telegram', ru: 'Telegram' },
  types: { en: 'Types', uk: 'Типи', ru: 'Типы' },
  bookingReminders: { en: 'Booking Reminders', uk: 'Нагадування про записи', ru: 'Напоминания о записях' },
  promotions: { en: 'Promotions', uk: 'Акції', ru: 'Акции' },
  savePreferences: { en: 'Save Preferences', uk: 'Зберегти налаштування', ru: 'Сохранить настройки' },
  languageChanged: { en: 'Language changed', uk: 'Мову змінено', ru: 'Язык изменён' },
};

// Community page
export const communityStrings: Record<string, Record<Locale, string>> = {
  title: { en: 'Community', uk: 'Спільнота', ru: 'Сообщество' },
  searchPosts: { en: 'Search posts...', uk: 'Пошук постів...', ru: 'Поиск постов...' },
  all: { en: 'All', uk: 'Все', ru: 'Все' },
  discussion: { en: 'Discussion', uk: 'Обговорення', ru: 'Обсуждение' },
  tip: { en: 'Tip', uk: 'Порада', ru: 'Совет' },
  question: { en: 'Question', uk: 'Питання', ru: 'Вопрос' },
  showcase: { en: 'Showcase', uk: 'Портфоліо', ru: 'Портфолио' },
  event: { en: 'Event', uk: 'Подія', ru: 'Событие' },
  noPosts: { en: 'No posts yet', uk: 'Постів поки немає', ru: 'Постов пока нет' },
  beFirst: { en: 'Be the first to share something!', uk: 'Будьте першим, хто поділиться!', ru: 'Будьте первым, кто поделится!' },
  createPost: { en: 'Create Post', uk: 'Створити пост', ru: 'Создать пост' },
  postTitle: { en: 'Title', uk: 'Заголовок', ru: 'Заголовок' },
  content: { en: 'Content', uk: 'Вміст', ru: 'Содержание' },
  type: { en: 'Type', uk: 'Тип', ru: 'Тип' },
  whatsOnMind: { en: 'What\'s on your mind?', uk: 'Що у вас на думці?', ru: 'Что у вас на уме?' },
  publishPost: { en: 'Publish Post', uk: 'Опублікувати пост', ru: 'Опубликовать пост' },
};

// Wallet page
export const walletStrings: Record<string, Record<Locale, string>> = {
  title: { en: 'Wallet', uk: 'Гаманець', ru: 'Кошелёк' },
  availableBalance: { en: 'Available Balance', uk: 'Доступний баланс', ru: 'Доступный баланс' },
  quickActions: { en: 'Quick Actions', uk: 'Швидкі дії', ru: 'Быстрые действия' },
  pay: { en: 'Pay', uk: 'Оплатити', ru: 'Оплатить' },
  history: { en: 'History', uk: 'Історія', ru: 'История' },
  recentActivity: { en: 'Recent Activity', uk: 'Остання активність', ru: 'Последняя активность' },
  noTransactions: { en: 'No transactions yet', uk: 'Транзакцій поки немає', ru: 'Транзакций пока нет' },
  transactionHistory: { en: 'Your transaction history will appear here', uk: 'Історія транзакцій з\'явиться тут', ru: 'История транзакций появится здесь' },
  overview: { en: 'Overview', uk: 'Огляд', ru: 'Обзор' },
  transactions: { en: 'Transactions', uk: 'Транзакції', ru: 'Транзакции' },
  saved: { en: 'Saved', uk: 'Збережено', ru: 'Сохранено' },
};

// Loyalty page
export const loyaltyStrings: Record<string, Record<Locale, string>> = {
  title: { en: 'Loyalty & Rewards', uk: 'Програма лояльності', ru: 'Программа лояльности' },
  currentPoints: { en: 'Current Points', uk: 'Поточні бали', ru: 'Текущие баллы' },
  currentTier: { en: 'Current Tier', uk: 'Поточний рівень', ru: 'Текущий уровень' },
  howToEarn: { en: 'How to earn points', uk: 'Як заробити бали', ru: 'Как заработать баллы' },
  completeBooking: { en: 'Complete a booking', uk: 'Завершити запис', ru: 'Завершить запись' },
  referFriend: { en: 'Refer a friend', uk: 'Запросити друга', ru: 'Пригласить друга' },
  leaveReview: { en: 'Leave a review', uk: 'Залишити відгук', ru: 'Оставить отзыв' },
  recentActivity: { en: 'Recent Activity', uk: 'Остання активність', ru: 'Последняя активность' },
  noActivity: { en: 'No loyalty activity yet', uk: 'Активності поки немає', ru: 'Активности пока нет' },
  noRewards: { en: 'No rewards available', uk: 'Немає доступних винагород', ru: 'Нет доступных наград' },
  keepEarning: { en: 'Keep earning points to unlock rewards', uk: 'Продовжуйте заробляти бали', ru: 'Продолжайте зарабатывать баллы' },
  missingFields: { en: 'Missing fields', uk: 'Відсутні поля', ru: 'Отсутствующие поля' },
  fillRequired: { en: 'Please fill all required fields', uk: 'Заповніть всі обов\'язкові поля', ru: 'Заполните все обязательные поля' },
  tiers: { en: 'Tiers', uk: 'Рівні', ru: 'Уровни' },
  rewards: { en: 'Rewards', uk: 'Винагороди', ru: 'Награды' },
  overview: { en: 'Overview', uk: 'Огляд', ru: 'Обзор' },
};

// Favorites page
export const favoritesStrings: Record<string, Record<Locale, string>> = {
  title: { en: 'Favorites', uk: 'Обрані', ru: 'Избранное' },
  specialists: { en: 'Specialists', uk: 'Спеціалісти', ru: 'Специалисты' },
  services: { en: 'Services', uk: 'Послуги', ru: 'Услуги' },
  searchSpecialists: { en: 'Search specialists...', uk: 'Пошук спеціалістів...', ru: 'Поиск специалистов...' },
  searchServices: { en: 'Search services...', uk: 'Пошук послуг...', ru: 'Поиск услуг...' },
  noFavorites: { en: 'No favorites yet', uk: 'Обраних поки немає', ru: 'Избранного пока нет' },
  saveSpecialists: { en: 'Save your favorite specialists for quick access', uk: 'Зберігайте улюблених спеціалістів', ru: 'Сохраняйте любимых специалистов' },
  saveServices: { en: 'Save services you want to book later', uk: 'Зберігайте послуги для пізнішого бронювання', ru: 'Сохраняйте услуги для последующего бронирования' },
  exploreSpecialists: { en: 'Explore Specialists', uk: 'Переглянути спеціалістів', ru: 'Посмотреть специалистов' },
  exploreServices: { en: 'Explore Services', uk: 'Переглянути послуги', ru: 'Посмотреть услуги' },
  confirmRemove: { en: 'Remove from favorites?', uk: 'Видалити з обраного?', ru: 'Удалить из избранного?' },
};

// Reviews page
export const reviewsStrings: Record<string, Record<Locale, string>> = {
  title: { en: 'My Reviews', uk: 'Мої відгуки', ru: 'Мои отзывы' },
  total: { en: 'Total', uk: 'Всього', ru: 'Всего' },
  avgRating: { en: 'Avg Rating', uk: 'Серед. рейтинг', ru: 'Ср. рейтинг' },
  responses: { en: 'Responses', uk: 'Відповіді', ru: 'Ответы' },
  noReviews: { en: 'No reviews yet', uk: 'Відгуків поки немає', ru: 'Отзывов пока нет' },
  leaveReview: { en: 'After completing a booking, you can leave a review', uk: 'Після завершення запису ви можете залишити відгук', ru: 'После завершения записи вы можете оставить отзыв' },
  viewBookings: { en: 'View Bookings', uk: 'Переглянути записи', ru: 'Посмотреть записи' },
};

// Analytics page
export const analyticsStrings: Record<string, Record<Locale, string>> = {
  title: { en: 'Your Analytics', uk: 'Ваша аналітика', ru: 'Ваша аналитика' },
  subtitle: { en: 'Track your booking activity and spending', uk: 'Відстежуйте активність та витрати', ru: 'Отслеживайте активность и расходы' },
  totalBookings: { en: 'Total Bookings', uk: 'Всього записів', ru: 'Всего записей' },
  totalSpent: { en: 'Total Spent', uk: 'Всього витрачено', ru: 'Всего потрачено' },
  avgRatingGiven: { en: 'Avg Rating Given', uk: 'Серед. рейтинг', ru: 'Ср. рейтинг' },
  completionRate: { en: 'Completion Rate', uk: 'Рівень завершення', ru: 'Уровень завершения' },
  monthlySpending: { en: 'Monthly Spending', uk: 'Щомісячні витрати', ru: 'Ежемесячные расходы' },
  spendingByCategory: { en: 'Spending by Category', uk: 'Витрати за категоріями', ru: 'Расходы по категориям' },
};

// Messaging page
export const messagingStrings: Record<string, Record<Locale, string>> = {
  title: { en: 'Messages', uk: 'Повідомлення', ru: 'Сообщения' },
  selectConversation: { en: 'Select a conversation', uk: 'Оберіть розмову', ru: 'Выберите разговор' },
  online: { en: 'Online', uk: 'Онлайн', ru: 'Онлайн' },
  lastSeen: { en: 'Last seen recently', uk: 'Був(-ла) нещодавно', ru: 'Был(-а) недавно' },
  typeMessage: { en: 'Type a message...', uk: 'Введіть повідомлення...', ru: 'Введите сообщение...' },
  send: { en: 'Send', uk: 'Надіслати', ru: 'Отправить' },
  noConversations: { en: 'No conversations yet', uk: 'Розмов поки немає', ru: 'Разговоров пока нет' },
  startMessaging: { en: 'Start messaging specialists', uk: 'Почніть спілкування зі спеціалістами', ru: 'Начните общение со специалистами' },
};

// Specialist profile page
export const specialistProfileStrings: Record<string, Record<Locale, string>> = {
  about: { en: 'About', uk: 'Про спеціаліста', ru: 'О специалисте' },
  specialties: { en: 'Specialties', uk: 'Спеціальності', ru: 'Специальности' },
  certifications: { en: 'Certifications', uk: 'Сертифікати', ru: 'Сертификаты' },
  location: { en: 'Location', uk: 'Локація', ru: 'Локация' },
  services: { en: 'Services', uk: 'Послуги', ru: 'Услуги' },
  portfolio: { en: 'Portfolio', uk: 'Портфоліо', ru: 'Портфолио' },
  reviews: { en: 'Reviews', uk: 'Відгуки', ru: 'Отзывы' },
  yearsExperience: { en: 'Years Experience', uk: 'Років досвіду', ru: 'Лет опыта' },
  online: { en: 'Online', uk: 'Онлайн', ru: 'Онлайн' },
  offline: { en: 'Offline', uk: 'Офлайн', ru: 'Офлайн' },
  viewProfile: { en: 'View Profile', uk: 'Переглянути профіль', ru: 'Посмотреть профиль' },
  message: { en: 'Message', uk: 'Написати', ru: 'Написать' },
  call: { en: 'Call', uk: 'Подзвонити', ru: 'Позвонить' },
  email: { en: 'Email', uk: 'Email', ru: 'Email' },
};

// Specialist services page
export const specialistServicesStrings: Record<string, Record<Locale, string>> = {
  title: { en: 'My Services', uk: 'Мої послуги', ru: 'Мои услуги' },
  noServices: { en: 'No services yet', uk: 'Послуг поки немає', ru: 'Услуг пока нет' },
  addFirst: { en: 'Add your first service to start receiving bookings', uk: 'Додайте першу послугу для початку роботи', ru: 'Добавьте первую услугу для начала работы' },
  addService: { en: 'Add Service', uk: 'Додати послугу', ru: 'Добавить услугу' },
  editService: { en: 'Edit Service', uk: 'Редагувати послугу', ru: 'Редактировать услугу' },
  serviceName: { en: 'Service Name', uk: 'Назва послуги', ru: 'Название услуги' },
  description: { en: 'Description', uk: 'Опис', ru: 'Описание' },
  category: { en: 'Category', uk: 'Категорія', ru: 'Категория' },
  selectCategory: { en: 'Select category', uk: 'Оберіть категорію', ru: 'Выберите категорию' },
  durationMin: { en: 'Duration (min)', uk: 'Тривалість (хв)', ru: 'Длительность (мин)' },
  price: { en: 'Price', uk: 'Ціна', ru: 'Цена' },
  create: { en: 'Create', uk: 'Створити', ru: 'Создать' },
  update: { en: 'Update', uk: 'Оновити', ru: 'Обновить' },
  saving: { en: 'Saving...', uk: 'Збереження...', ru: 'Сохранение...' },
  serviceUpdated: { en: 'Service updated successfully', uk: 'Послугу оновлено', ru: 'Услуга обновлена' },
  serviceCreated: { en: 'Service created successfully', uk: 'Послугу створено', ru: 'Услуга создана' },
  saveFailed: { en: 'Failed to save service', uk: 'Не вдалося зберегти', ru: 'Не удалось сохранить' },
  serviceDeleted: { en: 'Service deleted', uk: 'Послугу видалено', ru: 'Услуга удалена' },
  deleteFailed: { en: 'Failed to delete service', uk: 'Не вдалося видалити', ru: 'Не удалось удалить' },
};
