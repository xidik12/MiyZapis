import type { SeoService } from './seo.types';

export const SERVICES_B: SeoService[] = [
  {
    slug: 'lash-extensions',
    query: 'lash extensions',
    emoji: '👁️',
    name: {
      uk: 'Нарощування вій',
      ru: 'Наращивание ресниц',
      en: 'Lash extensions',
    },
    tagline: {
      uk: 'Виразний погляд без туші щодня',
      ru: 'Выразительный взгляд без туши каждый день',
      en: 'Stunning eyes without mascara every day',
    },
    intro: {
      uk: "Нарощування вій — один з найпопулярніших б'юті-сервісів, який дозволяє прокинутися з ідеальним макіяжем. Сертифікований майстер підбирає довжину, вигин та кількість пучків індивідуально під форму ваших очей. Знайдіть перевіреного фахівця поруч і забронюйте зручний час на МійЗапис — без черг і дзвінків.",
      ru: "Наращивание ресниц — один из самых востребованных бьюти-сервисов, который позволяет просыпаться с идеальным макияжем. Сертифицированный мастер подбирает длину, изгиб и количество пучков индивидуально под форму ваших глаз. Найдите проверенного специалиста рядом и запишитесь онлайн через МийЗапис — без очередей и звонков.",
      en: "Lash extensions are one of the most sought-after beauty services, letting you wake up with a polished look every morning. A certified lash artist selects the length, curl, and volume to complement your eye shape perfectly. Find a trusted specialist near you and book your appointment on MiyZapys — no queues, no phone calls.",
    },
    whatToExpect: {
      uk: "Процедура займає від 1,5 до 3 годин залежно від техніки — класика, 2D/3D або об'ємне нарощування. Зверніть увагу на матеріали: якісний клей і сертифіковані штучні вії мінімізують ризик алергії та забезпечують тривалий результат до 3–4 тижнів.",
      ru: "Процедура занимает от 1,5 до 3 часов в зависимости от техники — классика, 2D/3D или объёмное наращивание. Обратите внимание на материалы: качественный клей и сертифицированные искусственные ресницы минимизируют риск аллергии и обеспечивают долгий результат до 3–4 недель.",
      en: "The procedure takes 1.5 to 3 hours depending on the technique — classic, 2D/3D, or volume lashes. Pay attention to materials: professional-grade adhesive and certified synthetic lashes minimise the risk of allergic reactions and keep your look fresh for 3–4 weeks.",
    },
    priceHint: {
      uk: "Вартість нарощування вій в Україні — від 400 до 1 200 ₴ залежно від техніки та регіону. Корекція обходиться дешевше і зазвичай коштує від 200 до 600 ₴.",
      ru: "Стоимость наращивания ресниц в Украине — от 400 до 1 200 ₴ в зависимости от техники и региона. Коррекция обходится дешевле и обычно стоит от 200 до 600 ₴.",
      en: "Lash extension prices in Ukraine range from 400 to 1,200 UAH depending on the technique and city. A fill (correction) is more affordable and typically costs 200–600 UAH.",
    },
    faqs: [
      {
        q: {
          uk: 'Чи шкідливе нарощування вій для власних?',
          ru: 'Вредно ли наращивание ресниц для собственных?',
          en: 'Do lash extensions damage natural lashes?',
        },
        a: {
          uk: "При правильній техніці та якісних матеріалах нарощування не шкодить природним віям. Ключове — досвідчений майстер і дотримання правил догляду.",
          ru: "При правильной технике и качественных материалах наращивание не вредит натуральным ресницам. Главное — опытный мастер и соблюдение правил ухода.",
          en: "When done correctly with professional materials, lash extensions do not damage natural lashes. The key factors are a skilled technician and proper aftercare.",
        },
      },
      {
        q: {
          uk: 'Скільки тримається нарощування?',
          ru: 'Сколько держится наращивание?',
          en: 'How long do lash extensions last?',
        },
        a: {
          uk: "Зазвичай 3–4 тижні до першої корекції. Термін залежить від природного циклу росту вій та правильного догляду вдома.",
          ru: "Обычно 3–4 недели до первой коррекции. Срок зависит от природного цикла роста ресниц и правильного домашнего ухода.",
          en: "Typically 3–4 weeks until the first fill. The exact duration depends on your natural lash growth cycle and how well you follow aftercare guidelines.",
        },
      },
      {
        q: {
          uk: 'Як підготуватися до процедури?',
          ru: 'Как подготовиться к процедуре?',
          en: 'How should I prepare for lash extensions?',
        },
        a: {
          uk: "Приходьте зі знятим макіяжем та чистими віями. Не використовуйте жирні креми або олії навколо очей за добу до процедури — це погіршує адгезію клею.",
          ru: "Приходите с чистым лицом без макияжа на ресницах. Не используйте жирные кремы или масла вокруг глаз за сутки до процедуры — это ухудшает адгезию клея.",
          en: "Arrive with clean lashes, free of mascara and eye makeup. Avoid oily creams or oils around the eye area for 24 hours before your appointment, as they interfere with adhesive bonding.",
        },
      },
      {
        q: {
          uk: "Яка різниця між класичним і об'ємним нарощуванням?",
          ru: 'В чём разница между классическим и объёмным наращиванием?',
          en: "What is the difference between classic and volume lashes?",
        },
        a: {
          uk: "При класиці до кожної природної вії кріпиться одна штучна — результат виглядає природно. Об'ємне нарощування передбачає кілька тонких вій у пучку (2D–6D) для пишного ефекту.",
          ru: "При классике к каждой натуральной ресничке крепится одна искусственная — результат выглядит естественно. Объёмное наращивание предполагает несколько тонких ресниц в пучке (2D–6D) для пышного эффекту.",
          en: "Classic lashing attaches one extension to each natural lash for a natural-looking result. Volume lashing fans multiple ultra-fine extensions (2D–6D) per natural lash for a fuller, more dramatic effect.",
        },
      },
    ],
    related: ['brows', 'makeup', 'facial'],
  },
  {
    slug: 'brows',
    query: 'eyebrows',
    emoji: '🤨',
    name: {
      uk: "Корекція та оформлення брів",
      ru: "Коррекция и оформление бровей",
      en: "Eyebrow shaping",
    },
    tagline: {
      uk: "Ідеальна форма, що підкреслює ваш образ",
      ru: "Идеальная форма, которая подчёркивает ваш образ",
      en: "Perfect shape that defines your look",
    },
    intro: {
      uk: "Правильно оформлені брови змінюють обличчя не гірше за повноцінний макіяж. Майстер підбирає форму з урахуванням типу обличчя, виправляє асиметрію та підкреслює природну красу. Запишіться до бров-майстра онлайн через МійЗапис — оберіть зручний час і салон поруч із вами.",
      ru: "Правильно оформленные брови меняют лицо не хуже полноценного макияжа. Мастер подбирает форму с учётом типа лица, исправляет асимметрию и подчёркивает природную красоту. Запишитесь к бров-мастеру онлайн через МийЗапис — выберите удобное время и салон рядом с вами.",
      en: "Well-groomed brows can transform your face as effectively as a full makeup look. A brow specialist designs the shape based on your face type, corrects asymmetry, and enhances your natural features. Book a brow appointment online on MiyZapys — choose the time and location that suit you best.",
    },
    whatToExpect: {
      uk: "Послуга включає корекцію форми (нитка, пінцет або воск) та тонування чи фарбування при необхідності. Хороший фахівець спочатку вимальовує ескіз та узгоджує форму перед початком процедури.",
      ru: "Услуга включает коррекцию формы (нить, пинцет или воск) и тонирование или окрашивание при необходимости. Хороший специалист сначала рисует эскиз и согласовывает форму до начала процедуры.",
      en: "The service includes shaping (threading, tweezing, or waxing) and tinting or colouring if needed. A good specialist will sketch the shape and confirm it with you before starting.",
    },
    priceHint: {
      uk: "Корекція брів коштує від 100 до 350 ₴, фарбування або тонування — від 150 до 400 ₴. Комплекс (корекція + фарба) зазвичай від 250 до 600 ₴.",
      ru: "Коррекция бровей стоит от 100 до 350 ₴, окрашивание или тонирование — от 150 до 400 ₴. Комплекс (коррекция + окраска) обычно от 250 до 600 ₴.",
      en: "Eyebrow shaping costs 100–350 UAH, tinting or dyeing 150–400 UAH. A combination service (shaping + tinting) typically runs 250–600 UAH.",
    },
    faqs: [
      {
        q: {
          uk: "Як часто потрібно робити корекцію брів?",
          ru: "Как часто нужно делать коррекцию бровей?",
          en: "How often should I get my eyebrows shaped?",
        },
        a: {
          uk: "Зазвичай рекомендується корекція раз на 3–4 тижні — залежно від швидкості росту волосся.",
          ru: "Обычно рекомендуется коррекция раз в 3–4 недели — в зависимости от скорости роста волос.",
          en: "Most specialists recommend shaping every 3–4 weeks, depending on how quickly your hair grows.",
        },
      },
      {
        q: {
          uk: "Що краще — нитка, пінцет чи воск?",
          ru: "Что лучше — нить, пинцет или воск?",
          en: "Which is better — threading, tweezing, or waxing?",
        },
        a: {
          uk: "Кожен метод має свої переваги: нитка дає чіткі контури, пінцет — точність, воск — швидкість на великих ділянках. Майстер підбере оптимальний варіант під чутливість вашої шкіри.",
          ru: "У каждого метода свои преимущества: нить даёт чёткие контуры, пинцет — точность, воск — скорость на больших участках. Мастер подберёт оптимальный вариант под чувствительность вашей кожи.",
          en: "Each method has its strengths: threading creates crisp lines, tweezing offers precision, and waxing is fast for larger areas. Your technician will choose the best approach for your skin sensitivity.",
        },
      },
      {
        q: {
          uk: "Чи можна відростити брови після тривалої корекції?",
          ru: "Можно ли отрастить брови после длительной коррекции?",
          en: "Can I grow my brows back after years of over-plucking?",
        },
        a: {
          uk: "Так, у більшості випадків волосся відростає, хоча може зайняти 2–4 місяці. Майстер допоможе скоригувати форму на перехідний період.",
          ru: "Да, в большинстве случаев волосы отрастают, хотя это может занять 2–4 месяца. Мастер поможет скорректировать форму на переходный период.",
          en: "Yes, in most cases brows do grow back, though it can take 2–4 months. A specialist can help manage the shape during the transition period.",
        },
      },
      {
        q: {
          uk: "Чи боляче фарбувати брови?",
          ru: "Больно ли красить брови?",
          en: "Does eyebrow tinting hurt?",
        },
        a: {
          uk: "Фарбування брів безболісне. Єдиний ризик — алергія на барвник, тому перед процедурою варто зробити тест-патч.",
          ru: "Окрашивание бровей безболезненно. Единственный риск — аллергия на краситель, поэтому перед процедурой стоит сделать тест-патч.",
          en: "Eyebrow tinting is painless. The only risk is a potential reaction to the dye, so it is recommended to do a patch test before your first appointment.",
        },
      },
    ],
    related: ['lash-extensions', 'makeup', 'facial'],
  },
  {
    slug: 'barber',
    query: 'barber',
    emoji: '💈',
    name: {
      uk: "Барбершоп — стрижка та догляд для чоловіків",
      ru: "Барбершоп — стрижка и уход для мужчин",
      en: "Barber — men's haircut and grooming",
    },
    tagline: {
      uk: "Класичний догляд для сучасного чоловіка",
      ru: "Классический уход для современного мужчины",
      en: "Classic grooming for the modern man",
    },
    intro: {
      uk: "Барбершоп — це не просто стрижка, а повноцінний ритуал догляду: укладання, гоління, оформлення бороди та доглянутий вигляд на виході. Барбери поєднують класичні техніки з сучасними трендами, підбираючи стиль під форму голови та спосіб життя клієнта. Знайдіть топ-барбера у своєму місті та запишіться онлайн на МійЗапис.",
      ru: "Барбершоп — это не просто стрижка, а полноценный ритуал ухода: укладка, бритьё, оформление бороды и ухоженный вид на выходе. Барберы сочетают классические техники с современными трендами, подбирая стиль под форму головы и образ жизни клиента. Найдите топ-барбера в своём городе и запишитесь онлайн на МийЗапис.",
      en: "A barbershop visit is more than a haircut — it is a full grooming ritual: cut, styling, shave, and beard shaping. Barbers blend classic techniques with modern trends, tailoring the look to your head shape and lifestyle. Find a top barber in your city and book online on MiyZapys.",
    },
    whatToExpect: {
      uk: "Хороший барбер починає зі стислої консультації — обговорює бажаний стиль, пропонує варіанти під тип волосся та форму обличчя. Зверніть увагу на портфоліо та відгуки: стабільна якість роботи важливіша за яскравий інтер'єр закладу.",
      ru: "Хороший барбер начинает с короткой консультации — обсуждает желаемый стиль, предлагает варианты под тип волос и форму лица. Обратите внимание на портфолио и отзывы: стабильное качество работы важнее яркого интерьера заведения.",
      en: "A good barber starts with a brief consultation — discussing the desired style and recommending options based on hair type and face shape. Check the portfolio and reviews: consistent quality matters more than flashy décor.",
    },
    priceHint: {
      uk: "Чоловіча стрижка в барбершопі коштує від 150 до 600 ₴ залежно від міста та рівня майстра. Комплекс зі стрижкою бороди — від 250 до 800 ₴.",
      ru: "Мужская стрижка в барбершопе стоит от 150 до 600 ₴ в зависимости от города и уровня мастера. Комплекс со стрижкой бороды — от 250 до 800 ₴.",
      en: "Men's haircuts at a barbershop cost 150–600 UAH depending on the city and the barber's level. A combo cut with beard trim typically runs 250–800 UAH.",
    },
    faqs: [
      {
        q: {
          uk: "Як часто чоловікові потрібна стрижка?",
          ru: "Как часто мужчине нужна стрижка?",
          en: "How often should men get a haircut?",
        },
        a: {
          uk: "Зазвичай раз на 3–5 тижнів для підтримки чіткої форми. Для довгого волосся — раз на 6–8 тижнів для оновлення кінчиків.",
          ru: "Обычно раз в 3–5 недель для поддержания чёткой формы. Для длинных волос — раз в 6–8 недель для обновления кончиков.",
          en: "Typically every 3–5 weeks to maintain a sharp shape. For longer hair, every 6–8 weeks is usually enough to freshen up the ends.",
        },
      },
      {
        q: {
          uk: "Чи потрібно записуватися наперед?",
          ru: "Нужно ли записываться заранее?",
          en: "Do I need to book in advance?",
        },
        a: {
          uk: "У популярних барберів запис може бути зайнятий на кілька днів наперед. Бронюйте через МійЗапис заздалегідь, щоб обрати зручний час.",
          ru: "У популярных барберов запись может быть занята на несколько дней вперёд. Бронируйте через МийЗапис заранее, чтобы выбрать удобное время.",
          en: "Popular barbers often get booked days in advance. Use MiyZapys to secure your preferred time slot without last-minute stress.",
        },
      },
      {
        q: {
          uk: "Що включає класичне гоління у барбершопі?",
          ru: "Что включает классическое бритьё в барбершопе?",
          en: "What does a classic straight-razor shave include?",
        },
        a: {
          uk: "Класичне гоління включає розпарювання шкіри гарячим рушником, нанесення піни або крему для гоління, гоління небезпечною бритвою та заспокійливу маску або лосьйон після процедури.",
          ru: "Классическое бритьё включает распаривание кожи горячим полотенцем, нанесение пены или крема для бритья, бритьё опасной бритвой и успокаивающую маску или лосьон после процедуры.",
          en: "A classic shave includes steaming the skin with a hot towel, applying shaving cream or soap, a straight-razor shave, and a soothing aftershave mask or lotion.",
        },
      },
      {
        q: {
          uk: "Як доглядати за бородою між візитами до барбера?",
          ru: "Как ухаживать за бородой между визитами к барберу?",
          en: "How do I maintain my beard between barber visits?",
        },
        a: {
          uk: "Використовуйте спеціальний шампунь та олію для бороди, розчісуйте її щодня і підрівнюйте контур триммером раз на тиждень.",
          ru: "Используйте специальный шампунь и масло для бороды, расчёсывайте её ежедневно и подравнивайте контур триммером раз в неделю.",
          en: "Use a dedicated beard shampoo and oil, comb daily, and tidy the edges with a trimmer once a week to keep things neat between appointments.",
        },
      },
    ],
    related: ['haircut', 'hair-styling', 'waxing'],
  },
  {
    slug: 'waxing',
    query: 'waxing',
    emoji: '🪒',
    name: {
      uk: "Шугаринг і депіляція воском",
      ru: "Шугаринг и депиляция воском",
      en: "Waxing and sugaring hair removal",
    },
    tagline: {
      uk: "Гладка шкіра на тижні вперед",
      ru: "Гладкая кожа на недели вперёд",
      en: "Silky-smooth skin for weeks ahead",
    },
    intro: {
      uk: "Депіляція воском або шугаринг — швидкий і ефективний спосіб позбутися небажаного волосся на тілі та обличчі. Процедура дає результат на 3–5 тижнів, а при регулярному використанні волосся стає рідшим та тоншим. Запишіться до майстра депіляції онлайн на МійЗапис і оберіть найзручніший час.",
      ru: "Депиляция воском или шугаринг — быстрый и эффективный способ избавиться от нежелательных волос на теле и лице. Процедура даёт результат на 3–5 недель, а при регулярном использовании волосы становятся реже и тоньше. Запишитесь к мастеру депиляции онлайн на МийЗапис и выберите удобное время.",
      en: "Waxing and sugaring are fast, effective ways to remove unwanted hair from the body and face. Results last 3–5 weeks, and with regular sessions hair tends to grow back finer and sparser. Book a waxing appointment online on MiyZapys and choose the time that works for you.",
    },
    whatToExpect: {
      uk: "Для ефективної депіляції волосся має бути не менше 3–5 мм завдовжки. Майстер наносить тепловий або холодний віск (або пасту для шугарингу), знімає його швидким рухом проти росту волосся та заспокоює шкіру спеціальними засобами після процедури.",
      ru: "Для эффективной депиляции волосы должны быть не менее 3–5 мм в длину. Мастер наносит тёплый или холодный воск (или пасту для шугаринга), снимает его быстрым движением против роста волос и успокаивает кожу специальными средствами после процедуры.",
      en: "For effective waxing or sugaring, hair should be at least 3–5 mm long. The technician applies warm or cold wax (or sugaring paste), removes it with a quick motion against the direction of hair growth, and soothes the skin with post-treatment products.",
    },
    priceHint: {
      uk: "Ціна залежить від зони: бікіні — від 200 до 600 ₴, ноги повністю — від 350 до 800 ₴, пахви — від 100 до 300 ₴. Шугаринг зазвичай у тій же ціновій категорії, що й воскова депіляція.",
      ru: "Цена зависит от зоны: бикини — от 200 до 600 ₴, ноги полностью — от 350 до 800 ₴, подмышки — от 100 до 300 ₴. Шугаринг обычно в той же ценовой категории, что и восковая депиляция.",
      en: "Pricing depends on the area: bikini 200–600 UAH, full legs 350–800 UAH, underarms 100–300 UAH. Sugaring is usually priced similarly to waxing.",
    },
    faqs: [
      {
        q: {
          uk: "Що болючіше — шугаринг чи депіляція воском?",
          ru: "Что болезненнее — шугаринг или депиляция воском?",
          en: "Which hurts more — waxing or sugaring?",
        },
        a: {
          uk: "Більшість клієнтів вважають шугаринг трохи менш болючим, оскільки паста знімається у напрямку росту волосся й менше чіпляє шкіру. Втім, відчуття індивідуальні.",
          ru: "Большинство клиентов считают шугаринг чуть менее болезненным, поскольку паста снимается по направлению роста волос и меньше захватывает кожу. Однако ощущения индивидуальны.",
          en: "Most clients find sugaring slightly less painful, as the paste is removed in the direction of hair growth and grips the skin less. That said, pain tolerance is very individual.",
        },
      },
      {
        q: {
          uk: "Як довго росте волосся після депіляції?",
          ru: "Как долго растут волосы после депиляции?",
          en: "How long before hair grows back after waxing?",
        },
        a: {
          uk: "Зазвичай 3–5 тижнів до помітного відростання. При регулярних процедурах цей термін збільшується.",
          ru: "Обычно 3–5 недель до заметного отрастания. При регулярных процедурах этот срок увеличивается.",
          en: "Typically 3–5 weeks before noticeable regrowth. With regular sessions, the hair-free period tends to lengthen over time.",
        },
      },
      {
        q: {
          uk: "Як підготуватися до депіляції?",
          ru: "Как подготовиться к депиляции?",
          en: "How should I prepare for a waxing session?",
        },
        a: {
          uk: "Не брийтеся за 2 тижні до процедури — волосся має відрости мінімум до 3–5 мм. Уникайте засмаги та відлущувальних процедур за 24 години до депіляції.",
          ru: "Не брейтесь за 2 недели до процедуры — волосы должны отрасти минимум до 3–5 мм. Избегайте загара и отшелушивающих процедур за 24 часа до депиляции.",
          en: "Avoid shaving for at least 2 weeks before your appointment so hair reaches 3–5 mm. Skip tanning and exfoliating treatments in the 24 hours before waxing.",
        },
      },
      {
        q: {
          uk: "Чи можна робити депіляцію під час місячних?",
          ru: "Можно ли делать депиляцию во время месячных?",
          en: "Can I get waxed during my period?",
        },
        a: {
          uk: "Технічно можна, але чутливість шкіри в цей час підвищена, тому відчуття можуть бути інтенсивнішими. Краще запланувати процедуру за тиждень до або після.",
          ru: "Технически можно, но чувствительность кожи в это время повышена, поэтому ощущения могут быть интенсивнее. Лучше запланировать процедуру за неделю до или после.",
          en: "Technically yes, but skin sensitivity is heightened during your period, making the experience more uncomfortable. It is generally better to schedule your appointment a week before or after.",
        },
      },
    ],
    related: ['hair-removal', 'spa', 'cosmetology'],
  },
  {
    slug: 'spa',
    query: 'spa',
    emoji: '🧖',
    name: {
      uk: "СПА-процедури та масаж",
      ru: "СПА-процедуры и массаж",
      en: "Spa treatments and massage",
    },
    tagline: {
      uk: "Відновіть сили й зніміть напругу",
      ru: "Восстановите силы и снимите напряжение",
      en: "Recharge and release tension",
    },
    intro: {
      uk: "СПА — це комплекс процедур для відновлення тіла й душі: від ароматичних масажів і обгортань до пілінгів та гідротерапії. Регулярні СПА-сеанси знімають стрес, покращують стан шкіри та загальне самопочуття. Знайдіть СПА-центр або масажиста у своєму місті та забронюйте сеанс онлайн на МійЗапис.",
      ru: "СПА — это комплекс процедур для восстановления тела и духа: от ароматических массажей и обёртываний до пилингов и гидротерапии. Регулярные СПА-сеансы снимают стресс, улучшают состояние кожи и общее самочувствие. Найдите СПА-центр или массажиста в своём городе и забронируйте сеанс онлайн на МийЗапис.",
      en: "Spa treatments encompass a wide range of body and mind renewal services — aromatic massages, body wraps, peels, and hydrotherapy. Regular spa sessions reduce stress, improve skin quality, and boost overall wellbeing. Find a spa centre or massage therapist in your city and book online on MiyZapys.",
    },
    whatToExpect: {
      uk: "Хороший СПА-центр пропонує індивідуальну консультацію перед процедурою для підбору програми під ваші потреби. Зверніть увагу на кваліфікацію масажистів і якість косметики, яку використовує заклад.",
      ru: "Хороший СПА-центр предлагает индивидуальную консультацию перед процедурой для подбора программы под ваши потребности. Обратите внимание на квалификацию массажистов и качество косметики, которую использует заведение.",
      en: "A quality spa will offer a brief consultation before your session to tailor the programme to your needs. Pay attention to therapist qualifications and the products the establishment uses.",
    },
    priceHint: {
      uk: "Класичний масаж тіла — від 400 до 1 200 ₴ за годину. СПА-програми (обгортання + масаж + скраб) — від 800 до 2 500 ₴ залежно від тривалості та складу.",
      ru: "Классический массаж тела — от 400 до 1 200 ₴ в час. СПА-программы (обёртывание + массаж + скраб) — от 800 до 2 500 ₴ в зависимости от продолжительности и состава.",
      en: "Classic full-body massage costs 400–1,200 UAH per hour. Full spa programmes (wrap + massage + scrub) range from 800 to 2,500 UAH depending on duration and components.",
    },
    faqs: [
      {
        q: {
          uk: "Яка різниця між релаксаційним і лікувальним масажем?",
          ru: "В чём разница между релаксационным и лечебным массажем?",
          en: "What is the difference between relaxation and therapeutic massage?",
        },
        a: {
          uk: "Релаксаційний масаж спрямований на зняття загальної напруги та стресу з рівномірним помірним тиском. Лікувальний (терапевтичний) масаж працює з конкретними проблемними зонами — м'язовими затисками, болем у спині тощо — і вимагає кваліфікованого фахівця.",
          ru: "Релаксационный массаж направлен на снятие общего напряжения и стресса с равномерным умеренным давлением. Лечебный (терапевтический) массаж работает с конкретными проблемными зонами — мышечными зажимами, болью в спине и т. д. — и требует квалифицированного специалиста.",
          en: "Relaxation massage focuses on relieving general tension and stress through even, moderate pressure. Therapeutic massage targets specific problem areas — muscle knots, back pain, etc. — and requires a trained specialist.",
        },
      },
      {
        q: {
          uk: "Як часто варто ходити на масаж?",
          ru: "Как часто стоит ходить на массаж?",
          en: "How often should I get a massage?",
        },
        a: {
          uk: "Для підтримання загального тонусу та зняття стресу — раз на 2–4 тижні. При конкретних скаргах (біль у спині тощо) фахівець може рекомендувати курс із 5–10 сеансів.",
          ru: "Для поддержания общего тонуса и снятия стресса — раз в 2–4 недели. При конкретных жалобах (боль в спине и т. д.) специалист может рекомендовать курс из 5–10 сеансов.",
          en: "For general wellness and stress relief, once every 2–4 weeks is a good rhythm. For specific complaints such as back pain, a therapist may recommend a course of 5–10 sessions.",
        },
      },
      {
        q: {
          uk: "Чи є протипоказання для СПА-процедур?",
          ru: "Есть ли противопоказания для СПА-процедур?",
          en: "Are there any contraindications for spa treatments?",
        },
        a: {
          uk: "Деякі процедури (масаж, теплові обгортання) протипоказані при вагітності, гострих запаленнях, варикозі, шкірних захворюваннях. Завжди повідомляйте майстра про стан здоров'я перед початком.",
          ru: "Некоторые процедуры (массаж, тепловые обёртывания) противопоказаны при беременности, острых воспалениях, варикозе, кожных заболеваниях. Всегда сообщайте мастеру о состоянии здоровья до начала процедуры.",
          en: "Some treatments (massage, heat wraps) are contraindicated during pregnancy, active inflammation, varicose veins, or skin conditions. Always inform your therapist about your health status before starting.",
        },
      },
      {
        q: {
          uk: "Що таке СПА-капсула і чим вона відрізняється від звичайного масажу?",
          ru: "Что такое СПА-капсула и чем она отличается от обычного массажа?",
          en: "What is a spa capsule and how does it differ from regular massage?",
        },
        a: {
          uk: "СПА-капсула — це апаратна процедура в закритій камері, що поєднує тепловий, водний та ароматичний вплив на тіло без участі масажиста. Вона розслабляє, покращує обмін речовин і виведення токсинів.",
          ru: "СПА-капсула — это аппаратная процедура в закрытой камере, которая сочетает тепловое, водное и ароматическое воздействие на тело без участия массажиста. Она расслабляет, улучшает обмен веществ и выведение токсинов.",
          en: "A spa capsule is a device-based treatment in an enclosed chamber combining heat, water jets, and aromatherapy without a therapist's hands. It relaxes the body, boosts metabolism, and aids detoxification.",
        },
      },
    ],
    related: ['massage', 'facial', 'waxing'],
  },
  {
    slug: 'nail-extensions',
    query: 'nail extensions',
    emoji: '💅',
    name: {
      uk: "Нарощування нігтів",
      ru: "Наращивание ногтей",
      en: "Nail extensions",
    },
    tagline: {
      uk: "Довгі, міцні нігті будь-якої форми",
      ru: "Длинные, крепкие ногти любой формы",
      en: "Long, strong nails in any shape you choose",
    },
    intro: {
      uk: "Нарощування нігтів дозволяє досягти бажаної довжини та форми незалежно від стану натуральних нігтів. Майстер використовує гель або акрил, формуючи міцне покриття, що тримається 3–4 тижні. Запишіться до нейл-майстра онлайн через МійЗапис і оберіть зручний час без очікування.",
      ru: "Наращивание ногтей позволяет достичь желаемой длины и формы независимо от состояния натуральных ногтей. Мастер использует гель или акрил, формируя прочное покрытие, которое держится 3–4 недели. Запишитесь к нейл-мастеру онлайн через МийЗапис и выберите удобное время без ожидания.",
      en: "Nail extensions let you achieve your desired length and shape regardless of your natural nail condition. The technician uses gel or acrylic to build a durable finish that lasts 3–4 weeks. Book a nail artist online on MiyZapys and choose your slot without waiting.",
    },
    whatToExpect: {
      uk: "Процедура нарощування займає від 1,5 до 3 годин. Майстер обробляє натуральний ніготь, накладає форму або типс і вирівнює структурою. Важлива стерильність інструментів та якість матеріалів — саме на це слід звертати увагу при виборі майстра.",
      ru: "Процедура наращивания занимает от 1,5 до 3 часов. Мастер обрабатывает натуральный ноготь, накладывает форму или типс и выравнивает структурой. Важна стерильность инструментов и качество материалов — именно на это стоит обращать внимание при выборе мастера.",
      en: "A nail extension session takes 1.5 to 3 hours. The technician prepares the natural nail, applies a form or tip, and builds up the structure. Sterile tools and quality materials are key indicators to look for when choosing a nail artist.",
    },
    priceHint: {
      uk: "Нарощування нігтів гелем або акрилом коштує від 400 до 1 200 ₴. Корекція кожні 3–4 тижні обходиться від 300 до 800 ₴.",
      ru: "Наращивание ногтей гелем или акрилом стоит от 400 до 1 200 ₴. Коррекция каждые 3–4 недели обходится от 300 до 800 ₴.",
      en: "Gel or acrylic nail extensions cost 400–1,200 UAH. Infills every 3–4 weeks typically run 300–800 UAH.",
    },
    faqs: [
      {
        q: {
          uk: "Гель чи акрил — що краще?",
          ru: "Гель или акрил — что лучше?",
          en: "Gel or acrylic — which is better?",
        },
        a: {
          uk: "Гель виглядає природніше та більш гнучкий, акрил — міцніший і підходить для дуже довгих форм. Вибір залежить від ваших уподобань і способу життя — майстер підкаже оптимальний варіант.",
          ru: "Гель выглядит натуральнее и более гибкий, акрил — прочнее и подходит для очень длинных форм. Выбор зависит от ваших предпочтений и образа жизни — мастер подскажет оптимальный вариант.",
          en: "Gel looks more natural and is more flexible; acrylic is stronger and suits very long shapes. The choice depends on your lifestyle and preferences — your nail tech will recommend the best option.",
        },
      },
      {
        q: {
          uk: "Чи шкодить нарощування натуральним нігтям?",
          ru: "Вредит ли наращивание натуральным ногтям?",
          en: "Do nail extensions damage natural nails?",
        },
        a: {
          uk: "При правильній техніці та якісних матеріалах шкода мінімальна. Ризик підвищується при неправильному знятті — завжди знімайте нарощені нігті у майстра, а не самостійно.",
          ru: "При правильной технике и качественных материалах вред минимален. Риск повышается при неправильном снятии — всегда снимайте нарощенные ногти у мастера, а не самостоятельно.",
          en: "With proper technique and quality products the damage is minimal. The main risk comes from improper removal — always have extensions removed by a professional, not yourself.",
        },
      },
      {
        q: {
          uk: "Як довго тримається нарощування без корекції?",
          ru: "Как долго держится наращивание без коррекции?",
          en: "How long do nail extensions last without a fill?",
        },
        a: {
          uk: "Зазвичай 3–4 тижні до появи відросту біля кутикули. Рекомендується не затягувати з корекцією довше 4 тижнів, щоб уникнути відриву.",
          ru: "Обычно 3–4 недели до появления отросшей зоны у кутикулы. Рекомендуется не затягивать с коррекцией дольше 4 недель, чтобы избежать отрыва.",
          en: "Typically 3–4 weeks before noticeable regrowth at the cuticle. It is advisable not to go longer than 4 weeks without a fill to avoid lifting or breakage.",
        },
      },
      {
        q: {
          uk: "Чи можна робити нарощування на дуже короткі нігті?",
          ru: "Можно ли делать наращивание на очень короткие ногти?",
          en: "Can nail extensions be done on very short nails?",
        },
        a: {
          uk: "Так, для дуже коротких нігтів майстер використовує типси або форми для нарощування, тому довжина стартового нігтя не є обмеженням.",
          ru: "Да, для очень коротких ногтей мастер использует типсы или формы для наращивания, поэтому длина стартового ногтя не является ограничением.",
          en: "Yes, for very short nails the technician uses tips or nail forms, so the starting nail length is not a limiting factor.",
        },
      },
    ],
    related: ['manicure', 'pedicure', 'lash-extensions'],
  },
  {
    slug: 'hair-removal',
    query: 'hair removal',
    emoji: '✨',
    name: {
      uk: "Лазерна та фотоепіляція",
      ru: "Лазерная и фотоэпиляция",
      en: "Laser and photo hair removal",
    },
    tagline: {
      uk: "Назавжди позбудьтеся небажаного волосся",
      ru: "Навсегда избавьтесь от нежелательных волос",
      en: "Permanent reduction of unwanted hair",
    },
    intro: {
      uk: "Лазерна та фотоепіляція — найефективніші методи тривалого видалення волосся. На відміну від бриття чи депіляції воском, вони впливають на волосяний фолікул і з часом суттєво зменшують або повністю усувають ріст волосся. Знайдіть перевірений салон і запишіться на консультацію через МійЗапис.",
      ru: "Лазерная и фотоэпиляция — наиболее эффективные методы долгосрочного удаления волос. В отличие от бритья или депиляции воском, они воздействуют на волосяной фолликул и со временем существенно снижают или полностью устраняют рост волос. Найдите проверенный салон и запишитесь на консультацию через МийЗапис.",
      en: "Laser and photo hair removal are the most effective methods for long-term hair reduction. Unlike shaving or waxing, they target the hair follicle itself and over a course of treatments significantly reduce or permanently eliminate hair growth. Find a trusted salon and book a consultation on MiyZapys.",
    },
    whatToExpect: {
      uk: "Повний курс зазвичай складається з 6–10 сеансів з інтервалом 4–6 тижнів — саме стільки потрібно, щоб охопити всі фази росту волосся. При виборі салону перевіряйте тип апарату та наявність ліцензії: від якості обладнання залежить і результат, і безпека.",
      ru: "Полный курс обычно состоит из 6–10 сеансов с интервалом 4–6 недель — именно столько нужно, чтобы охватить все фазы роста волос. При выборе салона проверяйте тип аппарата и наличие лицензии: от качества оборудования зависит и результат, и безопасность.",
      en: "A full course typically consists of 6–10 sessions spaced 4–6 weeks apart — enough to target all hair growth cycles. When choosing a salon, check the device type and certification: equipment quality directly affects both results and safety.",
    },
    priceHint: {
      uk: "Вартість одного сеансу залежить від зони: пахви — від 200 до 500 ₴, ноги повністю — від 600 до 1 500 ₴, обличчя — від 300 до 800 ₴. Багато студій пропонують пакети зі знижкою на повний курс.",
      ru: "Стоимость одного сеанса зависит от зоны: подмышки — от 200 до 500 ₴, ноги полностью — от 600 до 1 500 ₴, лицо — от 300 до 800 ₴. Многие студии предлагают пакеты со скидкой на полный курс.",
      en: "Per-session pricing depends on the area: underarms 200–500 UAH, full legs 600–1,500 UAH, face 300–800 UAH. Many studios offer discounted packages for full courses.",
    },
    faqs: [
      {
        q: {
          uk: "Скільки сеансів потрібно для стійкого результату?",
          ru: "Сколько сеансов нужно для стойкого результата?",
          en: "How many sessions are needed for permanent results?",
        },
        a: {
          uk: "Зазвичай 6–10 сеансів залежно від зони, типу шкіри та кольору волосся. Після курсу можуть знадобитися підтримувальні сеанси раз на рік.",
          ru: "Обычно 6–10 сеансов в зависимости от зоны, типа кожи и цвета волос. После курса могут понадобиться поддерживающие сеансы раз в год.",
          en: "Typically 6–10 sessions depending on the treatment area, skin type, and hair colour. After the initial course, annual maintenance sessions may be needed.",
        },
      },
      {
        q: {
          uk: "Чи підходить лазерна епіляція для всіх типів шкіри?",
          ru: "Подходит ли лазерная эпиляция для всех типов кожи?",
          en: "Is laser hair removal suitable for all skin types?",
        },
        a: {
          uk: "Сучасні апарати (діодний лазер, Nd:YAG) безпечно працюють з різними типами шкіри. Для темної шкіри важливо обрати відповідний тип лазера — про це розкаже спеціаліст на консультації.",
          ru: "Современные аппараты (диодный лазер, Nd:YAG) безопасно работают с различными типами кожи. Для тёмной кожи важно выбрать подходящий тип лазера — об этом расскажет специалист на консультации.",
          en: "Modern devices (diode laser, Nd:YAG) safely treat various skin types. For darker skin tones it is important to choose the right laser type — a specialist will advise you during the consultation.",
        },
      },
      {
        q: {
          uk: "Чи боляче робити лазерну епіляцію?",
          ru: "Больно ли делать лазерную эпиляцию?",
          en: "Is laser hair removal painful?",
        },
        a: {
          uk: "Більшість пацієнтів описують відчуття як легке пощипування або поклацування гумкою. Сучасні апарати мають вбудовані системи охолодження, що значно підвищує комфорт процедури.",
          ru: "Большинство пациентов описывают ощущения как лёгкое пощипывание или щелчки резинкой. Современные аппараты имеют встроенные системы охлаждения, что значительно повышает комфорт процедуры.",
          en: "Most clients describe the sensation as a mild snapping or stinging. Modern devices have built-in cooling systems that significantly improve comfort during the session.",
        },
      },
      {
        q: {
          uk: "Як підготуватися до першого сеансу лазерної епіляції?",
          ru: "Как подготовиться к первому сеансу лазерной эпиляции?",
          en: "How do I prepare for my first laser hair removal session?",
        },
        a: {
          uk: "За 24 години поголіть оброблювану зону, уникайте засмаги та нанесення автозасмаги мінімум 2 тижні до процедури. Не робіть депіляцію воском або шугарингом — корінь волосся має бути присутнім.",
          ru: "За 24 часа побрейте обрабатываемую зону, избегайте загара и нанесения автозагара минимум 2 недели до процедуры. Не делайте депиляцию воском или шугарингом — корень волоса должен присутствовать.",
          en: "Shave the treatment area 24 hours before the session and avoid sun exposure and self-tanner for at least 2 weeks prior. Do not wax or sugar — the hair root must be intact for the laser to work.",
        },
      },
    ],
    related: ['waxing', 'spa', 'cosmetology'],
  },
  {
    slug: 'facial',
    query: 'facial',
    emoji: '🧖‍♀️',
    name: {
      uk: "Догляд за обличчям (фейшал)",
      ru: "Уход за лицом (фейшал)",
      en: "Facial treatment",
    },
    tagline: {
      uk: "Здорова сяюча шкіра після кожного сеансу",
      ru: "Здоровая сияющая кожа после каждого сеанса",
      en: "Healthy, glowing skin after every session",
    },
    intro: {
      uk: "Фейшал — це професійний догляд за шкірою обличчя в умовах косметологічного кабінету: очищення, зволоження, живлення та усунення конкретних проблем (акне, пігментація, зневоднення). Регулярні процедури сповільнюють старіння та покращують тон шкіри. Знайдіть косметолога поруч і запишіться онлайн через МійЗапис.",
      ru: "Фейшал — это профессиональный уход за кожей лица в условиях косметологического кабинета: очищение, увлажнение, питание и устранение конкретных проблем (акне, пигментация, обезвоженность). Регулярные процедуры замедляют старение и улучшают тон кожи. Найдите косметолога рядом и запишитесь онлайн через МийЗапис.",
      en: "A facial is a professional skincare treatment performed in a beauty clinic: cleansing, hydration, nourishment, and targeted correction of specific concerns (acne, pigmentation, dehydration). Regular sessions slow down the ageing process and improve skin tone. Find a cosmetologist near you and book online on MiyZapys.",
    },
    whatToExpect: {
      uk: "Процедура зазвичай починається з очищення та аналізу шкіри, після чого косметолог підбирає відповідні маски, сироватки та масажні техніки. Зверніть увагу на те, чи є у фахівця медична або косметологічна освіта та чи він аналізує ваш тип шкіри перед початком.",
      ru: "Процедура обычно начинается с очищения и анализа кожи, после чего косметолог подбирает подходящие маски, сыворотки и массажные техники. Обратите внимание на наличие у специалиста медицинского или косметологического образования и на то, анализирует ли он ваш тип кожи до начала процедуры.",
      en: "The session typically begins with cleansing and a skin analysis, after which the cosmetologist selects appropriate masks, serums, and massage techniques. Check that the specialist has relevant training and that they assess your skin type before starting.",
    },
    priceHint: {
      uk: "Базовий фейшал (очищення + зволоження) — від 400 до 900 ₴. Апаратні або ін'єкційні процедури (пілінги, RF-ліфтинг, мезотерапія) — від 700 до 2 500 ₴.",
      ru: "Базовый фейшал (очищение + увлажнение) — от 400 до 900 ₴. Аппаратные или инъекционные процедуры (пилинги, RF-лифтинг, мезотерапия) — от 700 до 2 500 ₴.",
      en: "A basic facial (cleansing + hydration) costs 400–900 UAH. Device-based or injection treatments (peels, RF lifting, mesotherapy) range from 700 to 2,500 UAH.",
    },
    faqs: [
      {
        q: {
          uk: "Як часто потрібно робити фейшал?",
          ru: "Как часто нужно делать фейшал?",
          en: "How often should I get a facial?",
        },
        a: {
          uk: "Для підтримання результату — раз на 3–4 тижні. Якщо є конкретна проблема (акне, пігментація), косметолог може рекомендувати більш інтенсивний курс.",
          ru: "Для поддержания результата — раз в 3–4 недели. Если есть конкретная проблема (акне, пигментация), косметолог может рекомендовать более интенсивный курс.",
          en: "For maintenance, once every 3–4 weeks is ideal. If you have a specific concern such as acne or pigmentation, your cosmetologist may recommend a more intensive course.",
        },
      },
      {
        q: {
          uk: "Чи можна робити фейшал при акне?",
          ru: "Можно ли делать фейшал при акне?",
          en: "Can I get a facial if I have acne?",
        },
        a: {
          uk: "Так, але не всі процедури підходять при активному запаленні. Косметолог підбере м'який протокол або спрямоване лікування, яке не погіршить стан шкіри.",
          ru: "Да, но не все процедуры подходят при активном воспалении. Косметолог подберёт мягкий протокол или направленное лечение, которое не ухудшит состояние кожи.",
          en: "Yes, but not all treatments are suitable for active breakouts. A cosmetologist will select a gentle protocol or targeted therapy that will not aggravate the condition.",
        },
      },
      {
        q: {
          uk: "Що краще — апаратний чи ручний масаж обличчя?",
          ru: "Что лучше — аппаратный или ручной массаж лица?",
          en: "Which is better — device-based or manual facial massage?",
        },
        a: {
          uk: "Ручний масаж (японський, Жако або скульптурний) добре підтягує контури та знімає напругу. Апаратні техніки (мікрострум, RF) глибше впливають на тканини. Найкращий результат — поєднання обох методів.",
          ru: "Ручной массаж (японский, Жако или скульптурный) хорошо подтягивает контуры и снимает напряжение. Аппаратные техники (микроток, RF) глубже воздействуют на ткани. Лучший результат — сочетание обоих методов.",
          en: "Manual massage (Japanese, Kobido, or sculptural) lifts contours and relieves tension. Device-based techniques (microcurrent, RF) penetrate deeper into tissues. The best results often come from combining both approaches.",
        },
      },
      {
        q: {
          uk: "Чи є реабілітаційний період після фейшалу?",
          ru: "Есть ли реабилитационный период после фейшала?",
          en: "Is there any downtime after a facial?",
        },
        a: {
          uk: "Після базового фейшалу реабілітаційного часу немає — шкіра виглядає свіжіше одразу. Після агресивних процедур (глибокий пілінг, мікроголкування) може бути почервоніння на 1–3 дні.",
          ru: "После базового фейшала реабилитационного времени нет — кожа выглядит свежее сразу. После агрессивных процедур (глубокий пилинг, микроиглование) может быть покраснение на 1–3 дня.",
          en: "After a basic facial there is no downtime — skin looks fresher immediately. More aggressive treatments (deep peels, microneedling) may cause redness for 1–3 days.",
        },
      },
    ],
    related: ['cosmetology', 'massage', 'brows'],
  },
];
