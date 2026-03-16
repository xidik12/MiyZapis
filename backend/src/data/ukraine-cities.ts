/**
 * Static Ukraine cities data for the Browse by City feature.
 * Used as fallback/supplement when the specialist table has few cities.
 *
 * City names are in Ukrainian. English equivalents are in comments.
 * Oblasts (states) are listed with their capital + major cities.
 */

export interface UkraineCity {
  city: string;
  state: string; // oblast name in Ukrainian
  country: string; // always "Україна"
}

export const ukraineCities: UkraineCity[] = [
  // ===== Kyiv City (Київ) =====
  { city: 'Київ', state: 'місто Київ', country: 'Україна' }, // Kyiv

  // ===== Kyiv Oblast (Київська область) =====
  { city: 'Бориспіль', state: 'Київська область', country: 'Україна' }, // Boryspil
  { city: 'Ірпінь', state: 'Київська область', country: 'Україна' }, // Irpin
  { city: 'Буча', state: 'Київська область', country: 'Україна' }, // Bucha
  { city: 'Бровари', state: 'Київська область', country: 'Україна' }, // Brovary
  { city: 'Біла Церква', state: 'Київська область', country: 'Україна' }, // Bila Tserkva
  { city: 'Обухів', state: 'Київська область', country: 'Україна' }, // Obukhiv
  { city: 'Фастів', state: 'Київська область', country: 'Україна' }, // Fastiv

  // ===== Kharkiv Oblast (Харківська область) =====
  { city: 'Харків', state: 'Харківська область', country: 'Україна' }, // Kharkiv
  { city: 'Лозова', state: 'Харківська область', country: 'Україна' }, // Lozova
  { city: 'Ізюм', state: 'Харківська область', country: 'Україна' }, // Izium
  { city: 'Чугуїв', state: 'Харківська область', country: 'Україна' }, // Chuhuiv
  { city: 'Первомайський', state: 'Харківська область', country: 'Україна' }, // Pervomayskyi

  // ===== Dnipropetrovsk Oblast (Дніпропетровська область) =====
  { city: 'Дніпро', state: 'Дніпропетровська область', country: 'Україна' }, // Dnipro
  { city: 'Кривий Ріг', state: 'Дніпропетровська область', country: 'Україна' }, // Kryvyi Rih
  { city: 'Кам\'янське', state: 'Дніпропетровська область', country: 'Україна' }, // Kamianske
  { city: 'Нікополь', state: 'Дніпропетровська область', country: 'Україна' }, // Nikopol
  { city: 'Павлоград', state: 'Дніпропетровська область', country: 'Україна' }, // Pavlohrad
  { city: 'Новомосковськ', state: 'Дніпропетровська область', country: 'Україна' }, // Novomoskovsk

  // ===== Odesa Oblast (Одеська область) =====
  { city: 'Одеса', state: 'Одеська область', country: 'Україна' }, // Odesa
  { city: 'Ізмаїл', state: 'Одеська область', country: 'Україна' }, // Izmail
  { city: 'Білгород-Дністровський', state: 'Одеська область', country: 'Україна' }, // Bilhorod-Dnistrovskyi
  { city: 'Чорноморськ', state: 'Одеська область', country: 'Україна' }, // Chornomorsk
  { city: 'Южне', state: 'Одеська область', country: 'Україна' }, // Yuzhne

  // ===== Donetsk Oblast (Донецька область) =====
  { city: 'Донецьк', state: 'Донецька область', country: 'Україна' }, // Donetsk
  { city: 'Маріуполь', state: 'Донецька область', country: 'Україна' }, // Mariupol
  { city: 'Краматорськ', state: 'Донецька область', country: 'Україна' }, // Kramatorsk
  { city: 'Бахмут', state: 'Донецька область', country: 'Україна' }, // Bakhmut
  { city: 'Слов\'янськ', state: 'Донецька область', country: 'Україна' }, // Sloviansk
  { city: 'Покровськ', state: 'Донецька область', country: 'Україна' }, // Pokrovsk

  // ===== Luhansk Oblast (Луганська область) =====
  { city: 'Луганськ', state: 'Луганська область', country: 'Україна' }, // Luhansk
  { city: 'Сєвєродонецьк', state: 'Луганська область', country: 'Україна' }, // Sievierodonetsk
  { city: 'Лисичанськ', state: 'Луганська область', country: 'Україна' }, // Lysychansk
  { city: 'Рубіжне', state: 'Луганська область', country: 'Україна' }, // Rubizhne

  // ===== Zaporizhzhia Oblast (Запорізька область) =====
  { city: 'Запоріжжя', state: 'Запорізька область', country: 'Україна' }, // Zaporizhzhia
  { city: 'Мелітополь', state: 'Запорізька область', country: 'Україна' }, // Melitopol
  { city: 'Бердянськ', state: 'Запорізька область', country: 'Україна' }, // Berdiansk
  { city: 'Енергодар', state: 'Запорізька область', country: 'Україна' }, // Enerhodar

  // ===== Lviv Oblast (Львівська область) =====
  { city: 'Львів', state: 'Львівська область', country: 'Україна' }, // Lviv
  { city: 'Дрогобич', state: 'Львівська область', country: 'Україна' }, // Drohobych
  { city: 'Стрий', state: 'Львівська область', country: 'Україна' }, // Stryi
  { city: 'Червоноград', state: 'Львівська область', country: 'Україна' }, // Chervonohrad
  { city: 'Борислав', state: 'Львівська область', country: 'Україна' }, // Boryslav
  { city: 'Самбір', state: 'Львівська область', country: 'Україна' }, // Sambir

  // ===== Zhytomyr Oblast (Житомирська область) =====
  { city: 'Житомир', state: 'Житомирська область', country: 'Україна' }, // Zhytomyr
  { city: 'Бердичів', state: 'Житомирська область', country: 'Україна' }, // Berdychiv
  { city: 'Коростень', state: 'Житомирська область', country: 'Україна' }, // Korosten
  { city: 'Новоград-Волинський', state: 'Житомирська область', country: 'Україна' }, // Novohrad-Volynskyi

  // ===== Vinnytsia Oblast (Вінницька область) =====
  { city: 'Вінниця', state: 'Вінницька область', country: 'Україна' }, // Vinnytsia
  { city: 'Жмеринка', state: 'Вінницька область', country: 'Україна' }, // Zhmerynka
  { city: 'Козятин', state: 'Вінницька область', country: 'Україна' }, // Koziatyn
  { city: 'Могилів-Подільський', state: 'Вінницька область', country: 'Україна' }, // Mohyliv-Podilskyi
  { city: 'Ладижин', state: 'Вінницька область', country: 'Україна' }, // Ladyzhyn

  // ===== Poltava Oblast (Полтавська область) =====
  { city: 'Полтава', state: 'Полтавська область', country: 'Україна' }, // Poltava
  { city: 'Кременчук', state: 'Полтавська область', country: 'Україна' }, // Kremenchuk
  { city: 'Миргород', state: 'Полтавська область', country: 'Україна' }, // Myrhorod
  { city: 'Лубни', state: 'Полтавська область', country: 'Україна' }, // Lubny
  { city: 'Горішні Плавні', state: 'Полтавська область', country: 'Україна' }, // Horishni Plavni

  // ===== Chernihiv Oblast (Чернігівська область) =====
  { city: 'Чернігів', state: 'Чернігівська область', country: 'Україна' }, // Chernihiv
  { city: 'Ніжин', state: 'Чернігівська область', country: 'Україна' }, // Nizhyn
  { city: 'Прилуки', state: 'Чернігівська область', country: 'Україна' }, // Pryluky
  { city: 'Бахмач', state: 'Чернігівська область', country: 'Україна' }, // Bakhmach

  // ===== Cherkasy Oblast (Черкаська область) =====
  { city: 'Черкаси', state: 'Черкаська область', country: 'Україна' }, // Cherkasy
  { city: 'Умань', state: 'Черкаська область', country: 'Україна' }, // Uman
  { city: 'Сміла', state: 'Черкаська область', country: 'Україна' }, // Smila
  { city: 'Золотоноша', state: 'Черкаська область', country: 'Україна' }, // Zolotonosha

  // ===== Khmelnytskyi Oblast (Хмельницька область) =====
  { city: 'Хмельницький', state: 'Хмельницька область', country: 'Україна' }, // Khmelnytskyi
  { city: 'Кам\'янець-Подільський', state: 'Хмельницька область', country: 'Україна' }, // Kamianets-Podilskyi
  { city: 'Шепетівка', state: 'Хмельницька область', country: 'Україна' }, // Shepetivka
  { city: 'Славута', state: 'Хмельницька область', country: 'Україна' }, // Slavuta
  { city: 'Нетішин', state: 'Хмельницька область', country: 'Україна' }, // Netishyn

  // ===== Sumy Oblast (Сумська область) =====
  { city: 'Суми', state: 'Сумська область', country: 'Україна' }, // Sumy
  { city: 'Шостка', state: 'Сумська область', country: 'Україна' }, // Shostka
  { city: 'Конотоп', state: 'Сумська область', country: 'Україна' }, // Konotop
  { city: 'Ромни', state: 'Сумська область', country: 'Україна' }, // Romny
  { city: 'Охтирка', state: 'Сумська область', country: 'Україна' }, // Okhtyrka

  // ===== Rivne Oblast (Рівненська область) =====
  { city: 'Рівне', state: 'Рівненська область', country: 'Україна' }, // Rivne
  { city: 'Дубно', state: 'Рівненська область', country: 'Україна' }, // Dubno
  { city: 'Вараш', state: 'Рівненська область', country: 'Україна' }, // Varash
  { city: 'Костопіль', state: 'Рівненська область', country: 'Україна' }, // Kostopil

  // ===== Ternopil Oblast (Тернопільська область) =====
  { city: 'Тернопіль', state: 'Тернопільська область', country: 'Україна' }, // Ternopil
  { city: 'Чортків', state: 'Тернопільська область', country: 'Україна' }, // Chortkiv
  { city: 'Бережани', state: 'Тернопільська область', country: 'Україна' }, // Berezhany
  { city: 'Кременець', state: 'Тернопільська область', country: 'Україна' }, // Kremenets

  // ===== Ivano-Frankivsk Oblast (Івано-Франківська область) =====
  { city: 'Івано-Франківськ', state: 'Івано-Франківська область', country: 'Україна' }, // Ivano-Frankivsk
  { city: 'Калуш', state: 'Івано-Франківська область', country: 'Україна' }, // Kalush
  { city: 'Коломия', state: 'Івано-Франківська область', country: 'Україна' }, // Kolomyia
  { city: 'Надвірна', state: 'Івано-Франківська область', country: 'Україна' }, // Nadvirna
  { city: 'Яремче', state: 'Івано-Франківська область', country: 'Україна' }, // Yaremche

  // ===== Volyn Oblast (Волинська область) =====
  { city: 'Луцьк', state: 'Волинська область', country: 'Україна' }, // Lutsk
  { city: 'Ковель', state: 'Волинська область', country: 'Україна' }, // Kovel
  { city: 'Нововолинськ', state: 'Волинська область', country: 'Україна' }, // Novovolynsk
  { city: 'Володимир', state: 'Волинська область', country: 'Україна' }, // Volodymyr

  // ===== Zakarpattia Oblast (Закарпатська область) =====
  { city: 'Ужгород', state: 'Закарпатська область', country: 'Україна' }, // Uzhhorod
  { city: 'Мукачево', state: 'Закарпатська область', country: 'Україна' }, // Mukachevo
  { city: 'Хуст', state: 'Закарпатська область', country: 'Україна' }, // Khust
  { city: 'Берегове', state: 'Закарпатська область', country: 'Україна' }, // Berehove
  { city: 'Виноградів', state: 'Закарпатська область', country: 'Україна' }, // Vynohradiv

  // ===== Chernivtsi Oblast (Чернівецька область) =====
  { city: 'Чернівці', state: 'Чернівецька область', country: 'Україна' }, // Chernivtsi
  { city: 'Хотин', state: 'Чернівецька область', country: 'Україна' }, // Khotyn
  { city: 'Сторожинець', state: 'Чернівецька область', country: 'Україна' }, // Storozhynets
  { city: 'Новодністровськ', state: 'Чернівецька область', country: 'Україна' }, // Novodnistrovsk

  // ===== Kirovohrad Oblast (Кіровоградська область) =====
  { city: 'Кропивницький', state: 'Кіровоградська область', country: 'Україна' }, // Kropyvnytskyi
  { city: 'Олександрія', state: 'Кіровоградська область', country: 'Україна' }, // Oleksandriia
  { city: 'Світловодськ', state: 'Кіровоградська область', country: 'Україна' }, // Svitlovodsk

  // ===== Mykolaiv Oblast (Миколаївська область) =====
  { city: 'Миколаїв', state: 'Миколаївська область', country: 'Україна' }, // Mykolaiv
  { city: 'Первомайськ', state: 'Миколаївська область', country: 'Україна' }, // Pervomaysk
  { city: 'Южноукраїнськ', state: 'Миколаївська область', country: 'Україна' }, // Yuzhnoukrainsk
  { city: 'Вознесенськ', state: 'Миколаївська область', country: 'Україна' }, // Voznesensk

  // ===== Kherson Oblast (Херсонська область) =====
  { city: 'Херсон', state: 'Херсонська область', country: 'Україна' }, // Kherson
  { city: 'Нова Каховка', state: 'Херсонська область', country: 'Україна' }, // Nova Kakhovka
  { city: 'Каховка', state: 'Херсонська область', country: 'Україна' }, // Kakhovka
  { city: 'Олешки', state: 'Херсонська область', country: 'Україна' }, // Oleshky

  // ===== Autonomous Republic of Crimea (Автономна Республіка Крим) =====
  { city: 'Сімферополь', state: 'Автономна Республіка Крим', country: 'Україна' }, // Simferopol
  { city: 'Севастополь', state: 'Автономна Республіка Крим', country: 'Україна' }, // Sevastopol
  { city: 'Ялта', state: 'Автономна Республіка Крим', country: 'Україна' }, // Yalta
  { city: 'Євпаторія', state: 'Автономна Республіка Крим', country: 'Україна' }, // Yevpatoriia
  { city: 'Керч', state: 'Автономна Республіка Крим', country: 'Україна' }, // Kerch
  { city: 'Феодосія', state: 'Автономна Республіка Крим', country: 'Україна' }, // Feodosiia
];
