export interface Profession {
  id: string;
  nameEn: string;
  nameUk: string;
  nameRu: string;
  category: string;
  specializations?: string[];
}

export const PROFESSIONS: Profession[] = [
  // Beauty & Wellness Professionals
  { id: 'hairstylist', nameEn: 'Hair Stylist', nameUk: 'Перукар-стиліст', nameRu: 'Парикмахер-стилист', category: 'beauty-wellness' },
  { id: 'hair-colorist', nameEn: 'Hair Colorist', nameUk: 'Колорист', nameRu: 'Колорист', category: 'beauty-wellness' },
  { id: 'barber', nameEn: 'Barber', nameUk: 'Барбер', nameRu: 'Барбер', category: 'beauty-wellness' },
  { id: 'nail-technician', nameEn: 'Nail Technician', nameUk: 'Майстер манікюру', nameRu: 'Мастер маникюра', category: 'beauty-wellness' },
  { id: 'esthetician', nameEn: 'Esthetician', nameUk: 'Косметолог', nameRu: 'Косметолог', category: 'beauty-wellness' },
  { id: 'massage-therapist', nameEn: 'Massage Therapist', nameUk: 'Масажист', nameRu: 'Массажист', category: 'beauty-wellness' },
  { id: 'makeup-artist', nameEn: 'Makeup Artist', nameUk: 'Візажист', nameRu: 'Визажист', category: 'beauty-wellness' },
  { id: 'lash-technician', nameEn: 'Lash Technician', nameUk: 'Майстер з нарощування вій', nameRu: 'Мастер по наращиванию ресниц', category: 'beauty-wellness' },
  { id: 'brow-specialist', nameEn: 'Brow Specialist', nameUk: 'Майстер з брів', nameRu: 'Мастер по бровям', category: 'beauty-wellness' },
  { id: 'spa-therapist', nameEn: 'SPA Therapist', nameUk: 'СПА-терапевт', nameRu: 'СПА-терапевт', category: 'beauty-wellness' },
  { id: 'tattoo-artist', nameEn: 'Tattoo Artist', nameUk: 'Тату-майстер', nameRu: 'Тату-мастер', category: 'beauty-wellness' },
  { id: 'permanent-makeup-artist', nameEn: 'Permanent Makeup Artist', nameUk: 'Майстер перманентного макіяжу', nameRu: 'Мастер перманентного макияжа', category: 'beauty-wellness' },

  // Health & Medical Professionals
  { id: 'general-practitioner', nameEn: 'General Practitioner', nameUk: 'Лікар загальної практики', nameRu: 'Врач общей практики', category: 'health-medical' },
  { id: 'dentist', nameEn: 'Dentist', nameUk: 'Стоматолог', nameRu: 'Стоматолог', category: 'health-medical' },
  { id: 'psychologist', nameEn: 'Psychologist', nameUk: 'Психолог', nameRu: 'Психолог', category: 'health-medical' },
  { id: 'psychiatrist', nameEn: 'Psychiatrist', nameUk: 'Психіатр', nameRu: 'Психиатр', category: 'health-medical' },
  { id: 'physiotherapist', nameEn: 'Physiotherapist', nameUk: 'Фізіотерапевт', nameRu: 'Физиотерапевт', category: 'health-medical' },
  { id: 'chiropractor', nameEn: 'Chiropractor', nameUk: 'Хіропрактик', nameRu: 'Хиропрактик', category: 'health-medical' },
  { id: 'nutritionist', nameEn: 'Nutritionist', nameUk: 'Дієтолог', nameRu: 'Диетолог', category: 'health-medical' },
  { id: 'dietitian', nameEn: 'Dietitian', nameUk: 'Дієтолог', nameRu: 'Диетолог', category: 'health-medical' },
  { id: 'therapist', nameEn: 'Therapist', nameUk: 'Терапевт', nameRu: 'Терапевт', category: 'health-medical' },
  { id: 'counselor', nameEn: 'Counselor', nameUk: 'Консультант', nameRu: 'Консультант', category: 'health-medical' },
  { id: 'acupuncturist', nameEn: 'Acupuncturist', nameUk: 'Акупунктурист', nameRu: 'Акупунктурист', category: 'health-medical' },
  { id: 'homeopath', nameEn: 'Homeopath', nameUk: 'Гомеопат', nameRu: 'Гомеопат', category: 'health-medical' },
  { id: 'osteopath', nameEn: 'Osteopath', nameUk: 'Остеопат', nameRu: 'Остеопат', category: 'health-medical' },
  { id: 'veterinarian', nameEn: 'Veterinarian', nameUk: 'Ветеринар', nameRu: 'Ветеринар', category: 'health-medical' },

  // Fitness & Sports Professionals
  { id: 'personal-trainer', nameEn: 'Personal Trainer', nameUk: 'Персональний тренер', nameRu: 'Персональный тренер', category: 'fitness-sports' },
  { id: 'yoga-instructor', nameEn: 'Yoga Instructor', nameUk: 'Інструктор з йоги', nameRu: 'Инструктор по йоге', category: 'fitness-sports' },
  { id: 'pilates-instructor', nameEn: 'Pilates Instructor', nameUk: 'Інструктор з пілатесу', nameRu: 'Инструктор по пилатесу', category: 'fitness-sports' },
  { id: 'fitness-coach', nameEn: 'Fitness Coach', nameUk: 'Фітнес-тренер', nameRu: 'Фитнес-тренер', category: 'fitness-sports' },
  { id: 'dance-instructor', nameEn: 'Dance Instructor', nameUk: 'Викладач танців', nameRu: 'Преподаватель танцев', category: 'fitness-sports' },
  { id: 'martial-arts-instructor', nameEn: 'Martial Arts Instructor', nameUk: 'Інструктор бойових мистецтв', nameRu: 'Инструктор боевых искусств', category: 'fitness-sports' },
  { id: 'swimming-coach', nameEn: 'Swimming Coach', nameUk: 'Тренер з плавання', nameRu: 'Тренер по плаванию', category: 'fitness-sports' },
  { id: 'sports-coach', nameEn: 'Sports Coach', nameUk: 'Спортивний тренер', nameRu: 'Спортивный тренер', category: 'fitness-sports' },
  { id: 'athletic-trainer', nameEn: 'Athletic Trainer', nameUk: 'Спортивний реабілітолог', nameRu: 'Спортивный реабилитолог', category: 'fitness-sports' },

  // Education & Training Professionals
  { id: 'tutor', nameEn: 'Tutor', nameUk: 'Репетитор', nameRu: 'Репетитор', category: 'education-tutoring' },
  { id: 'teacher', nameEn: 'Teacher', nameUk: 'Вчитель', nameRu: 'Учитель', category: 'education-tutoring' },
  { id: 'language-teacher', nameEn: 'Language Teacher', nameUk: 'Викладач мов', nameRu: 'Преподаватель языков', category: 'education-tutoring' },
  { id: 'music-teacher', nameEn: 'Music Teacher', nameUk: 'Викладач музики', nameRu: 'Преподаватель музыки', category: 'education-tutoring' },
  { id: 'art-teacher', nameEn: 'Art Teacher', nameUk: 'Викладач мистецтва', nameRu: 'Преподаватель искусства', category: 'education-tutoring' },
  { id: 'driving-instructor', nameEn: 'Driving Instructor', nameUk: 'Інструктор з водіння', nameRu: 'Инструктор по вождению', category: 'education-tutoring' },
  { id: 'life-coach', nameEn: 'Life Coach', nameUk: 'Лайф-коуч', nameRu: 'Лайф-коуч', category: 'education-tutoring' },
  { id: 'business-coach', nameEn: 'Business Coach', nameUk: 'Бізнес-коуч', nameRu: 'Бизнес-коуч', category: 'education-tutoring' },
  { id: 'career-counselor', nameEn: 'Career Counselor', nameUk: 'Кар\'єрний консультант', nameRu: 'Карьерный консультант', category: 'education-tutoring' },

  // Home Services Professionals
  { id: 'cleaner', nameEn: 'Cleaner', nameUk: 'Прибиральник', nameRu: 'Уборщик', category: 'home-services' },
  { id: 'housekeeper', nameEn: 'Housekeeper', nameUk: 'Домоправитель', nameRu: 'Домработник', category: 'home-services' },
  { id: 'handyman', nameEn: 'Handyman', nameUk: 'Домашній майстер', nameRu: 'Домашний мастер', category: 'home-services' },
  { id: 'plumber', nameEn: 'Plumber', nameUk: 'Сантехнік', nameRu: 'Сантехник', category: 'home-services' },
  { id: 'electrician', nameEn: 'Electrician', nameUk: 'Електрик', nameRu: 'Электрик', category: 'home-services' },
  { id: 'painter', nameEn: 'Painter', nameUk: 'Маляр', nameRu: 'Маляр', category: 'home-services' },
  { id: 'carpenter', nameEn: 'Carpenter', nameUk: 'Столяр', nameRu: 'Столяр', category: 'home-services' },
  { id: 'gardener', nameEn: 'Gardener', nameUk: 'Садівник', nameRu: 'Садовник', category: 'home-services' },
  { id: 'landscaper', nameEn: 'Landscaper', nameUk: 'Ландшафтний дизайнер', nameRu: 'Ландшафтный дизайнер', category: 'home-services' },
  { id: 'interior-designer', nameEn: 'Interior Designer', nameUk: 'Дизайнер інтер\'єру', nameRu: 'Дизайнер интерьера', category: 'home-services' },
  { id: 'appliance-repair-technician', nameEn: 'Appliance Repair Technician', nameUk: 'Майстер з ремонту техніки', nameRu: 'Мастер по ремонту техники', category: 'home-services' },

  // Automotive Professionals
  { id: 'auto-mechanic', nameEn: 'Auto Mechanic', nameUk: 'Автомеханік', nameRu: 'Автомеханик', category: 'automotive' },
  { id: 'car-detailer', nameEn: 'Car Detailer', nameUk: 'Детейлер', nameRu: 'Детейлер', category: 'automotive' },
  { id: 'tire-technician', nameEn: 'Tire Technician', nameUk: 'Шиномонтажник', nameRu: 'Шиномонтажник', category: 'automotive' },
  { id: 'auto-body-technician', nameEn: 'Auto Body Technician', nameUk: 'Кузовщик', nameRu: 'Кузовщик', category: 'automotive' },
  { id: 'automotive-painter', nameEn: 'Automotive Painter', nameUk: 'Автомаляр', nameRu: 'Автомаляр', category: 'automotive' },
  { id: 'car-inspector', nameEn: 'Car Inspector', nameUk: 'Автоінспектор', nameRu: 'Автоинспектор', category: 'automotive' },

  // Technology & IT Professionals
  { id: 'it-specialist', nameEn: 'IT Specialist', nameUk: 'IT-спеціаліст', nameRu: 'IT-специалист', category: 'technology-it' },
  { id: 'computer-repair-technician', nameEn: 'Computer Repair Technician', nameUk: 'Майстер з ремонту комп\'ютерів', nameRu: 'Мастер по ремонту компьютеров', category: 'technology-it' },
  { id: 'phone-repair-technician', nameEn: 'Phone Repair Technician', nameUk: 'Майстер з ремонту телефонів', nameRu: 'Мастер по ремонту телефонов', category: 'technology-it' },
  { id: 'software-developer', nameEn: 'Software Developer', nameUk: 'Розробник програмного забезпечення', nameRu: 'Разработчик программного обеспечения', category: 'technology-it' },
  { id: 'web-developer', nameEn: 'Web Developer', nameUk: 'Веб-розробник', nameRu: 'Веб-разработчик', category: 'technology-it' },
  { id: 'mobile-app-developer', nameEn: 'Mobile App Developer', nameUk: 'Розробник мобільних додатків', nameRu: 'Разработчик мобильных приложений', category: 'technology-it' },
  { id: 'cybersecurity-specialist', nameEn: 'Cybersecurity Specialist', nameUk: 'Спеціаліст з кібербезпеки', nameRu: 'Специалист по кибербезопасности', category: 'technology-it' },
  { id: 'data-recovery-specialist', nameEn: 'Data Recovery Specialist', nameUk: 'Спеціаліст з відновлення даних', nameRu: 'Специалист по восстановлению данных', category: 'technology-it' },
  { id: 'network-administrator', nameEn: 'Network Administrator', nameUk: 'Мережевий адміністратор', nameRu: 'Сетевой администратор', category: 'technology-it' },

  // Creative Arts Professionals
  { id: 'photographer', nameEn: 'Photographer', nameUk: 'Фотограф', nameRu: 'Фотограф', category: 'creative-arts' },
  { id: 'videographer', nameEn: 'Videographer', nameUk: 'Відеограф', nameRu: 'Видеограф', category: 'creative-arts' },
  { id: 'graphic-designer', nameEn: 'Graphic Designer', nameUk: 'Графічний дизайнер', nameRu: 'Графический дизайнер', category: 'creative-arts' },
  { id: 'ui-ux-designer', nameEn: 'UI/UX Designer', nameUk: 'UI/UX дизайнер', nameRu: 'UI/UX дизайнер', category: 'creative-arts' },
  { id: 'writer', nameEn: 'Writer', nameUk: 'Письменник', nameRu: 'Писатель', category: 'creative-arts' },
  { id: 'editor', nameEn: 'Editor', nameUk: 'Редактор', nameRu: 'Редактор', category: 'creative-arts' },
  { id: 'translator', nameEn: 'Translator', nameUk: 'Перекладач', nameRu: 'Переводчик', category: 'creative-arts' },
  { id: 'voice-over-artist', nameEn: 'Voice Over Artist', nameUk: 'Актор озвучування', nameRu: 'Актер озвучивания', category: 'creative-arts' },
  { id: 'animator', nameEn: 'Animator', nameUk: 'Аніматор', nameRu: 'Аниматор', category: 'creative-arts' },
  { id: 'illustrator', nameEn: 'Illustrator', nameUk: 'Ілюстратор', nameRu: 'Иллюстратор', category: 'creative-arts' },
  { id: 'copywriter', nameEn: 'Copywriter', nameUk: 'Копірайтер', nameRu: 'Копирайтер', category: 'creative-arts' },

  // Business & Professional Services
  { id: 'accountant', nameEn: 'Accountant', nameUk: 'Бухгалтер', nameRu: 'Бухгалтер', category: 'business-professional' },
  { id: 'bookkeeper', nameEn: 'Bookkeeper', nameUk: 'Бухгалтер-рахівник', nameRu: 'Бухгалтер-счетовод', category: 'business-professional' },
  { id: 'lawyer', nameEn: 'Lawyer', nameUk: 'Юрист', nameRu: 'Юрист', category: 'business-professional' },
  { id: 'paralegal', nameEn: 'Paralegal', nameUk: 'Помічник юриста', nameRu: 'Помощник юриста', category: 'business-professional' },
  { id: 'business-consultant', nameEn: 'Business Consultant', nameUk: 'Бізнес-консультант', nameRu: 'Бизнес-консультант', category: 'business-professional' },
  { id: 'marketing-specialist', nameEn: 'Marketing Specialist', nameUk: 'Маркетинговий спеціаліст', nameRu: 'Маркетинговый специалист', category: 'business-professional' },
  { id: 'social-media-manager', nameEn: 'Social Media Manager', nameUk: 'Менеджер соціальних мереж', nameRu: 'Менеджер социальных сетей', category: 'business-professional' },
  { id: 'real-estate-agent', nameEn: 'Real Estate Agent', nameUk: 'Ріелтор', nameRu: 'Риелтор', category: 'business-professional' },
  { id: 'insurance-agent', nameEn: 'Insurance Agent', nameUk: 'Страховий агент', nameRu: 'Страховой агент', category: 'business-professional' },
  { id: 'financial-advisor', nameEn: 'Financial Advisor', nameUk: 'Фінансовий консультант', nameRu: 'Финансовый консультант', category: 'business-professional' },
  { id: 'tax-preparer', nameEn: 'Tax Preparer', nameUk: 'Податковий консультант', nameRu: 'Налоговый консультант', category: 'business-professional' },

  // Events & Entertainment Professionals
  { id: 'event-planner', nameEn: 'Event Planner', nameUk: 'Організатор подій', nameRu: 'Организатор событий', category: 'events-entertainment' },
  { id: 'wedding-planner', nameEn: 'Wedding Planner', nameUk: 'Весільний організатор', nameRu: 'Свадебный организатор', category: 'events-entertainment' },
  { id: 'caterer', nameEn: 'Caterer', nameUk: 'Кейтерінг-спеціаліст', nameRu: 'Кейтеринг-специалист', category: 'events-entertainment' },
  { id: 'chef', nameEn: 'Chef', nameUk: 'Шеф-кухар', nameRu: 'Шеф-повар', category: 'events-entertainment' },
  { id: 'dj', nameEn: 'DJ', nameUk: 'Діджей', nameRu: 'Диджей', category: 'events-entertainment' },
  { id: 'musician', nameEn: 'Musician', nameUk: 'Музикант', nameRu: 'Музыкант', category: 'events-entertainment' },
  { id: 'entertainer', nameEn: 'Entertainer', nameUk: 'Артист-розважальник', nameRu: 'Артист-развлекатель', category: 'events-entertainment' },
  { id: 'mc-host', nameEn: 'MC/Host', nameUk: 'Ведучий', nameRu: 'Ведущий', category: 'events-entertainment' },

  // Pet Services Professionals
  { id: 'pet-groomer', nameEn: 'Pet Groomer', nameUk: 'Грумер', nameRu: 'Грумер', category: 'pet-services' },
  { id: 'pet-sitter', nameEn: 'Pet Sitter', nameUk: 'Ситтер для тварин', nameRu: 'Ситтер для животных', category: 'pet-services' },
  { id: 'dog-walker', nameEn: 'Dog Walker', nameUk: 'Вигульщик собак', nameRu: 'Выгульщик собак', category: 'pet-services' },
  { id: 'pet-trainer', nameEn: 'Pet Trainer', nameUk: 'Дресирувальник', nameRu: 'Дрессировщик', category: 'pet-services' },
  { id: 'pet-photographer', nameEn: 'Pet Photographer', nameUk: 'Фотограф тварин', nameRu: 'Фотограф животных', category: 'pet-services' }
];

export const getProfessionName = (professionId: string, language: 'en' | 'uk' | 'ru' = 'en'): string => {
  const profession = PROFESSIONS.find(p => p.id === professionId);
  if (!profession) return professionId;

  switch (language) {
    case 'uk': return profession.nameUk;
    case 'ru': return profession.nameRu;
    default: return profession.nameEn;
  }
};

export const getProfessionsByCategory = (category: string): Profession[] => {
  return PROFESSIONS.filter(p => p.category === category);
};

export const searchProfessions = (query: string, language: 'en' | 'uk' | 'ru' = 'en'): Profession[] => {
  const lowerQuery = query.toLowerCase();
  return PROFESSIONS.filter(profession => {
    const name = getProfessionName(profession.id, language).toLowerCase();
    return name.includes(lowerQuery);
  });
};