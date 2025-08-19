import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

type Language = 'uk' | 'ru' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface Translations {
  [key: string]: {
    en: string;
    uk: string;
    ru: string;
  };
}

const translations: Translations = {
  // Brand
  'brand.name': { en: 'MiyZapys', uk: 'МійЗапис', ru: 'МояЗапись' },
  
  // Navigation
  'nav.home': { en: 'Home', uk: 'Головна', ru: 'Главная' },
  'nav.services': { en: 'Services', uk: 'Послуги', ru: 'Услуги' },
  'nav.howItWorks': { en: 'How it Works', uk: 'Як це працює', ru: 'Как это работает' },
  'nav.forSpecialists': { en: 'For Specialists', uk: 'Для спеціалістів', ru: 'Для специалистов' },
  'nav.signIn': { en: 'Sign in', uk: 'Увійти', ru: 'Войти' },
  'nav.getStarted': { en: 'Get Started', uk: 'Почати', ru: 'Начать' },

  // Hero Section
  'hero.title1': { en: 'Book Professional Services', uk: 'Замовте професійні послуги', ru: 'Заказывайте профессиональные услуги' },
  'hero.title2': { en: 'Made Simple', uk: 'Легко і просто', ru: 'Легко и просто' },
  'hero.subtitle': { en: 'Connect with verified specialists, schedule appointments instantly, and get the professional services you need - all in one platform.', uk: 'Зв\'яжіться з перевіреними спеціалістами, миттєво записуйтеся на прийом та отримуйте необхідні професійні послуги - все в одній платформі.', ru: 'Свяжитесь с проверенными специалистами, мгновенно записывайтесь на прием и получайте необходимые профессиональные услуги - все на одной платформе.' },
  'hero.searchPlaceholder': { en: 'What service are you looking for? (e.g., haircut, personal training, tutoring)', uk: 'Яку послугу ви шукаєте? (наприклад, стрижка, персональні тренування, репетиторство)', ru: 'Какую услугу вы ищете? (например, стрижка, персональные тренировки, репетиторство)' },

  // Categories
  'category.homeServices': { en: 'Home Services', uk: 'Домашні послуги', ru: 'Домашние услуги' },
  'category.professional': { en: 'Professional Services', uk: 'Професійні послуги', ru: 'Профессиональные услуги' },
  'category.education': { en: 'Education & Tutoring', uk: 'Освіта та репетиторство', ru: 'Образование и репетиторство' },
  'category.technology': { en: 'Technology', uk: 'Технології', ru: 'Технологии' },

  // Categories Section
  'categories.title': { en: 'Browse by Category', uk: 'Перегляд за категоріями', ru: 'Просмотр по категориям' },
  'categories.subtitle': { en: 'Find the perfect specialist for any service you need', uk: 'Знайдіть ідеального спеціаліста для будь-якої потрібної вам послуги', ru: 'Найдите идеального специалиста для любой нужной вам услуги' },

  // Stats
  'stats.activeSpecialists': { en: 'Active Specialists', uk: 'Активні спеціалісти', ru: 'Активные специалисты' },
  'stats.servicesCompleted': { en: 'Services Completed', uk: 'Завершені послуги', ru: 'Завершенные услуги' },
  'stats.averageRating': { en: 'Average Rating', uk: 'Середній рейтинг', ru: 'Средний рейтинг' },
  'stats.responseTime': { en: 'Response Time', uk: 'Час відповіді', ru: 'Время отклика' },

  // How it Works
  'howItWorks.title': { en: 'How MiyZapys Works', uk: 'Як працює МійЗапис', ru: 'Как работает МояЗапись' },
  'howItWorks.subtitle': { en: 'Getting professional services has never been easier', uk: 'Отримання професійних послуг ще ніколи не було таким простим', ru: 'Получение профессиональных услуг никогда не было таким простым' },
  'howItWorks.step1.title': { en: 'Search & Browse', uk: 'Пошук та перегляд', ru: 'Поиск и просмотр' },
  'howItWorks.step1.desc': { en: 'Find the perfect specialist for your needs from our verified community.', uk: 'Знайдіть ідеального спеціаліста для ваших потреб з нашої перевіреної спільноти.', ru: 'Найдите идеального специалиста для ваших нужд из нашего проверенного сообщества.' },
  'howItWorks.step2.title': { en: 'Book & Schedule', uk: 'Бронювання та планування', ru: 'Бронирование и планирование' },
  'howItWorks.step2.desc': { en: 'Choose your preferred time and book instantly with secure payment.', uk: 'Оберіть зручний час та миттєво забронюйте з безпечною оплатою.', ru: 'Выберите удобное время и мгновенно забронируйте с безопасной оплатой.' },
  'howItWorks.step3.title': { en: 'Meet & Connect', uk: 'Зустріч та спілкування', ru: 'Встреча и общение' },
  'howItWorks.step3.desc': { en: 'Connect with your specialist and receive professional service.', uk: 'Зв\'яжіться зі своїм спеціалістом та отримайте професійну послугу.', ru: 'Свяжитесь со своим специалистом и получите профессиональную услугу.' },
  'howItWorks.step4.title': { en: 'Rate & Review', uk: 'Оцініть та відгук', ru: 'Оцените и отзыв' },
  'howItWorks.step4.desc': { en: 'Share your experience and help others find great specialists.', uk: 'Поділіться своїм досвідом та допоможіть іншим знайти чудових спеціалістів.', ru: 'Поделитесь своим опытом и помогите другим найти отличных специалистов.' },

  // CTA Section
  'cta.title': { en: 'Ready to Get Started?', uk: 'Готові почати?', ru: 'Готовы начать?' },
  'cta.subtitle.loggedOut': { en: 'Join thousands of satisfied customers and specialists', uk: 'Приєднуйтеся до тисяч задоволених клієнтів та спеціалістів', ru: 'Присоединяйтесь к тысячам довольных клиентов и специалистов' },
  'cta.subtitle.loggedIn': { en: 'Find your next professional service booking', uk: 'Знайдіть своє наступне замовлення професійної послуги', ru: 'Найдите свое следующее бронирование профессиональной услуги' },
  'cta.browseServices': { en: 'Browse Services', uk: 'Переглянути послуги', ru: 'Просмотреть услуги' },
  'cta.signUpCustomer': { en: 'Sign Up as Customer', uk: 'Зареєструватися як клієнт', ru: 'Зарегистрироваться как клиент' },
  'cta.joinSpecialist': { en: 'Join as Specialist', uk: 'Приєднатися як спеціаліст', ru: 'Присоединиться как специалист' },

  // Service Categories Descriptions
  'category.beautyWellness.desc': { en: 'Hair, makeup, massage, and beauty treatments', uk: 'Волосся, макіяж, масаж та косметичні процедури', ru: 'Волосы, макияж, массаж и косметические процедуры' },
  'category.healthFitness.desc': { en: 'Personal training, nutrition, and wellness coaching', uk: 'Персональні тренування, харчування та велнес-коучинг', ru: 'Персональные тренировки, питание и велнес-коучинг' },
  'category.homeServices.desc': { en: 'Cleaning, repairs, and home maintenance', uk: 'Прибирання, ремонт та обслуговування дому', ru: 'Уборка, ремонт и обслуживание дома' },
  'category.professional.desc': { en: 'Consulting, legal, accounting, and business services', uk: 'Консалтинг, юридичні, бухгалтерські та бізнес-послуги', ru: 'Консалтинг, юридические, бухгалтерские и бизнес-услуги' },
  'category.education.desc': { en: 'Language lessons, academic tutoring, and skill training', uk: 'Мовні уроки, академічне репетиторство та навчання навичкам', ru: 'Языковые уроки, академическое репетиторство и обучение навыкам' },
  'category.technology.desc': { en: 'IT support, web development, and tech consulting', uk: 'IT підтримка, веб-розробка та технологічний консалтинг', ru: 'IT поддержка, веб-разработка и технологический консалтинг' },

  // For Specialists Section
  'forSpecialists.title': { en: 'Grow Your Business with MiyZapys', uk: 'Розвивайте свій бізнес з МійЗапис', ru: 'Развивайте свой бизнес с МояЗапись' },
  'forSpecialists.subtitle': { en: 'Join thousands of specialists who are building successful businesses on our platform. Get more bookings, manage your schedule, and grow your income.', uk: 'Приєднуйтеся до тисяч спеціалістів, які будують успішний бізнес на нашій платформі. Отримуйте більше бронювань, керуйте своїм розкладом та збільшуйте дохід.', ru: 'Присоединяйтесь к тысячам специалистов, которые строят успешный бизнес на нашей платформе. Получайте больше бронирований, управляйте своим расписанием и увеличивайте доход.' },
  'forSpecialists.verifiedClients': { en: 'Verified client base', uk: 'Перевірена база клієнтів', ru: 'Проверенная база клиентов' },
  'forSpecialists.flexibleScheduling': { en: 'Flexible scheduling', uk: 'Гнучке планування', ru: 'Гибкое планирование' },
  'forSpecialists.securePayments': { en: 'Secure payments', uk: 'Безпечні платежі', ru: 'Безопасные платежи' },
  'forSpecialists.professionalSupport': { en: 'Professional support', uk: 'Професійна підтримка', ru: 'Профессиональная поддержка' },
  'forSpecialists.joinButton': { en: 'Join as a Specialist', uk: 'Приєднатися як спеціаліст', ru: 'Присоединиться как специалист' },
  'forSpecialists.benefitsTitle': { en: 'Specialist Benefits', uk: 'Переваги спеціалістів', ru: 'Преимущества специалистов' },
  'forSpecialists.monthlyBookings': { en: 'Average monthly bookings', uk: 'Середня кількість бронювань на місяць', ru: 'Среднее количество бронирований в месяц' },
  'forSpecialists.responseTime': { en: 'Average response time', uk: 'Середній час відповіді', ru: 'Среднее время отклика' },
  'forSpecialists.satisfaction': { en: 'Customer satisfaction', uk: 'Задоволеність клієнтів', ru: 'Удовлетворенность клиентов' },
  'forSpecialists.commission': { en: 'Platform commission', uk: 'Комісія платформи', ru: 'Комиссия платформы' },
  'forSpecialists.commissionValue': { en: 'Only 8%', uk: 'Лише 8%', ru: 'Всего 8%' },

  // Featured Specialists Section
  'featuredSpecialists.title': { en: 'Top-Rated Specialists', uk: 'Найвищі рейтинги спеціалістів', ru: 'Специалисты с высшим рейтингом' },
  'featuredSpecialists.subtitle': { en: 'Meet some of our highest-rated professionals', uk: 'Познайомтеся з нашими найвищими професіоналами', ru: 'Познакомьтесь с нашими самыми высокопрофессиональными специалистами' },
  'featuredSpecialists.viewAll': { en: 'View All Specialists', uk: 'Переглянути всіх спеціалістів', ru: 'Посмотреть всех специалистов' },
  'featuredSpecialists.from': { en: 'From', uk: 'Від', ru: 'От' },

  // Footer Sections
  'footer.company': { en: 'Company', uk: 'Компанія', ru: 'Компания' },
  'footer.support': { en: 'Support', uk: 'Підтримка', ru: 'Поддержка' },
  'footer.legal': { en: 'Legal', uk: 'Юридичні питання', ru: 'Правовые вопросы' },
  'footer.forSpecialists': { en: 'For Specialists', uk: 'Для спеціалістів', ru: 'Для специалистов' },
  
  // Footer Links - Company
  'footer.aboutUs': { en: 'About Us', uk: 'Про нас', ru: 'О нас' },
  'footer.careers': { en: 'Careers', uk: 'Кар\'єра', ru: 'Карьера' },
  'footer.contact': { en: 'Contact', uk: 'Контакти', ru: 'Контакты' },
  'footer.blog': { en: 'Blog', uk: 'Блог', ru: 'Блог' },
  
  // Footer Links - Support
  'footer.helpCenter': { en: 'Help Center', uk: 'Центр допомоги', ru: 'Центр помощи' },
  'footer.safety': { en: 'Safety', uk: 'Безпека', ru: 'Безопасность' },
  'footer.communityGuidelines': { en: 'Community Guidelines', uk: 'Правила спільноти', ru: 'Правила сообщества' },
  'footer.termsOfService': { en: 'Terms of Service', uk: 'Умови надання послуг', ru: 'Условия предоставления услуг' },
  
  // Footer Links - Legal
  'footer.privacyPolicy': { en: 'Privacy Policy', uk: 'Політика конфіденційності', ru: 'Политика конфиденциальности' },
  'footer.cookiePolicy': { en: 'Cookie Policy', uk: 'Політика використання файлів cookie', ru: 'Политика использования файлов cookie' },
  'footer.accessibility': { en: 'Accessibility', uk: 'Доступність', ru: 'Доступность' },
  'footer.disputeResolution': { en: 'Dispute Resolution', uk: 'Вирішення спорів', ru: 'Разрешение споров' },
  
  // Footer Links - Specialists
  'footer.joinAsSpecialist': { en: 'Join as Specialist', uk: 'Приєднатися як спеціаліст', ru: 'Присоединиться как специалист' },
  'footer.specialistResources': { en: 'Specialist Resources', uk: 'Ресурси для спеціалістів', ru: 'Ресурсы для специалистов' },
  'footer.successStories': { en: 'Success Stories', uk: 'Історії успіху', ru: 'Истории успеха' },
  'footer.community': { en: 'Community', uk: 'Спільнота', ru: 'Сообщество' },
  
  // Footer Brand Text
  'footer.tagline': { en: 'Professional service booking made simple and secure.', uk: 'Бронювання професійних послуг - просто та безпечно.', ru: 'Бронирование профессиональных услуг - просто и безопасно.' },
  'footer.allRightsReserved': { en: 'All rights reserved.', uk: 'Всі права захищені.', ru: 'Все права защищены.' },

  // Misc
  'services.count': { en: 'services', uk: 'послуг', ru: 'услуг' },

  // Search Page
  'search.title': { en: 'Search Services', uk: 'Пошук послуг', ru: 'Поиск услуг' },
  'search.subtitle': { en: 'Find the perfect specialist for your needs', uk: 'Знайдіть ідеального спеціаліста для ваших потреб', ru: 'Найдите идеального специалиста для ваших нужд' },
  'search.searchPlaceholder': { en: 'Search for services...', uk: 'Пошук послуг...', ru: 'Поиск услуг...' },
  'search.searchButton': { en: 'Search', uk: 'Пошук', ru: 'Поиск' },
  'search.clearSearch': { en: 'Clear search', uk: 'Очистити пошук', ru: 'Очистить поиск' },
  
  // Search Filters
  'search.filters.title': { en: 'Filters', uk: 'Фільтри', ru: 'Фильтры' },
  'search.filters.category': { en: 'Category', uk: 'Категорія', ru: 'Категория' },
  'search.filters.location': { en: 'Location', uk: 'Місцезнаходження', ru: 'Местоположение' },
  'search.filters.priceRange': { en: 'Price Range', uk: 'Діапазон цін', ru: 'Диапазон цен' },
  'search.filters.rating': { en: 'Rating', uk: 'Рейтинг', ru: 'Рейтинг' },
  'search.filters.availability': { en: 'Availability', uk: 'Доступність', ru: 'Доступность' },
  'search.filters.allCategories': { en: 'All Categories', uk: 'Всі категорії', ru: 'Все категории' },
  'search.filters.allLocations': { en: 'All Locations', uk: 'Всі місця', ru: 'Все места' },
  'search.filters.anyPrice': { en: 'Any Price', uk: 'Будь-яка ціна', ru: 'Любая цена' },
  'search.filters.anyRating': { en: 'Any Rating', uk: 'Будь-який рейтинг', ru: 'Любой рейтинг' },
  'search.filters.availableNow': { en: 'Available Now', uk: 'Доступно зараз', ru: 'Доступно сейчас' },
  'search.filters.availableToday': { en: 'Available Today', uk: 'Доступно сьогодні', ru: 'Доступно сегодня' },
  'search.filters.availableThisWeek': { en: 'Available This Week', uk: 'Доступно цього тижня', ru: 'Доступно на этой неделе' },
  'search.filters.apply': { en: 'Apply Filters', uk: 'Застосувати фільтри', ru: 'Применить фильтры' },
  'search.filters.clear': { en: 'Clear All', uk: 'Очистити все', ru: 'Очистить все' },
  
  // Search Results
  'search.results.showing': { en: 'Showing', uk: 'Показано', ru: 'Показано' },
  'search.results.of': { en: 'of', uk: 'з', ru: 'из' },
  'search.results.results': { en: 'results', uk: 'результатів', ru: 'результатов' },
  'search.results.for': { en: 'for', uk: 'для', ru: 'для' },
  'search.results.noResults': { en: 'No results found', uk: 'Результатів не знайдено', ru: 'Результатов не найдено' },
  'search.results.noResultsDesc': { en: 'Try adjusting your search or filters to find what you\'re looking for.', uk: 'Спробуйте змінити пошук або фільтри, щоб знайти те, що шукаєте.', ru: 'Попробуйте изменить поиск или фильтры, чтобы найти то, что ищете.' },
  'search.results.loading': { en: 'Loading results...', uk: 'Завантаження результатів...', ru: 'Загрузка результатов...' },
  'search.results.loadMore': { en: 'Load More', uk: 'Завантажити більше', ru: 'Загрузить больше' },
  'search.results.endOfResults': { en: 'You\'ve reached the end of results', uk: 'Ви досягли кінця результатів', ru: 'Вы достигли конца результатов' },
  
  // Sort Options
  'search.sort.title': { en: 'Sort by', uk: 'Сортувати за', ru: 'Сортировать по' },
  'search.sort.relevance': { en: 'Relevance', uk: 'Релевантністю', ru: 'Релевантности' },
  'search.sort.priceAsc': { en: 'Price: Low to High', uk: 'Ціна: від низької до високої', ru: 'Цена: от низкой к высокой' },
  'search.sort.priceDesc': { en: 'Price: High to Low', uk: 'Ціна: від високої до низької', ru: 'Цена: от высокой к низкой' },
  'search.sort.rating': { en: 'Highest Rated', uk: 'Найвищий рейтинг', ru: 'Высший рейтинг' },
  'search.sort.distance': { en: 'Distance', uk: 'Відстань', ru: 'Расстояние' },
  'search.sort.newest': { en: 'Newest First', uk: 'Спочатку нові', ru: 'Сначала новые' },
  'search.sort.reviews': { en: 'Most Reviews', uk: 'Найбільше відгуків', ru: 'Больше всего отзывов' },
  
  // Specialist Card
  'search.specialist.from': { en: 'From', uk: 'Від', ru: 'От' },
  'search.specialist.starting': { en: 'starting', uk: 'починаючи з', ru: 'начиная с' },
  'search.specialist.viewProfile': { en: 'View Profile', uk: 'Переглянути профіль', ru: 'Посмотреть профиль' },
  'search.specialist.bookNow': { en: 'Book Now', uk: 'Забронювати зараз', ru: 'Забронировать сейчас' },
  'search.specialist.verified': { en: 'Verified', uk: 'Підтверджено', ru: 'Подтверждено' },
  'search.specialist.online': { en: 'Online', uk: 'Онлайн', ru: 'Онлайн' },
  'search.specialist.responseTime': { en: 'Response time', uk: 'Час відповіді', ru: 'Время отклика' },
  'search.specialist.completedJobs': { en: 'completed jobs', uk: 'виконаних робіт', ru: 'выполненных работ' },
  'search.specialist.reviews': { en: 'reviews', uk: 'відгуків', ru: 'отзывов' },
  'search.specialist.yearsExperience': { en: 'years experience', uk: 'років досвіду', ru: 'лет опыта' },
  
  // Price Ranges
  'search.price.under25': { en: 'Under ₴25', uk: 'До ₴25', ru: 'До ₴25' },
  'search.price.25to50': { en: '₴25 - ₴50', uk: '₴25 - ₴50', ru: '₴25 - ₴50' },
  'search.price.50to100': { en: '₴50 - ₴100', uk: '₴50 - ₴100', ru: '₴50 - ₴100' },
  'search.price.100to200': { en: '₴100 - ₴200', uk: '₴100 - ₴200', ru: '₴100 - ₴200' },
  'search.price.over200': { en: 'Over ₴200', uk: 'Понад ₴200', ru: 'Свыше ₴200' },
  
  // Rating Filters
  'search.rating.4plus': { en: '4+ Stars', uk: '4+ зірки', ru: '4+ звезды' },
  'search.rating.4.5plus': { en: '4.5+ Stars', uk: '4.5+ зірок', ru: '4.5+ звезд' },
  'search.rating.5': { en: '5 Stars Only', uk: 'Тільки 5 зірок', ru: 'Только 5 звезд' },
  
  // Map View
  'search.map.toggle': { en: 'Map View', uk: 'Вид карти', ru: 'Вид карты' },
  'search.list.toggle': { en: 'List View', uk: 'Список', ru: 'Список' },
  'search.map.center': { en: 'Search this area', uk: 'Пошук у цій області', ru: 'Поиск в этой области' },

  // Authentication - Login Page
  'auth.login.title': { en: 'Sign in to your account', uk: 'Увійдіть у свій обліковий запис', ru: 'Войдите в свой аккаунт' },
  'auth.login.subtitle': { en: 'Or', uk: 'Або', ru: 'Или' },
  'auth.login.createAccount': { en: 'create a new account', uk: 'створити новий обліковий запис', ru: 'создать новый аккаунт' },
  'auth.login.demoAccounts': { en: 'Demo Accounts', uk: 'Демо облікові записи', ru: 'Демо аккаунты' },
  'auth.login.useDemoCustomer': { en: 'Use Demo Customer Account', uk: 'Використати демо обліковий запис клієнта', ru: 'Использовать демо аккаунт клиента' },
  'auth.login.useDemoSpecialist': { en: 'Use Demo Specialist Account', uk: 'Використати демо обліковий запис спеціаліста', ru: 'Использовать демо аккаунт специалиста' },
  'auth.login.emailLabel': { en: 'Email address', uk: 'Електронна адреса', ru: 'Электронная почта' },
  'auth.login.emailPlaceholder': { en: 'Enter your email', uk: 'Введіть вашу електронну адресу', ru: 'Введите ваш email' },
  'auth.login.passwordLabel': { en: 'Password', uk: 'Пароль', ru: 'Пароль' },
  'auth.login.passwordPlaceholder': { en: 'Enter your password', uk: 'Введіть ваш пароль', ru: 'Введите ваш пароль' },
  'auth.login.rememberMe': { en: 'Remember me', uk: 'Запам\'ятати мене', ru: 'Запомнить меня' },
  'auth.login.forgotPassword': { en: 'Forgot your password?', uk: 'Забули пароль?', ru: 'Забыли пароль?' },
  'auth.login.signingIn': { en: 'Signing in...', uk: 'Вхід...', ru: 'Вход...' },
  'auth.login.signIn': { en: 'Sign in', uk: 'Увійти', ru: 'Войти' },
  'auth.login.orContinueWith': { en: 'Or continue with', uk: 'Або продовжити з', ru: 'Или продолжить с' },
  'auth.login.googleComingSoon': { en: 'Google (Coming Soon)', uk: 'Google (Незабаром)', ru: 'Google (Скоро)' },

  // Authentication - Register Page
  'auth.register.title': { en: 'Create your account', uk: 'Створіть свій обліковий запис', ru: 'Создайте свой аккаунт' },
  'auth.register.subtitle': { en: 'Already have an account?', uk: 'Вже маєте обліковий запис?', ru: 'Уже есть аккаунт?' },
  'auth.register.signInHere': { en: 'Sign in here', uk: 'Увійдіть тут', ru: 'Войти здесь' },
  'auth.register.accountType': { en: 'I want to:', uk: 'Я хочу:', ru: 'Я хочу:' },
  'auth.register.bookServices': { en: 'Book Services', uk: 'Замовляти послуги', ru: 'Заказывать услуги' },
  'auth.register.bookServicesDesc': { en: 'Find and book professional services', uk: 'Знаходити та замовляти професійні послуги', ru: 'Находить и заказывать профессиональные услуги' },
  'auth.register.offerServices': { en: 'Offer Services', uk: 'Надавати послуги', ru: 'Предлагать услуги' },
  'auth.register.offerServicesDesc': { en: 'Provide professional services', uk: 'Надавати професійні послуги', ru: 'Предоставлять профессиональные услуги' },
  'auth.register.firstNameLabel': { en: 'First Name', uk: 'Ім\'я', ru: 'Имя' },
  'auth.register.firstNamePlaceholder': { en: 'Enter your first name', uk: 'Введіть ваше ім\'я', ru: 'Введите ваше имя' },
  'auth.register.lastNameLabel': { en: 'Last Name', uk: 'Прізвище', ru: 'Фамилия' },
  'auth.register.lastNamePlaceholder': { en: 'Enter your last name', uk: 'Введіть ваше прізвище', ru: 'Введите вашу фамилию' },
  'auth.register.emailLabel': { en: 'Email Address', uk: 'Електронна адреса', ru: 'Электронная почта' },
  'auth.register.emailPlaceholder': { en: 'Enter your email address', uk: 'Введіть вашу електронну адресу', ru: 'Введите ваш email' },
  'auth.register.phoneLabel': { en: 'Phone Number (Optional)', uk: 'Номер телефону (необов\'язково)', ru: 'Номер телефона (необязательно)' },
  'auth.register.phonePlaceholder': { en: 'Enter your phone number', uk: 'Введіть ваш номер телефону', ru: 'Введите ваш номер телефона' },
  'auth.register.passwordLabel': { en: 'Password', uk: 'Пароль', ru: 'Пароль' },
  'auth.register.passwordPlaceholder': { en: 'Create a strong password', uk: 'Створіть надійний пароль', ru: 'Создайте надежный пароль' },
  'auth.register.confirmPasswordLabel': { en: 'Confirm Password', uk: 'Підтвердіть пароль', ru: 'Подтвердите пароль' },
  'auth.register.confirmPasswordPlaceholder': { en: 'Confirm your password', uk: 'Підтвердіть ваш пароль', ru: 'Подтвердите ваш пароль' },
  'auth.register.agreeToTerms': { en: 'I agree to the', uk: 'Я погоджуюся з', ru: 'Я согласен с' },
  'auth.register.termsOfService': { en: 'Terms of Service', uk: 'Умовами надання послуг', ru: 'Условиями предоставления услуг' },
  'auth.register.and': { en: 'and', uk: 'та', ru: 'и' },
  'auth.register.privacyPolicy': { en: 'Privacy Policy', uk: 'Політикою конфіденційності', ru: 'Политикой конфиденциальности' },
  'auth.register.creatingAccount': { en: 'Creating account...', uk: 'Створення облікового запису...', ru: 'Создание аккаунта...' },
  'auth.register.createAccount': { en: 'Create Account', uk: 'Створити обліковий запис', ru: 'Создать аккаунт' },

  // Authentication - Forgot Password Page
  'auth.forgotPassword.title': { en: 'Forgot your password?', uk: 'Забули пароль?', ru: 'Забыли пароль?' },
  'auth.forgotPassword.subtitle': { en: 'Enter your email address and we\'ll send you a link to reset your password.', uk: 'Введіть вашу електронну адресу, і ми надішлемо вам посилання для скидання пароля.', ru: 'Введите ваш email, и мы отправим вам ссылку для сброса пароля.' },
  'auth.forgotPassword.backToSignIn': { en: 'Back to sign in', uk: 'Повернутися до входу', ru: 'Вернуться к входу' },
  'auth.forgotPassword.emailLabel': { en: 'Email address', uk: 'Електронна адреса', ru: 'Электронная почта' },
  'auth.forgotPassword.emailPlaceholder': { en: 'Enter your email address', uk: 'Введіть вашу електронну адресу', ru: 'Введите ваш email' },
  'auth.forgotPassword.sending': { en: 'Sending...', uk: 'Надсилання...', ru: 'Отправка...' },
  'auth.forgotPassword.sendResetLink': { en: 'Send reset link', uk: 'Надіслати посилання для скидання', ru: 'Отправить ссылку для сброса' },
  'auth.forgotPassword.checkEmail': { en: 'Check your email', uk: 'Перевірте вашу електронну пошту', ru: 'Проверьте вашу почту' },
  'auth.forgotPassword.sentResetLink': { en: 'We\'ve sent a password reset link to:', uk: 'Ми надіслали посилання для скидання пароля на:', ru: 'Мы отправили ссылку для сброса пароля на:' },
  'auth.forgotPassword.didntReceive': { en: 'Didn\'t receive the email? Check your spam folder.', uk: 'Не отримали електронний лист? Перевірте папку спам.', ru: 'Не получили письмо? Проверьте папку спам.' },
  'auth.forgotPassword.tryDifferentEmail': { en: 'Try a different email address', uk: 'Спробувати іншу електронну адресу', ru: 'Попробовать другой email' },

  // Authentication - Reset Password Page
  'auth.resetPassword.title': { en: 'Reset Password', uk: 'Скидання пароля', ru: 'Сброс пароля' },
  'auth.resetPassword.enterNewPassword': { en: 'Enter your new password below.', uk: 'Введіть ваш новий пароль нижче.', ru: 'Введите ваш новый пароль ниже.' },
  'auth.resetPassword.invalidToken': { en: 'Invalid or expired reset token.', uk: 'Недійсний або застарілий токен скидання.', ru: 'Недействительный или истекший токен сброса.' },
  'auth.resetPassword.requestNewLink': { en: 'Request a new reset link', uk: 'Запросити нове посилання для скидання', ru: 'Запросить новую ссылку для сброса' },
  'auth.resetPassword.formPlaceholder': { en: 'Password reset form would be implemented here', uk: 'Форма скидання пароля буде реалізована тут', ru: 'Форма сброса пароля будет реализована здесь' },

  // Authentication - Verify Email Page
  'auth.verifyEmail.title': { en: 'Email Verification', uk: 'Підтвердження електронної пошти', ru: 'Подтверждение email' },
  'auth.verifyEmail.verifying': { en: 'Verifying your email address...', uk: 'Підтвердження вашої електронної адреси...', ru: 'Подтверждение вашего email...' },
  'auth.verifyEmail.invalidLink': { en: 'Invalid verification link.', uk: 'Недійсне посилання для підтвердження.', ru: 'Недействительная ссылка для подтверждения.' },
  'auth.verifyEmail.continueToSignIn': { en: 'Continue to sign in', uk: 'Продовжити до входу', ru: 'Продолжить к входу' },

  // Authentication - Error Messages
  'auth.error.emailRequired': { en: 'Email is required', uk: 'Електронна адреса обов\'язкова', ru: 'Email обязателен' },
  'auth.error.emailInvalid': { en: 'Please enter a valid email address', uk: 'Будь ласка, введіть дійсну електронну адресу', ru: 'Пожалуйста, введите действительный email' },
  'auth.error.passwordRequired': { en: 'Password is required', uk: 'Пароль обов\'язковий', ru: 'Пароль обязателен' },
  'auth.error.passwordMinLength': { en: 'Password must be at least 6 characters', uk: 'Пароль має містити щонайменше 6 символів', ru: 'Пароль должен содержать не менее 6 символов' },
  'auth.error.passwordMinLengthRegister': { en: 'Password must be at least 8 characters', uk: 'Пароль має містити щонайменше 8 символів', ru: 'Пароль должен содержать не менее 8 символов' },
  'auth.error.passwordPattern': { en: 'Password must contain at least one uppercase letter, one lowercase letter, and one number', uk: 'Пароль має містити щонайменше одну велику літеру, одну малу літеру та одну цифру', ru: 'Пароль должен содержать не менее одной заглавной буквы, одной строчной буквы и одной цифры' },
  'auth.error.confirmPasswordRequired': { en: 'Please confirm your password', uk: 'Будь ласка, підтвердіть ваш пароль', ru: 'Пожалуйста, подтвердите ваш пароль' },
  'auth.error.passwordsDoNotMatch': { en: 'Passwords do not match', uk: 'Паролі не збігаються', ru: 'Пароли не совпадают' },
  'auth.error.firstNameRequired': { en: 'First name is required', uk: 'Ім\'я обов\'язкове', ru: 'Имя обязательно' },
  'auth.error.firstNameMinLength': { en: 'First name must be at least 2 characters', uk: 'Ім\'я має містити щонайменше 2 символи', ru: 'Имя должно содержать не менее 2 символов' },
  'auth.error.lastNameRequired': { en: 'Last name is required', uk: 'Прізвище обов\'язкове', ru: 'Фамилия обязательна' },
  'auth.error.lastNameMinLength': { en: 'Last name must be at least 2 characters', uk: 'Прізвище має містити щонайменше 2 символи', ru: 'Фамилия должна содержать не менее 2 символов' },
  'auth.error.phoneInvalid': { en: 'Please enter a valid phone number', uk: 'Будь ласка, введіть дійсний номер телефону', ru: 'Пожалуйста, введите действительный номер телефона' },
  'auth.error.accountTypeRequired': { en: 'Please select account type', uk: 'Будь ласка, оберіть тип облікового запису', ru: 'Пожалуйста, выберите тип аккаунта' },
  'auth.error.termsRequired': { en: 'You must agree to the terms and conditions', uk: 'Ви повинні погодитися з умовами та положеннями', ru: 'Вы должны согласиться с условиями и положениями' },

  // Authentication - Logout
  'auth.logout': { en: 'Logout', uk: 'Вийти', ru: 'Выйти' },

  // Currency
  'currency.symbol.usd': { en: '$', uk: '$', ru: '$' },
  'currency.symbol.eur': { en: '€', uk: '€', ru: '€' },
  'currency.symbol.uah': { en: '₴', uk: '₴', ru: '₴' },
  'currency.code.usd': { en: 'USD', uk: 'USD', ru: 'USD' },
  'currency.code.eur': { en: 'EUR', uk: 'EUR', ru: 'EUR' },
  'currency.code.uah': { en: 'UAH', uk: 'UAH', ru: 'UAH' },
  'currency.from': { en: 'From', uk: 'Від', ru: 'От' },
  'currency.starting': { en: 'starting', uk: 'починаючи з', ru: 'начиная с' },

  // Specialist Professions
  'profession.hairStylistColorist': { en: 'Hair Stylist & Colorist', uk: 'Перукар-стиліст', ru: 'Парикмахер-стилист' },
  'profession.personalTrainer': { en: 'Personal Trainer', uk: 'Персональний тренер', ru: 'Персональный тренер' },
  'profession.businessConsultant': { en: 'Business Consultant', uk: 'Бізнес-консультант', ru: 'Бизнес-консультант' },
  'profession.massageTherapist': { en: 'Massage Therapist', uk: 'Масажист', ru: 'Массажист' },
  'profession.mathTutor': { en: 'Math Tutor', uk: 'Репетитор математики', ru: 'Репетитор математики' },
  'profession.webDeveloper': { en: 'Web Developer', uk: 'Веб-розробник', ru: 'Веб-разработчик' },
  'profession.photographyInstructor': { en: 'Photography Instructor', uk: 'Викладач фотографії', ru: 'Преподаватель фотографии' },
  'profession.cleaningService': { en: 'Cleaning Service', uk: 'Клінінгова служба', ru: 'Клининговая служба' },
  'profession.englishTutor': { en: 'English Tutor', uk: 'Репетитор англійської мови', ru: 'Преподаватель английского языка' },
  'profession.plumber': { en: 'Plumber', uk: 'Сантехнік', ru: 'Сантехник' },
  'profession.lawyer': { en: 'Lawyer', uk: 'Юрист', ru: 'Юрист' },

  // Specialist Card Text
  'specialist.responseTime': { en: 'Response time', uk: 'Час відповіді', ru: 'Время отклика' },
  'specialist.completedJobs': { en: 'completed jobs', uk: 'виконаних робіт', ru: 'выполненных работ' },
  'specialist.yearsExperience': { en: 'years experience', uk: 'років досвіду', ru: 'лет опыта' },
  'specialist.reviews': { en: 'reviews', uk: 'відгуків', ru: 'отзывов' },
  'specialist.verified': { en: 'Verified', uk: 'Підтверджено', ru: 'Подтверждено' },
  'specialist.online': { en: 'Online', uk: 'Онлайн', ru: 'Онлайн' },

  // Location Names (for examples - in real app these would come from API)
  'location.newYork': { en: 'New York, NY', uk: 'Нью-Йорк, США', ru: 'Нью-Йорк, США' },
  'location.sanFrancisco': { en: 'San Francisco, CA', uk: 'Сан-Франциско, США', ru: 'Сан-Франциско, США' },
  'location.austin': { en: 'Austin, TX', uk: 'Остін, США', ru: 'Остин, США' },
  'location.kyivPechersk': { en: 'Kyiv, Pechersk District', uk: 'Київ, Печерський район', ru: 'Киев, Печерский район' },
  'location.kyivShevchenko': { en: 'Kyiv, Shevchenko District', uk: 'Київ, Шевченківський район', ru: 'Киев, Шевченковский район' },
  'location.kyivPodil': { en: 'Kyiv, Podil District', uk: 'Київ, Поділ', ru: 'Киев, Подол' },
  'location.kharkivKholodnohirsk': { en: 'Kharkiv, Kholodnohirsk District', uk: 'Харків, Холодногірський район', ru: 'Харьков, Холодногорский район' },
  'location.lvivSykhiv': { en: 'Lviv, Sykhiv District', uk: 'Львів, Сихівський район', ru: 'Львов, Сиховский район' },
  'location.dniproCentral': { en: 'Dnipro, Central District', uk: 'Дніпро, Центральний район', ru: 'Днепр, Центральный район' },
  'location.odesaPrymorskyy': { en: 'Odesa, Prymorsky District', uk: 'Одеса, Приморський район', ru: 'Одесса, Приморский район' },

  // Time units
  'time.minutes': { en: 'min', uk: 'хв', ru: 'мин' },
  'time.hours': { en: 'h', uk: 'год', ru: 'ч' },

  // Dashboard - Common
  'dashboard.welcome.morning': { en: 'Good morning', uk: 'Доброго ранку', ru: 'Доброе утро' },
  'dashboard.welcome.afternoon': { en: 'Good afternoon', uk: 'Доброго дня', ru: 'Добрый день' },
  'dashboard.welcome.evening': { en: 'Good evening', uk: 'Доброго вечора', ru: 'Добрый вечер' },
  'dashboard.today': { en: 'Today', uk: 'Сьогодні', ru: 'Сегодня' },
  'dashboard.thisWeek': { en: 'This Week', uk: 'Цього тижня', ru: 'На этой неделе' },
  'dashboard.thisMonth': { en: 'This Month', uk: 'Цього місяця', ru: 'В этом месяце' },
  'dashboard.overview': { en: 'Overview', uk: 'Огляд', ru: 'Обзор' },
  'dashboard.quickActions': { en: 'Quick Actions', uk: 'Швидкі дії', ru: 'Быстрые действия' },
  'dashboard.recentActivity': { en: 'Recent Activity', uk: 'Останні дії', ru: 'Последняя активность' },
  'dashboard.viewAll': { en: 'View All', uk: 'Переглянути всі', ru: 'Посмотреть все' },
  'dashboard.loadMore': { en: 'Load More', uk: 'Завантажити більше', ru: 'Загрузить больше' },
  'dashboard.noData': { en: 'No data available', uk: 'Немає даних', ru: 'Нет данных' },
  'dashboard.loading': { en: 'Loading...', uk: 'Завантаження...', ru: 'Загрузка...' },

  // Dashboard - Navigation
  'dashboard.nav.dashboard': { en: 'Dashboard', uk: 'Панель керування', ru: 'Панель управления' },
  'dashboard.nav.bookings': { en: 'Bookings', uk: 'Бронювання', ru: 'Бронирования' },
  'dashboard.nav.services': { en: 'Services', uk: 'Послуги', ru: 'Услуги' },
  'dashboard.nav.schedule': { en: 'Schedule', uk: 'Розклад', ru: 'Расписание' },
  'dashboard.nav.analytics': { en: 'Analytics', uk: 'Аналітика', ru: 'Аналитика' },
  'dashboard.nav.earnings': { en: 'Earnings', uk: 'Заробітки', ru: 'Заработки' },
  'dashboard.nav.profile': { en: 'Profile', uk: 'Профіль', ru: 'Профиль' },
  'dashboard.nav.reviews': { en: 'Reviews', uk: 'Відгуки', ru: 'Отзывы' },
  'dashboard.nav.messages': { en: 'Messages', uk: 'Повідомлення', ru: 'Сообщения' },
  'dashboard.nav.settings': { en: 'Settings', uk: 'Налаштування', ru: 'Настройки' },
  'dashboard.nav.favorites': { en: 'Favorites', uk: 'Обране', ru: 'Избранное' },
  'dashboard.nav.payments': { en: 'Payments', uk: 'Платежі', ru: 'Платежи' },
  'dashboard.nav.history': { en: 'History', uk: 'Історія', ru: 'История' },
  'dashboard.nav.support': { en: 'Support', uk: 'Підтримка', ru: 'Поддержка' },
  'dashboard.nav.notifications': { en: 'Notifications', uk: 'Сповіщення', ru: 'Уведомления' },

  // Dashboard - Specialist Stats
  'dashboard.specialist.totalBookings': { en: 'Total Bookings', uk: 'Всього бронювань', ru: 'Всего бронирований' },
  'dashboard.specialist.monthlyBookings': { en: 'Monthly Bookings', uk: 'Місячні бронювання', ru: 'Месячные бронирования' },
  'dashboard.specialist.totalRevenue': { en: 'Total Revenue', uk: 'Загальний дохід', ru: 'Общий доход' },
  'dashboard.specialist.monthlyRevenue': { en: 'Monthly Revenue', uk: 'Місячний дохід', ru: 'Месячный доход' },
  'dashboard.specialist.averageRating': { en: 'Average Rating', uk: 'Середній рейтинг', ru: 'Средний рейтинг' },
  'dashboard.specialist.responseTime': { en: 'Response Time', uk: 'Час відповіді', ru: 'Время отклика' },
  'dashboard.specialist.completionRate': { en: 'Completion Rate', uk: 'Рівень завершення', ru: 'Уровень завершения' },
  'dashboard.specialist.profileViews': { en: 'Profile Views', uk: 'Перегляди профілю', ru: 'Просмотры профиля' },
  'dashboard.specialist.favoriteCount': { en: 'Added to Favorites', uk: 'Додано в обране', ru: 'Добавлено в избранное' },
  'dashboard.specialist.conversionRate': { en: 'Conversion Rate', uk: 'Конверсія', ru: 'Конверсия' },
  'dashboard.specialist.repeatClients': { en: 'Repeat Clients', uk: 'Повторні клієнти', ru: 'Повторные клиенты' },
  'dashboard.specialist.punctuality': { en: 'Punctuality', uk: 'Пунктуальність', ru: 'Пунктуальность' },
  'dashboard.specialist.allTime': { en: 'All time', uk: 'За весь час', ru: 'За все время' },
  'dashboard.specialist.thisMonthImprovement': { en: 'this month', uk: 'цього місяця', ru: 'в этом месяце' },
  'dashboard.specialist.averageTime': { en: 'Average time', uk: 'Середній час', ru: 'Среднее время' },
  'dashboard.specialist.improvement': { en: 'improvement', uk: 'покращення', ru: 'улучшение' },

  // Dashboard - Booking Status
  'dashboard.booking.status.confirmed': { en: 'Confirmed', uk: 'Підтверджено', ru: 'Подтверждено' },
  'dashboard.booking.status.pending': { en: 'Pending', uk: 'Очікує', ru: 'Ожидает' },
  'dashboard.booking.status.cancelled': { en: 'Cancelled', uk: 'Скасовано', ru: 'Отменено' },
  'dashboard.booking.status.completed': { en: 'Completed', uk: 'Завершено', ru: 'Завершено' },
  'dashboard.booking.status.inProgress': { en: 'In Progress', uk: 'В процесі', ru: 'В процессе' },
  'dashboard.booking.status.noShow': { en: 'No Show', uk: 'Не з\'явився', ru: 'Не явился' },

  // Dashboard - Specialist Quick Actions
  'dashboard.specialist.addService': { en: 'Add Service', uk: 'Додати послугу', ru: 'Добавить услугу' },
  'dashboard.specialist.manageSchedule': { en: 'Manage Schedule', uk: 'Налаштувати розклад', ru: 'Настроить расписание' },
  'dashboard.specialist.viewReviews': { en: 'View Reviews', uk: 'Переглянути відгуки', ru: 'Посмотреть отзывы' },
  'dashboard.specialist.exportReport': { en: 'Export Report', uk: 'Експортувати звіт', ru: 'Экспортировать отчет' },
  'dashboard.specialist.respondToReviews': { en: 'Respond to Reviews', uk: 'Відповісти на відгуки', ru: 'Ответить на отзывы' },
  'dashboard.specialist.messageClients': { en: 'Message Clients', uk: 'Повідомлення клієнтів', ru: 'Сообщения клиентов' },
  'dashboard.specialist.updateProfile': { en: 'Update Profile', uk: 'Оновити профіль', ru: 'Обновить профиль' },
  'dashboard.specialist.manageAvailability': { en: 'Manage Availability', uk: 'Керувати доступністю', ru: 'Управлять доступностью' },

  // Dashboard - Recent Bookings
  'dashboard.specialist.recentBookings': { en: 'Recent Bookings', uk: 'Останні бронювання', ru: 'Последние бронирования' },
  'dashboard.specialist.todaysSchedule': { en: 'Today\'s Schedule', uk: 'Розклад на сьогодні', ru: 'Расписание на сегодня' },
  'dashboard.specialist.upcomingAppointments': { en: 'Upcoming Appointments', uk: 'Майбутні зустрічі', ru: 'Предстоящие встречи' },
  'dashboard.specialist.noAppointments': { en: 'No scheduled appointments today', uk: 'Сьогодні немає запланованих зустрічей', ru: 'Сегодня нет запланированных встреч' },
  'dashboard.specialist.freeTimeMessage': { en: 'Take advantage of your free time to prepare!', uk: 'Скористайтеся вільним часом для підготовки!', ru: 'Воспользуйтесь свободным временем для подготовки!' },
  'dashboard.specialist.online': { en: 'Online', uk: 'Онлайн', ru: 'Онлайн' },
  'dashboard.specialist.offline': { en: 'Office', uk: 'Офіс', ru: 'Офис' },
  'dashboard.specialist.duration': { en: 'duration', uk: 'тривалість', ru: 'продолжительность' },

  // Dashboard - Activity Metrics
  'dashboard.specialist.profileActivity': { en: 'Profile Activity', uk: 'Активність профілю', ru: 'Активность профиля' },
  'dashboard.specialist.qualityMetrics': { en: 'Quality Metrics', uk: 'Показники якості', ru: 'Показатели качества' },
  'dashboard.specialist.businessGrowth': { en: 'Business Growth', uk: 'Зростання бізнесу', ru: 'Рост бизнеса' },

  // Dashboard - Customer Stats
  'dashboard.customer.upcomingBookings': { en: 'Upcoming Bookings', uk: 'Майбутні бронювання', ru: 'Предстоящие бронирования' },
  'dashboard.customer.bookingHistory': { en: 'Booking History', uk: 'Історія бронювань', ru: 'История бронирований' },
  'dashboard.customer.favoriteSpecialists': { en: 'Favorite Specialists', uk: 'Улюблені спеціалісти', ru: 'Любимые специалисты' },
  'dashboard.customer.loyaltyPoints': { en: 'Loyalty Points', uk: 'Бонусні бали', ru: 'Бонусные баллы' },
  'dashboard.customer.totalSpent': { en: 'Total Spent', uk: 'Витрачено загалом', ru: 'Потрачено всего' },
  'dashboard.customer.servicesUsed': { en: 'Services Used', uk: 'Використано послуг', ru: 'Использовано услуг' },
  'dashboard.customer.averageRating': { en: 'Average Rating Given', uk: 'Середня оцінка', ru: 'Средняя оценка' },
  'dashboard.customer.memberSince': { en: 'Member Since', uk: 'Учасник з', ru: 'Участник с' },
  'dashboard.customer.savedAmount': { en: 'Saved with Discounts', uk: 'Заощаджено знижками', ru: 'Сэкономлено скидками' },
  'dashboard.customer.reviewsWritten': { en: 'Reviews Written', uk: 'Написано відгуків', ru: 'Написано отзывов' },

  // Dashboard - Customer Quick Actions
  'dashboard.customer.findSpecialists': { en: 'Find Specialists', uk: 'Знайти спеціалістів', ru: 'Найти специалистов' },
  'dashboard.customer.bookService': { en: 'Book Service', uk: 'Замовити послугу', ru: 'Заказать услугу' },
  'dashboard.customer.viewHistory': { en: 'View History', uk: 'Переглянути історію', ru: 'Посмотреть историю' },
  'dashboard.customer.manageFavorites': { en: 'Manage Favorites', uk: 'Керувати обраним', ru: 'Управлять избранным' },
  'dashboard.customer.writeReview': { en: 'Write Review', uk: 'Написати відгук', ru: 'Написать отзыв' },
  'dashboard.customer.updateProfile': { en: 'Update Profile', uk: 'Оновити профіль', ru: 'Обновить профиль' },
  'dashboard.customer.viewOffers': { en: 'View Special Offers', uk: 'Переглянути спецпропозиції', ru: 'Посмотреть спецпредложения' },
  'dashboard.customer.contactSupport': { en: 'Contact Support', uk: 'Зв\'язатися з підтримкою', ru: 'Связаться с поддержкой' },

  // Dashboard - Recent Activity
  'dashboard.customer.recentBookings': { en: 'Recent Bookings', uk: 'Останні бронювання', ru: 'Последние бронирования' },
  'dashboard.customer.nextAppointment': { en: 'Next Appointment', uk: 'Наступна зустріч', ru: 'Следующая встреча' },
  'dashboard.customer.recommendedSpecialists': { en: 'Recommended for You', uk: 'Рекомендовано для вас', ru: 'Рекомендовано для вас' },
  'dashboard.customer.specialOffers': { en: 'Special Offers', uk: 'Спеціальні пропозиції', ru: 'Специальные предложения' },
  'dashboard.customer.noBookings': { en: 'No bookings yet', uk: 'Поки немає бронювань', ru: 'Пока нет бронирований' },
  'dashboard.customer.startBooking': { en: 'Book your first service to get started!', uk: 'Забронюйте вашу першу послугу для початку!', ru: 'Забронируйте вашу первую услугу для начала!' },
  'dashboard.customer.exploreServices': { en: 'Explore Services', uk: 'Дослідити послуги', ru: 'Исследовать услуги' },

  // Dashboard - Calendar & Schedule
  'dashboard.schedule.today': { en: 'Today', uk: 'Сьогодні', ru: 'Сегодня' },
  'dashboard.schedule.tomorrow': { en: 'Tomorrow', uk: 'Завтра', ru: 'Завтра' },
  'dashboard.schedule.thisWeek': { en: 'This Week', uk: 'Цей тиждень', ru: 'Эта неделя' },
  'dashboard.schedule.nextWeek': { en: 'Next Week', uk: 'Наступний тиждень', ru: 'Следующая неделя' },
  'dashboard.schedule.availableSlots': { en: 'Available Slots', uk: 'Доступні слоти', ru: 'Доступные слоты' },
  'dashboard.schedule.bookedSlots': { en: 'Booked Slots', uk: 'Заброньовані слоти', ru: 'Забронированные слоты' },
  'dashboard.schedule.blockedTime': { en: 'Blocked Time', uk: 'Заблокований час', ru: 'Заблокированное время' },

  // Dashboard - Analytics Terms
  'dashboard.analytics.revenue': { en: 'Revenue', uk: 'Дохід', ru: 'Доход' },
  'dashboard.analytics.bookings': { en: 'Bookings', uk: 'Бронювання', ru: 'Бронирования' },
  'dashboard.analytics.customers': { en: 'Customers', uk: 'Клієнти', ru: 'Клиенты' },
  'dashboard.analytics.growth': { en: 'Growth', uk: 'Зростання', ru: 'Рост' },
  'dashboard.analytics.performance': { en: 'Performance', uk: 'Продуктивність', ru: 'Производительность' },
  'dashboard.analytics.trends': { en: 'Trends', uk: 'Тренди', ru: 'Тренды' },
  'dashboard.analytics.comparison': { en: 'Comparison', uk: 'Порівняння', ru: 'Сравнение' },
  
  // Analytics Page
  'analytics.subtitle': { en: 'Comprehensive insights into your business performance', uk: 'Комплексна аналітика ефективності вашого бізнесу', ru: 'Комплексная аналитика эффективности вашего бизнеса' },
  'analytics.daily': { en: 'Daily', uk: 'Щоденно', ru: 'Ежедневно' },
  'analytics.weekly': { en: 'Weekly', uk: 'Щотижня', ru: 'Еженедельно' },
  'analytics.monthly': { en: 'Monthly', uk: 'Щомісяця', ru: 'Ежемесячно' },
  'analytics.yearly': { en: 'Yearly', uk: 'Щорічно', ru: 'Ежегодно' },
  'analytics.total': { en: 'Total', uk: 'Загальний', ru: 'Общий' },
  'analytics.average': { en: 'Average', uk: 'Середній', ru: 'Средний' },
  'analytics.vsAverage': { en: 'vs average', uk: 'проти середнього', ru: 'против среднего' },
  'analytics.revenueByService': { en: 'Revenue by Service', uk: 'Дохід за послугами', ru: 'Доход по услугам' },
  'analytics.servicePerformance': { en: 'Service Performance', uk: 'Ефективність послуг', ru: 'Эффективность услуг' },
  'analytics.revenueTrend': { en: 'Revenue Trend', uk: 'Тенденція доходу', ru: 'Тенденция дохода' },
  'analytics.bookingsTrend': { en: 'Bookings Trend', uk: 'Тенденція бронювань', ru: 'Тенденция бронирований' },
  'analytics.responseTime': { en: 'Response Time', uk: 'Час відповіді', ru: 'Время ответа' },
  'analytics.completionRate': { en: 'Completion Rate', uk: 'Рівень завершення', ru: 'Уровень завершения' },
  'analytics.profileViews': { en: 'Profile Views', uk: 'Перегляди профілю', ru: 'Просмотры профиля' },
  'analytics.conversionRate': { en: 'Conversion Rate', uk: 'Коефіцієнт конверсії', ru: 'Коэффициент конверсии' },
  'analytics.excellent': { en: 'Excellent', uk: 'Відмінно', ru: 'Отлично' },
  'analytics.outstanding': { en: 'Outstanding', uk: 'Чудово', ru: 'Превосходно' },
  'analytics.thisMonth': { en: 'this month', uk: 'цього місяця', ru: 'в этом месяце' },
  'analytics.industryAvg': { en: 'Industry avg:', uk: 'Середнє по галузі:', ru: 'Среднее по отрасли:' },
  'analytics.exportPdfReport': { en: 'Export PDF Report', uk: 'Експортувати PDF звіт', ru: 'Экспортировать PDF отчет' },
  'analytics.exportCsvData': { en: 'Export CSV Data', uk: 'Експортувати CSV дані', ru: 'Экспортировать CSV данные' },
  'analytics.shareAnalytics': { en: 'Share Analytics', uk: 'Поділитися аналітикою', ru: 'Поделиться аналитикой' },

  // Bookings Page
  'bookings.subtitle': { en: 'Manage all your bookings and appointments in one place', uk: 'Керуйте всіма своїми бронюваннями та зустрічами в одному місці', ru: 'Управляйте всеми своими бронированиями и встречами в одном месте' },
  'bookings.total': { en: 'Total', uk: 'Всього', ru: 'Всего' },
  'bookings.confirmed': { en: 'Confirmed', uk: 'Підтверджено', ru: 'Подтверждено' },
  'bookings.pending': { en: 'Pending', uk: 'Очікується', ru: 'Ожидает' },
  'bookings.completed': { en: 'Completed', uk: 'Завершено', ru: 'Завершено' },
  'bookings.search': { en: 'Search', uk: 'Пошук', ru: 'Поиск' },
  'bookings.searchPlaceholder': { en: 'Search by customer or service...', uk: 'Пошук за клієнтом або послугою...', ru: 'Поиск по клиенту или услуге...' },
  'bookings.status': { en: 'Status', uk: 'Статус', ru: 'Статус' },
  'bookings.allStatus': { en: 'All Status', uk: 'Всі статуси', ru: 'Все статусы' },
  'bookings.dateRange': { en: 'Date Range', uk: 'Діапазон дат', ru: 'Диапазон дат' },
  'bookings.allDates': { en: 'All Dates', uk: 'Всі дати', ru: 'Все даты' },
  'bookings.today': { en: 'Today', uk: 'Сьогодні', ru: 'Сегодня' },
  'bookings.thisWeek': { en: 'This Week', uk: 'Цей тиждень', ru: 'Эта неделя' },
  'bookings.thisMonth': { en: 'This Month', uk: 'Цей місяць', ru: 'Этот месяц' },
  'bookings.sortBy': { en: 'Sort By', uk: 'Сортувати за', ru: 'Сортировать по' },
  'bookings.date': { en: 'Date', uk: 'Дата', ru: 'Дата' },
  'bookings.amount': { en: 'Amount', uk: 'Сума', ru: 'Сумма' },
  'bookings.selected': { en: 'booking(s) selected', uk: 'бронювань обрано', ru: 'бронирований выбрано' },
  'bookings.confirm': { en: 'Confirm', uk: 'Підтвердити', ru: 'Подтвердить' },
  'bookings.cancel': { en: 'Cancel', uk: 'Скасувати', ru: 'Отменить' },
  'bookings.clear': { en: 'Clear', uk: 'Очистити', ru: 'Очистить' },
  'bookings.customer': { en: 'Customer', uk: 'Клієнт', ru: 'Клиент' },
  'bookings.service': { en: 'Service', uk: 'Послуга', ru: 'Услуга' },
  'bookings.dateTime': { en: 'Date & Time', uk: 'Дата і час', ru: 'Дата и время' },
  'bookings.type': { en: 'Type', uk: 'Тип', ru: 'Тип' },
  'bookings.actions': { en: 'Actions', uk: 'Дії', ru: 'Действия' },
  'bookings.online': { en: 'Online', uk: 'Онлайн', ru: 'Онлайн' },
  'bookings.inPerson': { en: 'In-Person', uk: 'Особисто', ru: 'Лично' },
  'bookings.view': { en: 'View', uk: 'Переглянути', ru: 'Просмотр' },
  'bookings.complete': { en: 'Complete', uk: 'Завершити', ru: 'Завершить' },
  'bookings.previous': { en: 'Previous', uk: 'Попередня', ru: 'Предыдущая' },
  'bookings.next': { en: 'Next', uk: 'Наступна', ru: 'Следующая' },
  'bookings.showing': { en: 'Showing', uk: 'Показано', ru: 'Показано' },
  'bookings.to': { en: 'to', uk: 'до', ru: 'до' },
  'bookings.of': { en: 'of', uk: 'з', ru: 'из' },
  'bookings.results': { en: 'results', uk: 'результатів', ru: 'результатов' },
  'bookings.noBookingsFound': { en: 'No bookings found', uk: 'Бронювань не знайдено', ru: 'Бронирований не найдено' },
  'bookings.noBookingsDescription': { en: 'No bookings match your current filters. Try adjusting your search criteria.', uk: 'Жодне бронювання не відповідає вашим поточним фільтрам. Спробуйте налаштувати критерії пошуку.', ru: 'Ни одно бронирование не соответствует вашим текущим фильтрам. Попробуйте настроить критерии поиска.' },
  
  // Booking Details Modal
  'bookingDetails.title': { en: 'Booking Details', uk: 'Деталі бронювання', ru: 'Детали бронирования' },
  'bookingDetails.customerInfo': { en: 'Customer Information', uk: 'Інформація про клієнта', ru: 'Информация о клиенте' },
  'bookingDetails.name': { en: 'Name', uk: 'Ім\'я', ru: 'Имя' },
  'bookingDetails.contact': { en: 'Contact', uk: 'Контакт', ru: 'Контакт' },
  'bookingDetails.serviceInfo': { en: 'Service Information', uk: 'Інформація про послугу', ru: 'Информация об услуге' },
  'bookingDetails.duration': { en: 'Duration', uk: 'Тривалість', ru: 'Длительность' },
  'bookingDetails.appointmentDetails': { en: 'Appointment Details', uk: 'Деталі зустрічі', ru: 'Детали встречи' },
  'bookingDetails.time': { en: 'Time', uk: 'Час', ru: 'Время' },
  'bookingDetails.location': { en: 'Location', uk: 'Місце', ru: 'Место' },
  'bookingDetails.notes': { en: 'Notes', uk: 'Примітки', ru: 'Заметки' },
  'bookingDetails.statusManagement': { en: 'Status Management', uk: 'Управління статусом', ru: 'Управление статусом' },
  'bookingDetails.updateStatus': { en: 'Update Status', uk: 'Оновити статус', ru: 'Обновить статус' },
  'bookingDetails.sendMessage': { en: 'Send Message to Customer', uk: 'Надіслати повідомлення клієнту', ru: 'Отправить сообщение клиенту' },
  'bookingDetails.messagePlaceholder': { en: 'Type your message here...', uk: 'Введіть ваше повідомлення тут...', ru: 'Введите ваше сообщение здесь...' },
  'bookingDetails.sendMessageButton': { en: 'Send Message', uk: 'Надіслати повідомлення', ru: 'Отправить сообщение' },
  'bookingDetails.template': { en: 'Template', uk: 'Шаблон', ru: 'Шаблон' },

  // Service Names Translations
  'service.consultation': { en: 'Psychology Consultation', uk: 'Консультація з психології', ru: 'Консультация по психологии' },
  'service.individualTherapy': { en: 'Individual Therapy', uk: 'Індивідуальна терапія', ru: 'Индивидуальная терапия' },
  'service.familyConsultation': { en: 'Family Consultation', uk: 'Сімейна консультація', ru: 'Семейная консультация' },
  'service.groupTherapy': { en: 'Group Therapy', uk: 'Групова терапія', ru: 'Групповая терапия' },
  'service.expressConsultation': { en: 'Express Consultation', uk: 'Експрес-консультація', ru: 'Экспресс-консультация' },
  'service.teenPsychology': { en: 'Adolescent Psychology', uk: 'Підліткова психологія', ru: 'Подростковая психология' },
  'service.coupleTherapy': { en: 'Couple Therapy', uk: 'Терапія пар', ru: 'Парная терапия' },
  'service.individualSession': { en: 'Individual Session', uk: 'Індивідуальна терапія', ru: 'Индивидуальная терапия' },
  'service.psychologyConsultation': { en: 'Psychology Consultation', uk: 'Консультація з психології', ru: 'Консультация по психологии' },

  // Dashboard - Messages & Communication
  'dashboard.messages.unread': { en: 'Unread Messages', uk: 'Непрочитані повідомлення', ru: 'Непрочитанные сообщения' },
  'dashboard.messages.recent': { en: 'Recent Messages', uk: 'Останні повідомлення', ru: 'Последние сообщения' },
  'dashboard.messages.sendMessage': { en: 'Send Message', uk: 'Надіслати повідомлення', ru: 'Отправить сообщение' },
  'dashboard.messages.reply': { en: 'Reply', uk: 'Відповісти', ru: 'Ответить' },
  'dashboard.messages.markAsRead': { en: 'Mark as Read', uk: 'Позначити як прочитане', ru: 'Отметить как прочитанное' },

  // Dashboard - Settings & Profile
  'dashboard.settings.profile': { en: 'Profile Settings', uk: 'Налаштування профілю', ru: 'Настройки профиля' },
  'dashboard.settings.notifications': { en: 'Notification Settings', uk: 'Налаштування сповіщень', ru: 'Настройки уведомлений' },
  'dashboard.settings.privacy': { en: 'Privacy Settings', uk: 'Налаштування приватності', ru: 'Настройки конфиденциальности' },
  'dashboard.settings.billing': { en: 'Billing Settings', uk: 'Налаштування рахунків', ru: 'Настройки счетов' },
  'dashboard.settings.language': { en: 'Language Settings', uk: 'Налаштування мови', ru: 'Настройки языка' },
  'dashboard.settings.theme': { en: 'Theme Settings', uk: 'Налаштування теми', ru: 'Настройки темы' },

  // Dashboard - Mobile
  'dashboard.mobile.menu': { en: 'Menu', uk: 'Меню', ru: 'Меню' },

  // Customer Settings Translation Keys
  'customer.settings.title': { en: 'Settings', uk: 'Налаштування', ru: 'Настройки' },
  'customer.settings.subtitle': { en: 'Manage your account settings and preferences', uk: 'Керуйте налаштуваннями облікового запису та вподобаннями', ru: 'Управляйте настройками аккаунта и предпочтениями' },
  'customer.settings.account': { en: 'Account', uk: 'Обліковий запис', ru: 'Аккаунт' },
  'customer.settings.notifications': { en: 'Notifications', uk: 'Сповіщення', ru: 'Уведомления' },
  'customer.settings.privacy': { en: 'Privacy', uk: 'Приватність', ru: 'Конфиденциальность' },
  'customer.settings.language': { en: 'Language & Region', uk: 'Мова та регіон', ru: 'Язык и регион' },
  'customer.settings.payments': { en: 'Payment Methods', uk: 'Способи оплати', ru: 'Способы оплаты' },
  'customer.settings.addresses': { en: 'Addresses', uk: 'Адреси', ru: 'Адреса' },

  // Customer Settings - Password Section
  'customer.settings.changePassword': { en: 'Change Password', uk: 'Змінити пароль', ru: 'Изменить пароль' },
  
  // Customer Settings - Notifications Section
  'customer.settings.emailNotifications': { en: 'Email Notifications', uk: 'Електронні сповіщення', ru: 'Email уведомления' },
  'customer.settings.pushNotifications': { en: 'Push Notifications', uk: 'Push-сповіщення', ru: 'Push уведомления' },
  'customer.settings.smsNotifications': { en: 'SMS Notifications', uk: 'SMS-сповіщення', ru: 'SMS уведомления' },
  'customer.settings.bookingConfirmations': { en: 'Booking confirmations', uk: 'Підтвердження бронювань', ru: 'Подтверждения бронирований' },
  'customer.settings.appointmentReminders': { en: 'Appointment reminders', uk: 'Нагадування про зустрічі', ru: 'Напоминания о встречах' },
  'customer.settings.promotionsOffers': { en: 'Promotions and offers', uk: 'Акції та пропозиції', ru: 'Акции и предложения' },

  // Customer Settings - Privacy Section
  'customer.settings.profileVisibility': { en: 'Profile Visibility', uk: 'Видимість профілю', ru: 'Видимость профиля' },
  'customer.settings.publicProfile': { en: 'Public', uk: 'Публічний', ru: 'Публичный' },
  'customer.settings.privateProfile': { en: 'Private', uk: 'Приватний', ru: 'Приватный' },
  'customer.settings.showEmailProfile': { en: 'Show email in profile', uk: 'Показувати email у профілі', ru: 'Показывать email в профиле' },
  'customer.settings.showPhoneProfile': { en: 'Show phone number in profile', uk: 'Показувати номер телефону у профілі', ru: 'Показывать номер телефона в профиле' },
  'customer.settings.allowReviews': { en: 'Allow others to leave reviews', uk: 'Дозволити іншим залишати відгуки', ru: 'Разрешить другим оставлять отзывы' },
  'customer.settings.dataProcessing': { en: 'Allow data processing for recommendations', uk: 'Дозволити обробку даних для рекомендацій', ru: 'Разрешить обработку данных для рекомендаций' },

  // Customer Settings - Language Section
  'customer.settings.languageLabel': { en: 'Language', uk: 'Мова', ru: 'Язык' },
  'customer.settings.currencyLabel': { en: 'Currency', uk: 'Валюта', ru: 'Валюта' },
  'customer.settings.themeLabel': { en: 'Theme', uk: 'Тема', ru: 'Тема' },
  'customer.settings.lightTheme': { en: 'Light', uk: 'Світла', ru: 'Светлая' },
  'customer.settings.darkTheme': { en: 'Dark', uk: 'Темна', ru: 'Темная' },
  'customer.settings.systemTheme': { en: 'System', uk: 'Системна', ru: 'Системная' },

  // Customer Settings - Payment Methods Section
  'customer.settings.addPaymentMethod': { en: 'Add Payment Method', uk: 'Додати спосіб оплати', ru: 'Добавить способ оплаты' },
  'customer.settings.expires': { en: 'Expires', uk: 'Закінчується', ru: 'Истекает' },
  'customer.settings.defaultPayment': { en: 'Default', uk: 'За замовчуванням', ru: 'По умолчанию' },
  'customer.settings.editPayment': { en: 'Edit', uk: 'Редагувати', ru: 'Редактировать' },
  'customer.settings.removePayment': { en: 'Remove', uk: 'Видалити', ru: 'Удалить' },

  // Customer Settings - Addresses Section
  'customer.settings.addAddress': { en: 'Add Address', uk: 'Додати адресу', ru: 'Добавить адрес' },
  'customer.settings.defaultAddress': { en: 'Default', uk: 'За замовчуванням', ru: 'По умолчанию' },
  'customer.settings.editAddress': { en: 'Edit', uk: 'Редагувати', ru: 'Редактировать' },
  'customer.settings.removeAddress': { en: 'Remove', uk: 'Видалити', ru: 'Удалить' },

  // Admin Dashboard Translation Keys
  'admin.stats.totalUsers': { en: 'Total Users', uk: 'Загальна кількість користувачів', ru: 'Общее количество пользователей' },
  'admin.stats.specialists': { en: 'Specialists', uk: 'Спеціалісти', ru: 'Специалисты' },
  'admin.stats.totalBookings': { en: 'Total Bookings', uk: 'Загальна кількість бронювань', ru: 'Общее количество бронирований' },
  'admin.stats.platformRevenue': { en: 'Platform Revenue', uk: 'Дохід платформи', ru: 'Доходы платформы' },
  'admin.stats.pendingVerifications': { en: 'Pending Verifications', uk: 'Очікують верифікації', ru: 'Ожидают верификации' },
  'admin.stats.reportedUsers': { en: 'Reported Users', uk: 'Скаржились користувачі', ru: 'Жалобы на пользователей' },
  'admin.stats.activeUsers24h': { en: 'Active Users (24h)', uk: 'Активні користувачі (24г)', ru: 'Активные пользователи (24ч)' },
  'admin.stats.popularSearchesToday': { en: 'Popular Searches Today', uk: 'Популярні пошуки сьогодні', ru: 'Популярные поиски сегодня' },

  // Admin Navigation
  'admin.nav.overview': { en: 'Overview', uk: 'Огляд', ru: 'Обзор' },
  'admin.nav.users': { en: 'Users', uk: 'Користувачі', ru: 'Пользователи' },
  'admin.nav.analytics': { en: 'Analytics', uk: 'Аналітика', ru: 'Аналитика' },
  'admin.nav.verification': { en: 'Verification', uk: 'Верифікація', ru: 'Верификация' },

  // Admin Users Section
  'admin.users.searchPlaceholder': { en: 'Search users...', uk: 'Пошук користувачів...', ru: 'Поиск пользователей...' },
  'admin.users.filterAll': { en: 'All Users', uk: 'Всі користувачі', ru: 'Все пользователи' },
  'admin.users.filterCustomers': { en: 'Customers', uk: 'Клієнти', ru: 'Клиенты' },
  'admin.users.filterSpecialists': { en: 'Specialists', uk: 'Спеціалісти', ru: 'Специалисты' },
  'admin.users.filterPending': { en: 'Pending', uk: 'Очікують', ru: 'Ожидают' },
  'admin.users.filterSuspended': { en: 'Suspended', uk: 'Заблоковані', ru: 'Заблокированы' },

  // Admin Users Table
  'admin.users.table.user': { en: 'User', uk: 'Користувач', ru: 'Пользователь' },
  'admin.users.table.type': { en: 'Type', uk: 'Тип', ru: 'Тип' },
  'admin.users.table.status': { en: 'Status', uk: 'Статус', ru: 'Статус' },
  'admin.users.table.bookings': { en: 'Bookings', uk: 'Бронювання', ru: 'Бронирования' },
  'admin.users.table.revenue': { en: 'Revenue', uk: 'Дохід', ru: 'Доходы' },
  'admin.users.table.actions': { en: 'Actions', uk: 'Дії', ru: 'Действия' },

  // Admin Analytics Section
  'admin.analytics.searchAnalytics': { en: 'Search Analytics', uk: 'Аналітика пошуку', ru: 'Аналитика поиска' },
  'admin.analytics.searches': { en: 'searches', uk: 'пошуків', ru: 'поисков' },

  // Admin Verification Section
  'admin.verification.title': { en: 'Pending Verifications', uk: 'Очікують верифікації', ru: 'Ожидают верификации' },
  'admin.verification.joined': { en: 'Joined', uk: 'Приєднався', ru: 'Присоединился' },
  'admin.verification.approve': { en: 'Approve', uk: 'Схвалити', ru: 'Одобрить' },
  'admin.verification.reject': { en: 'Reject', uk: 'Відхилити', ru: 'Отклонить' },

  // Admin User Status
  'admin.status.active': { en: 'active', uk: 'активний', ru: 'активный' },
  'admin.status.pending': { en: 'pending', uk: 'очікує', ru: 'ожидает' },
  'admin.status.suspended': { en: 'suspended', uk: 'заблокований', ru: 'заблокирован' },
  'admin.status.customer': { en: 'customer', uk: 'клієнт', ru: 'клиент' },
  'admin.status.specialist': { en: 'specialist', uk: 'спеціаліст', ru: 'специалист' },

  // Notifications Page Translation Keys
  'notifications.subtitle': { en: 'Stay updated with your latest activities', uk: 'Залишайтеся в курсі останніх подій', ru: 'Будьте в курсе последних событий' },
  'notifications.unread': { en: 'unread', uk: 'непрочитано', ru: 'непрочитано' },
  'notifications.markAllRead': { en: 'Mark All Read', uk: 'Позначити всі як прочитані', ru: 'Отметить все как прочитанные' },
  'notifications.markAsRead': { en: 'Mark as read', uk: 'Позначити як прочитане', ru: 'Отметить как прочитанное' },
  'notifications.delete': { en: 'Delete', uk: 'Видалити', ru: 'Удалить' },
  'notifications.noNotifications': { en: 'No notifications', uk: 'Немає сповіщень', ru: 'Нет уведомлений' },
  'notifications.noNotificationsDescription': { en: 'You are all caught up! Check back later for new updates.', uk: 'Ви прочитали все! Перевірте пізніше для нових оновлень.', ru: 'Вы все прочитали! Проверьте позже для новых обновлений.' },

  // Notification Types
  'notifications.newBooking': { en: 'New Booking', uk: 'Нове бронювання', ru: 'Новое бронирование' },
  'notifications.paymentReceived': { en: 'Payment Received', uk: 'Отримано оплату', ru: 'Получен платеж' },
  'notifications.newReview': { en: 'New Review', uk: 'Новий відгук', ru: 'Новый отзыв' },
  'notifications.upcomingAppointment': { en: 'Upcoming Appointment', uk: 'Майбутня зустріч', ru: 'Предстоящая встреча' },
  'notifications.systemUpdate': { en: 'System Update', uk: 'Оновлення системи', ru: 'Обновление системы' },

  // Notification Filters
  'notifications.filter.all': { en: 'All', uk: 'Всі', ru: 'Все' },
  'notifications.filter.unread': { en: 'Unread', uk: 'Непрочитані', ru: 'Непрочитанные' },
  'notifications.filter.booking': { en: 'Bookings', uk: 'Бронювання', ru: 'Бронирования' },
  'notifications.filter.payment': { en: 'Payments', uk: 'Платежі', ru: 'Платежи' },
  'notifications.filter.review': { en: 'Reviews', uk: 'Відгуки', ru: 'Отзывы' },
  'notifications.filter.system': { en: 'System', uk: 'Система', ru: 'Система' },
  
  // Notification dropdown
  'notifications.title': { en: 'Notifications', uk: 'Уведомления', ru: 'Уведомления' },
  'notifications.viewAll': { en: 'View all notifications', uk: 'Просмотреть все уведомления', ru: 'Просмотреть все уведомления' },
  
  // Notification messages
  'notifications.message.newBooking': { en: '{name} booked a consultation for tomorrow at {time}', uk: '{name} записалася на консультацію на завтра о {time}', ru: '{name} записалась на консультацию на завтра в {time}' },
  'notifications.message.paymentReceived': { en: 'Received payment {amount} for service "{service}"', uk: 'Отримано оплату {amount} за послугу "{service}"', ru: 'Получен платеж {amount} за услугу "{service}"' },
  'notifications.message.newReview': { en: '{name} left a review with {rating} stars', uk: '{name} залишив відгук з оцінкою {rating} зірок', ru: '{name} оставил отзыв с оценкой {rating} звезд' },
  'notifications.message.upcomingAppointment': { en: 'Reminder: meeting with {name} in {time}', uk: 'Нагадування: зустріч з {name} через {time}', ru: 'Напоминание: встреча с {name} через {time}' },
  'notifications.message.systemUpdate': { en: 'System update available with new features', uk: 'Доступне оновлення системи з новими функціями', ru: 'Доступно обновление системы с новыми функциями' },
  
  // Time units for notifications
  'time.minutesAgo': { en: '{count} min ago', uk: '{count} хв тому', ru: '{count} мин назад' },
  'time.hoursAgo': { en: '{count} hours ago', uk: '{count} год тому', ru: '{count} час назад' },
  'time.daysAgo': { en: '{count} days ago', uk: '{count} день тому', ru: '{count} дней назад' },
  
  // Services for notifications
  'services.psychologyConsultation': { en: 'Psychology Consultation', uk: 'Психологічна консультація', ru: 'Психологическая консультация' },

  // Messages Page Translation Keys
  'messages.subtitle': { en: 'Communicate with your clients', uk: 'Спілкуйтеся з клієнтами', ru: 'Общайтесь с клиентами' },
  'messages.searchConversations': { en: 'Search conversations...', uk: 'Пошук розмов...', ru: 'Поиск разговоров...' },
  'messages.online': { en: 'Online', uk: 'В мережі', ru: 'В сети' },
  'messages.offline': { en: 'Offline', uk: 'Не в мережі', ru: 'Не в сети' },
  'messages.selectConversation': { en: 'Select conversation', uk: 'Оберіть розмову', ru: 'Выберите разговор' },
  'messages.selectConversationDescription': { en: 'Choose a conversation from the list to start chatting', uk: 'Виберіть розмову зі списку, щоб почати спілкування', ru: 'Выберите разговор из списка, чтобы начать общение' },
  'messages.typeMessage': { en: 'Type a message...', uk: 'Введіть повідомлення...', ru: 'Введите сообщение...' },

  // Earnings Page Translation Keys
  'earnings.subtitle': { en: 'Track your income and payouts', uk: 'Переглядайте свої доходи та виплати', ru: 'Отслеживайте свои доходы и выплаты' },
  'earnings.exportReport': { en: 'Export Report', uk: 'Експорт звіту', ru: 'Экспорт отчета' },
  'earnings.totalEarnings': { en: 'Total Earnings', uk: 'Загальний заробіток', ru: 'Общий заработок' },
  'earnings.thisMonth': { en: 'This Month', uk: 'Цього місяця', ru: 'В этом месяце' },
  'earnings.pending': { en: 'Pending', uk: 'В очікуванні', ru: 'В ожидании' },
  'earnings.lastPayout': { en: 'Last Payout', uk: 'Остання виплата', ru: 'Последняя выплата' },
  'earnings.detailedAnalytics': { en: 'Detailed Earnings Analytics', uk: 'Детальна аналітика заробітку', ru: 'Детальная аналитика заработка' },
  'earnings.analyticsDescription': { en: 'Here will be displayed detailed income statistics, monthly earnings charts and payout history.', uk: 'Тут буде відображена детальна статистика доходів, графіки заробітку по місяцях та історія виплат.', ru: 'Здесь будет отображена детальная статистика доходов, графики заработка по месяцам и история выплат.' },
  'earnings.inDevelopment': { en: 'Feature in development', uk: 'Функціонал в розробці', ru: 'Функционал в разработке' },
  'earnings.completedBookings': { en: 'Completed Bookings', uk: 'Завершені бронювання', ru: 'Завершенные бронирования' },
  'earnings.activeClients': { en: 'Active Clients', uk: 'Активні клієнти', ru: 'Активные клиенты' },
  'earnings.averageBookingValue': { en: 'Avg. Booking Value', uk: 'Середня вартість бронювання', ru: 'Средняя стоимость бронирования' },
  'earnings.monthlyGrowth': { en: 'Monthly Growth', uk: 'Місячне зростання', ru: 'Месячный рост' },
  'earnings.monthlyEarnings': { en: 'Monthly Earnings', uk: 'Місячний заробіток', ru: 'Месячный заработок' },
  'earnings.recentPayouts': { en: 'Recent Payouts', uk: 'Останні виплати', ru: 'Последние выплаты' },
  'earnings.performanceMetrics': { en: 'Performance Metrics', uk: 'Показники ефективності', ru: 'Показатели эффективности' },
  'earnings.timeAnalysis': { en: 'Time Analysis', uk: 'Аналіз часу', ru: 'Анализ времени' },
  'earnings.growthInsights': { en: 'Growth Insights', uk: 'Аналіз зростання', ru: 'Анализ роста' },
  'earnings.conversionRate': { en: 'Conversion Rate', uk: 'Коефіцієнт конверсії', ru: 'Коэффициент конверсии' },
  'earnings.repeatCustomers': { en: 'Repeat Customers', uk: 'Постійні клієнти', ru: 'Постоянные клиенты' },
  'earnings.avgSessionValue': { en: 'Avg. Session Value', uk: 'Середня вартість сесії', ru: 'Средняя стоимость сессии' },
  'earnings.peakHours': { en: 'Peak Hours', uk: 'Пікові години', ru: 'Пиковые часы' },
  'earnings.bestDay': { en: 'Best Day', uk: 'Найкращий день', ru: 'Лучший день' },
  'earnings.avgBookingDuration': { en: 'Avg. Booking Duration', uk: 'Середня тривалість бронювання', ru: 'Средняя продолжительность бронирования' },
  'earnings.newCustomers': { en: 'New Customers', uk: 'Нові клієнти', ru: 'Новые клиенты' },
  'earnings.revenueTrend': { en: 'Revenue Trend', uk: 'Тренд доходу', ru: 'Тренд дохода' },
  'earnings.increasing': { en: '↗ Increasing', uk: '↗ Зростає', ru: '↗ Растет' },
  'earnings.thisMonthShort': { en: 'this month', uk: 'цього місяця', ru: 'в этом месяце' },
  'earnings.bookings': { en: 'bookings', uk: 'бронювання', ru: 'бронирования' },
  'earnings.completed': { en: 'Completed', uk: 'Завершено', ru: 'Завершено' },
  'earnings.processing': { en: 'Processing', uk: 'Обробка', ru: 'Обработка' },
  'earnings.bankTransfer': { en: 'Bank Transfer', uk: 'Банківський переказ', ru: 'Банковский перевод' },
  'earnings.paypal': { en: 'PayPal', uk: 'PayPal', ru: 'PayPal' },
  'earnings.exporting': { en: 'Exporting...', uk: 'Експорт...', ru: 'Экспорт...' },
  
  // Services Page
  'services.title': { en: 'My Services', uk: 'Мої послуги', ru: 'Мои услуги' },
  'services.subtitle': { en: 'Manage your services, pricing, and availability', uk: 'Керуйте своїми послугами, цінами та доступністю', ru: 'Управляйте своими услугами, ценами и доступностью' },
  'services.addService': { en: 'Add Service', uk: 'Додати послугу', ru: 'Добавить услугу' },
  'services.activeServices': { en: 'Active Services', uk: 'Активні послуги', ru: 'Активные услуги' },
  'services.totalBookings': { en: 'Total Bookings', uk: 'Всього бронювань', ru: 'Всего бронирований' },
  'services.avgRating': { en: 'Avg Rating', uk: 'Середній рейтинг', ru: 'Средний рейтинг' },
  'services.avgPrice': { en: 'Avg Price', uk: 'Середня ціна', ru: 'Средняя цена' },
  'services.searchPlaceholder': { en: 'Search services...', uk: 'Пошук послуг...', ru: 'Поиск услуг...' },
  'services.allCategories': { en: 'All Categories', uk: 'Всі категорії', ru: 'Все категории' },
  'services.noServicesFound': { en: 'No services found', uk: 'Послуги не знайдено', ru: 'Услуги не найдены' },
  'services.noServicesDesc': { en: 'Try changing filters or add a new service', uk: 'Спробуйте змінити фільтри або додати нову послугу', ru: 'Попробуйте изменить фильтры или добавить новую услугу' },
  'services.active': { en: 'Active', uk: 'Активна', ru: 'Активная' },
  'services.inactive': { en: 'Inactive', uk: 'Неактивна', ru: 'Неактивная' },
  'services.availability': { en: 'Availability', uk: 'Доступність', ru: 'Доступность' },
  'services.timeSlots': { en: 'Time Slots', uk: 'Часові слоти', ru: 'Временные слоты' },
  'services.edit': { en: 'Edit', uk: 'Редагувати', ru: 'Редактировать' },
  'services.activate': { en: 'Activate', uk: 'Активувати', ru: 'Активировать' },
  'services.deactivate': { en: 'Deactivate', uk: 'Деактивувати', ru: 'Деактивировать' },
  'services.min': { en: 'min', uk: 'хв', ru: 'мин' },
  'services.bookings': { en: 'bookings', uk: 'бронювань', ru: 'бронирований' },
  
  // Service Form
  'serviceForm.addService': { en: 'Add New Service', uk: 'Додати нову послугу', ru: 'Добавить новую услугу' },
  'serviceForm.editService': { en: 'Edit Service', uk: 'Редагувати послугу', ru: 'Редактировать услугу' },
  'serviceForm.serviceName': { en: 'Service Name', uk: 'Назва послуги', ru: 'Название услуги' },
  'serviceForm.serviceNamePlaceholder': { en: 'Enter service name...', uk: 'Введіть назву послуги...', ru: 'Введите название услуги...' },
  'serviceForm.description': { en: 'Description', uk: 'Опис', ru: 'Описание' },
  'serviceForm.descriptionPlaceholder': { en: 'Describe your service in detail...', uk: 'Детально опишіть свою послугу...', ru: 'Подробно опишите свою услугу...' },
  'serviceForm.category': { en: 'Category', uk: 'Категорія', ru: 'Категория' },
  'serviceForm.selectCategory': { en: 'Select a category', uk: 'Оберіть категорію', ru: 'Выберите категорию' },
  'serviceForm.pricing': { en: 'Pricing & Duration', uk: 'Ціна та тривалість', ru: 'Цена и продолжительность' },
  'serviceForm.price': { en: 'Price', uk: 'Ціна', ru: 'Цена' },
  'serviceForm.duration': { en: 'Duration (minutes)', uk: 'Тривалість (хвилини)', ru: 'Продолжительность (минуты)' },
  'serviceForm.availability': { en: 'Availability', uk: 'Доступність', ru: 'Доступность' },
  'serviceForm.availableDays': { en: 'Available Days', uk: 'Доступні дні', ru: 'Доступные дни' },
  'serviceForm.timeSlots': { en: 'Time Slots', uk: 'Часові слоти', ru: 'Временные слоты' },
  'serviceForm.addTimeSlot': { en: 'Add Time Slot', uk: 'Додати часовий слот', ru: 'Добавить временной слот' },
  'serviceForm.removeTimeSlot': { en: 'Remove', uk: 'Видалити', ru: 'Удалить' },
  'serviceForm.serviceActive': { en: 'Service is active and visible to customers', uk: 'Послуга активна та видима клієнтам', ru: 'Услуга активна и видна клиентам' },
  'serviceForm.required': { en: 'This field is required', uk: 'Це поле обов\'язкове', ru: 'Это поле обязательное' },
  'serviceForm.priceMin': { en: 'Price must be greater than 0', uk: 'Ціна повинна бути більше 0', ru: 'Цена должна быть больше 0' },
  'serviceForm.durationMin': { en: 'Duration must be at least 15 minutes', uk: 'Тривалість повинна бути не менше 15 хвилин', ru: 'Продолжительность должна быть не менее 15 минут' },
  'serviceForm.selectAtLeastOneDay': { en: 'Select at least one day', uk: 'Оберіть принаймні один день', ru: 'Выберите хотя бы один день' },
  'serviceForm.addAtLeastOneTimeSlot': { en: 'Add at least one time slot', uk: 'Додайте принаймні один часовий слот', ru: 'Добавьте хотя бы один временной слот' },
  
  // User Roles
  'user.specialist': { en: 'Specialist', uk: 'Спеціаліст', ru: 'Специалист' },
  'user.customer': { en: 'Customer', uk: 'Клієнт', ru: 'Клиент' },
  'user.admin': { en: 'Admin', uk: 'Адміністратор', ru: 'Администратор' },
  'user.online': { en: '● Online', uk: '● Онлайн', ru: '● Онлайн' },
  'user.offline': { en: '● Offline', uk: '● Офлайн', ru: '● Офлайн' },
  
  // Theme Toggle
  'theme.light': { en: 'Light Theme', uk: 'Світла тема', ru: 'Светлая тема' },
  'theme.dark': { en: 'Dark Theme', uk: 'Темна тема', ru: 'Темная тема' },
  'dashboard.mobile.close': { en: 'Close', uk: 'Закрити', ru: 'Закрыть' },
  'dashboard.mobile.showSidebar': { en: 'Show Sidebar', uk: 'Показати бічну панель', ru: 'Показать боковую панель' },

  // Customer Pages
  'customer.bookings.title': { en: 'My Bookings', uk: 'Мої бронювання', ru: 'Мои бронирования' },
  'customer.bookings.subtitle': { en: 'Manage your upcoming and past bookings', uk: 'Керуйте своїми майбутніми та минулими бронюваннями', ru: 'Управляйте своими предстоящими и прошлыми бронированиями' },
  'customer.bookings.upcoming': { en: 'Upcoming Bookings', uk: 'Майбутні бронювання', ru: 'Предстоящие бронирования' },
  'customer.bookings.past': { en: 'Past Bookings', uk: 'Минулі бронювання', ru: 'Прошлые бронирования' },
  'customer.bookings.cancelled': { en: 'Cancelled', uk: 'Скасовані', ru: 'Отмененные' },
  'customer.bookings.noUpcoming': { en: 'No upcoming bookings', uk: 'Немає майбутніх бронювань', ru: 'Нет предстоящих бронирований' },
  'customer.bookings.noPast': { en: 'No past bookings', uk: 'Немає минулих бронювань', ru: 'Нет прошлых бронирований' },
  'customer.bookings.reschedule': { en: 'Reschedule', uk: 'Перенести', ru: 'Перенести' },
  'customer.bookings.cancel': { en: 'Cancel', uk: 'Скасувати', ru: 'Отменить' },
  'customer.bookings.viewDetails': { en: 'View Details', uk: 'Переглянути деталі', ru: 'Посмотреть детали' },
  'customer.bookings.leaveReview': { en: 'Leave Review', uk: 'Залишити відгук', ru: 'Оставить отзыв' },
  'customer.bookings.bookAgain': { en: 'Book Again', uk: 'Забронювати знову', ru: 'Забронировать снова' },
  
  'customer.favorites.title': { en: 'My Favorites', uk: 'Моє обране', ru: 'Мое избранное' },
  'customer.favorites.subtitle': { en: 'Your saved specialists and services', uk: 'Ваші збережені спеціалісти та послуги', ru: 'Ваши сохраненные специалисты и услуги' },
  'customer.favorites.specialists': { en: 'Favorite Specialists', uk: 'Улюблені спеціалісти', ru: 'Любимые специалисты' },
  'customer.favorites.services': { en: 'Favorite Services', uk: 'Улюблені послуги', ru: 'Любимые услуги' },
  'customer.favorites.noSpecialists': { en: 'No favorite specialists yet', uk: 'Поки немає улюблених спеціалістів', ru: 'Пока нет любимых специалистов' },
  'customer.favorites.noServices': { en: 'No favorite services yet', uk: 'Поки немає улюблених послуг', ru: 'Пока нет любимых услуг' },
  'customer.favorites.removeFromFavorites': { en: 'Remove from Favorites', uk: 'Видалити з обраного', ru: 'Удалить из избранного' },
  
  
  'customer.help.title': { en: 'Help & Support', uk: 'Допомога та підтримка', ru: 'Помощь и поддержка' },
  'customer.help.subtitle': { en: 'Get help and find answers to your questions', uk: 'Отримайте допомогу та знайдіть відповіді на свої питання', ru: 'Получите помощь и найдите ответы на свои вопросы' },
  'customer.help.faq': { en: 'Frequently Asked Questions', uk: 'Часті питання', ru: 'Часто задаваемые вопросы' },
  'customer.help.contact': { en: 'Contact Support', uk: 'Зв\'язатися з підтримкою', ru: 'Связаться с поддержкой' },
  'customer.help.guides': { en: 'User Guides', uk: 'Посібники користувача', ru: 'Руководства пользователя' },
  'customer.help.feedback': { en: 'Send Feedback', uk: 'Надіслати відгук', ru: 'Отправить отзыв' },

  // Common Actions & States
  'common.call': { en: 'Call', uk: 'Подзвонити', ru: 'Позвонить' },
  'common.message': { en: 'Message', uk: 'Повідомлення', ru: 'Сообщение' },
  'common.edit': { en: 'Edit', uk: 'Редагувати', ru: 'Редактировать' },
  'common.remove': { en: 'Remove', uk: 'Видалити', ru: 'Удалить' },
  'common.close': { en: 'Close', uk: 'Закрити', ru: 'Закрыть' },
  'common.cancel': { en: 'Cancel', uk: 'Скасувати', ru: 'Отменить' },
  'common.save': { en: 'Save', uk: 'Зберегти', ru: 'Сохранить' },
  'common.send': { en: 'Send', uk: 'Надіслати', ru: 'Отправить' },
  'common.book': { en: 'Book', uk: 'Забронювати', ru: 'Забронировать' },
  'common.view': { en: 'View', uk: 'Переглянути', ru: 'Посмотреть' },
  'common.start': { en: 'Start', uk: 'Почати', ru: 'Начать' },
  'common.change': { en: 'Change', uk: 'Змінити', ru: 'Изменить' },
  'common.add': { en: 'Add', uk: 'Додати', ru: 'Добавить' },
  'common.again': { en: 'again', uk: 'знову', ru: 'снова' },
  'common.default': { en: 'Default', uk: 'За замовчуванням', ru: 'По умолчанию' },
  'common.online': { en: 'Online', uk: 'Онлайн', ru: 'Онлайн' },
  'common.verified': { en: 'Verified', uk: 'Підтверджено', ru: 'Подтверждено' },
  'common.upcoming': { en: 'Upcoming', uk: 'Майбутні', ru: 'Предстоящие' },
  'common.completed': { en: 'Completed', uk: 'Завершені', ru: 'Завершенные' },
  'common.cancelled': { en: 'Cancelled', uk: 'Скасовані', ru: 'Отмененные' },
  'common.past': { en: 'Past', uk: 'Минулі', ru: 'Прошлые' },
  'common.private': { en: 'Private', uk: 'Приватний', ru: 'Частный' },
  'common.public': { en: 'Public', uk: 'Публічний', ru: 'Публичный' },
  'common.light': { en: 'Light', uk: 'Світла', ru: 'Светлая' },
  'common.dark': { en: 'Dark', uk: 'Темна', ru: 'Темная' },
  'common.system': { en: 'System', uk: 'Системна', ru: 'Системная' },
  'common.home': { en: 'Home', uk: 'Дім', ru: 'Дом' },
  'common.work': { en: 'Work', uk: 'Робота', ru: 'Работа' },
  'common.other': { en: 'Other', uk: 'Інше', ru: 'Другое' },
  'common.inProgress': { en: 'In Progress', uk: 'Виконується', ru: 'В процессе' },
  'common.saveChanges': { en: 'Save Changes', uk: 'Зберегти зміни', ru: 'Сохранить изменения' },

  // Booking Status & Details
  'booking.details': { en: 'Booking Details', uk: 'Деталі бронювання', ru: 'Детали бронирования' },
  'booking.service': { en: 'Service', uk: 'Послуга', ru: 'Услуга' },
  'booking.specialist': { en: 'Specialist', uk: 'Спеціаліст', ru: 'Специалист' },
  'booking.date': { en: 'Date', uk: 'Дата', ru: 'Дата' },
  'booking.time': { en: 'Time', uk: 'Час', ru: 'Время' },
  'booking.location': { en: 'Location', uk: 'Місце', ru: 'Место' },
  'booking.price': { en: 'Price', uk: 'Ціна', ru: 'Цена' },
  'booking.notes': { en: 'Notes', uk: 'Примітки', ru: 'Заметки' },
  'booking.onlineSession': { en: 'Online Session', uk: 'Онлайн сесія', ru: 'Онлайн сессия' },
  'booking.rescheduleAlert': { en: 'Reschedule functionality would be implemented here', uk: 'Функціонал перенесення буде реалізовано тут', ru: 'Функционал переноса будет реализован здесь' },
  'booking.reviewAlert': { en: 'Review functionality would be implemented here', uk: 'Функціонал відгуків буде реалізовано тут', ru: 'Функционал отзывов будет реализован здесь' },

  // Empty States
  'empty.noCancelledBookings': { en: 'No cancelled bookings', uk: 'Немає скасованих бронювань', ru: 'Нет отмененных бронирований' },
  'empty.bookFirstService': { en: 'Book your first service to see it here.', uk: 'Забронюйте свою першу послугу, щоб побачити її тут.', ru: 'Забронируйте свою первую услугу, чтобы увидеть её здесь.' },
  'empty.completedBookingsHere': { en: 'Your completed bookings will appear here.', uk: 'Ваші завершені бронювання з\'являться тут.', ru: 'Ваши завершенные бронирования появятся здесь.' },
  'empty.cancelledBookingsHere': { en: 'Your cancelled bookings will appear here.', uk: 'Ваші скасовані бронювання з\'являться тут.', ru: 'Ваши отмененные бронирования появятся здесь.' },
  'empty.browseSpecialists': { en: 'Browse Specialists', uk: 'Переглянути спеціалістів', ru: 'Просмотреть специалистов' },
  'empty.browseServices': { en: 'Browse Services', uk: 'Переглянути послуги', ru: 'Просмотреть услуги' },
  'empty.startBrowsingSpecialists': { en: 'Start browsing specialists and add them to your favorites.', uk: 'Почніть переглядати спеціалістів і додавайте їх до обраного.', ru: 'Начните просматривать специалистов и добавляйте их в избранное.' },
  'empty.startBrowsingServices': { en: 'Start browsing services and add them to your favorites.', uk: 'Почніть переглядати послуги і додавайте їх до обраного.', ru: 'Начните просматривать услуги и добавляйте их в избранное.' },

  // Profile & Account
  'profile.changePhoto': { en: 'Change Photo', uk: 'Змінити фото', ru: 'Изменить фото' },
  'profile.firstName': { en: 'First Name', uk: 'Ім\'я', ru: 'Имя' },
  'profile.lastName': { en: 'Last Name', uk: 'Прізвище', ru: 'Фамилия' },
  'profile.email': { en: 'Email', uk: 'Електронна пошта', ru: 'Электронная почта' },
  'profile.phone': { en: 'Phone', uk: 'Телефон', ru: 'Телефон' },
  'profile.changePassword': { en: 'Change Password', uk: 'Змінити пароль', ru: 'Изменить пароль' },
  'profile.currentPassword': { en: 'Current Password', uk: 'Поточний пароль', ru: 'Текущий пароль' },
  'profile.newPassword': { en: 'New Password', uk: 'Новий пароль', ru: 'Новый пароль' },
  'profile.confirmPassword': { en: 'Confirm Password', uk: 'Підтвердити пароль', ru: 'Подтвердить пароль' },

  // Notifications
  'notifications.emailNotifications': { en: 'Email Notifications', uk: 'Email сповіщення', ru: 'Email уведомления' },
  'notifications.pushNotifications': { en: 'Push Notifications', uk: 'Push сповіщення', ru: 'Push уведомления' },
  'notifications.smsNotifications': { en: 'SMS Notifications', uk: 'SMS сповіщення', ru: 'SMS уведомления' },
  'notifications.bookingConfirmations': { en: 'Booking confirmations', uk: 'Підтвердження бронювань', ru: 'Подтверждения бронирований' },
  'notifications.appointmentReminders': { en: 'Appointment reminders', uk: 'Нагадування про зустрічі', ru: 'Напоминания о встречах' },
  'notifications.promotionsOffers': { en: 'Promotions and offers', uk: 'Акції та пропозиції', ru: 'Акции и предложения' },

  // Privacy & Security
  'privacy.profileVisibility': { en: 'Profile Visibility', uk: 'Видимість профілю', ru: 'Видимость профиля' },
  'privacy.showEmailProfile': { en: 'Show email in profile', uk: 'Показувати email в профілі', ru: 'Показывать email в профиле' },
  'privacy.showPhoneProfile': { en: 'Show phone number in profile', uk: 'Показувати телефон в профілі', ru: 'Показывать телефон в профиле' },
  'privacy.allowReviews': { en: 'Allow others to leave reviews', uk: 'Дозволити іншим залишати відгуки', ru: 'Разрешить другим оставлять отзывы' },
  'privacy.allowDataProcessing': { en: 'Allow data processing for recommendations', uk: 'Дозволити обробку даних для рекомендацій', ru: 'Разрешить обработку данных для рекомендаций' },

  // Language & Currency
  'language.language': { en: 'Language', uk: 'Мова', ru: 'Язык' },
  'language.currency': { en: 'Currency', uk: 'Валюта', ru: 'Валюта' },
  'language.theme': { en: 'Theme', uk: 'Тема', ru: 'Тема' },
  'language.english': { en: 'English', uk: 'Англійська', ru: 'Английский' },
  'language.ukrainian': { en: 'Українська', uk: 'Українська', ru: 'Украинский' },
  'language.russian': { en: 'Русский', uk: 'Російська', ru: 'Русский' },

  // Currency Options
  'currency.uah': { en: 'Ukrainian Hryvnia (₴)', uk: 'Українська гривня (₴)', ru: 'Украинская гривна (₴)' },
  'currency.usd': { en: 'US Dollar ($)', uk: 'Долар США ($)', ru: 'Доллар США ($)' },
  'currency.eur': { en: 'Euro (€)', uk: 'Євро (€)', ru: 'Евро (€)' },

  // Payment Methods
  'payment.addPaymentMethod': { en: 'Add Payment Method', uk: 'Додати спосіб оплати', ru: 'Добавить способ оплаты' },
  'payment.expires': { en: 'Expires', uk: 'Закінчується', ru: 'Истекает' },

  // Addresses
  'address.addAddress': { en: 'Add Address', uk: 'Додати адресу', ru: 'Добавить адрес' },

  // Help & Support
  'help.allTopics': { en: 'All Topics', uk: 'Всі теми', ru: 'Все темы' },
  'help.bookingScheduling': { en: 'Booking & Scheduling', uk: 'Бронювання та планування', ru: 'Бронирование и планирование' },
  'help.paymentsBilling': { en: 'Payments & Billing', uk: 'Платежі та рахунки', ru: 'Платежи и счета' },
  'help.accountProfile': { en: 'Account & Profile', uk: 'Акаунт і профіль', ru: 'Аккаунт и профиль' },
  'help.reviewsRatings': { en: 'Reviews & Ratings', uk: 'Відгуки та рейтинги', ru: 'Отзывы и рейтинги' },
  'help.generalQuestions': { en: 'General Questions', uk: 'Загальні питання', ru: 'Общие вопросы' },
  'help.emailSupport': { en: 'Email Support', uk: 'Підтримка email', ru: 'Поддержка email' },
  'help.phoneSupport': { en: 'Phone Support', uk: 'Телефонна підтримка', ru: 'Телефонная поддержка' },
  'help.liveChat': { en: 'Live Chat', uk: 'Живий чат', ru: 'Живой чат' },
  'help.getHelpViaEmail': { en: 'Get help via email', uk: 'Отримати допомогу через email', ru: 'Получить помощь через email' },
  'help.speakWithSupport': { en: 'Speak with our support team', uk: 'Поговорити з нашою командою підтримки', ru: 'Поговорить с нашей командой поддержки' },
  'help.chatRealTime': { en: 'Chat with us in real-time', uk: 'Спілкуйтеся з нами в реальному часі', ru: 'Общайтесь с нами в реальном времени' },
  'help.responseWithin24h': { en: 'Response within 24 hours', uk: 'Відповідь протягом 24 годин', ru: 'Ответ в течение 24 часов' },
  'help.monFri9to6': { en: 'Mon-Fri, 9 AM - 6 PM (EET)', uk: 'Пн-Пт, 9:00 - 18:00 (EET)', ru: 'Пн-Пт, 9:00 - 18:00 (EET)' },
  'help.startChat': { en: 'Start Chat', uk: 'Почати чат', ru: 'Начать чат' },
  'help.supportStats': { en: 'Support Stats', uk: 'Статистика підтримки', ru: 'Статистика поддержки' },
  'help.averageResponseTime': { en: 'Average Response Time', uk: 'Середній час відповіді', ru: 'Среднее время ответа' },
  'help.resolutionRate': { en: 'Resolution Rate', uk: 'Рівень вирішення', ru: 'Уровень решения' },
  'help.customerSatisfaction': { en: 'Customer Satisfaction', uk: 'Задоволеність клієнтів', ru: 'Удовлетворенность клиентов' },
  'help.2hours': { en: '2 hours', uk: '2 години', ru: '2 часа' },
  'help.98percent': { en: '98%', uk: '98%', ru: '98%' },
  'help.49outof5': { en: '4.9/5', uk: '4,9/5', ru: '4,9/5' },

  // User Guides
  'guides.gettingStarted': { en: 'Getting Started Guide', uk: 'Посібник для початківців', ru: 'Руководство для начинающих' },
  'guides.gettingStartedDesc': { en: 'Learn how to create your account and book your first service', uk: 'Дізнайтеся, як створити обліковий запис та забронювати першу послугу', ru: 'Узнайте, как создать аккаунт и забронировать первую услугу' },
  'guides.bookingProcess': { en: 'Booking Process', uk: 'Процес бронювання', ru: 'Процесс бронирования' },
  'guides.bookingProcessDesc': { en: 'Step-by-step guide to booking and managing appointments', uk: 'Покроковий посібник з бронювання та управління зустрічами', ru: 'Пошаговое руководство по бронированию и управлению встречами' },
  'guides.paymentMethods': { en: 'Payment Methods', uk: 'Способи оплати', ru: 'Способы оплаты' },
  'guides.paymentMethodsDesc': { en: 'Understanding payments, refunds, and billing', uk: 'Розуміння платежів, повернень та рахунків', ru: 'Понимание платежей, возвратов и счетов' },
  'guides.accountSecurity': { en: 'Account Security', uk: 'Безпека акаунта', ru: 'Безопасность аккаунта' },
  'guides.accountSecurityDesc': { en: 'Tips for keeping your account safe and secure', uk: 'Поради щодо безпеки вашого акаунта', ru: 'Советы по обеспечению безопасности вашего аккаунта' },

  // Feedback Form
  'feedback.category': { en: 'Category', uk: 'Категорія', ru: 'Категория' },
  'feedback.subject': { en: 'Subject', uk: 'Тема', ru: 'Тема' },
  'feedback.message': { en: 'Message', uk: 'Повідомлення', ru: 'Сообщение' },
  'feedback.sendFeedback': { en: 'Send Feedback', uk: 'Надіслати відгук', ru: 'Отправить отзыв' },
  'feedback.general': { en: 'General Feedback', uk: 'Загальний відгук', ru: 'Общий отзыв' },
  'feedback.bugReport': { en: 'Bug Report', uk: 'Звіт про помилку', ru: 'Сообщение об ошибке' },
  'feedback.featureRequest': { en: 'Feature Request', uk: 'Запит функції', ru: 'Запрос функции' },
  'feedback.complaint': { en: 'Complaint', uk: 'Скарга', ru: 'Жалоба' },
  'feedback.compliment': { en: 'Compliment', uk: 'Компліменти', ru: 'Комплимент' },
  'feedback.thankYou': { en: 'Thank you for your feedback! We\'ll get back to you soon.', uk: 'Дякуємо за ваш відгук! Ми зв\'яжемося з вами найближчим часом.', ru: 'Спасибо за ваш отзыв! Мы свяжемся с вами в ближайшее время.' },

  // FAQ Content
  'faq.howToBook': { en: 'How do I book a service?', uk: 'Як забронювати послугу?', ru: 'Как забронировать услугу?' },
  'faq.howToBookAnswer': { en: 'To book a service, browse our specialists, select the service you want, choose your preferred date and time, and complete the payment. You\'ll receive a confirmation email with all the details.', uk: 'Щоб забронювати послугу, перегляньте наших спеціалістів, виберіть потрібну послугу, оберіть бажані дату та час і завершіть оплату. Ви отримаете електронний лист з підтвердженням з усіма деталями.', ru: 'Чтобы забронировать услугу, просмотрите наших специалистов, выберите нужную услугу, выберите предпочтительные дату и время и завершите оплату. Вы получите электронное письмо с подтверждением со всеми деталями.' },
  'faq.cancelReschedule': { en: 'Can I cancel or reschedule my booking?', uk: 'Чи можу я скасувати або перенести бронювання?', ru: 'Могу ли я отменить или перенести бронирование?' },
  'faq.cancelRescheduleAnswer': { en: 'Yes, you can cancel or reschedule your booking up to 24 hours before the scheduled time. Go to "My Bookings" in your account to make changes. Cancellation policies may vary by specialist.', uk: 'Так, ви можете скасувати або перенести бронювання за 24 години до запланованого часу. Перейдіть до "Мої бронювання" у своєму акаунті, щоб внести зміни. Політика скасування може відрізнятися залежно від спеціаліста.', ru: 'Да, вы можете отменить или перенести бронирование за 24 часа до запланированного времени. Перейдите в "Мои бронирования" в своем аккаунте, чтобы внести изменения. Политика отмены может отличаться в зависимости от специалиста.' },
  'faq.howPaymentsWork': { en: 'How do payments work?', uk: 'Як працюють платежі?', ru: 'Как работают платежи?' },
  'faq.howPaymentsWorkAnswer': { en: 'We accept major credit cards, debit cards, and PayPal. Payment is processed when you confirm your booking. For some services, you may pay a deposit upfront and the remainder after service completion.', uk: 'Ми приймаємо основні кредитні картки, дебетові картки та PayPal. Оплата обробляється, коли ви підтверджуєте своє бронювання. Для деяких послуг ви можете сплатити депозит наперед, а решту після завершення послуги.', ru: 'Мы принимаем основные кредитные карты, дебетовые карты и PayPal. Оплата обрабатывается при подтверждении бронирования. Для некоторых услуг вы можете заплатить депозит заранее, а остальное после завершения услуги.' },
  'faq.notSatisfied': { en: 'What if I\'m not satisfied with the service?', uk: 'Що робити, якщо я не задоволений послугою?', ru: 'Что делать, если я не доволен услугой?' },
  'faq.notSatisfiedAnswer': { en: 'We want you to be completely satisfied. If you\'re not happy with your service, please contact us within 48 hours. We\'ll work with you and the specialist to resolve any issues.', uk: 'Ми хочемо, щоб ви були повністю задоволені. Якщо ви не задоволені своєю послугою, зв\'яжіться з нами протягом 48 годин. Ми працюватимемо з вами та спеціалістом, щоб вирішити будь-які проблеми.', ru: 'Мы хотим, чтобы вы были полностью удовлетворены. Если вы не довольны своей услугой, свяжитесь с нами в течение 48 часов. Мы будем работать с вами и специалистом для решения любых проблем.' },
  'faq.specialistsVerified': { en: 'How are specialists verified?', uk: 'Як перевіряються спеціалісти?', ru: 'Как проверяются специалисты?' },
  'faq.specialistsVerifiedAnswer': { en: 'All our specialists go through a thorough verification process including background checks, credential verification, and skills assessment. We also monitor reviews and ratings continuously.', uk: 'Усі наші спеціалісти проходять ретельний процес перевірки, включаючи перевірку біографії, верифікацію кваліфікації та оцінку навичок. Ми також постійно відстежуємо відгуки та рейтинги.', ru: 'Все наши специалисты проходят тщательный процесс проверки, включая проверку биографии, верификацию квалификации и оценку навыков. Мы также постоянно отслеживаем отзывы и рейтинги.' },
  'faq.leaveReview': { en: 'Can I leave a review?', uk: 'Чи можу я залишити відгук?', ru: 'Могу ли я оставить отзыв?' },
  'faq.leaveReviewAnswer': { en: 'Yes! We encourage you to leave reviews after your service is completed. This helps other customers make informed decisions and helps specialists improve their services.', uk: 'Так! Ми заохочуємо вас залишати відгуки після завершення послуги. Це допомагає іншим клієнтам приймати обґрунтовані рішення та допомагає спеціалістам покращувати свої послуги.', ru: 'Да! Мы призываем вас оставлять отзывы после завершения услуги. Это помогает другим клиентам принимать обоснованные решения и помогает специалистам улучшать свои услуги.' },
  'faq.personalInfoSecure': { en: 'Is my personal information secure?', uk: 'Чи захищена моя особиста інформація?', ru: 'Защищена ли моя личная информация?' },
  'faq.personalInfoSecureAnswer': { en: 'Absolutely. We use industry-standard encryption and security measures to protect your personal information. We never share your data with third parties without your consent.', uk: 'Абсолютно. Ми використовуємо стандартне для індустрії шифрування та заходи безпеки для захисту вашої особистої інформації. Ми ніколи не передаємо ваші дані третім сторонам без вашої згоди.', ru: 'Абсолютно. Мы используем стандартное для отрасли шифрование и меры безопасности для защиты вашей личной информации. Мы никогда не передаем ваши данные третьим сторонам без вашего согласия.' },
  'faq.updateProfile': { en: 'How do I update my profile?', uk: 'Як оновити свій профіль?', ru: 'Как обновить свой профиль?' },
  'faq.updateProfileAnswer': { en: 'Go to your account settings to update your profile information, payment methods, addresses, and preferences. Changes are saved automatically.', uk: 'Перейдіть до налаштувань свого акаунта, щоб оновити інформацію профілю, способи оплати, адреси та налаштування. Зміни зберігаються автоматично.', ru: 'Перейдите в настройки своего аккаунта, чтобы обновить информацию профиля, способы оплаты, адреса и настройки. Изменения сохраняются автоматически.' },

  // Service Names (examples)
  'service.hairCutStyle': { en: 'Hair Cut & Style', uk: 'Стрижка та укладка', ru: 'Стрижка и укладка' },
  'service.personalTraining': { en: 'Personal Training Session', uk: 'Персональне тренування', ru: 'Персональная тренировка' },
  'service.businessConsultation': { en: 'Business Consultation', uk: 'Бізнес консультація', ru: 'Бизнес консультация' },
  'service.massageTherapy': { en: 'Massage Therapy', uk: 'Масажна терапія', ru: 'Массажная терапия' },
  'service.premiumHairCut': { en: 'Premium Hair Cut & Style', uk: 'Преміум стрижка та укладка', ru: 'Премиум стрижка и укладка' },
  'service.premiumHairCutDesc': { en: 'Professional hair cutting and styling service with consultation', uk: 'Професійна стрижка та укладка з консультацією', ru: 'Профессиональная стрижка и укладка с консультацией' },
  'service.personalTrainingDesc': { en: 'One-on-one fitness training session with personalized workout plan', uk: 'Індивідуальне фітнес тренування з персоналізованим планом', ru: 'Индивидуальная фитнес тренировка с персонализированным планом' },

  // Specialist Names (examples)
  'specialist.sarahJohnson': { en: 'Sarah Johnson', uk: 'Сара Джонсон', ru: 'Сара Джонсон' },
  'specialist.michaelChen': { en: 'Michael Chen', uk: 'Майкл Чен', ru: 'Майкл Чен' },
  'specialist.emilyRodriguez': { en: 'Emily Rodriguez', uk: 'Емілі Родрігез', ru: 'Эмили Родригез' },
  'specialist.davidKumar': { en: 'David Kumar', uk: 'Девід Кумар', ru: 'Дэвид Кумар' },

  // Location Names (examples)
  'location.beautyStudio': { en: 'Beauty Studio Downtown, 123 Main St, Kyiv', uk: 'Студія краси в центрі, вул. Головна 123, Київ', ru: 'Студия красоты в центре, ул. Главная 123, Киев' },
  'location.fitLifeGym': { en: 'FitLife Gym, 456 Fitness Ave, Kyiv', uk: 'Спортзал FitLife, просп. Фітнес 456, Київ', ru: 'Спортзал FitLife, просп. Фитнес 456, Киев' },
  'location.zenWellness': { en: 'Zen Wellness Center, 789 Relax Blvd, Kyiv', uk: 'Центр здоров\'я Zen, бульв. Релакс 789, Київ', ru: 'Центр здоровья Zen, бульв. Релакс 789, Киев' },

  // Notes (examples)
  'notes.bringPhotos': { en: 'Please bring inspiration photos', uk: 'Будь ласка, принесіть фото для натхнення', ru: 'Пожалуйста, принесите фото для вдохновения' },

  // Categories
  'category.beautyWellness': { en: 'Beauty & Wellness', uk: 'Краса та здоров\'я', ru: 'Красота и здоровье' },
  'category.healthFitness': { en: 'Health & Fitness', uk: 'Здоров\'я та фітнес', ru: 'Здоровье и фитнес' },

  // Actions with context
  'action.viewProfile': { en: 'View Profile', uk: 'Переглянути профіль', ru: 'Посмотреть профиль' },
  'action.bookNow': { en: 'Book Now', uk: 'Забронювати зараз', ru: 'Забронировать сейчас' },
  'action.viewDetails': { en: 'View Details', uk: 'Переглянути деталі', ru: 'Посмотреть детали' },
  'action.liveChatAlert': { en: 'Live chat feature would be implemented here', uk: 'Функція живого чату буде реалізована тут', ru: 'Функция живого чата будет реализована здесь' },

  // Time
  'time.2hours': { en: '2 hours', uk: '2 години', ru: '2 часа' },
  'dashboard.mobile.hideSidebar': { en: 'Hide Sidebar', uk: 'Сховати бічну панель', ru: 'Скрыть боковую панель' },



  // Schedule
  'schedule.subtitle': { en: 'Configure your work schedule and availability', uk: 'Налаштуйте свій робочий розклад та доступність', ru: 'Настройте свой рабочий график и доступность' },
  'schedule.addTime': { en: 'Add Time', uk: 'Додати час', ru: 'Добавить время' },
  'schedule.comingSoon': { en: 'Schedule Coming Soon', uk: 'Розклад буде тут', ru: 'Расписание скоро здесь' },
  'schedule.description': { en: 'This section will contain a calendar with the ability to configure working hours, breaks and availability.', uk: 'Цей розділ буде містити календар з можливістю налаштування робочих годин, перерв та доступності.', ru: 'Этот раздел будет содержать календарь с возможностью настройки рабочих часов, перерывов и доступности.' },
  'schedule.availableSlots': { en: 'Available Slots', uk: 'Доступні слоти', ru: 'Доступные слоты' },
  'schedule.blockedSlots': { en: 'Blocked Slots', uk: 'Заблоковані слоти', ru: 'Заблокированные слоты' },
  'schedule.totalSlots': { en: 'Total Slots', uk: 'Всього слотів', ru: 'Всего слотов' },
  'schedule.upcomingSchedule': { en: 'Upcoming Schedule', uk: 'Майбутній розклад', ru: 'Предстоящее расписание' },
  'schedule.noScheduleSet': { en: 'No schedule set', uk: 'Розклад не встановлено', ru: 'Расписание не установлено' },
  'schedule.noScheduleDescription': { en: 'Start by adding your available time slots to let customers book appointments.', uk: 'Почніть з додавання доступних часових слотів, щоб клієнти могли записатися на прийом.', ru: 'Начните с добавления доступных временных слотов, чтобы клиенты могли записаться на прием.' },
  'schedule.addFirstSlot': { en: 'Add Your First Time Slot', uk: 'Додати перший часовий слот', ru: 'Добавить первый временной слот' },
  'schedule.recurring': { en: 'Recurring', uk: 'Повторювані', ru: 'Повторяющиеся' },
  'schedule.repeats': { en: 'Repeats', uk: 'Повторюється', ru: 'Повторяется' },
  'schedule.addTimeSlot': { en: 'Add Time Slot', uk: 'Додати часовий слот', ru: 'Добавить временной слот' },
  'schedule.editTimeSlot': { en: 'Edit Time Slot', uk: 'Редагувати часовий слот', ru: 'Редактировать временной слот' },
  'schedule.date': { en: 'Date', uk: 'Дата', ru: 'Дата' },
  'schedule.startTime': { en: 'Start Time', uk: 'Час початку', ru: 'Время начала' },
  'schedule.endTime': { en: 'End Time', uk: 'Час закінчення', ru: 'Время окончания' },
  'schedule.availableForBooking': { en: 'Available for booking', uk: 'Доступно для бронювання', ru: 'Доступно для бронирования' },
  'schedule.reasonUnavailable': { en: 'Reason for unavailability', uk: 'Причина недоступності', ru: 'Причина недоступности' },
  'schedule.reasonPlaceholder': { en: 'e.g., Personal appointment, Holiday', uk: 'наприклад, Особиста зустріч, Відпустка', ru: 'например, Личная встреча, Отпуск' },
  'schedule.repeatWeekly': { en: 'Repeat weekly', uk: 'Повторювати щотижня', ru: 'Повторять еженедельно' },
  'schedule.repeatOnDays': { en: 'Repeat on days', uk: 'Повторювати в дні', ru: 'Повторять в дни' },
  'schedule.monday': { en: 'Monday', uk: 'Понеділок', ru: 'Понедельник' },
  'schedule.tuesday': { en: 'Tuesday', uk: 'Вівторок', ru: 'Вторник' },
  'schedule.wednesday': { en: 'Wednesday', uk: 'Середа', ru: 'Среда' },
  'schedule.thursday': { en: 'Thursday', uk: 'Четвер', ru: 'Четверг' },
  'schedule.friday': { en: 'Friday', uk: 'П\'ятниця', ru: 'Пятница' },
  'schedule.saturday': { en: 'Saturday', uk: 'Субота', ru: 'Суббота' },
  'schedule.sunday': { en: 'Sunday', uk: 'Неділя', ru: 'Воскресенье' },
  'schedule.cancel': { en: 'Cancel', uk: 'Скасувати', ru: 'Отменить' },
  'schedule.update': { en: 'Update', uk: 'Оновити', ru: 'Обновить' },
  'schedule.add': { en: 'Add', uk: 'Додати', ru: 'Добавить' },
  'schedule.week': { en: 'Week', uk: 'Тиждень', ru: 'Неделя' },
  'schedule.month': { en: 'Month', uk: 'Місяць', ru: 'Месяц' },
  'schedule.year': { en: 'Year', uk: 'Рік', ru: 'Год' },

  // Month names for date formatting
  'month.january': { en: 'Jan', uk: 'Січ', ru: 'Янв' },
  'month.february': { en: 'Feb', uk: 'Лют', ru: 'Фев' },
  'month.march': { en: 'Mar', uk: 'Бер', ru: 'Мар' },
  'month.april': { en: 'Apr', uk: 'Кві', ru: 'Апр' },
  'month.may': { en: 'May', uk: 'Тра', ru: 'Май' },
  'month.june': { en: 'Jun', uk: 'Чер', ru: 'Июн' },
  'month.july': { en: 'Jul', uk: 'Лип', ru: 'Июл' },
  'month.august': { en: 'Aug', uk: 'Сер', ru: 'Авг' },
  'month.september': { en: 'Sep', uk: 'Вер', ru: 'Сен' },
  'month.october': { en: 'Oct', uk: 'Жов', ru: 'Окт' },
  'month.november': { en: 'Nov', uk: 'Лис', ru: 'Ноя' },
  'month.december': { en: 'Dec', uk: 'Гру', ru: 'Дек' },

  // Weekday names for date formatting
  'weekday.monday': { en: 'Mon', uk: 'Пн', ru: 'Пн' },
  'weekday.tuesday': { en: 'Tue', uk: 'Вт', ru: 'Вт' },
  'weekday.wednesday': { en: 'Wed', uk: 'Ср', ru: 'Ср' },
  'weekday.thursday': { en: 'Thu', uk: 'Чт', ru: 'Чт' },
  'weekday.friday': { en: 'Fri', uk: 'Пт', ru: 'Пт' },
  'weekday.saturday': { en: 'Sat', uk: 'Сб', ru: 'Сб' },
  'weekday.sunday': { en: 'Sun', uk: 'Нд', ru: 'Вс' },

  // Schedule reasons
  'schedule.personalAppointment': { en: 'Personal appointment', uk: 'Особиста зустріч', ru: 'Личная встреча' },
  
      // Time abbreviations (fixed duplicate)
    'time.hrs': { en: 'hr', uk: 'год', ru: 'ч' },
  
  // Rating and reviews
  'rating.reviews': { en: 'reviews', uk: 'відгуків', ru: 'отзывов' },
  
  // Reviews page
  'reviews.title': { en: 'Client Reviews', uk: 'Відгуки клієнтів', ru: 'Отзывы клиентов' },
  'reviews.subtitle': { en: 'View and respond to reviews', uk: 'Переглядайте та відповідайте на відгуки', ru: 'Просматривайте и отвечайте на отзывы' },
  'reviews.overallRating': { en: 'Overall rating from {count} reviews', uk: 'Загальний рейтинг з {count} відгуків', ru: 'Общий рейтинг из {count} отзывов' },
  'reviews.positiveReviews': { en: 'Positive reviews', uk: 'Позитивні відгуки', ru: 'Положительные отзывы' },
  'reviews.averageResponseTime': { en: 'Average response time (minutes)', uk: 'Середній час відповіді (хвилин)', ru: 'Среднее время ответа (минут)' },
  'reviews.recentReviews': { en: 'Recent reviews', uk: 'Останні відгуки', ru: 'Последние отзывы' },
  'reviews.verified': { en: 'Verified', uk: 'Підтверджено', ru: 'Подтверждено' },
  'reviews.forService': { en: 'for service "{service}"', uk: 'за послугу "{service}"', ru: 'за услугу "{service}"' },
  'reviews.reply': { en: 'Reply', uk: 'Відповісти', ru: 'Ответить' },
  'reviews.showMore': { en: 'Show more reviews', uk: 'Показати більше відгуків', ru: 'Показать больше отзывов' },
  
  // Portfolio section
  'portfolio.title': { en: 'Portfolio', uk: 'Портфоліо', ru: 'Портфолио' },
  'portfolio.addPhoto': { en: 'Add Photo', uk: 'Додати фото', ru: 'Добавить фото' },
  'portfolio.addNew': { en: 'Add New', uk: 'Додати нове', ru: 'Добавить новое' },
  'portfolio.noItems': { en: 'No portfolio items available', uk: 'Немає елементів портфоліо', ru: 'Нет элементов портфолио' },
  'portfolio.category.workspace': { en: 'Workspace', uk: 'Робоче місце', ru: 'Рабочее место' },
  'portfolio.category.workshop': { en: 'Workshop', uk: 'Майстер-клас', ru: 'Мастер-класс' },
  'portfolio.category.consultation': { en: 'Consultation', uk: 'Консультація', ru: 'Консультация' },
  'portfolio.category.therapy': { en: 'Therapy', uk: 'Терапія', ru: 'Терапия' },

  // Earnings Page
  'earnings.paymentMethod.bankTransfer': { en: 'Bank Transfer', uk: 'Банківський переказ', ru: 'Банковский перевод' },
  'earnings.paymentMethod.paypal': { en: 'PayPal', uk: 'PayPal', ru: 'PayPal' },
  'earnings.timeFormat.afternoon': { en: '2PM - 6PM', uk: '14:00 - 18:00', ru: '14:00 - 18:00' },
  'earnings.weekday.thursday': { en: 'Thursday', uk: 'Четвер', ru: 'Четверг' },
  'earnings.duration.minutes': { en: 'min', uk: 'хв', ru: 'мин' },

  // Common
  'common.inDevelopment': { en: 'In Development', uk: 'Функціонал в розробці', ru: 'В разработке' },

  // Specialist Settings
  'settings.title': { en: 'Settings', uk: 'Налаштування', ru: 'Настройки' },
  'settings.subtitle': { en: 'Manage your account preferences and business settings', uk: 'Керуйте налаштуваннями облікового запису та бізнесу', ru: 'Управляйте настройками аккаунта и бизнеса' },
  'settings.account': { en: 'Account', uk: 'Обліковий запис', ru: 'Аккаунт' },
  'settings.accountDescription': { en: 'Manage your account and booking preferences', uk: 'Керуйте обліковим записом та налаштуваннями бронювання', ru: 'Управляйте аккаунтом и настройками бронирования' },
  'settings.notifications': { en: 'Notifications', uk: 'Сповіщення', ru: 'Уведомления' },
  'settings.notificationsDescription': { en: 'Configure how you receive notifications', uk: 'Налаштуйте отримання сповіщень', ru: 'Настройте получение уведомлений' },
  'settings.privacy': { en: 'Privacy', uk: 'Конфіденційність', ru: 'Конфиденциальность' },
  'settings.privacyDescription': { en: 'Control your privacy and data sharing preferences', uk: 'Контролюйте конфіденційність та обмін даними', ru: 'Контролируйте конфиденциальность и обмен данными' },
  'settings.business': { en: 'Business', uk: 'Бізнес', ru: 'Бизнес' },
  'settings.businessDescription': { en: 'Configure your business and payment settings', uk: 'Налаштуйте бізнес та платіжні параметри', ru: 'Настройте бизнес и платежные параметры' },
  'settings.language': { en: 'Language & Currency', uk: 'Мова та валюта', ru: 'Язык и валюта' },
  'settings.languageDescription': { en: 'Set your preferred language and currency', uk: 'Встановіть бажану мову та валюту', ru: 'Установите предпочитаемый язык и валюту' },
  'settings.interfaceLanguage': { en: 'Interface Language', uk: 'Мова інтерфейсу', ru: 'Язык интерфейса' },
  'settings.currency': { en: 'Currency', uk: 'Валюта', ru: 'Валюта' },

  // Account Settings
  'settings.autoAcceptBookings': { en: 'Auto-accept bookings', uk: 'Автоматично приймати записи', ru: 'Автоматически принимать записи' },
  'settings.autoAcceptBookingsDesc': { en: 'Automatically accept booking requests without manual approval', uk: 'Автоматично приймати запити на запис без ручного підтвердження', ru: 'Автоматически принимать запросы на запись без ручного подтверждения' },
  'settings.allowInstantBookings': { en: 'Allow instant bookings', uk: 'Дозволити миттєві записи', ru: 'Разрешить мгновенные записи' },
  'settings.allowInstantBookingsDesc': { en: 'Allow customers to book immediately without waiting for approval', uk: 'Дозволити клієнтам записуватися негайно без очікування підтвердження', ru: 'Разрешить клиентам записываться немедленно без ожидания подтверждения' },
  'settings.requireVerification': { en: 'Require customer verification', uk: 'Вимагати верифікацію клієнтів', ru: 'Требовать верификацию клиентов' },
  'settings.requireVerificationDesc': { en: 'Only allow verified customers to book your services', uk: 'Дозволити лише верифікованим клієнтам записуватися на ваші послуги', ru: 'Разрешить только верифицированным клиентам записываться на ваши услуги' },
  'settings.showProfileInSearch': { en: 'Show profile in search', uk: 'Показувати профіль у пошуку', ru: 'Показывать профиль в поиске' },
  'settings.showProfileInSearchDesc': { en: 'Make your profile visible in search results', uk: 'Зробити ваш профіль видимим у результатах пошуку', ru: 'Сделать ваш профиль видимым в результатах поиска' },

  // Notification Settings
  'settings.emailNotifications': { en: 'Email notifications', uk: 'Email сповіщення', ru: 'Email уведомления' },
  'settings.emailNotificationsDesc': { en: 'Receive notifications via email', uk: 'Отримувати сповіщення електронною поштою', ru: 'Получать уведомления по электронной почте' },
  'settings.smsNotifications': { en: 'SMS notifications', uk: 'SMS сповіщення', ru: 'SMS уведомления' },
  'settings.smsNotificationsDesc': { en: 'Receive notifications via text message', uk: 'Отримувати сповіщення через SMS', ru: 'Получать уведомления через SMS' },
  'settings.pushNotifications': { en: 'Push notifications', uk: 'Push сповіщення', ru: 'Push уведомления' },
  'settings.pushNotificationsDesc': { en: 'Receive push notifications in your browser', uk: 'Отримувати push-сповіщення у браузері', ru: 'Получать push-уведомления в браузере' },
  'settings.newBookingAlert': { en: 'New booking alerts', uk: 'Сповіщення про нові записи', ru: 'Уведомления о новых записях' },
  'settings.newBookingAlertDesc': { en: 'Get notified when you receive a new booking', uk: 'Отримувати сповіщення про нові записи', ru: 'Получать уведомления о новых записях' },
  'settings.bookingReminders': { en: 'Booking reminders', uk: 'Нагадування про записи', ru: 'Напоминания о записях' },
  'settings.bookingRemindersDesc': { en: 'Receive reminders about upcoming appointments', uk: 'Отримувати нагадування про майбутні зустрічі', ru: 'Получать напоминания о предстоящих встречах' },

  // Privacy Settings
  'settings.showPhoneNumber': { en: 'Show phone number', uk: 'Показувати номер телефону', ru: 'Показывать номер телефона' },
  'settings.showPhoneNumberDesc': { en: 'Display your phone number on your public profile', uk: 'Відображати номер телефону у публічному профілі', ru: 'Отображать номер телефона в публичном профиле' },
  'settings.showEmail': { en: 'Show email address', uk: 'Показувати email адресу', ru: 'Показывать email адрес' },
  'settings.showEmailDesc': { en: 'Display your email address on your public profile', uk: 'Відображати email адресу у публічному профілі', ru: 'Отображать email адрес в публичном профиле' },
  'settings.allowDirectMessages': { en: 'Allow direct messages', uk: 'Дозволити прямі повідомлення', ru: 'Разрешить прямые сообщения' },
  'settings.allowDirectMessagesDesc': { en: 'Allow customers to send you direct messages', uk: 'Дозволити клієнтам надсилати прямі повідомлення', ru: 'Разрешить клиентам отправлять прямые сообщения' },
  'settings.dataProcessingConsent': { en: 'Data processing consent', uk: 'Згода на обробку даних', ru: 'Согласие на обработку данных' },
  'settings.dataProcessingConsentDesc': { en: 'Allow us to process your data for service improvements', uk: 'Дозволити обробку даних для покращення сервісу', ru: 'Разрешить обработку данных для улучшения сервиса' },

  // Business Settings
  'settings.acceptOnlinePayments': { en: 'Accept online payments', uk: 'Приймати онлайн платежі', ru: 'Принимать онлайн платежи' },
  'settings.acceptOnlinePaymentsDesc': { en: 'Allow customers to pay online through the platform', uk: 'Дозволити клієнтам платити онлайн через платформу', ru: 'Разрешить клиентам платить онлайн через платформу' },
  'settings.requireDeposit': { en: 'Require deposit', uk: 'Вимагати завдаток', ru: 'Требовать задаток' },
  'settings.requireDepositDesc': { en: 'Require customers to pay a deposit when booking', uk: 'Вимагати від клієнтів завдаток при бронюванні', ru: 'Требовать от клиентов задаток при бронировании' },
  'settings.cancellationWindow': { en: 'Cancellation window', uk: 'Вікно скасування', ru: 'Окно отмены' },
  'settings.cancellationWindowDesc': { en: 'How far in advance customers can cancel without penalty', uk: 'За скільки часу клієнти можуть скасувати без штрафу', ru: 'За сколько времени клиенты могут отменить без штрафа' },
  'settings.hours2': { en: '2 hours', uk: '2 години', ru: '2 часа' },
  'settings.hours6': { en: '6 hours', uk: '6 годин', ru: '6 часов' },
  'settings.hours12': { en: '12 hours', uk: '12 годин', ru: '12 часов' },
  'settings.hours24': { en: '24 hours', uk: '24 години', ru: '24 часа' },
  'settings.hours48': { en: '48 hours', uk: '48 годин', ru: '48 часов' },

  // Customer Navigation
  'customer.customerLabel': { en: 'Customer', uk: 'Клієнт', ru: 'Клиент' },
  'customer.online': { en: 'Online', uk: 'Онлайн', ru: 'Онлайн' },
  'customer.nav.dashboard': { en: 'Dashboard', uk: 'Головна', ru: 'Главная' },
  'customer.nav.searchServices': { en: 'Search Services', uk: 'Пошук послуг', ru: 'Поиск услуг' },
  'customer.nav.bookings': { en: 'Bookings', uk: 'Бронювання', ru: 'Бронирования' },
  'customer.nav.history': { en: 'History', uk: 'Історія', ru: 'История' },
  'customer.nav.favorites': { en: 'Favorites', uk: 'Улюблені', ru: 'Избранные' },
  'customer.nav.reviews': { en: 'Reviews', uk: 'Відгуки', ru: 'Отзывы' },
  'customer.nav.payments': { en: 'Payments', uk: 'Платежі', ru: 'Платежи' },
  'customer.nav.loyalty': { en: 'Loyalty Points', uk: 'Бали лояльності', ru: 'Баллы лояльности' },
  'customer.nav.profile': { en: 'Profile', uk: 'Профіль', ru: 'Профиль' },
  'customer.nav.help': { en: 'Help & Support', uk: 'Допомога та підтримка', ru: 'Помощь и поддержка' },
  
  // Admin Panel
  'admin.dashboard.title': { en: 'Admin Dashboard', uk: 'Панель адміністратора', ru: 'Панель администратора' },
  'admin.dashboard.subtitle': { en: 'Manage platform users, analytics, and system settings', uk: 'Керуйте користувачами платформи, аналітикою та системними налаштуваннями', ru: 'Управляйте пользователями платформы, аналитикой и системными настройками' },

  // Specialist Profile Page
  'specialistProfile.completedJobs': { en: 'Completed Jobs', uk: 'Виконано робіт', ru: 'Выполнено работ' },
  'specialistProfile.yearsExperience': { en: 'Years Experience', uk: 'Років досвіду', ru: 'Лет опыта' },
  'specialistProfile.status': { en: 'Status', uk: 'Статус', ru: 'Статус' },
  'specialistProfile.online': { en: 'Online', uk: 'Онлайн', ru: 'Онлайн' },
  'specialistProfile.offline': { en: 'Offline', uk: 'Офлайн', ru: 'Офлайн' },
  'specialistProfile.specialization': { en: 'Specialization:', uk: 'Спеціалізація:', ru: 'Специализация:' },
  'specialistProfile.services': { en: 'Services', uk: 'Послуги', ru: 'Услуги' },
  'specialistProfile.reviews': { en: 'Reviews', uk: 'Відгуки', ru: 'Отзывы' },
  'specialistProfile.bookService': { en: 'Book Service', uk: 'Записатися', ru: 'Записаться' },
  'specialistProfile.bookConsultation': { en: 'Book Consultation', uk: 'Записатися на консультацію', ru: 'Записаться на консультацию' },
  'specialistProfile.sendMessage': { en: 'Send Message', uk: 'Написати повідомлення', ru: 'Написать сообщение' },
  'specialistProfile.responseTime': { en: 'Response time:', uk: 'Час відповіді:', ru: 'Время отклика:' },
  'specialistProfile.experience': { en: 'Work experience:', uk: 'Досвід роботи:', ru: 'Опыт работы:' },
  'specialistProfile.fromPrice': { en: 'from', uk: 'від', ru: 'от' },
  'specialistProfile.forConsultation': { en: 'per consultation', uk: 'за консультацію', ru: 'за консультацию' },
  'specialistProfile.respondsIn': { en: 'Responds in', uk: 'Відповідає за', ru: 'Отвечает за' },
  'specialistProfile.minutes': { en: 'min', uk: 'хв', ru: 'мин' },
  'specialistProfile.years': { en: 'years', uk: 'років', ru: 'лет' },
  'specialistProfile.outOf5': { en: 'out of 5', uk: 'із 5', ru: 'из 5' },
  'specialistProfile.individualConsultation': { en: 'Individual Consultation', uk: 'Індивідуальна консультація', ru: 'Индивидуальная консультация' },
  'specialistProfile.personalConsultation60min': { en: 'Personal consultation lasting 60 minutes', uk: 'Персональна консультація тривалістю 60 хвилин', ru: 'Персональная консультация продолжительностью 60 минут' },
  'specialistProfile.expressConsultation': { en: 'Express Consultation', uk: 'Експрес-консультація', ru: 'Экспресс-консультация' },
  'specialistProfile.shortTermConsultation': { en: 'Short-term consultation for specific issues', uk: 'Короткострокова консультація для вирішення конкретних питань', ru: 'Краткосрочная консультация для решения конкретных вопросов' },
  'specialistProfile.familyConsultation': { en: 'Family Consultation', uk: 'Сімейна консультація', ru: 'Семейная консультация' },
  'specialistProfile.familyConsultation90min': { en: 'Consultation for couples and families lasting 90 minutes', uk: 'Консультація для пар та сімей тривалістю 90 хвилин', ru: 'Консультация для пар и семей продолжительностью 90 минут' },

  // Booking Flow
  'booking.individualPsychConsultation': { en: 'Individual Psychological Consultation', uk: 'Індивідуальна психологічна консультація', ru: 'Индивидуальная психологическая консультация' },
  'booking.professionalPsychSupport': { en: 'Professional psychological support and counseling', uk: 'Професійна психологічна підтримка та консультування', ru: 'Профессиональная психологическая поддержка и консультирование' },
  'booking.step.dateTime': { en: 'Date & Time', uk: 'Дата та час', ru: 'Дата и время' },
  'booking.step.details': { en: 'Details', uk: 'Деталі', ru: 'Детали' },
  'booking.step.payment': { en: 'Payment', uk: 'Оплата', ru: 'Оплата' },
  'booking.step.confirmation': { en: 'Confirmation', uk: 'Підтвердження', ru: 'Подтверждение' },
  'booking.videoCall': { en: 'Video call', uk: 'Відеозв\'язок', ru: 'Видеозвонок' },
  'booking.additionalNotes': { en: 'Additional notes (optional)', uk: 'Додаткові примітки (необов\'язково)', ru: 'Дополнительные заметки (необязательно)' },
  'booking.online': { en: 'Online', uk: 'Онлайн', ru: 'Онлайн' },
  'booking.offline': { en: 'Offline', uk: 'Офлайн', ru: 'Офлайн' },
  'booking.confirmBooking': { en: 'Confirm Booking', uk: 'Підтвердити бронювання', ru: 'Подтвердить бронирование' },
  'booking.next': { en: 'Next', uk: 'Далі', ru: 'Далее' },
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem('booking-language');
    return (stored === 'uk' || stored === 'en' || stored === 'ru') ? stored : 'uk';
  });

  const t = useCallback((key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[language] || translation.en || key;
  }, [language]);

  const handleSetLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('booking-language', lang);
  }, []);

  const value = useMemo(() => ({
    language,
    setLanguage: handleSetLanguage,
    t
  }), [language, handleSetLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};