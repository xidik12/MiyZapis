export interface Specialty {
  id: string;
  nameEn: string;
  nameUk: string;
  nameRu: string;
  category: string;
  professions: string[];
}

export const SPECIALTIES: Specialty[] = [
  // Beauty & Wellness Specialties
  { id: 'mens-haircuts', nameEn: 'Men\'s Haircuts', nameUk: 'Чоловічі стрижки', nameRu: 'Мужские стрижки', category: 'beauty-wellness', professions: ['hairstylist', 'barber'] },
  { id: 'womens-haircuts', nameEn: 'Women\'s Haircuts', nameUk: 'Жіночі стрижки', nameRu: 'Женские стрижки', category: 'beauty-wellness', professions: ['hairstylist'] },
  { id: 'hair-extensions', nameEn: 'Hair Extensions', nameUk: 'Нарощування волосся', nameRu: 'Наращивание волос', category: 'beauty-wellness', professions: ['hairstylist'] },
  { id: 'balayage-highlights', nameEn: 'Balayage & Highlights', nameUk: 'Балаяж та мелірування', nameRu: 'Балаяж и мелирование', category: 'beauty-wellness', professions: ['hair-colorist'] },
  { id: 'hair-straightening', nameEn: 'Hair Straightening', nameUk: 'Випрямлення волосся', nameRu: 'Выпрямление волос', category: 'beauty-wellness', professions: ['hairstylist'] },
  { id: 'bridal-hair', nameEn: 'Bridal Hair', nameUk: 'Весільні зачіски', nameRu: 'Свадебные прически', category: 'beauty-wellness', professions: ['hairstylist'] },
  { id: 'gel-manicure', nameEn: 'Gel Manicure', nameUk: 'Гель-манікюр', nameRu: 'Гель-маникюр', category: 'beauty-wellness', professions: ['nail-technician'] },
  { id: 'nail-art', nameEn: 'Nail Art', nameUk: 'Нейл-арт', nameRu: 'Нейл-арт', category: 'beauty-wellness', professions: ['nail-technician'] },
  { id: 'acrylic-nails', nameEn: 'Acrylic Nails', nameUk: 'Акрилові нігті', nameRu: 'Акриловые ногти', category: 'beauty-wellness', professions: ['nail-technician'] },
  { id: 'anti-aging-treatments', nameEn: 'Anti-Aging Treatments', nameUk: 'Омолоджуючі процедури', nameRu: 'Омолаживающие процедуры', category: 'beauty-wellness', professions: ['esthetician'] },
  { id: 'acne-treatment', nameEn: 'Acne Treatment', nameUk: 'Лікування акне', nameRu: 'Лечение акне', category: 'beauty-wellness', professions: ['esthetician'] },
  { id: 'chemical-peels', nameEn: 'Chemical Peels', nameUk: 'Хімічні пілінги', nameRu: 'Химические пилинги', category: 'beauty-wellness', professions: ['esthetician'] },
  { id: 'deep-tissue-massage', nameEn: 'Deep Tissue Massage', nameUk: 'Глибокотканинний масаж', nameRu: 'Глубокотканный массаж', category: 'beauty-wellness', professions: ['massage-therapist'] },
  { id: 'swedish-massage', nameEn: 'Swedish Massage', nameUk: 'Шведський масаж', nameRu: 'Шведский массаж', category: 'beauty-wellness', professions: ['massage-therapist'] },
  { id: 'hot-stone-massage', nameEn: 'Hot Stone Massage', nameUk: 'Масаж гарячими каменями', nameRu: 'Массаж горячими камнями', category: 'beauty-wellness', professions: ['massage-therapist'] },
  { id: 'bridal-makeup', nameEn: 'Bridal Makeup', nameUk: 'Весільний макіяж', nameRu: 'Свадебный макияж', category: 'beauty-wellness', professions: ['makeup-artist'] },
  { id: 'special-event-makeup', nameEn: 'Special Event Makeup', nameUk: 'Макіяж для особливих подій', nameRu: 'Макияж для особых событий', category: 'beauty-wellness', professions: ['makeup-artist'] },
  { id: 'eyelash-extensions', nameEn: 'Eyelash Extensions', nameUk: 'Нарощування вій', nameRu: 'Наращивание ресниц', category: 'beauty-wellness', professions: ['lash-technician'] },
  { id: 'lash-lift', nameEn: 'Lash Lift', nameUk: 'Ламінування вій', nameRu: 'Ламинирование ресниц', category: 'beauty-wellness', professions: ['lash-technician'] },
  { id: 'microblading', nameEn: 'Microblading', nameUk: 'Мікроблейдинг', nameRu: 'Микроблейдинг', category: 'beauty-wellness', professions: ['brow-specialist', 'permanent-makeup-artist'] },
  { id: 'eyebrow-threading', nameEn: 'Eyebrow Threading', nameUk: 'Тридинг брів', nameRu: 'Тридинг бровей', category: 'beauty-wellness', professions: ['brow-specialist'] },

  // Health & Medical Specialties
  { id: 'family-medicine', nameEn: 'Family Medicine', nameUk: 'Сімейна медицина', nameRu: 'Семейная медицина', category: 'health-medical', professions: ['general-practitioner'] },
  { id: 'preventive-care', nameEn: 'Preventive Care', nameUk: 'Профілактична медицина', nameRu: 'Профилактическая медицина', category: 'health-medical', professions: ['general-practitioner'] },
  { id: 'cosmetic-dentistry', nameEn: 'Cosmetic Dentistry', nameUk: 'Естетична стоматологія', nameRu: 'Эстетическая стоматология', category: 'health-medical', professions: ['dentist'] },
  { id: 'orthodontics', nameEn: 'Orthodontics', nameUk: 'Ортодонтія', nameRu: 'Ортодонтия', category: 'health-medical', professions: ['dentist'] },
  { id: 'teeth-cleaning', nameEn: 'Teeth Cleaning', nameUk: 'Чистка зубів', nameRu: 'Чистка зубов', category: 'health-medical', professions: ['dentist'] },
  { id: 'root-canal', nameEn: 'Root Canal Treatment', nameUk: 'Лікування кореневих каналів', nameRu: 'Лечение корневых каналов', category: 'health-medical', professions: ['dentist'] },
  { id: 'anxiety-therapy', nameEn: 'Anxiety Therapy', nameUk: 'Терапія тривожності', nameRu: 'Терапия тревожности', category: 'health-medical', professions: ['psychologist', 'therapist'] },
  { id: 'depression-therapy', nameEn: 'Depression Therapy', nameUk: 'Терапія депресії', nameRu: 'Терапия депрессии', category: 'health-medical', professions: ['psychologist', 'therapist'] },
  { id: 'couples-therapy', nameEn: 'Couples Therapy', nameUk: 'Парна терапія', nameRu: 'Парная терапия', category: 'health-medical', professions: ['psychologist', 'therapist'] },
  { id: 'child-psychology', nameEn: 'Child Psychology', nameUk: 'Дитяча психологія', nameRu: 'Детская психология', category: 'health-medical', professions: ['psychologist'] },
  { id: 'sports-physiotherapy', nameEn: 'Sports Physiotherapy', nameUk: 'Спортивна фізіотерапія', nameRu: 'Спортивная физиотерапия', category: 'health-medical', professions: ['physiotherapist'] },
  { id: 'post-surgery-rehabilitation', nameEn: 'Post-Surgery Rehabilitation', nameUk: 'Післяопераційна реабілітація', nameRu: 'Послеоперационная реабилитация', category: 'health-medical', professions: ['physiotherapist'] },
  { id: 'back-pain-treatment', nameEn: 'Back Pain Treatment', nameUk: 'Лікування болю в спині', nameRu: 'Лечение боли в спине', category: 'health-medical', professions: ['chiropractor', 'physiotherapist'] },
  { id: 'weight-loss-nutrition', nameEn: 'Weight Loss Nutrition', nameUk: 'Харчування для схуднення', nameRu: 'Питание для похудения', category: 'health-medical', professions: ['nutritionist', 'dietitian'] },
  { id: 'sports-nutrition', nameEn: 'Sports Nutrition', nameUk: 'Спортивне харчування', nameRu: 'Спортивное питание', category: 'health-medical', professions: ['nutritionist', 'dietitian'] },
  { id: 'diabetes-management', nameEn: 'Diabetes Management', nameUk: 'Управління діабетом', nameRu: 'Управление диабетом', category: 'health-medical', professions: ['nutritionist', 'dietitian'] },

  // Fitness & Sports Specialties
  { id: 'weight-loss-training', nameEn: 'Weight Loss Training', nameUk: 'Тренування для схуднення', nameRu: 'Тренировки для похудения', category: 'fitness-sports', professions: ['personal-trainer', 'fitness-coach'] },
  { id: 'strength-training', nameEn: 'Strength Training', nameUk: 'Силові тренування', nameRu: 'Силовые тренировки', category: 'fitness-sports', professions: ['personal-trainer', 'fitness-coach'] },
  { id: 'bodybuilding-coaching', nameEn: 'Bodybuilding Coaching', nameUk: 'Тренування з бодібілдингу', nameRu: 'Тренировки по бодибилдингу', category: 'fitness-sports', professions: ['personal-trainer', 'fitness-coach'] },
  { id: 'crossfit-training', nameEn: 'CrossFit Training', nameUk: 'Кросфіт тренування', nameRu: 'Кроссфит тренировки', category: 'fitness-sports', professions: ['personal-trainer', 'fitness-coach'] },
  { id: 'hatha-yoga', nameEn: 'Hatha Yoga', nameUk: 'Хатха-йога', nameRu: 'Хатха-йога', category: 'fitness-sports', professions: ['yoga-instructor'] },
  { id: 'vinyasa-yoga', nameEn: 'Vinyasa Yoga', nameUk: 'Віньяса-йога', nameRu: 'Виньяса-йога', category: 'fitness-sports', professions: ['yoga-instructor'] },
  { id: 'hot-yoga', nameEn: 'Hot Yoga', nameUk: 'Гаряча йога', nameRu: 'Горячая йога', category: 'fitness-sports', professions: ['yoga-instructor'] },
  { id: 'prenatal-yoga', nameEn: 'Prenatal Yoga', nameUk: 'Йога для вагітних', nameRu: 'Йога для беременных', category: 'fitness-sports', professions: ['yoga-instructor'] },
  { id: 'classical-pilates', nameEn: 'Classical Pilates', nameUk: 'Класичний пілатес', nameRu: 'Классический пилатес', category: 'fitness-sports', professions: ['pilates-instructor'] },
  { id: 'reformer-pilates', nameEn: 'Reformer Pilates', nameUk: 'Пілатес на реформері', nameRu: 'Пилатес на реформере', category: 'fitness-sports', professions: ['pilates-instructor'] },
  { id: 'ballroom-dance', nameEn: 'Ballroom Dance', nameUk: 'Бальні танці', nameRu: 'Бальные танцы', category: 'fitness-sports', professions: ['dance-instructor'] },
  { id: 'latin-dance', nameEn: 'Latin Dance', nameUk: 'Латиноамериканські танці', nameRu: 'Латиноамериканские танцы', category: 'fitness-sports', professions: ['dance-instructor'] },
  { id: 'hip-hop-dance', nameEn: 'Hip Hop Dance', nameUk: 'Хіп-хоп танці', nameRu: 'Хип-хоп танцы', category: 'fitness-sports', professions: ['dance-instructor'] },
  { id: 'karate', nameEn: 'Karate', nameUk: 'Карате', nameRu: 'Карате', category: 'fitness-sports', professions: ['martial-arts-instructor'] },
  { id: 'taekwondo', nameEn: 'Taekwondo', nameUk: 'Тхеквондо', nameRu: 'Тхэквондо', category: 'fitness-sports', professions: ['martial-arts-instructor'] },
  { id: 'boxing', nameEn: 'Boxing', nameUk: 'Бокс', nameRu: 'Бокс', category: 'fitness-sports', professions: ['martial-arts-instructor'] },

  // Education & Tutoring Specialties
  { id: 'elementary-math', nameEn: 'Elementary Math', nameUk: 'Початкова математика', nameRu: 'Начальная математика', category: 'education-tutoring', professions: ['tutor', 'teacher'] },
  { id: 'high-school-math', nameEn: 'High School Math', nameUk: 'Математика старшої школи', nameRu: 'Математика старшей школы', category: 'education-tutoring', professions: ['tutor', 'teacher'] },
  { id: 'calculus', nameEn: 'Calculus', nameUk: 'Математичний аналіз', nameRu: 'Математический анализ', category: 'education-tutoring', professions: ['tutor', 'teacher'] },
  { id: 'physics-tutoring', nameEn: 'Physics', nameUk: 'Фізика', nameRu: 'Физика', category: 'education-tutoring', professions: ['tutor', 'teacher'] },
  { id: 'chemistry-tutoring', nameEn: 'Chemistry', nameUk: 'Хімія', nameRu: 'Химия', category: 'education-tutoring', professions: ['tutor', 'teacher'] },
  { id: 'biology-tutoring', nameEn: 'Biology', nameUk: 'Біологія', nameRu: 'Биология', category: 'education-tutoring', professions: ['tutor', 'teacher'] },
  { id: 'english-as-second-language', nameEn: 'English as Second Language', nameUk: 'Англійська як друга мова', nameRu: 'Английский как второй язык', category: 'education-tutoring', professions: ['language-teacher', 'tutor'] },
  { id: 'business-english', nameEn: 'Business English', nameUk: 'Ділова англійська', nameRu: 'Деловой английский', category: 'education-tutoring', professions: ['language-teacher', 'tutor'] },
  { id: 'conversational-english', nameEn: 'Conversational English', nameUk: 'Розмовна англійська', nameRu: 'Разговорный английский', category: 'education-tutoring', professions: ['language-teacher', 'tutor'] },
  { id: 'spanish-lessons', nameEn: 'Spanish Lessons', nameUk: 'Уроки іспанської', nameRu: 'Уроки испанского', category: 'education-tutoring', professions: ['language-teacher', 'tutor'] },
  { id: 'french-lessons', nameEn: 'French Lessons', nameUk: 'Уроки французької', nameRu: 'Уроки французского', category: 'education-tutoring', professions: ['language-teacher', 'tutor'] },
  { id: 'german-lessons', nameEn: 'German Lessons', nameUk: 'Уроки німецької', nameRu: 'Уроки немецкого', category: 'education-tutoring', professions: ['language-teacher', 'tutor'] },
  { id: 'piano-lessons', nameEn: 'Piano Lessons', nameUk: 'Уроки піаніно', nameRu: 'Уроки пианино', category: 'education-tutoring', professions: ['music-teacher'] },
  { id: 'guitar-lessons', nameEn: 'Guitar Lessons', nameUk: 'Уроки гітари', nameRu: 'Уроки гитары', category: 'education-tutoring', professions: ['music-teacher'] },
  { id: 'violin-lessons', nameEn: 'Violin Lessons', nameUk: 'Уроки скрипки', nameRu: 'Уроки скрипки', category: 'education-tutoring', professions: ['music-teacher'] },
  { id: 'voice-lessons', nameEn: 'Voice Lessons', nameUk: 'Уроки вокалу', nameRu: 'Уроки вокала', category: 'education-tutoring', professions: ['music-teacher'] },
  { id: 'drawing-lessons', nameEn: 'Drawing Lessons', nameUk: 'Уроки малювання', nameRu: 'Уроки рисования', category: 'education-tutoring', professions: ['art-teacher'] },
  { id: 'painting-lessons', nameEn: 'Painting Lessons', nameUk: 'Уроки живопису', nameRu: 'Уроки живописи', category: 'education-tutoring', professions: ['art-teacher'] },
  { id: 'sat-prep', nameEn: 'SAT Preparation', nameUk: 'Підготовка до SAT', nameRu: 'Подготовка к SAT', category: 'education-tutoring', professions: ['tutor'] },
  { id: 'act-prep', nameEn: 'ACT Preparation', nameUk: 'Підготовка до ACT', nameRu: 'Подготовка к ACT', category: 'education-tutoring', professions: ['tutor'] },

  // Home Services Specialties  
  { id: 'deep-cleaning', nameEn: 'Deep Cleaning', nameUk: 'Генеральне прибирання', nameRu: 'Генеральная уборка', category: 'home-services', professions: ['cleaner', 'housekeeper'] },
  { id: 'regular-cleaning', nameEn: 'Regular Cleaning', nameUk: 'Регулярне прибирання', nameRu: 'Регулярная уборка', category: 'home-services', professions: ['cleaner', 'housekeeper'] },
  { id: 'move-in-out-cleaning', nameEn: 'Move-in/Move-out Cleaning', nameUk: 'Прибирання при переїзді', nameRu: 'Уборка при переезде', category: 'home-services', professions: ['cleaner'] },
  { id: 'post-construction-cleaning', nameEn: 'Post-Construction Cleaning', nameUk: 'Прибирання після ремонту', nameRu: 'Уборка после ремонта', category: 'home-services', professions: ['cleaner'] },
  { id: 'kitchen-renovation', nameEn: 'Kitchen Renovation', nameUk: 'Ремонт кухні', nameRu: 'Ремонт кухни', category: 'home-services', professions: ['handyman', 'carpenter'] },
  { id: 'bathroom-renovation', nameEn: 'Bathroom Renovation', nameUk: 'Ремонт ванної кімнати', nameRu: 'Ремонт ванной комнаты', category: 'home-services', professions: ['handyman', 'plumber'] },
  { id: 'drywall-repair', nameEn: 'Drywall Repair', nameUk: 'Ремонт гіпсокартону', nameRu: 'Ремонт гипсокартона', category: 'home-services', professions: ['handyman', 'painter'] },
  { id: 'tile-installation', nameEn: 'Tile Installation', nameUk: 'Укладання плитки', nameRu: 'Укладка плитки', category: 'home-services', professions: ['handyman'] },
  { id: 'leak-repair', nameEn: 'Leak Repair', nameUk: 'Усунення протікань', nameRu: 'Устранение протечек', category: 'home-services', professions: ['plumber'] },
  { id: 'drain-cleaning', nameEn: 'Drain Cleaning', nameUk: 'Очищення каналізації', nameRu: 'Очистка канализации', category: 'home-services', professions: ['plumber'] },
  { id: 'toilet-installation', nameEn: 'Toilet Installation', nameUk: 'Встановлення унітазу', nameRu: 'Установка унитаза', category: 'home-services', professions: ['plumber'] },
  { id: 'electrical-wiring', nameEn: 'Electrical Wiring', nameUk: 'Електропроводка', nameRu: 'Электропроводка', category: 'home-services', professions: ['electrician'] },
  { id: 'lighting-installation', nameEn: 'Lighting Installation', nameUk: 'Встановлення освітлення', nameRu: 'Установка освещения', category: 'home-services', professions: ['electrician'] },
  { id: 'ceiling-fan-installation', nameEn: 'Ceiling Fan Installation', nameUk: 'Встановлення стельового вентилятора', nameRu: 'Установка потолочного вентилятора', category: 'home-services', professions: ['electrician'] },

  // Automotive Specialties
  { id: 'oil-change', nameEn: 'Oil Change', nameUk: 'Заміна мастила', nameRu: 'Замена масла', category: 'automotive', professions: ['auto-mechanic'] },
  { id: 'brake-repair', nameEn: 'Brake Repair', nameUk: 'Ремонт гальм', nameRu: 'Ремонт тормозов', category: 'automotive', professions: ['auto-mechanic'] },
  { id: 'engine-diagnostics', nameEn: 'Engine Diagnostics', nameUk: 'Діагностика двигуна', nameRu: 'Диагностика двигателя', category: 'automotive', professions: ['auto-mechanic'] },
  { id: 'transmission-repair', nameEn: 'Transmission Repair', nameUk: 'Ремонт коробки передач', nameRu: 'Ремонт коробки передач', category: 'automotive', professions: ['auto-mechanic'] },
  { id: 'exterior-detailing', nameEn: 'Exterior Detailing', nameUk: 'Зовнішнє детейлінг', nameRu: 'Внешний детейлинг', category: 'automotive', professions: ['car-detailer'] },
  { id: 'interior-detailing', nameEn: 'Interior Detailing', nameUk: 'Внутрішнє детейлінг', nameRu: 'Внутренний детейлинг', category: 'automotive', professions: ['car-detailer'] },
  { id: 'ceramic-coating', nameEn: 'Ceramic Coating', nameUk: 'Керамічне покриття', nameRu: 'Керамическое покрытие', category: 'automotive', professions: ['car-detailer'] },
  { id: 'tire-mounting', nameEn: 'Tire Mounting', nameUk: 'Шиномонтаж', nameRu: 'Шиномонтаж', category: 'automotive', professions: ['tire-technician'] },
  { id: 'wheel-alignment', nameEn: 'Wheel Alignment', nameUk: 'Розвал-сходження', nameRu: 'Развал-схождение', category: 'automotive', professions: ['tire-technician'] },

  // Technology & IT Specialties
  { id: 'virus-removal', nameEn: 'Virus Removal', nameUk: 'Видалення вірусів', nameRu: 'Удаление вирусов', category: 'technology-it', professions: ['computer-repair-technician', 'it-specialist'] },
  { id: 'data-backup', nameEn: 'Data Backup', nameUk: 'Резервне копіювання даних', nameRu: 'Резервное копирование данных', category: 'technology-it', professions: ['it-specialist'] },
  { id: 'hardware-upgrade', nameEn: 'Hardware Upgrade', nameUk: 'Оновлення обладнання', nameRu: 'Обновление оборудования', category: 'technology-it', professions: ['computer-repair-technician'] },
  { id: 'screen-replacement', nameEn: 'Screen Replacement', nameUk: 'Заміна екрану', nameRu: 'Замена экрана', category: 'technology-it', professions: ['phone-repair-technician'] },
  { id: 'battery-replacement', nameEn: 'Battery Replacement', nameUk: 'Заміна батареї', nameRu: 'Замена батареи', category: 'technology-it', professions: ['phone-repair-technician'] },
  { id: 'water-damage-repair', nameEn: 'Water Damage Repair', nameUk: 'Ремонт після потрапляння води', nameRu: 'Ремонт после попадания воды', category: 'technology-it', professions: ['phone-repair-technician'] },
  { id: 'web-application-development', nameEn: 'Web Application Development', nameUk: 'Розробка веб-додатків', nameRu: 'Разработка веб-приложений', category: 'technology-it', professions: ['web-developer', 'software-developer'] },
  { id: 'mobile-app-development', nameEn: 'Mobile App Development', nameUk: 'Розробка мобільних додатків', nameRu: 'Разработка мобильных приложений', category: 'technology-it', professions: ['mobile-app-developer', 'software-developer'] },
  { id: 'e-commerce-development', nameEn: 'E-commerce Development', nameUk: 'Розробка інтернет-магазинів', nameRu: 'Разработка интернет-магазинов', category: 'technology-it', professions: ['web-developer'] },
  { id: 'wordpress-development', nameEn: 'WordPress Development', nameUk: 'Розробка на WordPress', nameRu: 'Разработка на WordPress', category: 'technology-it', professions: ['web-developer'] },

  // Creative Arts Specialties
  { id: 'wedding-photography', nameEn: 'Wedding Photography', nameUk: 'Весільна фотографія', nameRu: 'Свадебная фотография', category: 'creative-arts', professions: ['photographer'] },
  { id: 'portrait-photography', nameEn: 'Portrait Photography', nameUk: 'Портретна фотографія', nameRu: 'Портретная фотография', category: 'creative-arts', professions: ['photographer'] },
  { id: 'event-photography', nameEn: 'Event Photography', nameUk: 'Фотографія подій', nameRu: 'Фотография событий', category: 'creative-arts', professions: ['photographer'] },
  { id: 'product-photography', nameEn: 'Product Photography', nameUk: 'Предметна фотографія', nameRu: 'Предметная фотография', category: 'creative-arts', professions: ['photographer'] },
  { id: 'real-estate-photography', nameEn: 'Real Estate Photography', nameUk: 'Фотографія нерухомості', nameRu: 'Фотография недвижимости', category: 'creative-arts', professions: ['photographer'] },
  { id: 'wedding-videography', nameEn: 'Wedding Videography', nameUk: 'Весільна відеографія', nameRu: 'Свадебная видеография', category: 'creative-arts', professions: ['videographer'] },
  { id: 'corporate-video', nameEn: 'Corporate Video', nameUk: 'Корпоративне відео', nameRu: 'Корпоративное видео', category: 'creative-arts', professions: ['videographer'] },
  { id: 'music-video', nameEn: 'Music Video', nameUk: 'Музичне відео', nameRu: 'Музыкальное видео', category: 'creative-arts', professions: ['videographer'] },
  { id: 'logo-design', nameEn: 'Logo Design', nameUk: 'Дизайн логотипу', nameRu: 'Дизайн логотипа', category: 'creative-arts', professions: ['graphic-designer'] },
  { id: 'brand-identity', nameEn: 'Brand Identity', nameUk: 'Фірмовий стиль', nameRu: 'Фирменный стиль', category: 'creative-arts', professions: ['graphic-designer'] },
  { id: 'web-design', nameEn: 'Web Design', nameUk: 'Веб-дизайн', nameRu: 'Веб-дизайн', category: 'creative-arts', professions: ['graphic-designer', 'ui-ux-designer'] },
  { id: 'print-design', nameEn: 'Print Design', nameUk: 'Поліграфічний дизайн', nameRu: 'Полиграфический дизайн', category: 'creative-arts', professions: ['graphic-designer'] },

  // Business & Professional Specialties
  { id: 'tax-preparation', nameEn: 'Tax Preparation', nameUk: 'Підготовка податкових декларацій', nameRu: 'Подготовка налоговых деклараций', category: 'business-professional', professions: ['accountant', 'tax-preparer'] },
  { id: 'bookkeeping', nameEn: 'Bookkeeping', nameUk: 'Ведення обліку', nameRu: 'Ведение учета', category: 'business-professional', professions: ['bookkeeper', 'accountant'] },
  { id: 'payroll-processing', nameEn: 'Payroll Processing', nameUk: 'Розрахунок заробітної плати', nameRu: 'Расчет заработной платы', category: 'business-professional', professions: ['accountant', 'bookkeeper'] },
  { id: 'business-registration', nameEn: 'Business Registration', nameUk: 'Реєстрація бізнесу', nameRu: 'Регистрация бизнеса', category: 'business-professional', professions: ['lawyer', 'business-consultant'] },
  { id: 'contract-law', nameEn: 'Contract Law', nameUk: 'Договірне право', nameRu: 'Договорное право', category: 'business-professional', professions: ['lawyer'] },
  { id: 'family-law', nameEn: 'Family Law', nameUk: 'Сімейне право', nameRu: 'Семейное право', category: 'business-professional', professions: ['lawyer'] },
  { id: 'immigration-law', nameEn: 'Immigration Law', nameUk: 'Міграційне право', nameRu: 'Миграционное право', category: 'business-professional', professions: ['lawyer'] },
  { id: 'digital-marketing', nameEn: 'Digital Marketing', nameUk: 'Цифровий маркетинг', nameRu: 'Цифровой маркетинг', category: 'business-professional', professions: ['marketing-specialist'] },
  { id: 'seo-services', nameEn: 'SEO Services', nameUk: 'SEO послуги', nameRu: 'SEO услуги', category: 'business-professional', professions: ['marketing-specialist'] },
  { id: 'social-media-marketing', nameEn: 'Social Media Marketing', nameUk: 'Маркетинг в соціальних мережах', nameRu: 'Маркетинг в социальных сетях', category: 'business-professional', professions: ['social-media-manager', 'marketing-specialist'] },

  // Events & Entertainment Specialties
  { id: 'corporate-events', nameEn: 'Corporate Events', nameUk: 'Корпоративні заходи', nameRu: 'Корпоративные мероприятия', category: 'events-entertainment', professions: ['event-planner'] },
  { id: 'birthday-parties', nameEn: 'Birthday Parties', nameUk: 'Дні народження', nameRu: 'Дни рождения', category: 'events-entertainment', professions: ['event-planner'] },
  { id: 'anniversary-celebrations', nameEn: 'Anniversary Celebrations', nameUk: 'Ювілеї', nameRu: 'Юбилеи', category: 'events-entertainment', professions: ['event-planner', 'wedding-planner'] },
  { id: 'outdoor-weddings', nameEn: 'Outdoor Weddings', nameUk: 'Весілля на природі', nameRu: 'Свадьбы на природе', category: 'events-entertainment', professions: ['wedding-planner'] },
  { id: 'destination-weddings', nameEn: 'Destination Weddings', nameUk: 'Весілля за кордоном', nameRu: 'Свадьбы за границей', category: 'events-entertainment', professions: ['wedding-planner'] },
  { id: 'wedding-catering', nameEn: 'Wedding Catering', nameUk: 'Весільний кейтеринг', nameRu: 'Свадебный кейтеринг', category: 'events-entertainment', professions: ['caterer', 'chef'] },
  { id: 'corporate-catering', nameEn: 'Corporate Catering', nameUk: 'Корпоративний кейтеринг', nameRu: 'Корпоративный кейтеринг', category: 'events-entertainment', professions: ['caterer'] },
  { id: 'private-chef', nameEn: 'Private Chef Services', nameUk: 'Послуги приватного кухаря', nameRu: 'Услуги частного повара', category: 'events-entertainment', professions: ['chef'] },
  { id: 'dj-wedding', nameEn: 'Wedding DJ', nameUk: 'Весільний діджей', nameRu: 'Свадебный диджей', category: 'events-entertainment', professions: ['dj'] },
  { id: 'dj-corporate', nameEn: 'Corporate DJ', nameUk: 'Корпоративний діджей', nameRu: 'Корпоративный диджей', category: 'events-entertainment', professions: ['dj'] },

  // Pet Services Specialties
  { id: 'dog-grooming', nameEn: 'Dog Grooming', nameUk: 'Грумінг собак', nameRu: 'Груминг собак', category: 'pet-services', professions: ['pet-groomer'] },
  { id: 'cat-grooming', nameEn: 'Cat Grooming', nameUk: 'Грумінг котів', nameRu: 'Груминг кошек', category: 'pet-services', professions: ['pet-groomer'] },
  { id: 'nail-trimming', nameEn: 'Pet Nail Trimming', nameUk: 'Стрижка кігтів', nameRu: 'Стрижка когтей', category: 'pet-services', professions: ['pet-groomer'] },
  { id: 'overnight-pet-sitting', nameEn: 'Overnight Pet Sitting', nameUk: 'Нічний догляд за тваринами', nameRu: 'Ночной уход за животными', category: 'pet-services', professions: ['pet-sitter'] },
  { id: 'pet-feeding', nameEn: 'Pet Feeding', nameUk: 'Годування тварин', nameRu: 'Кормление животных', category: 'pet-services', professions: ['pet-sitter'] },
  { id: 'dog-walking-group', nameEn: 'Group Dog Walking', nameUk: 'Груповий вигул собак', nameRu: 'Групповой выгул собак', category: 'pet-services', professions: ['dog-walker'] },
  { id: 'puppy-training', nameEn: 'Puppy Training', nameUk: 'Дресирування цуценят', nameRu: 'Дрессировка щенков', category: 'pet-services', professions: ['pet-trainer'] },
  { id: 'obedience-training', nameEn: 'Obedience Training', nameUk: 'Тренування слухняності', nameRu: 'Тренировка послушания', category: 'pet-services', professions: ['pet-trainer'] },
  { id: 'behavioral-training', nameEn: 'Behavioral Training', nameUk: 'Корекція поведінки', nameRu: 'Коррекция поведения', category: 'pet-services', professions: ['pet-trainer'] }
];

export const getSpecialtyName = (specialtyId: string, language: 'en' | 'uk' | 'ru' = 'en'): string => {
  const specialty = SPECIALTIES.find(s => s.id === specialtyId);
  if (!specialty) return specialtyId;

  switch (language) {
    case 'uk': return specialty.nameUk;
    case 'ru': return specialty.nameRu;
    default: return specialty.nameEn;
  }
};

export const getSpecialtiesByCategory = (category: string): Specialty[] => {
  return SPECIALTIES.filter(s => s.category === category);
};

export const getSpecialtiesByProfession = (profession: string): Specialty[] => {
  return SPECIALTIES.filter(s => s.professions.includes(profession));
};

export const searchSpecialties = (query: string, language: 'en' | 'uk' | 'ru' = 'en'): Specialty[] => {
  const lowerQuery = query.toLowerCase();
  return SPECIALTIES.filter(specialty => {
    const name = getSpecialtyName(specialty.id, language).toLowerCase();
    return name.includes(lowerQuery);
  });
};