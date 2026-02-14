export type Locale = 'en' | 'uk' | 'ru';

interface CategoryInfo {
  icon: string;
  color: string;
  name: {
    en: string;
    uk: string;
    ru: string;
  };
}

// Comprehensive category registry mapping API slugs to proper display data
const CATEGORY_REGISTRY: Record<string, CategoryInfo> = {
  // Beauty & Personal Care
  'beauty': { icon: '💄', color: '#EC4899', name: { en: 'Beauty & Makeup', uk: 'Краса та макіяж', ru: 'Красота и макияж' } },
  'beauty-wellness': { icon: '✨', color: '#EC4899', name: { en: 'Beauty & Wellness', uk: 'Краса та здоров\'я', ru: 'Красота и здоровье' } },
  'makeup-services': { icon: '💄', color: '#F472B6', name: { en: 'Makeup', uk: 'Макіяж', ru: 'Макияж' } },
  'skincare': { icon: '🧴', color: '#FDA4AF', name: { en: 'Skincare & Facials', uk: 'Догляд за шкірою', ru: 'Уход за кожей' } },
  'eyebrows': { icon: '👁️', color: '#A855F7', name: { en: 'Brows & Lashes', uk: 'Брови та вії', ru: 'Брови и ресницы' } },
  'tattoo': { icon: '🎨', color: '#6366F1', name: { en: 'Tattoo & Piercing', uk: 'Тату та пірсинг', ru: 'Тату и пирсинг' } },

  // Hair
  'haircut': { icon: '✂️', color: '#8B5CF6', name: { en: 'Hair & Barber', uk: 'Перукарські послуги', ru: 'Парикмахерские услуги' } },
  'hair-styling': { icon: '💇', color: '#A78BFA', name: { en: 'Hair Styling', uk: 'Укладка волосся', ru: 'Укладка волос' } },
  'styling': { icon: '🎨', color: '#C084FC', name: { en: 'Hair Coloring', uk: 'Фарбування волосся', ru: 'Окрашивание волос' } },

  // Nails
  'nails': { icon: '💅', color: '#F43F5E', name: { en: 'Nail Services', uk: 'Нігтьовий сервіс', ru: 'Ногтевой сервис' } },
  'manicure-pedicure': { icon: '💅', color: '#FB7185', name: { en: 'Manicure & Pedicure', uk: 'Манікюр та педикюр', ru: 'Маникюр и педикюр' } },

  // Wellness & Health
  'wellness': { icon: '🌿', color: '#10B981', name: { en: 'Wellness', uk: 'Оздоровлення', ru: 'Оздоровление' } },
  'massage': { icon: '💆', color: '#34D399', name: { en: 'Massage & Spa', uk: 'Масаж та спа', ru: 'Массаж и спа' } },
  'therapy': { icon: '🧘', color: '#6EE7B7', name: { en: 'Therapy', uk: 'Терапія', ru: 'Терапия' } },
  'physiotherapy': { icon: '🏥', color: '#2DD4BF', name: { en: 'Physiotherapy', uk: 'Фізіотерапія', ru: 'Физиотерапия' } },
  'nutrition': { icon: '🥗', color: '#4ADE80', name: { en: 'Nutrition & Diet', uk: 'Харчування та дієта', ru: 'Питание и диета' } },
  'yoga': { icon: '🧘', color: '#A7F3D0', name: { en: 'Yoga & Pilates', uk: 'Йога та пілатес', ru: 'Йога и пилатес' } },

  // Fitness & Sports
  'fitness': { icon: '🏋️', color: '#EF4444', name: { en: 'Fitness', uk: 'Фітнес', ru: 'Фитнес' } },
  'sports': { icon: '⚽', color: '#F87171', name: { en: 'Sports Coaching', uk: 'Спортивний тренер', ru: 'Спортивный тренер' } },
  'martial-arts': { icon: '🥋', color: '#DC2626', name: { en: 'Martial Arts', uk: 'Бойові мистецтва', ru: 'Боевые искусства' } },
  'dance': { icon: '💃', color: '#FB923C', name: { en: 'Dance Lessons', uk: 'Уроки танців', ru: 'Уроки танцев' } },

  // Education & Lessons
  'education': { icon: '📚', color: '#8B5CF6', name: { en: 'Tutoring', uk: 'Репетиторство', ru: 'Репетиторство' } },
  'education-tutoring': { icon: '📖', color: '#7C3AED', name: { en: 'Education & Tutoring', uk: 'Освіта та навчання', ru: 'Образование и обучение' } },
  'language': { icon: '🗣️', color: '#6D28D9', name: { en: 'Language Lessons', uk: 'Уроки мов', ru: 'Уроки языков' } },
  'language-lessons': { icon: '🗣️', color: '#6D28D9', name: { en: 'Language Lessons', uk: 'Уроки мов', ru: 'Уроки языков' } },
  'music': { icon: '🎵', color: '#A855F7', name: { en: 'Music Lessons', uk: 'Уроки музики', ru: 'Уроки музыки' } },
  'computer': { icon: '💻', color: '#818CF8', name: { en: 'Computer Skills', uk: 'Комп\'ютерні навички', ru: 'Компьютерные навыки' } },
  'test-prep': { icon: '📝', color: '#4F46E5', name: { en: 'Test Preparation', uk: 'Підготовка до іспитів', ru: 'Подготовка к экзаменам' } },
  'driving': { icon: '🚗', color: '#6366F1', name: { en: 'Driving Lessons', uk: 'Уроки водіння', ru: 'Уроки вождения' } },

  // Home & Repair
  'home-services': { icon: '🏠', color: '#F97316', name: { en: 'Home Services', uk: 'Домашні послуги', ru: 'Домашние услуги' } },
  'home-repair': { icon: '🔧', color: '#EA580C', name: { en: 'Home Repair', uk: 'Ремонт дому', ru: 'Ремонт дома' } },
  'repair': { icon: '🛠️', color: '#FB923C', name: { en: 'Repair Services', uk: 'Ремонтні послуги', ru: 'Ремонтные услуги' } },
  'electrical-work': { icon: '⚡', color: '#FBBF24', name: { en: 'Electrical Work', uk: 'Електрика', ru: 'Электрика' } },
  'cleaning': { icon: '🧽', color: '#22D3EE', name: { en: 'Cleaning', uk: 'Прибирання', ru: 'Уборка' } },
  'gardening': { icon: '🌱', color: '#16A34A', name: { en: 'Gardening', uk: 'Садівництво', ru: 'Садоводство' } },

  // Professional Services
  'consulting': { icon: '💼', color: '#0EA5E9', name: { en: 'Consulting', uk: 'Консалтинг', ru: 'Консалтинг' } },
  'legal': { icon: '⚖️', color: '#475569', name: { en: 'Legal Services', uk: 'Юридичні послуги', ru: 'Юридические услуги' } },
  'accounting': { icon: '📊', color: '#0D9488', name: { en: 'Accounting & Tax', uk: 'Бухгалтерія та податки', ru: 'Бухгалтерия и налоги' } },
  'real-estate': { icon: '🏘️', color: '#0284C7', name: { en: 'Real Estate', uk: 'Нерухомість', ru: 'Недвижимость' } },

  // Tech & Digital
  'web-development': { icon: '🌐', color: '#3B82F6', name: { en: 'Web Development', uk: 'Веб-розробка', ru: 'Веб-разработка' } },
  'app-development': { icon: '📱', color: '#2563EB', name: { en: 'App Development', uk: 'Розробка додатків', ru: 'Разработка приложений' } },
  'graphic-design': { icon: '🎨', color: '#7C3AED', name: { en: 'Graphic Design', uk: 'Графічний дизайн', ru: 'Графический дизайн' } },
  'digital-marketing': { icon: '📈', color: '#059669', name: { en: 'Digital Marketing', uk: 'Цифровий маркетинг', ru: 'Цифровой маркетинг' } },
  'it-support': { icon: '💻', color: '#1D4ED8', name: { en: 'IT Support', uk: 'IT підтримка', ru: 'IT поддержка' } },

  // Creative & Media
  'photography': { icon: '📸', color: '#E11D48', name: { en: 'Photography', uk: 'Фотографія', ru: 'Фотография' } },
  'videography': { icon: '🎥', color: '#BE123C', name: { en: 'Videography', uk: 'Відеозйомка', ru: 'Видеосъёмка' } },
  'art': { icon: '🎨', color: '#C026D3', name: { en: 'Art & Design', uk: 'Мистецтво та дизайн', ru: 'Искусство и дизайн' } },
  'writing': { icon: '✍️', color: '#9333EA', name: { en: 'Writing & Translation', uk: 'Написання та переклад', ru: 'Написание и перевод' } },

  // Events & Entertainment
  'event-planning': { icon: '🎉', color: '#D946EF', name: { en: 'Event Planning', uk: 'Організація подій', ru: 'Организация мероприятий' } },
  'entertainment': { icon: '🎭', color: '#E879F9', name: { en: 'Entertainment', uk: 'Розваги', ru: 'Развлечения' } },
  'dj': { icon: '🎧', color: '#A855F7', name: { en: 'DJ & Music', uk: 'DJ та музика', ru: 'DJ и музыка' } },
  'catering': { icon: '🍽️', color: '#F59E0B', name: { en: 'Catering', uk: 'Кейтеринг', ru: 'Кейтеринг' } },

  // Care Services
  'childcare': { icon: '👶', color: '#F472B6', name: { en: 'Childcare', uk: 'Догляд за дітьми', ru: 'Уход за детьми' } },
  'elderly-care': { icon: '👵', color: '#94A3B8', name: { en: 'Elderly Care', uk: 'Догляд за літніми', ru: 'Уход за пожилыми' } },
  'pet-care': { icon: '🐕', color: '#A3E635', name: { en: 'Pet Care', uk: 'Догляд за тваринами', ru: 'Уход за животными' } },

  // Transport & Other
  'transport': { icon: '🚐', color: '#64748B', name: { en: 'Transport', uk: 'Транспорт', ru: 'Транспорт' } },
  'security': { icon: '🛡️', color: '#334155', name: { en: 'Security', uk: 'Охорона', ru: 'Охрана' } },
  'automotive': { icon: '🚗', color: '#78716C', name: { en: 'Auto Services', uk: 'Автопослуги', ru: 'Автоуслуги' } },
  'craft': { icon: '✋', color: '#B45309', name: { en: 'Crafts', uk: 'Ремесла', ru: 'Ремёсла' } },
  'other': { icon: '📋', color: '#64748B', name: { en: 'Other', uk: 'Інше', ru: 'Другое' } },
};

const DEFAULT_CATEGORY: CategoryInfo = {
  icon: '📋',
  color: '#64748B',
  name: { en: 'Other', uk: 'Інше', ru: 'Другое' },
};

/**
 * Get display info for a category by its API slug/id.
 */
export function getCategoryInfo(id: string): CategoryInfo {
  if (!id) return DEFAULT_CATEGORY;
  const lower = id.toLowerCase().trim();
  return CATEGORY_REGISTRY[lower] || DEFAULT_CATEGORY;
}

/**
 * Get localized category name.
 */
export function getCategoryName(id: string, locale: Locale): string {
  const info = getCategoryInfo(id);
  return info.name[locale] || info.name.en;
}

/**
 * Get category icon emoji.
 */
export function getCategoryIcon(id: string): string {
  return getCategoryInfo(id).icon;
}

/**
 * Get category accent color.
 */
export function getCategoryColor(id: string): string {
  return getCategoryInfo(id).color;
}

/**
 * Process raw API categories into display-ready format.
 * Filters out empty categories and maps to proper display data.
 */
export function processCategories(
  apiCategories: Array<{ id: string; name: string; icon: string; count: number }>,
  locale: Locale
): Array<{
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
}> {
  return apiCategories
    .filter((c) => c.id && c.count > 0)
    .map((c) => {
      const info = getCategoryInfo(c.id);
      return {
        id: c.id,
        name: info.name[locale] || info.name.en,
        icon: info.icon,
        color: info.color,
        count: c.count,
      };
    })
    .sort((a, b) => b.count - a.count);
}

/**
 * UI strings for the HomePage, translated.
 */
export const homeStrings: Record<string, Record<Locale, string>> = {
  welcome: { en: 'Welcome', uk: 'Вітаємо', ru: 'Добро пожаловать' },
  hi: { en: 'Hi', uk: 'Привіт', ru: 'Привет' },
  findService: { en: 'Find your perfect service', uk: 'Знайдіть ідеальну послугу', ru: 'Найдите идеальную услугу' },
  searchPlaceholder: { en: 'Search services, specialists...', uk: 'Пошук послуг, спеціалістів...', ru: 'Поиск услуг, специалистов...' },
  categories: { en: 'Categories', uk: 'Категорії', ru: 'Категории' },
  viewAll: { en: 'View All', uk: 'Усі', ru: 'Все' },
  popularServices: { en: 'Popular Services', uk: 'Популярні послуги', ru: 'Популярные услуги' },
  nearbySpecialists: { en: 'Nearby Specialists', uk: 'Спеціалісти поруч', ru: 'Специалисты рядом' },
  bookNow: { en: 'Book Now', uk: 'Записатися', ru: 'Записаться' },
  services: { en: 'services', uk: 'послуг', ru: 'услуг' },
  bookings: { en: 'Bookings', uk: 'Записи', ru: 'Записи' },
  wallet: { en: 'Wallet', uk: 'Гаманець', ru: 'Кошелёк' },
  favorites: { en: 'Favorites', uk: 'Обрані', ru: 'Избранное' },
  rewards: { en: 'Rewards', uk: 'Нагороди', ru: 'Награды' },
  community: { en: 'Community', uk: 'Спільнота', ru: 'Сообщество' },
  communityDesc: { en: 'Share tips, ask questions & connect', uk: 'Діліться порадами та спілкуйтесь', ru: 'Делитесь советами и общайтесь' },
  explore: { en: 'Explore', uk: 'Відкрити', ru: 'Открыть' },
  readyToStart: { en: 'Ready to get started?', uk: 'Готові розпочати?', ru: 'Готовы начать?' },
  signUpOffer: { en: 'Sign up now and get 10% off your first booking!', uk: 'Зареєструйтесь та отримайте -10% на перший запис!', ru: 'Зарегистрируйтесь и получите скидку 10% на первую запись!' },
  getStarted: { en: 'Get Started', uk: 'Почати', ru: 'Начать' },
  min: { en: 'min', uk: 'хв', ru: 'мин' },
  noCategories: { en: 'No categories yet', uk: 'Категорій поки немає', ru: 'Категорий пока нет' },
  noServices: { en: 'No services yet', uk: 'Послуг поки немає', ru: 'Услуг пока нет' },
  noSpecialists: { en: 'No specialists nearby', uk: 'Спеціалістів поруч немає', ru: 'Специалистов рядом нет' },
  beFirstSpecialist: { en: 'Be the first to offer your services!', uk: 'Будьте першими, хто запропонує свої послуги!', ru: 'Будьте первым, кто предложит свои услуги!' },
  loading: { en: 'Loading...', uk: 'Завантаження...', ru: 'Загрузка...' },
  // Dashboard grid categories & items
  catMyServices: { en: 'My Services', uk: 'Мої послуги', ru: 'Мои услуги' },
  catSocial: { en: 'Social', uk: 'Соціальне', ru: 'Социальное' },
  catAccount: { en: 'Account', uk: 'Акаунт', ru: 'Аккаунт' },
  catSpecialist: { en: 'Business', uk: 'Бізнес', ru: 'Бизнес' },
  messages: { en: 'Messages', uk: 'Повідомлення', ru: 'Сообщения' },
  notifications: { en: 'Alerts', uk: 'Сповіщення', ru: 'Уведомления' },
  referrals: { en: 'Referrals', uk: 'Реферали', ru: 'Рефералы' },
  profile: { en: 'Profile', uk: 'Профіль', ru: 'Профиль' },
  dashboard: { en: 'Dashboard', uk: 'Панель', ru: 'Панель' },
  settings: { en: 'Settings', uk: 'Налаштування', ru: 'Настройки' },
  help: { en: 'Help', uk: 'Допомога', ru: 'Помощь' },
  payments: { en: 'Payments', uk: 'Оплати', ru: 'Платежи' },
  reviews: { en: 'Reviews', uk: 'Відгуки', ru: 'Отзывы' },
  loyalty: { en: 'Loyalty', uk: 'Бонуси', ru: 'Бонусы' },
  specDashboard: { en: 'Dashboard', uk: 'Панель', ru: 'Панель' },
  specBookings: { en: 'Bookings', uk: 'Записи', ru: 'Записи' },
  specSchedule: { en: 'Schedule', uk: 'Графік', ru: 'Расписание' },
  specEarnings: { en: 'Earnings', uk: 'Дохід', ru: 'Доход' },
  specAnalytics: { en: 'Analytics', uk: 'Аналітика', ru: 'Аналитика' },
  specReviews: { en: 'Reviews', uk: 'Відгуки', ru: 'Отзывы' },
  specClients: { en: 'Clients', uk: 'Клієнти', ru: 'Клиенты' },
  specSettings: { en: 'Settings', uk: 'Налашт.', ru: 'Настр.' },
};
