import { LocalizedText, Language } from '../types';

export type MessageKey =
  | 'welcome.new_user'
  | 'welcome.returning_user'
  | 'main_menu.welcome'
  | 'main_menu.browse_services'
  | 'main_menu.my_bookings'
  | 'main_menu.my_profile'
  | 'main_menu.help_support'
  | 'categories.choose'
  | 'categories.hair_beauty'
  | 'categories.massage_spa'
  | 'categories.fitness_training'
  | 'categories.beauty_nails'
  | 'categories.tattoo_piercing'
  | 'categories.therapy_wellness'
  | 'buttons.back'
  | 'buttons.main_menu'
  | 'buttons.cancel'
  | 'buttons.book_now'
  | 'buttons.call'
  | 'buttons.message'
  | 'buttons.view_portfolio'
  | 'specialist.verified'
  | 'specialist.online'
  | 'specialist.reviews'
  | 'specialist.not_found'
  | 'specialist.call_info'
  | 'specialist.message_info'
  | 'specialist.portfolio'
  | 'booking.confirmed'
  | 'booking.cancelled'
  | 'booking.pending'
  | 'booking.select_date'
  | 'booking.select_time'
  | 'booking.notes_added'
  | 'booking.invalid_step'
  | 'booking.start_intent'
  | 'bookings.view_all'
  | 'bookings.create_new'
  | 'bookings.search'
  | 'bookings.specialists'
  | 'bookings.create_first'
  | 'services.browse'
  | 'services.browse_title'
  | 'specialists.search'
  | 'specialists.nearby'
  | 'search.prompt'
  | 'search.placeholder'
  | 'earnings.analytics'
  | 'earnings.payout'
  | 'analytics.detailed'
  | 'analytics.export'
  | 'settings.main'
  | 'settings.change_language'
  | 'settings.notification_preferences'
  | 'settings.language_changed'
  | 'profile.title'
  | 'profile.name'
  | 'profile.email'
  | 'profile.phone'
  | 'profile.language'
  | 'profile.member_since'
  | 'profile.edit'
  | 'profile.not_found'
  | 'profile.phone_updated'
  | 'profile.name_updated'
  | 'profile.email_updated'
  | 'profile.invalid_email'
  | 'profile.edit_invalid_step'
  | 'location.request'
  | 'location.share_button'
  | 'location.not_requested'
  | 'flow.unknown'
  | 'actions.cancelled'
  | 'support.message_received'
  | 'help.main'
  | 'errors.network'
  | 'errors.not_found'
  | 'errors.general'
  | 'loading.specialists'
  | 'loading.booking'
  | 'loading.payment';

export const messages: Record<MessageKey, LocalizedText> = {
  // Welcome messages
  'welcome.new_user': {
    uk: '🎉 Ласкаво просимо до BookingBot, {firstName}!\n\nВаш обліковий запис створено і ви можете:\n• 📅 Переглядати та бронювати послуги\n• 🔍 Знаходити спеціалістів поруч\n• ⭐ Залишати відгуки та оцінки\n• 🎁 Заробляти бали лояльності\n\nРозпочнемо!',
    ru: '🎉 Добро пожаловать в BookingBot, {firstName}!\n\nВаш аккаунт создан и вы можете:\n• 📅 Просматривать и бронировать услуги\n• 🔍 Находить специалистов рядом\n• ⭐ Оставлять отзывы и оценки\n• 🎁 Зарабатывать баллы лояльности\n\nДавайте начнем!',
    en: '🎉 Welcome to BookingBot, {firstName}!\n\nYour account has been created and you can now:\n• 📅 Browse and book services\n• 🔍 Find specialists near you\n• ⭐ Leave reviews and ratings\n• 🎁 Earn loyalty points\n\nLet\'s get started!',
    km: '🎉 សូមស្វាគមន៍មកកាន់ BookingBot, {firstName}!\n\nគណនីរបស់អ្នកត្រូវបានបង្កើត ហើយអ្នកអាច:\n• 📅 រកមើល និងកក់សេវាកម្ម\n• 🔍 ស្វែងរកអ្នកជំនាញនៅជិតអ្នក\n• ⭐ ផ្ដល់មតិយោបល់ និងវាយតម្លៃ\n• 🎁 រកពិន្ទុភក្ដីភាព\n\nតោះចាប់ផ្ដើម!'
  },

  'welcome.returning_user': {
    uk: 'З поверненням, {firstName}! 👋\n\nЩо ви хочете зробити сьогодні?',
    ru: 'С возвращением, {firstName}! 👋\n\nЧто вы хотите сделать сегодня?',
    en: 'Welcome back, {firstName}! 👋\n\nWhat would you like to do today?',
    km: 'សូមស្វាគមន៍ការត្រឡប់មកវិញ, {firstName}! 👋\n\nតើអ្នកចង់ធ្វើអ្វីថ្ងៃនេះ?'
  },

  // Main menu
  'main_menu.browse_services': {
    uk: '🔍 Переглянути послуги',
    ru: '🔍 Просмотреть услуги',
    en: '🔍 Browse Services',
    km: '🔍 រកមើលសេវាកម្ម'
  },

  'main_menu.my_bookings': {
    uk: '📅 Мої записи',
    ru: '📅 Мои записи',
    en: '📅 My Bookings',
    km: '📅 ការកក់របស់ខ្ញុំ'
  },

  'main_menu.my_profile': {
    uk: '👤 Мій профіль',
    ru: '👤 Мой профиль',
    en: '👤 My Profile',
    km: '👤 ប្រវត្តិរូបរបស់ខ្ញុំ'
  },

  'main_menu.help_support': {
    uk: '❓ Довідка та підтримка',
    ru: '❓ Справка и поддержка',
    en: '❓ Help & Support',
    km: '❓ ជំនួយ និងគាំទ្រ'
  },

  // Categories
  'categories.hair_beauty': {
    uk: '✂️ Перукарські послуги',
    ru: '✂️ Парикмахерские услуги',
    en: '✂️ Hair & Beauty',
    km: '✂️ សក់ និងសម្រស់'
  },

  'categories.massage_spa': {
    uk: '💆‍♀️ Масаж та СПА',
    ru: '💆‍♀️ Массаж и СПА',
    en: '💆‍♀️ Massage & Spa',
    km: '💆‍♀️ ម៉ាស្សា និងស្ប៉ា'
  },

  'categories.fitness_training': {
    uk: '🏋️‍♂️ Фітнес та тренування',
    ru: '🏋️‍♂️ Фитнес и тренировки',
    en: '🏋️‍♂️ Fitness & Training',
    km: '🏋️‍♂️ កីឡា និងហ្វឹកហ្វឺន'
  },

  'categories.beauty_nails': {
    uk: '💅 Краса та манікюр',
    ru: '💅 Красота и маникюр',
    en: '💅 Beauty & Nails',
    km: '💅 សម្រស់ និងក្រចក'
  },

  'categories.tattoo_piercing': {
    uk: '🎨 Тату та пірсинг',
    ru: '🎨 Тату и пирсинг',
    en: '🎨 Tattoo & Piercing',
    km: '🎨 សាក់ និងចាក់រន្ធ'
  },

  'categories.therapy_wellness': {
    uk: '🧘‍♀️ Терапія та велнес',
    ru: '🧘‍♀️ Терапия и велнес',
    en: '🧘‍♀️ Therapy & Wellness',
    km: '🧘‍♀️ ព្យាបាល និងសុខភាព'
  },

  // Buttons
  'buttons.back': {
    uk: '🔙 Назад',
    ru: '🔙 Назад',
    en: '🔙 Back',
    km: '🔙 ថយក្រោយ'
  },

  'buttons.main_menu': {
    uk: '🏠 Головне меню',
    ru: '🏠 Главное меню',
    en: '🏠 Main Menu',
    km: '🏠 ម៉ឺនុយដើម'
  },

  'buttons.cancel': {
    uk: '❌ Скасувати',
    ru: '❌ Отменить',
    en: '❌ Cancel',
    km: '❌ បោះបង់'
  },

  'buttons.book_now': {
    uk: '📅 Записатися',
    ru: '📅 Записаться',
    en: '📅 Book Now',
    km: '📅 កក់ឥឡូវ'
  },

  'buttons.call': {
    uk: '📞 Зателефонувати',
    ru: '📞 Позвонить',
    en: '📞 Call',
    km: '📞 ហៅទូរសព្ទ'
  },

  'buttons.message': {
    uk: '💬 Написати',
    ru: '💬 Написать',
    en: '💬 Message',
    km: '💬 ផ្ញើសារ'
  },

  'buttons.view_portfolio': {
    uk: '🌐 Переглянути роботи',
    ru: '🌐 Посмотреть работы',
    en: '🌐 View Portfolio',
    km: '🌐 មើលស្នាដៃ'
  },

  // Specialist info
  'specialist.verified': {
    uk: '🏆 Підтверджений спеціаліст',
    ru: '🏆 Подтвержденный специалист',
    en: '🏆 Verified Specialist',
    km: '🏆 អ្នកជំនាញដែលបានផ្ទៀងផ្ទាត់'
  },

  'specialist.online': {
    uk: '🟢 Онлайн',
    ru: '🟢 Онлайн',
    en: '🟢 Online',
    km: '🟢 អនឡាញ'
  },

  'specialist.reviews': {
    uk: 'відгуків',
    ru: 'отзывов',
    en: 'reviews',
    km: 'មតិយោបល់'
  },

  // Booking statuses
  'booking.confirmed': {
    uk: '✅ Підтверджено',
    ru: '✅ Подтверждено',
    en: '✅ Confirmed',
    km: '✅ បានបញ្ជាក់'
  },

  'booking.cancelled': {
    uk: '❌ Скасовано',
    ru: '❌ Отменено',
    en: '❌ Cancelled',
    km: '❌ បានបោះបង់'
  },

  'booking.pending': {
    uk: '⏳ Очікує підтвердження',
    ru: '⏳ Ожидает подтверждения',
    en: '⏳ Pending Confirmation',
    km: '⏳ រង់ចាំការបញ្ជាក់'
  },

  // Error messages
  'errors.network': {
    uk: '⚠️ Помилка з\'єднання\n\nВибачте, у мене проблеми з підключенням до серверів.\n\nСпробуйте ще раз через хвилину.',
    ru: '⚠️ Ошибка соединения\n\nИзвините, у меня проблемы с подключением к серверам.\n\nПопробуйте еще раз через минуту.',
    en: '⚠️ Connection Error\n\nSorry, I\'m having trouble connecting to our servers.\n\nPlease try again in a moment.',
    km: '⚠️ កំហុសក្នុងការតភ្ជាប់\n\nសូមអភ័យទោស មានបញ្ហាក្នុងការតភ្ជាប់ទៅម៉ាស៊ីនមេរបស់យើង។\n\nសូមព្យាយាមម្ដងទៀតក្នុងពេលបន្តិច។'
  },

  'errors.not_found': {
    uk: '❌ Не знайдено\n\nЗапитаний ресурс не існує або був видалений.',
    ru: '❌ Не найдено\n\nЗапрашиваемый ресурс не существует или был удален.',
    en: '❌ Not Found\n\nThe requested resource doesn\'t exist or has been removed.',
    km: '❌ រកមិនឃើញ\n\nធនធានដែលស្នើសុំមិនមាន ឬត្រូវបានលុបចេញ។'
  },

  'errors.general': {
    uk: '❌ Щось пішло не так\n\nСпробуйте ще раз або зверніться до підтримки.',
    ru: '❌ Что-то пошло не так\n\nПопробуйте еще раз или обратитесь в поддержку.',
    en: '❌ Something went wrong\n\nPlease try again or contact support.',
    km: '❌ មានអ្វីមួយមិនប្រក្រតី\n\nសូមព្យាយាមម្ដងទៀត ឬទាក់ទងផ្នែកគាំទ្រ។'
  },

  // Loading messages
  'loading.specialists': {
    uk: '🔍 Шукаю спеціалістів...',
    ru: '🔍 Ищу специалистов...',
    en: '🔍 Searching for specialists...',
    km: '🔍 កំពុងស្វែងរកអ្នកជំនាញ...'
  },

  'loading.booking': {
    uk: '📅 Обробляю бронювання...',
    ru: '📅 Обрабатываю бронирование...',
    en: '📅 Processing booking...',
    km: '📅 កំពុងដំណើរការការកក់...'
  },

  'loading.payment': {
    uk: '💳 Обробляю платіж...\nЦе може зайняти кілька хвилин.',
    ru: '💳 Обрабатываю платеж...\nЭто может занять несколько минут.',
    en: '💳 Processing payment...\nThis may take a few moments.',
    km: '💳 កំពុងដំណើរការការទូទាត់...\nអាចចំណាយពេលបន្តិច។'
  },

  // Additional messages
  'main_menu.welcome': {
    uk: '🏠 Головне меню\n\nОберіть дію:',
    ru: '🏠 Главное меню\n\nВыберите действие:',
    en: '🏠 Main Menu\n\nChoose an action:',
    km: '🏠 ម៉ឺនុយដើម\n\nជ្រើសរើសសកម្មភាព:'
  },

  'categories.choose': {
    uk: '🔍 Оберіть категорію послуг:',
    ru: '🔍 Выберите категорию услуг:',
    en: '🔍 Choose a service category:',
    km: '🔍 ជ្រើសរើសប្រភេទសេវាកម្ម:'
  },

  'specialist.not_found': {
    uk: '❌ Спеціаліста не знайдено',
    ru: '❌ Специалист не найден',
    en: '❌ Specialist not found',
    km: '❌ រកមិនឃើញអ្នកជំនាញ'
  },

  'specialist.call_info': {
    uk: '📞 Контактна інформація\n\nДля дзвінка спеціалісту використовуйте контактні дані в його профілі або зверніться через платформу.',
    ru: '📞 Контактная информация\n\nДля звонка специалисту используйте контактные данные в его профиле или обратитесь через платформу.',
    en: '📞 Contact Information\n\nTo call the specialist, use the contact details in their profile or reach out through the platform.',
    km: '📞 ព័ត៌មានទំនាក់ទំនង\n\nដើម្បីហៅទូរសព្ទទៅអ្នកជំនាញ សូមប្រើព័ត៌មានទំនាក់ទំនងនៅក្នុងប្រវត្តិរូបរបស់គាត់ ឬទាក់ទងតាមវេទិកា។'
  },

  'specialist.message_info': {
    uk: '💬 Написати повідомлення\n\nВи можете написати спеціалісту через внутрішню систему повідомлень платформи.',
    ru: '💬 Написать сообщение\n\nВы можете написать специалисту через внутреннюю систему сообщений платформы.',
    en: '💬 Send Message\n\nYou can message the specialist through the platform\'s internal messaging system.',
    km: '💬 ផ្ញើសារ\n\nអ្នកអាចផ្ញើសារទៅអ្នកជំនាញតាមរយៈប្រព័ន្ធផ្ញើសារខាងក្នុងរបស់វេទិកា។'
  },

  'specialist.portfolio': {
    uk: '🌐 Портфоліо\n\nПереглянути роботи спеціаліста можна на веб-сайті платформи.',
    ru: '🌐 Портфолио\n\nПросмотреть работы специалиста можно на веб-сайте платформы.',
    en: '🌐 Portfolio\n\nYou can view the specialist\'s work on the platform website.',
    km: '🌐 ស្នាដៃ\n\nអ្នកអាចមើលស្នាដៃរបស់អ្នកជំនាញនៅលើគេហទំព័ររបស់វេទិកា។'
  },

  'booking.select_date': {
    uk: '📅 Оберіть дату для запису:',
    ru: '📅 Выберите дату для записи:',
    en: '📅 Select a date for your appointment:',
    km: '📅 ជ្រើសរើសកាលបរិច្ឆេទសម្រាប់ការណាត់ជួបរបស់អ្នក:'
  },

  'booking.select_time': {
    uk: '🕐 Оберіть час для запису:',
    ru: '🕐 Выберите время для записи:',
    en: '🕐 Select a time for your appointment:',
    km: '🕐 ជ្រើសរើសម៉ោងសម្រាប់ការណាត់ជួបរបស់អ្នក:'
  },

  'booking.notes_added': {
    uk: '📝 Примітки додано до вашого бронювання.',
    ru: '📝 Примечания добавлены к вашему бронированию.',
    en: '📝 Notes added to your booking.',
    km: '📝 បានបន្ថែមកំណត់ចំណាំទៅក្នុងការកក់របស់អ្នក។'
  },

  'booking.invalid_step': {
    uk: '❌ Невірний крок бронювання. Почніть спочатку.',
    ru: '❌ Неверный шаг бронирования. Начните сначала.',
    en: '❌ Invalid booking step. Please start over.',
    km: '❌ ជំហានកក់មិនត្រឹមត្រូវ។ សូមចាប់ផ្ដើមឡើងវិញ។'
  },

  'booking.start_intent': {
    uk: '📅 Давайте почнемо бронювання!\n\nОберіть категорію послуг:',
    ru: '📅 Давайте начнем бронирование!\n\nВыберите категорию услуг:',
    en: '📅 Let\'s start booking!\n\nChoose a service category:',
    km: '📅 តោះចាប់ផ្ដើមកក់!\n\nជ្រើសរើសប្រភេទសេវាកម្ម:'
  },

  'settings.main': {
    uk: '⚙️ Налаштування\n\nОберіть опцію:',
    ru: '⚙️ Настройки\n\nВыберите опцию:',
    en: '⚙️ Settings\n\nChoose an option:',
    km: '⚙️ ការកំណត់\n\nជ្រើសរើសជម្រើស:'
  },

  'settings.change_language': {
    uk: '🌍 Змінити мову',
    ru: '🌍 Изменить язык',
    en: '🌍 Change Language',
    km: '🌍 ប្ដូរភាសា'
  },

  'settings.notification_preferences': {
    uk: '🔔 Налаштування сповіщень',
    ru: '🔔 Настройки уведомлений',
    en: '🔔 Notification Preferences',
    km: '🔔 ការកំណត់ការជូនដំណឹង'
  },

  'settings.language_changed': {
    uk: '✅ Мову змінено успішно!',
    ru: '✅ Язык успешно изменен!',
    en: '✅ Language changed successfully!',
    km: '✅ បានប្ដូរភាសាដោយជោគជ័យ!'
  },

  'profile.title': {
    uk: 'Профіль користувача',
    ru: 'Профиль пользователя',
    en: 'User Profile',
    km: 'ប្រវត្តិរូបអ្នកប្រើ'
  },

  'profile.name': {
    uk: 'Ім\'я',
    ru: 'Имя',
    en: 'Name',
    km: 'ឈ្មោះ'
  },

  'profile.email': {
    uk: 'Email',
    ru: 'Email',
    en: 'Email',
    km: 'អ៊ីមែល'
  },

  'profile.phone': {
    uk: 'Телефон',
    ru: 'Телефон',
    en: 'Phone',
    km: 'ទូរសព្ទ'
  },

  'profile.language': {
    uk: 'Мова',
    ru: 'Язык',
    en: 'Language',
    km: 'ភាសា'
  },

  'profile.member_since': {
    uk: 'Учасник з',
    ru: 'Участник с',
    en: 'Member since',
    km: 'សមាជិកតាំងពី'
  },

  'profile.edit': {
    uk: '✏️ Редагувати профіль',
    ru: '✏️ Редактировать профиль',
    en: '✏️ Edit Profile',
    km: '✏️ កែសម្រួលប្រវត្តិរូប'
  },

  'profile.not_found': {
    uk: '❌ Профіль не знайдено',
    ru: '❌ Профиль не найден',
    en: '❌ Profile not found',
    km: '❌ រកមិនឃើញប្រវត្តិរូប'
  },

  'profile.phone_updated': {
    uk: '✅ Номер телефону оновлено',
    ru: '✅ Номер телефона обновлен',
    en: '✅ Phone number updated',
    km: '✅ បានធ្វើបច្ចុប្បន្នភាពលេខទូរសព្ទ'
  },

  'profile.name_updated': {
    uk: '✅ Ім\'я оновлено',
    ru: '✅ Имя обновлено',
    en: '✅ Name updated',
    km: '✅ បានធ្វើបច្ចុប្បន្នភាពឈ្មោះ'
  },

  'profile.email_updated': {
    uk: '✅ Email оновлено',
    ru: '✅ Email обновлен',
    en: '✅ Email updated',
    km: '✅ បានធ្វើបច្ចុប្បន្នភាពអ៊ីមែល'
  },

  'profile.invalid_email': {
    uk: '❌ Невірний формат email',
    ru: '❌ Неверный формат email',
    en: '❌ Invalid email format',
    km: '❌ ទម្រង់អ៊ីមែលមិនត្រឹមត្រូវ'
  },

  'profile.edit_invalid_step': {
    uk: '❌ Невірний крок редагування',
    ru: '❌ Неверный шаг редактирования',
    en: '❌ Invalid edit step',
    km: '❌ ជំហានកែសម្រួលមិនត្រឹមត្រូវ'
  },

  'location.request': {
    uk: '📍 Поділіться своїм місцезнаходженням, щоб знайти найближчих спеціалістів.',
    ru: '📍 Поделитесь своим местоположением, чтобы найти ближайших специалистов.',
    en: '📍 Share your location to find nearby specialists.',
    km: '📍 ចែករំលែកទីតាំងរបស់អ្នកដើម្បីស្វែងរកអ្នកជំនាញនៅជិត។'
  },

  'location.share_button': {
    uk: '📍 Поділитися місцезнаходженням',
    ru: '📍 Поделиться местоположением',
    en: '📍 Share Location',
    km: '📍 ចែករំលែកទីតាំង'
  },

  'location.not_requested': {
    uk: '❌ Місцезнаходження не запитувалося',
    ru: '❌ Местоположение не запрашивалось',
    en: '❌ Location was not requested',
    km: '❌ មិនបានស្នើសុំទីតាំង'
  },

  'flow.unknown': {
    uk: '❌ Невідомий процес. Повертаємо до головного меню.',
    ru: '❌ Неизвестный процесс. Возвращаемся в главное меню.',
    en: '❌ Unknown flow. Returning to main menu.',
    km: '❌ ដំណើរការមិនស្គាល់។ កំពុងត្រឡប់ទៅម៉ឺនុយដើម។'
  },

  'actions.cancelled': {
    uk: '❌ Дію скасовано',
    ru: '❌ Действие отменено',
    en: '❌ Action cancelled',
    km: '❌ បានបោះបង់សកម្មភាព'
  },

  'support.message_received': {
    uk: '📧 Ваше повідомлення отримано!\n\nНаша команда підтримки зв\'яжеться з вами найближчим часом.',
    ru: '📧 Ваше сообщение получено!\n\nНаша команда поддержки свяжется с вами в ближайшее время.',
    en: '📧 Your message has been received!\n\nOur support team will contact you shortly.',
    km: '📧 សាររបស់អ្នកត្រូវបានទទួល!\n\nក្រុមគាំទ្ររបស់យើងនឹងទាក់ទងអ្នកក្នុងពេលឆាប់ៗ។'
  },

  'help.main': {
    uk: '❓ Довідка\n\n🔍 /start - Почати роботу з ботом\n📅 /bookings - Мої записи\n👤 /profile - Мій профіль\n⚙️ /settings - Налаштування\n📍 /location - Поділитися місцезнаходженням\n❌ /cancel - Скасувати поточну дію\n\nДля додаткової допомоги зверніться до підтримки.',
    ru: '❓ Справка\n\n🔍 /start - Начать работу с ботом\n📅 /bookings - Мои записи\n👤 /profile - Мой профиль\n⚙️ /settings - Настройки\n📍 /location - Поделиться местоположением\n❌ /cancel - Отменить текущее действие\n\nДля дополнительной помощи обратитесь в поддержку.',
    en: '❓ Help\n\n🔍 /start - Start using the bot\n📅 /bookings - My bookings\n👤 /profile - My profile\n⚙️ /settings - Settings\n📍 /location - Share location\n❌ /cancel - Cancel current action\n\nFor additional help, contact support.',
    km: '❓ ជំនួយ\n\n🔍 /start - ចាប់ផ្ដើមប្រើបូត\n📅 /bookings - ការកក់របស់ខ្ញុំ\n👤 /profile - ប្រវត្តិរូបរបស់ខ្ញុំ\n⚙️ /settings - ការកំណត់\n📍 /location - ចែករំលែកទីតាំង\n❌ /cancel - បោះបង់សកម្មភាពបច្ចុប្បន្ន\n\nសម្រាប់ជំនួយបន្ថែម សូមទាក់ទងផ្នែកគាំទ្រ។'
  },

  // Bookings
  'bookings.view_all': {
    uk: 'Переглянути всі',
    ru: 'Посмотреть все',
    en: 'View All',
    km: 'មើលទាំងអស់'
  },

  'bookings.create_new': {
    uk: 'Створити новий',
    ru: 'Создать новый',
    en: 'Create New',
    km: 'បង្កើតថ្មី'
  },

  'bookings.search': {
    uk: 'Пошук',
    ru: 'Поиск',
    en: 'Search',
    km: 'ស្វែងរក'
  },

  'bookings.specialists': {
    uk: 'Спеціалісти',
    ru: 'Специалисты',
    en: 'Specialists',
    km: 'អ្នកជំនាញ'
  },

  'bookings.create_first': {
    uk: 'Створити перший запис',
    ru: 'Создать первую запись',
    en: 'Create First Booking',
    km: 'បង្កើតការកក់ដំបូង'
  },

  // Services
  'services.browse': {
    uk: 'Переглянути послуги',
    ru: 'Просмотреть услуги',
    en: 'Browse Services',
    km: 'រកមើលសេវាកម្ម'
  },

  'services.browse_title': {
    uk: '🔍 Перегляд послуг\n\nОберіть категорію:',
    ru: '🔍 Просмотр услуг\n\nВыберите категорию:',
    en: '🔍 Browse Services\n\nChoose a category:',
    km: '🔍 រកមើលសេវាកម្ម\n\nជ្រើសរើសប្រភេទ:'
  },

  // Specialists
  'specialists.search': {
    uk: 'Пошук спеціалістів',
    ru: 'Поиск специалистов',
    en: 'Search Specialists',
    km: 'ស្វែងរកអ្នកជំនាញ'
  },

  'specialists.nearby': {
    uk: 'Поблизу мене',
    ru: 'Рядом со мной',
    en: 'Nearby',
    km: 'នៅជិត'
  },

  // Search
  'search.prompt': {
    uk: '🔍 Пошук послуг\n\nВведіть назву послуги або ключове слово:',
    ru: '🔍 Поиск услуг\n\nВведите название услуги или ключевое слово:',
    en: '🔍 Search Services\n\nEnter service name or keyword:',
    km: '🔍 ស្វែងរកសេវាកម្ម\n\nបញ្ចូលឈ្មោះសេវាកម្ម ឬពាក្យគន្លឹះ:'
  },

  'search.placeholder': {
    uk: 'Введіть назву послуги...',
    ru: 'Введите название услуги...',
    en: 'Enter service name...',
    km: 'បញ្ចូលឈ្មោះសេវាកម្ម...'
  },

  // Earnings
  'earnings.analytics': {
    uk: 'Аналітика',
    ru: 'Аналитика',
    en: 'Analytics',
    km: 'ការវិភាគ'
  },

  'earnings.payout': {
    uk: 'Запит виплати',
    ru: 'Запрос выплаты',
    en: 'Request Payout',
    km: 'ស្នើសុំការដកប្រាក់'
  },

  // Analytics
  'analytics.detailed': {
    uk: 'Детальна аналітика',
    ru: 'Детальная аналитика',
    en: 'Detailed Analytics',
    km: 'ការវិភាគលម្អិត'
  },

  'analytics.export': {
    uk: 'Експорт звіту',
    ru: 'Экспорт отчета',
    en: 'Export Report',
    km: 'នាំចេញរបាយការណ៍'
  }
};

export function getMessage(key: MessageKey, language: Language, params?: Record<string, string>): string {
  let message = messages[key]?.[language] || messages[key]?.en || key;

  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      message = message.replace(new RegExp(`{${param}}`, 'g'), value);
    });
  }

  return message;
}

export function getLanguageFromCode(languageCode?: string): Language {
  if (!languageCode) return 'km';

  const code = languageCode.toLowerCase();
  if (code.startsWith('km') || code.startsWith('kh')) return 'km';
  if (code.startsWith('uk')) return 'uk';
  if (code.startsWith('ru')) return 'ru';
  return 'en';
}
