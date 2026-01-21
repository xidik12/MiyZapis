export interface ServiceCategory {
  id: string;
  nameEn: string;
  nameUk: string;
  nameRu: string;
  subcategories?: ServiceCategory[];
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'beauty-wellness',
    nameEn: 'Beauty & Wellness',
    nameUk: 'Краса та Здоров\'я',
    nameRu: 'Красота и Здоровье',
    subcategories: [
      { id: 'hair-styling', nameEn: 'Hair Styling & Cut', nameUk: 'Перукарські послуги', nameRu: 'Парикмахерские услуги' },
      { id: 'hair-coloring', nameEn: 'Hair Coloring', nameUk: 'Фарбування волосся', nameRu: 'Окрашивание волос' },
      { id: 'manicure-pedicure', nameEn: 'Manicure & Pedicure', nameUk: 'Манікюр та Педикюр', nameRu: 'Маникюр и Педикюр' },
      { id: 'facial-treatments', nameEn: 'Facial Treatments', nameUk: 'Догляд за обличчям', nameRu: 'Уход за лицом' },
      { id: 'massage-therapy', nameEn: 'Massage Therapy', nameUk: 'Масажна терапія', nameRu: 'Массажная терапия' },
      { id: 'eyebrow-lash', nameEn: 'Eyebrow & Lash Services', nameUk: 'Брови та вії', nameRu: 'Брови и ресницы' },
      { id: 'makeup-services', nameEn: 'Makeup Services', nameUk: 'Послуги візажиста', nameRu: 'Услуги визажиста' },
      { id: 'spa-treatments', nameEn: 'SPA Treatments', nameUk: 'СПА процедури', nameRu: 'СПА процедуры' },
      { id: 'body-treatments', nameEn: 'Body Treatments', nameUk: 'Догляд за тілом', nameRu: 'Уход за телом' },
      { id: 'tattoo-piercing', nameEn: 'Tattoo & Piercing', nameUk: 'Тату та Пірсинг', nameRu: 'Тату и Пирсинг' }
    ]
  },
  {
    id: 'health-medical',
    nameEn: 'Health & Medical',
    nameUk: 'Здоров\'я та Медицина',
    nameRu: 'Здоровье и Медицина',
    subcategories: [
      { id: 'general-practice', nameEn: 'General Practice', nameUk: 'Загальна практика', nameRu: 'Общая практика' },
      { id: 'dentistry', nameEn: 'Dentistry', nameUk: 'Стоматологія', nameRu: 'Стоматология' },
      { id: 'psychology-therapy', nameEn: 'Psychology & Therapy', nameUk: 'Психологія та Терапія', nameRu: 'Психология и Терапия' },
      { id: 'physiotherapy', nameEn: 'Physiotherapy', nameUk: 'Фізіотерапія', nameRu: 'Физиотерапия' },
      { id: 'chiropractic', nameEn: 'Chiropractic', nameUk: 'Хіропрактика', nameRu: 'Хиропрактика' },
      { id: 'nutrition-dietetics', nameEn: 'Nutrition & Dietetics', nameUk: 'Харчування та Дієтологія', nameRu: 'Питание и Диетология' },
      { id: 'alternative-medicine', nameEn: 'Alternative Medicine', nameUk: 'Альтернативна медицина', nameRu: 'Альтернативная медицина' },
      { id: 'mental-health', nameEn: 'Mental Health', nameUk: 'Ментальне здоров\'я', nameRu: 'Ментальное здоровье' },
      { id: 'veterinary', nameEn: 'Veterinary Services', nameUk: 'Ветеринарні послуги', nameRu: 'Ветеринарные услуги' }
    ]
  },
  {
    id: 'fitness-sports',
    nameEn: 'Fitness & Sports',
    nameUk: 'Фітнес та Спорт',
    nameRu: 'Фитнес и Спорт',
    subcategories: [
      { id: 'personal-training', nameEn: 'Personal Training', nameUk: 'Персональні тренування', nameRu: 'Персональные тренировки' },
      { id: 'yoga-pilates', nameEn: 'Yoga & Pilates', nameUk: 'Йога та Пілатес', nameRu: 'Йога и Пилатес' },
      { id: 'martial-arts', nameEn: 'Martial Arts', nameUk: 'Бойові мистецтва', nameRu: 'Боевые искусства' },
      { id: 'dance-lessons', nameEn: 'Dance Lessons', nameUk: 'Уроки танців', nameRu: 'Уроки танцев' },
      { id: 'swimming-coaching', nameEn: 'Swimming Coaching', nameUk: 'Тренування з плавання', nameRu: 'Тренировки по плаванию' },
      { id: 'sports-coaching', nameEn: 'Sports Coaching', nameUk: 'Спортивне тренування', nameRu: 'Спортивное тренерство' },
      { id: 'rehabilitation', nameEn: 'Sports Rehabilitation', nameUk: 'Спортивна реабілітація', nameRu: 'Спортивная реабилитация' }
    ]
  },
  {
    id: 'education-tutoring',
    nameEn: 'Education & Tutoring',
    nameUk: 'Освіта та Репетиторство',
    nameRu: 'Образование и Репетиторство',
    subcategories: [
      { id: 'academic-tutoring', nameEn: 'Academic Tutoring', nameUk: 'Академічне репетиторство', nameRu: 'Академическое репетиторство' },
      { id: 'language-lessons', nameEn: 'Language Lessons', nameUk: 'Уроки мов', nameRu: 'Языковые уроки' },
      { id: 'music-lessons', nameEn: 'Music Lessons', nameUk: 'Уроки музики', nameRu: 'Уроки музыки' },
      { id: 'art-lessons', nameEn: 'Art Lessons', nameUk: 'Уроки мистецтва', nameRu: 'Уроки искусства' },
      { id: 'exam-preparation', nameEn: 'Exam Preparation', nameUk: 'Підготовка до іспитів', nameRu: 'Подготовка к экзаменам' },
      { id: 'professional-training', nameEn: 'Professional Training', nameUk: 'Професійне навчання', nameRu: 'Профессиональное обучение' },
      { id: 'computer-skills', nameEn: 'Computer Skills', nameUk: 'Комп\'ютерні навички', nameRu: 'Компьютерные навыки' },
      { id: 'life-coaching', nameEn: 'Life Coaching', nameUk: 'Лайф-коучинг', nameRu: 'Лайф-коучинг' }
    ]
  },
  {
    id: 'home-services',
    nameEn: 'Home Services',
    nameUk: 'Домашні послуги',
    nameRu: 'Домашние услуги',
    subcategories: [
      { id: 'cleaning-services', nameEn: 'Cleaning Services', nameUk: 'Послуги прибирання', nameRu: 'Услуги уборки' },
      { id: 'home-repair', nameEn: 'Home Repair & Maintenance', nameUk: 'Ремонт та обслуговування', nameRu: 'Ремонт и обслуживание' },
      { id: 'plumbing', nameEn: 'Plumbing', nameUk: 'Сантехнічні роботи', nameRu: 'Сантехнические работы' },
      { id: 'electrical-work', nameEn: 'Electrical Work', nameUk: 'Електричні роботи', nameRu: 'Электрические работы' },
      { id: 'painting-decorating', nameEn: 'Painting & Decorating', nameUk: 'Малярні роботи', nameRu: 'Малярные работы' },
      { id: 'gardening-landscaping', nameEn: 'Gardening & Landscaping', nameUk: 'Садівництво та ландшафт', nameRu: 'Садоводство и ландшафт' },
      { id: 'appliance-repair', nameEn: 'Appliance Repair', nameUk: 'Ремонт техніки', nameRu: 'Ремонт техники' },
      { id: 'carpentry', nameEn: 'Carpentry', nameUk: 'Столярні роботи', nameRu: 'Столярные работы' },
      { id: 'interior-design', nameEn: 'Interior Design', nameUk: 'Дизайн інтер\'єру', nameRu: 'Дизайн интерьера' }
    ]
  },
  {
    id: 'automotive',
    nameEn: 'Automotive',
    nameUk: 'Автомобільні послуги',
    nameRu: 'Автомобильные услуги',
    subcategories: [
      { id: 'car-repair', nameEn: 'Car Repair & Maintenance', nameUk: 'Ремонт та обслуговування авто', nameRu: 'Ремонт и обслуживание авто' },
      { id: 'car-detailing', nameEn: 'Car Detailing', nameUk: 'Детейлінг автомобілів', nameRu: 'Детейлинг автомобилей' },
      { id: 'tire-services', nameEn: 'Tire Services', nameUk: 'Послуги з шинами', nameRu: 'Услуги по шинам' },
      { id: 'auto-bodywork', nameEn: 'Auto Bodywork', nameUk: 'Кузовні роботи', nameRu: 'Кузовные работы' },
      { id: 'driving-lessons', nameEn: 'Driving Lessons', nameUk: 'Уроки водіння', nameRu: 'Уроки вождения' },
      { id: 'car-inspection', nameEn: 'Car Inspection', nameUk: 'Технічний огляд', nameRu: 'Технический осмотр' }
    ]
  },
  {
    id: 'technology-it',
    nameEn: 'Technology & IT',
    nameUk: 'Технології та IT',
    nameRu: 'Технологии и IT',
    subcategories: [
      { id: 'computer-repair', nameEn: 'Computer Repair', nameUk: 'Ремонт комп\'ютерів', nameRu: 'Ремонт компьютеров' },
      { id: 'phone-tablet-repair', nameEn: 'Phone & Tablet Repair', nameUk: 'Ремонт телефонів та планшетів', nameRu: 'Ремонт телефонов и планшетов' },
      { id: 'software-development', nameEn: 'Software Development', nameUk: 'Розробка програмного забезпечення', nameRu: 'Разработка программного обеспечения' },
      { id: 'web-development', nameEn: 'Web Development', nameUk: 'Веб-розробка', nameRu: 'Веб-разработка' },
      { id: 'it-support', nameEn: 'IT Support', nameUk: 'IT підтримка', nameRu: 'IT поддержка' },
      { id: 'data-recovery', nameEn: 'Data Recovery', nameUk: 'Відновлення даних', nameRu: 'Восстановление данных' },
      { id: 'cybersecurity', nameEn: 'Cybersecurity', nameUk: 'Кібербезпека', nameRu: 'Кибербезопасность' }
    ]
  },
  {
    id: 'creative-arts',
    nameEn: 'Creative Arts',
    nameUk: 'Творчі мистецтва',
    nameRu: 'Творческие искусства',
    subcategories: [
      { id: 'photography', nameEn: 'Photography', nameUk: 'Фотографія', nameRu: 'Фотография' },
      { id: 'videography', nameEn: 'Videography', nameUk: 'Відеографія', nameRu: 'Видеография' },
      { id: 'graphic-design', nameEn: 'Graphic Design', nameUk: 'Графічний дизайн', nameRu: 'Графический дизайн' },
      { id: 'writing-editing', nameEn: 'Writing & Editing', nameUk: 'Письмо та редагування', nameRu: 'Письмо и редактирование' },
      { id: 'translation', nameEn: 'Translation Services', nameUk: 'Послуги перекладу', nameRu: 'Услуги перевода' },
      { id: 'voice-over', nameEn: 'Voice Over', nameUk: 'Озвучування', nameRu: 'Озвучивание' },
      { id: 'animation', nameEn: 'Animation', nameUk: 'Анімація', nameRu: 'Анимация' },
      { id: 'illustration', nameEn: 'Illustration', nameUk: 'Ілюстрація', nameRu: 'Иллюстрация' }
    ]
  },
  {
    id: 'business-professional',
    nameEn: 'Business & Professional',
    nameUk: 'Бізнес та Професійні послуги',
    nameRu: 'Бизнес и Профессиональные услуги',
    subcategories: [
      { id: 'accounting-bookkeeping', nameEn: 'Accounting & Bookkeeping', nameUk: 'Бухгалтерський облік', nameRu: 'Бухгалтерский учет' },
      { id: 'legal-services', nameEn: 'Legal Services', nameUk: 'Юридичні послуги', nameRu: 'Юридические услуги' },
      { id: 'business-consulting', nameEn: 'Business Consulting', nameUk: 'Бізнес-консалтинг', nameRu: 'Бизнес-консалтинг' },
      { id: 'marketing-advertising', nameEn: 'Marketing & Advertising', nameUk: 'Маркетинг та реклама', nameRu: 'Маркетинг и реклама' },
      { id: 'real-estate', nameEn: 'Real Estate Services', nameUk: 'Послуги з нерухомості', nameRu: 'Услуги по недвижимости' },
      { id: 'insurance', nameEn: 'Insurance Services', nameUk: 'Страхові послуги', nameRu: 'Страховые услуги' },
      { id: 'financial-planning', nameEn: 'Financial Planning', nameUk: 'Фінансове планування', nameRu: 'Финансовое планирование' }
    ]
  },
  {
    id: 'events-entertainment',
    nameEn: 'Events & Entertainment',
    nameUk: 'Події та Розваги',
    nameRu: 'События и Развлечения',
    subcategories: [
      { id: 'event-planning', nameEn: 'Event Planning', nameUk: 'Планування подій', nameRu: 'Планирование событий' },
      { id: 'wedding-services', nameEn: 'Wedding Services', nameUk: 'Весільні послуги', nameRu: 'Свадебные услуги' },
      { id: 'catering', nameEn: 'Catering', nameUk: 'Кейтеринг', nameRu: 'Кейтеринг' },
      { id: 'entertainment', nameEn: 'Entertainment', nameUk: 'Розваги', nameRu: 'Развлечения' },
      { id: 'dj-services', nameEn: 'DJ Services', nameUk: 'Послуги діджея', nameRu: 'Услуги диджея' },
      { id: 'party-planning', nameEn: 'Party Planning', nameUk: 'Планування вечірок', nameRu: 'Планирование вечеринок' }
    ]
  },
  {
    id: 'pet-services',
    nameEn: 'Pet Services',
    nameUk: 'Послуги для тварин',
    nameRu: 'Услуги для животных',
    subcategories: [
      { id: 'pet-grooming', nameEn: 'Pet Grooming', nameUk: 'Грумінг тварин', nameRu: 'Груминг животных' },
      { id: 'pet-sitting', nameEn: 'Pet Sitting', nameUk: 'Догляд за тваринами', nameRu: 'Уход за животными' },
      { id: 'dog-walking', nameEn: 'Dog Walking', nameUk: 'Вигул собак', nameRu: 'Выгул собак' },
      { id: 'pet-training', nameEn: 'Pet Training', nameUk: 'Дресирування тварин', nameRu: 'Дрессировка животных' },
      { id: 'pet-photography', nameEn: 'Pet Photography', nameUk: 'Фотографія тварин', nameRu: 'Фотография животных' }
    ]
  }
];

export const getCategoryName = (categoryId: string, language: 'en' | 'kh' | 'uk' | 'ru' = 'en'): string => {
  const findCategoryRecursive = (categories: ServiceCategory[], id: string): ServiceCategory | undefined => {
    for (const category of categories) {
      if (category.id === id) return category;
      if (category.subcategories) {
        const found = findCategoryRecursive(category.subcategories, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  const category = findCategoryRecursive(SERVICE_CATEGORIES, categoryId);
  if (!category) return categoryId;

  switch (language) {
    case 'kh': return category.nameEn;
    case 'uk': return category.nameUk;
    case 'ru': return category.nameRu;
    default: return category.nameEn;
  }
};

export const getAllCategories = (): ServiceCategory[] => {
  const flatCategories: ServiceCategory[] = [];
  
  const flattenRecursive = (categories: ServiceCategory[]) => {
    categories.forEach(category => {
      flatCategories.push(category);
      if (category.subcategories) {
        flattenRecursive(category.subcategories);
      }
    });
  };
  
  flattenRecursive(SERVICE_CATEGORIES);
  return flatCategories;
};
