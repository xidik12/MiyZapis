import type { SeoService } from './seo.types';

export const SERVICES_A: SeoService[] = [
  {
    slug: 'manicure',
    query: 'manicure',
    emoji: '💅',
    name: { uk: 'Манікюр', ru: 'Маникюр', en: 'Manicure' },
    tagline: {
      uk: 'Доглянуті руки — деталь, яку помічають усі',
      ru: 'Ухоженные руки — деталь, которую замечают все',
      en: 'Well-groomed hands — a detail everyone notices',
    },
    intro: {
      uk: "Манікюр — один із найпопулярніших б'юті-сервісів в Україні, і знайти справді хорошого майстра тепер простіше, ніж будь-коли. На МійЗапис ви можете переглянути портфоліо майстрів, реальні відгуки клієнтів і записатись онлайн у кілька кліків. Обирайте зручний час і салон поруч — без дзвінків і черг.",
      ru: "Маникюр — один из самых востребованных б'юти-сервисов в Украине, и найти хорошего мастера теперь проще, чем когда-либо. На МійЗапис вы можете изучить портфолио, прочитать реальные отзывы и записаться онлайн за несколько кликов. Выбирайте удобное время и салон рядом — без звонков и очередей.",
      en: "Manicure is one of the most popular beauty services in Ukraine, and finding a skilled nail technician has never been easier. On MiyZapis you can browse portfolios, read genuine client reviews, and book online in seconds. Pick a time that suits you and a salon near you — no phone calls, no waiting.",
    },
    whatToExpect: {
      uk: "Хороший манікюр включає акуратну обробку кутикули, підпилювання та покриття — класичне, гель-лак або акрил. Обирайте майстра з портфоліо, де видно чистоту ліній і якість покриття, та зверніть увагу на відгуки щодо дотримання санітарних норм.",
      ru: "Качественный маникюр включает аккуратную обработку кутикулы, подпиливание и покрытие — классическое, гель-лак или акрил. Выбирайте мастера с портфолио, где видна чёткость линий и стойкость покрытия, и обратите внимание на отзывы о соблюдении санитарных норм.",
      en: "A quality manicure covers careful cuticle care, shaping, and a finish coat — classic polish, gel, or acrylic. Look for a specialist with a portfolio that shows clean lines and durable coverage, and check reviews mentioning hygiene standards.",
    },
    priceHint: {
      uk: 'Манікюр в Україні зазвичай коштує від 250 до 800 ₴ залежно від міста, складності та типу покриття.',
      ru: 'Маникюр в Украине обычно стоит от 250 до 800 ₴ в зависимости от города, сложности и типа покрытия.',
      en: 'Manicure in Ukraine typically costs from 250 to 800 ₴ depending on the city, complexity, and coating type.',
    },
    faqs: [
      {
        q: {
          uk: 'Як довго тримається гель-лак?',
          ru: 'Как долго держится гель-лак?',
          en: 'How long does gel polish last?',
        },
        a: {
          uk: 'Якісний гель-лак тримається 2–3 тижні без відколів. Термін залежить від підготовки нігтя, техніки нанесення та вашого побуту.',
          ru: 'Качественный гель-лак держится 2–3 недели без сколов. Срок зависит от подготовки ногтя, техники нанесения и вашего образа жизни.',
          en: 'Quality gel polish lasts 2–3 weeks without chipping. The duration depends on nail prep, application technique, and your daily habits.',
        },
      },
      {
        q: {
          uk: 'Апаратний чи класичний манікюр — що краще?',
          ru: 'Аппаратный или классический маникюр — что лучше?',
          en: 'Machine or classic manicure — which is better?',
        },
        a: {
          uk: 'Апаратний метод акуратніший і менш травматичний для кутикули. Класичний підходить тим, хто звик до традиційного підходу. Обидва варіанти доступні на МійЗапис.',
          ru: 'Аппаратный метод аккуратнее и менее травматичен для кутикулы. Классический подходит тем, кто привык к традиционному подходу. Оба варианта доступны на МійЗапис.',
          en: 'Machine manicure is more precise and less traumatic for the cuticle. Classic suits those who prefer a traditional approach. Both options are available on MiyZapis.',
        },
      },
      {
        q: {
          uk: 'Скільки часу займає процедура?',
          ru: 'Сколько времени занимает процедура?',
          en: 'How long does the procedure take?',
        },
        a: {
          uk: 'Стандартний манікюр із покриттям займає від 60 до 90 хвилин. Складний дизайн або нарощування можуть збільшити час до 2–2,5 годин.',
          ru: 'Стандартный маникюр с покрытием занимает от 60 до 90 минут. Сложный дизайн или наращивание могут увеличить время до 2–2,5 часов.',
          en: 'A standard manicure with coating takes 60 to 90 minutes. Complex nail art or extensions can extend the session to 2–2.5 hours.',
        },
      },
      {
        q: {
          uk: 'На що звернути увагу при виборі майстра?',
          ru: 'На что обратить внимание при выборе мастера?',
          en: 'What should I look for when choosing a nail technician?',
        },
        a: {
          uk: "Перевірте портфоліо — шукайте чіткі лінії та рівне покриття. Читайте відгуки про стерильність інструментів: це ключовий показник професіоналізму майстра.",
          ru: "Изучите портфолио — ищите чёткие линии и ровное покрытие. Читайте отзывы о стерильности инструментов: это ключевой показатель профессионализма.",
          en: "Check the portfolio — look for clean lines and smooth coverage. Read reviews about tool sterilization; that's a key marker of professional standards.",
        },
      },
    ],
    related: ['pedicure', 'nail-extensions', 'brows'],
  },
  {
    slug: 'pedicure',
    query: 'pedicure',
    emoji: '🦶',
    name: { uk: 'Педикюр', ru: 'Педикюр', en: 'Pedicure' },
    tagline: {
      uk: 'Здорові й доглянуті ноги — турбота, яку ви заслуговуєте',
      ru: 'Здоровые и ухоженные ноги — забота, которую вы заслуживаете',
      en: 'Healthy, well-groomed feet — the care you deserve',
    },
    intro: {
      uk: "Педикюр — це не лише естетика, а й здоров'я ніг. Регулярний догляд запобігає мозолям, вросшим нігтям і тріщинам на п'ятах. Запишіться до перевіреного майстра через МійЗапис: виберіть зручний час, ознайомтесь із портфоліо та відгуками — і приходьте вже підготовленими.",
      ru: "Педикюр — это не только эстетика, но и здоровье ног. Регулярный уход предотвращает мозоли, вросшие ногти и трещины на пятках. Запишитесь к проверенному мастеру через МійЗапис: выберите удобное время, изучите портфолио и отзывы — и приходите уже подготовленными.",
      en: "Pedicure is about more than aesthetics — it's about foot health. Regular care prevents calluses, ingrown nails, and cracked heels. Book a trusted specialist through MiyZapis: browse portfolios, read reviews, and pick a time that works for you.",
    },
    whatToExpect: {
      uk: "Педикюр охоплює пом'якшення шкіри, видалення мозолів і натоптишів, обробку нігтів і покриття лаком або гель-лаком. Медичний педикюр виконується без парафінових ванночок — для чутливої шкіри або при грибкових захворюваннях.",
      ru: "Педикюр включает размягчение кожи, удаление мозолей и натоптышей, обработку ногтей и покрытие лаком или гель-лаком. Медицинский педикюр выполняется без парафиновых ванночек — для чувствительной кожи или при грибковых заболеваниях.",
      en: "Pedicure covers skin softening, callus and hard skin removal, nail treatment, and a finish coat of regular or gel polish. Medical (dry) pedicure skips soaking — ideal for sensitive skin or fungal conditions.",
    },
    priceHint: {
      uk: "Педикюр в Україні коштує від 350 до 900 ₴. Апаратний або медичний педикюр зазвичай дорожчий за класичний.",
      ru: "Педикюр в Украине стоит от 350 до 900 ₴. Аппаратный или медицинский педикюр обычно дороже классического.",
      en: "Pedicure in Ukraine costs from 350 to 900 ₴. Machine or medical pedicure is typically priced higher than the classic wet method.",
    },
    faqs: [
      {
        q: {
          uk: 'Як часто робити педикюр?',
          ru: 'Как часто делать педикюр?',
          en: 'How often should I get a pedicure?',
        },
        a: {
          uk: 'Рекомендується кожні 4–6 тижнів. Влітку, коли ноги більш відкриті, можна частіше — раз на 3–4 тижні.',
          ru: 'Рекомендуется каждые 4–6 недель. Летом, когда ноги больше на виду, можно чаще — раз в 3–4 недели.',
          en: 'Every 4–6 weeks is recommended. In summer, when feet are more exposed, every 3–4 weeks works well.',
        },
      },
      {
        q: {
          uk: 'Чи боляче робити педикюр?',
          ru: 'Больно ли делать педикюр?',
          en: 'Is a pedicure painful?',
        },
        a: {
          uk: "У досвідченого майстра педикюр комфортний. Апаратний метод м'якший за класичний — ніяких різких рухів і ризику порізів.",
          ru: "У опытного мастера педикюр комфортен. Аппаратный метод мягче классического — никаких резких движений и риска порезов.",
          en: "With a skilled technician, pedicure is comfortable. The machine method is gentler than classic — no abrupt movements or risk of cuts.",
        },
      },
      {
        q: {
          uk: 'Чим відрізняється медичний педикюр від звичайного?',
          ru: 'Чем отличается медицинский педикюр от обычного?',
          en: 'What is the difference between medical and regular pedicure?',
        },
        a: {
          uk: "Медичний (апаратний сухий) педикюр не використовує воду — тільки фрези. Він підходить для діабетиків, людей із грибком або надмірно сухою шкірою.",
          ru: "Медицинский (аппаратный сухой) педикюр не использует воду — только фрезы. Он подходит для диабетиков, людей с грибком или чрезмерно сухой кожей.",
          en: "Medical (dry machine) pedicure uses no water — only rotary bits. It suits diabetics, people with fungal conditions, or very dry skin.",
        },
      },
      {
        q: {
          uk: 'Як підготуватися до педикюру?',
          ru: 'Как подготовиться к педикюру?',
          en: 'How should I prepare for a pedicure?',
        },
        a: {
          uk: "Прийдіть з чистими ногами та зручним взуттям, яке легко знімається. Якщо є грибок або рани — попередьте майстра заздалегідь.",
          ru: "Придите с чистыми ногами и удобной обувью, которую легко снять. Если есть грибок или раны — предупредите мастера заранее.",
          en: "Come with clean feet and easy-to-remove footwear. If you have a fungal infection or wounds, let your technician know in advance.",
        },
      },
    ],
    related: ['manicure', 'nail-extensions', 'waxing'],
  },
  {
    slug: 'haircut',
    query: 'haircut',
    emoji: '✂️',
    name: { uk: 'Стрижка', ru: 'Стрижка', en: 'Haircut' },
    tagline: {
      uk: 'Правильна стрижка змінює все — знайдіть свого майстра',
      ru: 'Правильная стрижка меняет всё — найдите своего мастера',
      en: 'The right haircut changes everything — find your stylist',
    },
    intro: {
      uk: "Стрижка — це базова послуга, яка задає тон усьому образу. Хороший стиліст враховує форму обличчя, структуру волосся та ваш ритм життя. На МійЗапис ви знайдете майстрів із підтвердженими портфоліо і зможете записатись онлайн без зайвих дзвінків — просто оберіть час і прийдіть.",
      ru: "Стрижка — это базовая услуга, которая задаёт тон всему образу. Хороший стилист учитывает форму лица, структуру волос и ваш ритм жизни. На МійЗапис вы найдёте мастеров с подтверждёнными портфолио и сможете записаться онлайн без лишних звонков — просто выберите время и приходите.",
      en: "A haircut is the foundation of any look. A great stylist considers your face shape, hair texture, and lifestyle. On MiyZapis you can find verified stylists with real portfolios and book online in seconds — choose a time and walk in.",
    },
    whatToExpect: {
      uk: "Хороша стрижка починається з консультації: майстер обговорює форму, довжину та техніку — наприклад, стрижку на верстаті, ножицями або за допомогою рейзора. Зверніть увагу на відгуки клієнтів із вашим типом волосся.",
      ru: "Хорошая стрижка начинается с консультации: мастер обсуждает форму, длину и технику — например, стрижку машинкой, ножницами или бритвой. Обращайте внимание на отзывы клиентов с вашим типом волос.",
      en: "A great haircut starts with a consultation: the stylist discusses shape, length, and technique — clippers, scissors, or razor cut. Pay attention to reviews from clients with your hair type.",
    },
    priceHint: {
      uk: "Стрижка в українських салонах коштує від 200 до 700 ₴. Вартість залежить від міста, довжини волосся та рівня майстра.",
      ru: "Стрижка в украинских салонах стоит от 200 до 700 ₴. Стоимость зависит от города, длины волос и уровня мастера.",
      en: "A haircut at Ukrainian salons costs from 200 to 700 ₴. Price varies by city, hair length, and stylist seniority.",
    },
    faqs: [
      {
        q: {
          uk: 'Як часто потрібно стригтися?',
          ru: 'Как часто нужно стричься?',
          en: 'How often should I get a haircut?',
        },
        a: {
          uk: "Для підтримки форми — кожні 6–8 тижнів. Якщо ви відрощуєте волосся, достатньо підстригати кінчики раз на 2–3 місяці.",
          ru: "Для поддержания формы — каждые 6–8 недель. Если вы отращиваете волосы, достаточно подстригать кончики раз в 2–3 месяца.",
          en: "To maintain shape — every 6–8 weeks. If you're growing your hair out, trimming the ends every 2–3 months is enough.",
        },
      },
      {
        q: {
          uk: 'Як пояснити майстру, яку стрижку я хочу?',
          ru: 'Как объяснить мастеру, какую стрижку я хочу?',
          en: 'How do I explain to my stylist what cut I want?',
        },
        a: {
          uk: "Принесіть кілька фото — це найшвидший і найнадійніший спосіб. Доповніть деталями: довжина на потилиці, чи хочете чубчик, наскільки об'ємно.",
          ru: "Принесите несколько фото — это самый быстрый и надёжный способ. Дополните деталями: длина на затылке, хотите ли чёлку, насколько объёмно.",
          en: "Bring a few reference photos — it's the fastest and clearest method. Add details: nape length, whether you want a fringe, and how much volume you prefer.",
        },
      },
      {
        q: {
          uk: "Чи можна записатись на стрижку онлайн?",
          ru: "Можно ли записаться на стрижку онлайн?",
          en: "Can I book a haircut online?",
        },
        a: {
          uk: "Так, саме для цього існує МійЗапис. Оберіть майстра, зручний час і підтвердіть запис — все без телефонних дзвінків.",
          ru: "Да, именно для этого существует МійЗапис. Выберите мастера, удобное время и подтвердите запись — всё без телефонных звонков.",
          en: "Yes — that's exactly what MiyZapis is for. Choose a stylist, pick a time slot, and confirm your booking online.",
        },
      },
      {
        q: {
          uk: 'Стрижка сухим чи вологим волоссям — яка різниця?',
          ru: 'Стрижка сухим или мокрым волосом — в чём разница?',
          en: 'Dry cut vs wet cut — what is the difference?',
        },
        a: {
          uk: "Стрижка вологим волоссям дає точнішу лінію — ідеально для класичних форм. Суха стрижка краще враховує природне падіння волосся і підходить для кучерявого типу.",
          ru: "Стрижка влажным волосом даёт более точную линию — идеально для классических форм. Сухая стрижка лучше учитывает естественное падение волос и подходит для кудрявого типа.",
          en: "Wet cutting gives a precise line — ideal for classic shapes. Dry cutting works with the hair's natural fall and suits curly types especially well.",
        },
      },
    ],
    related: ['hair-coloring', 'hair-styling', 'barber'],
  },
  {
    slug: 'hair-coloring',
    query: 'hair coloring',
    emoji: '🎨',
    name: { uk: 'Фарбування волосся', ru: 'Окрашивание волос', en: 'Hair Coloring' },
    tagline: {
      uk: 'Новий колір — новий настрій. Довірте волосся професіоналу',
      ru: 'Новый цвет — новое настроение. Доверьте волосы профессионалу',
      en: 'New colour, new mood. Entrust your hair to a professional',
    },
    intro: {
      uk: "Фарбування волосся — це один із найбільших трендів у світі б'юті, і якість результату повністю залежить від майстра. На МійЗапис ви знайдете колористів із реальними фото робіт, зможете порівняти ціни та записатися онлайн без черги. Довірте свій колір людині, чиї роботи вам вже подобаються.",
      ru: "Окрашивание волос — один из главных б'юти-трендов, и качество результата полностью зависит от мастера. На МійЗапис вы найдёте колористов с реальными фото работ, сможете сравнить цены и записаться онлайн без очереди. Доверьте свой цвет тому, чьи работы вам уже нравятся.",
      en: "Hair coloring is one of the biggest beauty trends, and the result depends entirely on the colorist. On MiyZapis you can find color specialists with genuine portfolio photos, compare prices, and book online without waiting. Trust your color to someone whose work you already love.",
    },
    whatToExpect: {
      uk: "Якісне фарбування починається з консультації та тест-нанесення на чутливій шкірі. Майстер оцінює стан волосся перед вибором техніки — балаяж, омбре, класичне суцільне фарбування або мелірування. Зверніть увагу на відгуки щодо стану волосся після процедури.",
      ru: "Качественное окрашивание начинается с консультации и тест-нанесения на чувствительной коже. Мастер оценивает состояние волос перед выбором техники — балаяж, омбре, классическое сплошное окрашивание или мелирование. Обращайте внимание на отзывы о состоянии волос после процедуры.",
      en: "Quality coloring starts with a consultation and a skin-sensitivity patch test. The colorist assesses your hair condition before choosing the technique — balayage, ombré, full color, or highlights. Pay attention to reviews mentioning hair condition after the service.",
    },
    priceHint: {
      uk: "Фарбування волосся в Україні коштує від 400 до 2 500 ₴ залежно від техніки, довжини та міста. Балаяж і складні техніки зазвичай дорожчі.",
      ru: "Окрашивание волос в Украине стоит от 400 до 2 500 ₴ в зависимости от техники, длины и города. Балаяж и сложные техники обычно дороже.",
      en: "Hair coloring in Ukraine costs from 400 to 2 500 ₴ depending on technique, length, and city. Balayage and complex techniques are typically priced higher.",
    },
    faqs: [
      {
        q: {
          uk: 'Як довго тримається фарбування?',
          ru: 'Как долго держится окрашивание?',
          en: 'How long does hair color last?',
        },
        a: {
          uk: "Стійке фарбування зберігається 4–6 тижнів, після чого потрібне підфарбовування коренів. Балаяж виглядає природно довше — 3–5 місяців.",
          ru: "Стойкое окрашивание держится 4–6 недель, после чего нужна подкраска корней. Балаяж выглядит естественно дольше — 3–5 месяцев.",
          en: "Permanent color lasts 4–6 weeks before roots need touching up. Balayage looks natural for longer — 3–5 months.",
        },
      },
      {
        q: {
          uk: 'Чи шкодить фарбування волоссю?',
          ru: 'Вредит ли окрашивание волосам?',
          en: 'Does hair coloring damage hair?',
        },
        a: {
          uk: "Будь-яке хімічне фарбування певною мірою впливає на структуру волосся. Якісні фарби та правильний доглядовий ритуал суттєво мінімізують пошкодження.",
          ru: "Любое химическое окрашивание в той или иной степени влияет на структуру волос. Качественные краски и правильный уход существенно минимизируют повреждения.",
          en: "Any chemical coloring affects hair structure to some degree. Quality dyes and a proper care routine significantly minimize damage.",
        },
      },
      {
        q: {
          uk: 'Що таке балаяж і чим він відрізняється від мелірування?',
          ru: 'Что такое балаяж и чем он отличается от мелирования?',
          en: 'What is balayage and how does it differ from highlights?',
        },
        a: {
          uk: "Балаяж наноситься вручну для плавного природного переходу кольору. Мелірування — техніка з використанням фольги, що дає чіткіші, контрастніші пасма.",
          ru: "Балаяж наносится вручную для плавного натурального перехода цвета. Мелирование — техника с использованием фольги, дающая более чёткие, контрастные пряди.",
          en: "Balayage is hand-painted for a seamless, natural-looking transition. Traditional highlights use foils and produce more defined, contrasted streaks.",
        },
      },
      {
        q: {
          uk: 'Як підготуватися до фарбування?',
          ru: 'Как подготовиться к окрашиванию?',
          en: 'How should I prepare for hair coloring?',
        },
        a: {
          uk: "Не мийте волосся за 1–2 дні до процедури — натуральний жир захищає шкіру голови. Повідомте колориста про попередні фарбування або хімічні процедури.",
          ru: "Не мойте волосы за 1–2 дня до процедуры — натуральный жир защищает кожу головы. Сообщите колористу о предыдущих окрашиваниях или химических процедурах.",
          en: "Avoid washing your hair 1–2 days before — natural oils protect the scalp during coloring. Tell your colorist about any previous chemical treatments.",
        },
      },
    ],
    related: ['haircut', 'hair-styling', 'cosmetology'],
  },
  {
    slug: 'hair-styling',
    query: 'hair styling',
    emoji: '💇',
    name: { uk: 'Укладання волосся', ru: 'Укладка волос', en: 'Hair Styling' },
    tagline: {
      uk: 'Ідеальна укладка для будь-якого приводу — від повсякдення до весілля',
      ru: 'Идеальная укладка для любого повода — от повседневности до свадьбы',
      en: 'Perfect styling for any occasion — from everyday to wedding day',
    },
    intro: {
      uk: "Укладання волосся перетворює будь-який образ. Незалежно від того, чи готуєтесь ви до важливої події, чи просто хочете освіжити вигляд, — на МійЗапис ви знайдете досвідченого стиліста та запишетесь онлайн. Оберіть майстра за портфоліо і приходьте вже готовою до зйомки чи урочистості.",
      ru: "Укладка волос преображает любой образ. Готовитесь ли вы к важному событию или просто хотите освежить вид — на МійЗапис вы найдёте опытного стилиста и запишетесь онлайн. Выбирайте мастера по портфолио и приходите готовой к съёмке или торжеству.",
      en: "Hair styling transforms any look. Whether you're preparing for a big event or just want a polished finish, MiyZapis lets you find an experienced stylist and book online. Browse portfolios and arrive ready for the spotlight.",
    },
    whatToExpect: {
      uk: "Стиліст підбирає техніку укладання залежно від типу волосся та бажаного результату — вечірня зачіска, локони, пряме укладання або об'ємний феновий. Для складних весільних зачісок краще заздалегідь зробити пробну укладку.",
      ru: "Стилист подбирает технику укладки в зависимости от типа волос и желаемого результата — вечерняя причёска, локоны, прямая укладка или объёмный фен. Для сложных свадебных причёсок лучше заранее сделать пробную укладку.",
      en: "The stylist chooses a technique based on hair type and desired look — evening updo, curls, blow-dry, or voluminous blowout. For complex wedding styles, a trial session beforehand is strongly recommended.",
    },
    priceHint: {
      uk: "Укладання волосся в Україні коштує від 200 до 1 000 ₴. Вечірні та весільні зачіски зазвичай дорожчі за повсякденне укладання.",
      ru: "Укладка волос в Украине стоит от 200 до 1 000 ₴. Вечерние и свадебные причёски обычно дороже повседневной укладки.",
      en: "Hair styling in Ukraine costs from 200 to 1 000 ₴. Evening and bridal styles are typically priced higher than everyday blow-dry sessions.",
    },
    faqs: [
      {
        q: {
          uk: 'Скільки тримається вечірня зачіска?',
          ru: 'Сколько держится вечерняя причёска?',
          en: 'How long does an evening hairstyle hold?',
        },
        a: {
          uk: "З правильними засобами фіксації — 8–12 годин. Для особливих подій попросіть майстра використати лак із сильною фіксацією або шпильки для надійності.",
          ru: "С правильными средствами фиксации — 8–12 часов. Для особых поводов попросите мастера использовать лак с сильной фиксацией или шпильки для надёжности.",
          en: "With the right finishing products — 8–12 hours. For important events, ask your stylist to use strong-hold spray or pins for extra security.",
        },
      },
      {
        q: {
          uk: 'Чи потрібна пробна укладка перед весіллям?',
          ru: 'Нужна ли пробная укладка перед свадьбой?',
          en: 'Do I need a trial run before my wedding?',
        },
        a: {
          uk: "Так, пробна укладка обов'язкова — вона дозволяє узгодити деталі та переконатися, що стиль підходить вашому образу і вдягненню.",
          ru: "Да, пробная укладка обязательна — она позволяет согласовать детали и убедиться, что стиль подходит вашему образу и наряду.",
          en: "Yes, a trial is essential — it lets you finalize details and make sure the style complements your overall look and outfit.",
        },
      },
      {
        q: {
          uk: 'Як підготувати волосся до укладання?',
          ru: 'Как подготовить волосы к укладке?',
          en: 'How should I prepare my hair for styling?',
        },
        a: {
          uk: "Вимийте волосся перед процедурою і не наносьте важкі кондиціонери — вони ускладнюють фіксацію. Прийдіть із сухим або злегка вологим волоссям.",
          ru: "Вымойте волосы перед процедурой и не наносите тяжёлые кондиционеры — они затрудняют фиксацию. Приходите с сухими или слегка влажными волосами.",
          en: "Wash your hair before the appointment and skip heavy conditioners — they make it harder to hold a style. Arrive with dry or slightly damp hair.",
        },
      },
      {
        q: {
          uk: 'Які зачіски зараз у тренді?',
          ru: 'Какие причёски сейчас в тренде?',
          en: 'What hairstyles are trending right now?',
        },
        a: {
          uk: "Серед актуальних трендів — об'ємний blow-dry, низькі хвилясті хвости, текстурні пучки і класичні локони. Покажіть майстрові фото — він підбере те, що пасує саме вам.",
          ru: "Среди актуальных трендов — объёмный блоу-драй, низкие волнистые хвосты, текстурные пучки и классические локоны. Покажите мастеру фото — он подберёт то, что подходит именно вам.",
          en: "Current trends include voluminous blow-drys, low wavy ponytails, textured buns, and classic curls. Show your stylist a reference photo and they'll tailor it to you.",
        },
      },
    ],
    related: ['haircut', 'hair-coloring', 'makeup'],
  },
  {
    slug: 'massage',
    query: 'massage',
    emoji: '💆',
    name: { uk: 'Масаж', ru: 'Массаж', en: 'Massage' },
    tagline: {
      uk: "Розслабтеся і відновіться — ваше тіло заслуговує на відпочинок",
      ru: "Расслабьтесь и восстановитесь — ваше тело заслуживает отдыха",
      en: "Relax and recover — your body deserves a break",
    },
    intro: {
      uk: "Масаж — один із найефективніших способів зняти напругу, покращити кровообіг і відновити енергію. На МійЗапис ви знайдете сертифікованих масажистів із відгуками реальних клієнтів і зможете записатись онлайн у зручний час. Оберіть тип масажу та спеціаліста — і прийдіть на сеанс без зайвого стресу.",
      ru: "Массаж — один из самых эффективных способов снять напряжение, улучшить кровообращение и восстановить энергию. На МійЗапис вы найдёте сертифицированных массажистов с реальными отзывами и запишетесь онлайн в удобное время. Выберите тип массажа и специалиста — и приходите на сеанс без лишнего стресса.",
      en: "Massage is one of the most effective ways to release tension, improve circulation, and restore energy. On MiyZapis you can find certified massage therapists with genuine reviews and book online at a time that suits you. Choose your massage type and specialist — and arrive ready to unwind.",
    },
    whatToExpect: {
      uk: "На першому сеансі майстер уточнює ваші потреби — зони напруги, бажана інтенсивність, наявність протипоказань. Класичний, спортивний, лімфодренажний та антицелюлітний масаж мають різні техніки та цілі. Повідомте про хронічні захворювання або болі заздалегідь.",
      ru: "На первом сеансе мастер уточняет ваши потребности — зоны напряжения, желаемая интенсивность, наличие противопоказаний. Классический, спортивный, лимфодренажный и антицеллюлитный массаж имеют разные техники и цели. Сообщите о хронических заболеваниях или болях заранее.",
      en: "At the first session your therapist will ask about your needs — tension areas, preferred pressure, and any contraindications. Classic, sports, lymphatic drainage, and anti-cellulite massage each have different techniques and goals. Mention any chronic conditions or pain areas upfront.",
    },
    priceHint: {
      uk: "Масаж в Україні коштує від 400 до 1 500 ₴ за сеанс залежно від виду, тривалості та міста.",
      ru: "Массаж в Украине стоит от 400 до 1 500 ₴ за сеанс в зависимости от вида, продолжительности и города.",
      en: "Massage in Ukraine costs from 400 to 1 500 ₴ per session depending on the type, duration, and city.",
    },
    faqs: [
      {
        q: {
          uk: "Як часто робити масаж?",
          ru: "Как часто делать массаж?",
          en: "How often should I get a massage?",
        },
        a: {
          uk: "Для профілактики та розслаблення — раз на 2–4 тижні. Курс лікувального масажу зазвичай складається з 10 сеансів через день або щодня.",
          ru: "Для профилактики и расслабления — раз в 2–4 недели. Курс лечебного массажа обычно состоит из 10 сеансов через день или ежедневно.",
          en: "For maintenance and relaxation — once every 2–4 weeks. A therapeutic course typically consists of 10 sessions every other day or daily.",
        },
      },
      {
        q: {
          uk: "Чи є протипоказання до масажу?",
          ru: "Есть ли противопоказания для массажа?",
          en: "Are there contraindications for massage?",
        },
        a: {
          uk: "Так: гострі запалення, тромбози, онкологія, висока температура та деякі шкірні захворювання. Завжди консультуйтесь із лікарем при сумнівах.",
          ru: "Да: острые воспаления, тромбозы, онкология, высокая температура и некоторые кожные заболевания. При сомнениях всегда консультируйтесь с врачом.",
          en: "Yes: acute inflammation, thrombosis, oncological conditions, fever, and certain skin conditions. When in doubt, always consult a doctor first.",
        },
      },
      {
        q: {
          uk: "Який масаж краще для зняття стресу?",
          ru: "Какой массаж лучше для снятия стресса?",
          en: "Which massage is best for stress relief?",
        },
        a: {
          uk: "Класичний релаксуючий масаж або масаж голови та шиї чудово знімають стрес. Для глибшої роботи з м'язами підійде deep tissue масаж.",
          ru: "Классический расслабляющий массаж или массаж головы и шеи отлично снимают стресс. Для глубокой работы с мышцами подойдёт deep tissue массаж.",
          en: "Classic relaxation massage or head-and-neck massage are excellent for stress relief. For deeper muscle work, deep tissue massage is the right choice.",
        },
      },
      {
        q: {
          uk: "Як підготуватися до масажу?",
          ru: "Как подготовиться к массажу?",
          en: "How should I prepare for a massage?",
        },
        a: {
          uk: "Не їжте важку їжу за 1–1,5 години до сеансу. Прийдіть чистим і без сильних парфумів. Після масажу пийте більше води — це допомагає вивести токсини.",
          ru: "Не ешьте тяжёлую пищу за 1–1,5 часа до сеанса. Приходите чистым и без сильных духов. После массажа пейте больше воды — это помогает вывести токсины.",
          en: "Avoid heavy food 1–1.5 hours before the session. Come clean and without strong perfume. After the massage, drink plenty of water to help flush out toxins.",
        },
      },
    ],
    related: ['cosmetology', 'spa', 'hair-removal'],
  },
  {
    slug: 'cosmetology',
    query: 'cosmetology',
    emoji: '🧴',
    name: { uk: 'Косметологія', ru: 'Косметология', en: 'Cosmetology' },
    tagline: {
      uk: "Професійний догляд за шкірою — інвестиція, яка видно одразу",
      ru: "Профессиональный уход за кожей — инвестиция, которая видна сразу",
      en: "Professional skincare — an investment that shows immediately",
    },
    intro: {
      uk: "Косметологія охоплює широкий спектр процедур для здоров'я та краси шкіри — від чищень і пілінгів до апаратних методів. На МійЗапис ви знайдете ліцензованих косметологів із реальними відгуками і зможете записатись онлайн у зручний час. Подбайте про свою шкіру з перевіреним фахівцем.",
      ru: "Косметология охватывает широкий спектр процедур для здоровья и красоты кожи — от чисток и пилингов до аппаратных методов. На МійЗапис вы найдёте лицензированных косметологов с реальными отзывами и запишетесь онлайн в удобное время. Заботьтесь о своей коже с проверенным специалистом.",
      en: "Cosmetology covers a wide range of skin health and beauty treatments — from cleansing and peels to device-based procedures. On MiyZapis you can find licensed cosmetologists with genuine reviews and book online. Take care of your skin with a verified professional.",
    },
    whatToExpect: {
      uk: "Перший прийом у косметолога починається з діагностики шкіри. Спеціаліст підбирає процедуру залежно від типу шкіри, проблем і сезону. Уточніть, чи є реабілітаційний період після процедури — деякі пілінги вимагають кількох днів відновлення.",
      ru: "Первый приём у косметолога начинается с диагностики кожи. Специалист подбирает процедуру в зависимости от типа кожи, проблем и сезона. Уточните, есть ли реабилитационный период после процедуры — некоторые пилинги требуют нескольких дней восстановления.",
      en: "The first cosmetology visit starts with a skin diagnosis. The specialist selects the procedure based on your skin type, concerns, and season. Ask whether there is a recovery period — some peels require a few days of downtime.",
    },
    priceHint: {
      uk: "Косметологічні процедури в Україні коштують від 400 до 2 500 ₴ за сеанс. Апаратні методи та ін'єкційні процедури зазвичай дорожчі.",
      ru: "Косметологические процедуры в Украине стоят от 400 до 2 500 ₴ за сеанс. Аппаратные методы и инъекционные процедуры обычно дороже.",
      en: "Cosmetology procedures in Ukraine cost from 400 to 2 500 ₴ per session. Device-based and injectable treatments are typically priced higher.",
    },
    faqs: [
      {
        q: {
          uk: "Як часто потрібно відвідувати косметолога?",
          ru: "Как часто нужно посещать косметолога?",
          en: "How often should I visit a cosmetologist?",
        },
        a: {
          uk: "Для базового підтримувального догляду — раз на місяць. Курс апаратних або пілінгових процедур зазвичай складається з 5–10 сеансів з перервою 7–14 днів.",
          ru: "Для базового поддерживающего ухода — раз в месяц. Курс аппаратных или пилинговых процедур обычно состоит из 5–10 сеансов с перерывом 7–14 дней.",
          en: "For basic maintenance care — once a month. A course of device or peel treatments typically consists of 5–10 sessions, 7–14 days apart.",
        },
      },
      {
        q: {
          uk: "Що таке чищення обличчя і чи боляче це?",
          ru: "Что такое чистка лица и больно ли это?",
          en: "What is a facial cleansing and does it hurt?",
        },
        a: {
          uk: "Чищення видаляє забруднення, відкриті та закриті комедони. Механічне чищення може бути дискомфортним, ультразвукове — безболісне. Косметолог підбере метод під ваш тип шкіри.",
          ru: "Чистка удаляет загрязнения, открытые и закрытые комедоны. Механическая чистка может быть дискомфортной, ультразвуковая — безболезненна. Косметолог подберёт метод под ваш тип кожи.",
          en: "Cleansing removes impurities, blackheads, and closed comedones. Manual extraction can be uncomfortable; ultrasonic cleansing is painless. Your cosmetologist will choose the method that suits your skin type.",
        },
      },
      {
        q: {
          uk: "Чи можна робити косметологічні процедури влітку?",
          ru: "Можно ли делать косметологические процедуры летом?",
          en: "Can I have cosmetology treatments in summer?",
        },
        a: {
          uk: "Деякі процедури (агресивні пілінги, лазер) не рекомендуються влітку через підвищену інсоляцію. Однак зволоження, мікрострумова терапія та м'які пілінги — цілком безпечні.",
          ru: "Некоторые процедуры (агрессивные пилинги, лазер) не рекомендуются летом из-за повышенной инсоляции. Однако увлажнение, микротоковая терапия и мягкие пилинги — вполне безопасны.",
          en: "Some procedures (aggressive peels, laser) are not recommended in summer due to high sun exposure. However, hydration facials, microcurrent therapy, and mild peels are perfectly safe.",
        },
      },
      {
        q: {
          uk: "Як підібрати косметолога?",
          ru: "Как подобрать косметолога?",
          en: "How do I choose a cosmetologist?",
        },
        a: {
          uk: "Перевірте наявність освіти та сертифікатів, прочитайте відгуки про результати (особливо фото до/після) і переконайтесь, що спеціаліст проводить попередню діагностику.",
          ru: "Проверьте наличие образования и сертификатов, прочитайте отзывы о результатах (особенно фото до/после) и убедитесь, что специалист проводит предварительную диагностику.",
          en: "Verify their education and certifications, read outcome reviews (especially before/after photos), and make sure the specialist conducts a skin assessment before any treatment.",
        },
      },
    ],
    related: ['massage', 'makeup', 'facial'],
  },
  {
    slug: 'makeup',
    query: 'makeup',
    emoji: '💄',
    name: { uk: 'Макіяж', ru: 'Макияж', en: 'Makeup' },
    tagline: {
      uk: "Макіяж від майстра — впевненість, яку видно",
      ru: "Макияж от мастера — уверенность, которую видно",
      en: "Makeup by a professional — confidence that shows",
    },
    intro: {
      uk: "Хороший макіяж підкреслює природну красу й тримається весь день. Незалежно від того, чи це повсякденний образ, чи вечірній вихід або весілля, — на МійЗапис ви знайдете досвідченого візажиста та запишетесь онлайн без черги. Оберіть майстра за його роботами і приходьте впевнено.",
      ru: "Хороший макияж подчёркивает природную красоту и держится весь день. Будь то повседневный образ, вечерний выход или свадьба — на МійЗапис вы найдёте опытного визажиста и запишетесь онлайн без очереди. Выбирайте мастера по его работам и приходите уверенно.",
      en: "Great makeup enhances natural beauty and lasts all day. Whether it's an everyday look, an evening out, or a wedding — MiyZapis lets you find an experienced makeup artist and book online without the wait. Browse their work and arrive with confidence.",
    },
    whatToExpect: {
      uk: "Майстер обговорює ваш образ заздалегідь: стиль (натуральний, вечірній, smoky eye), привід та вподобання щодо покриття. Хороший візажист враховує колір шкіри, форму очей і тип заходу. Для весільного макіяжу рекомендується пробний сеанс.",
      ru: "Мастер обсуждает ваш образ заранее: стиль (натуральный, вечерний, smoky eye), повод и предпочтения по перекрытию. Хороший визажист учитывает цвет кожи, форму глаз и тип мероприятия. Для свадебного макияжа рекомендуется пробный сеанс.",
      en: "Your makeup artist discusses the look in advance: style (natural, evening, smoky eye), occasion, and coverage preferences. A great artist considers your skin tone, eye shape, and event type. A trial session is recommended for bridal makeup.",
    },
    priceHint: {
      uk: "Макіяж в Україні коштує від 400 до 1 500 ₴. Весільний макіяж та складні вечірні образи зазвичай дорожчі за денний або натуральний.",
      ru: "Макияж в Украине стоит от 400 до 1 500 ₴. Свадебный макияж и сложные вечерние образы обычно дороже дневного или натурального.",
      en: "Makeup in Ukraine costs from 400 to 1 500 ₴. Bridal and complex evening looks are typically priced higher than daytime or natural styles.",
    },
    faqs: [
      {
        q: {
          uk: "Скільки часу займає макіяж?",
          ru: "Сколько времени занимает макияж?",
          en: "How long does makeup take?",
        },
        a: {
          uk: "Денний або натуральний макіяж — 30–45 хвилин. Вечірній або весільний образ може займати від 1,5 до 2,5 годин залежно від складності.",
          ru: "Дневной или натуральный макияж — 30–45 минут. Вечерний или свадебный образ может занимать от 1,5 до 2,5 часов в зависимости от сложности.",
          en: "Daytime or natural makeup — 30–45 minutes. An evening or bridal look can take 1.5 to 2.5 hours depending on complexity.",
        },
      },
      {
        q: {
          uk: "Чи потрібно приходити з підготовленою шкірою?",
          ru: "Нужно ли приходить с подготовленной кожей?",
          en: "Should I arrive with prepped skin?",
        },
        a: {
          uk: "Так: очищена, зволожена шкіра — ідеальна основа. Уникайте жирних кремів безпосередньо перед процедурою, оскільки вони ускладнюють нанесення тональної основи.",
          ru: "Да: очищенная, увлажнённая кожа — идеальная основа. Избегайте жирных кремов непосредственно перед процедурой, так как они затрудняют нанесение тонального крема.",
          en: "Yes: clean, moisturized skin is the ideal canvas. Avoid heavy creams right before the appointment, as they can interfere with foundation application.",
        },
      },
      {
        q: {
          uk: "Чи можна попросити навчити техніці нанесення?",
          ru: "Можно ли попросить обучить технике нанесения?",
          en: "Can I ask for a makeup lesson during the session?",
        },
        a: {
          uk: "Так, багато візажистів пропонують формат майстер-класу або навчального сеансу. Уточніть цей формат заздалегідь при записі через МійЗапис.",
          ru: "Да, многие визажисты предлагают формат мастер-класса или обучающего сеанса. Уточните этот формат заранее при записи через МійЗапис.",
          en: "Yes, many makeup artists offer a tutorial or lesson format. Clarify this option in advance when booking through MiyZapis.",
        },
      },
      {
        q: {
          uk: "Які продукти використовує майстер?",
          ru: "Какие продукты использует мастер?",
          en: "What products does the makeup artist use?",
        },
        a: {
          uk: "Більшість професійних візажистів працюють із брендами MAC, NYX, Charlotte Tilbury, Giorgio Armani та іншими. Якщо у вас алергія на певні компоненти, повідомте майстрові заздалегідь.",
          ru: "Большинство профессиональных визажистов работают с брендами MAC, NYX, Charlotte Tilbury, Giorgio Armani и другими. Если у вас аллергия на определённые компоненты, сообщите мастеру заранее.",
          en: "Most professional makeup artists work with brands like MAC, NYX, Charlotte Tilbury, Giorgio Armani, and others. If you have allergies to specific ingredients, let your artist know in advance.",
        },
      },
    ],
    related: ['hair-styling', 'cosmetology', 'brows'],
  },
];
