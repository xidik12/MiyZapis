import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  MagnifyingGlassIcon,
  StarIcon,
  CalendarIcon,
  CheckCircleIcon,
  CreditCardIcon,
  TrophyIcon,
  WalletIcon,
  UserPlusIcon,
  LinkIcon,
  InboxIcon,
  SquaresFourIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ArrowRightIcon,
  GiftIcon,
  ChartBarIcon,
  SealCheckIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  BriefcaseIcon,
  MapPinIcon,
} from '@/components/icons';

/* ------------------------------------------------------------------ */
/*  Scroll reveal hook                                                  */
/* ------------------------------------------------------------------ */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) { setVisible(true); return; }
    if (el.getBoundingClientRect().top < window.innerHeight) { setVisible(true); return; }
    const ob = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    ob.observe(el);
    const t = window.setTimeout(() => setVisible(true), 1500);
    return () => { ob.disconnect(); window.clearTimeout(t); };
  }, []);
  return { ref, visible };
}

/* ------------------------------------------------------------------ */
/*  Inline content (en / uk / ru)                                      */
/* ------------------------------------------------------------------ */
type Lang = 'en' | 'uk' | 'ru';

const CONTENT: Record<Lang, {
  badge: string;
  heroTitle: string;
  heroSub: string;
  tabCustomer: string;
  tabSpecialist: string;
  customerTrackTitle: string;
  customerSteps: { title: string; desc: string }[];
  loyaltyTitle: string;
  loyaltyDesc: string;
  walletTitle: string;
  walletDesc: string;
  freeNote: string;
  specialistTrackTitle: string;
  specialistSteps: { title: string; desc: string }[];
  pricingTitle: string;
  pricingTrial: string;
  pricingMonthly: string;
  pricingAnnual: string;
  pricingPpu: string;
  pricingNote: string;
  whyTitle: string;
  whyItems: { title: string; desc: string }[];
  ctaCustomerTitle: string;
  ctaCustomerSub: string;
  ctaCustomerBtn: string;
  ctaSpecialistTitle: string;
  ctaSpecialistSub: string;
  ctaSpecialistBtn: string;
  contactNote: string;
}> = {
  en: {
    badge: 'Ukraine · Kyiv',
    heroTitle: 'How MiyZapis works',
    heroSub: 'A Ukrainian marketplace connecting customers with specialists across any city. No commissions. No online payments. Just bookings that work.',
    tabCustomer: 'For Customers',
    tabSpecialist: 'For Specialists',
    customerTrackTitle: 'Book a specialist in minutes',
    customerSteps: [
      { title: 'Search by service or city', desc: 'Type what you need — a haircut, massage, car inspection, tutor — or browse by city. Hundreds of verified specialists across Ukraine.' },
      { title: 'Compare & choose', desc: 'See real ratings, prices, portfolios, and availability at a glance. Every profile tells you what to expect before you commit.' },
      { title: 'Pick a time & request', desc: 'Choose a slot that fits your schedule and send the booking request in one tap. No account needed for a first look, quick registration to book.' },
      { title: 'Get confirmed', desc: 'Some specialists confirm instantly. Others review and approve within minutes. You\'ll be notified either way — no guessing.' },
      { title: 'Show up & pay in person', desc: 'Arrive at the appointment and pay the specialist directly — cash or card at the venue. The platform charges you nothing. Zero platform fees for customers.' },
      { title: 'Leave a review & earn points', desc: 'Rate your experience, help others decide, and earn loyalty points with every completed booking. Points unlock perks and discounts.' },
    ],
    loyaltyTitle: 'Loyalty tiers & points',
    loyaltyDesc: 'Every review you leave after a booking earns loyalty points. Accumulate enough and you move up tiers — Bronze, Silver, Gold, Platinum. Higher tiers unlock exclusive discounts with participating specialists and priority booking.',
    walletTitle: 'Your wallet',
    walletDesc: 'Loyalty points and any cashback sit in your in-app wallet. You can spend them on future bookings with specialists who accept loyalty rewards.',
    freeNote: 'MiyZapis is completely free for customers — always.',
    specialistTrackTitle: 'Grow your client base with zero commission',
    specialistSteps: [
      { title: 'Sign up & set up your profile', desc: 'Create your specialist or business account, add your services, set prices, configure your schedule, and upload portfolio photos. Takes 15 minutes.' },
      { title: 'Get your booking link, QR & website widget', desc: 'Each specialist gets a unique public booking URL, a QR code to print at the venue, and an embeddable widget for your own website. Clients book from anywhere.' },
      { title: 'Receive bookings your way', desc: 'Choose instant confirmation or manual approval — you\'re in control. Bookings land in your dashboard with full client details.' },
      { title: 'Manage everything in one place', desc: 'Dashboard, POS for retail sales, inventory management, client CRM, team payroll, and accounting — all built in. No third-party tools needed.' },
      { title: 'Get paid in person — keep 100%', desc: 'Clients pay you directly at the appointment in cash or by card. MiyZapis takes no commission on services. Your revenue is yours.' },
      { title: 'Grow with reviews, loyalty & referrals', desc: 'More reviews boost your search ranking. Reward loyal clients with your own points program. Share referral links that convert.' },
    ],
    pricingTitle: 'Simple, transparent pricing',
    pricingTrial: '2-month free trial — full access, no credit card required',
    pricingMonthly: 'Monthly subscription via Telegram Stars',
    pricingAnnual: 'Annual subscription via Telegram Stars (best value)',
    pricingPpu: 'Pay-per-use: ₴20 per completed booking — no subscription needed',
    pricingNote: 'No commission on service revenue. Ever.',
    whyTitle: 'Why MiyZapis',
    whyItems: [
      { title: 'Zero commission', desc: 'We don\'t take a cut of your service revenue. Specialists keep every hryvnia they earn.' },
      { title: 'Free for customers', desc: 'Customers never pay the platform. Only the specialist\'s service fee, settled in person.' },
      { title: 'Built for Ukraine', desc: 'Ukrainian-first: UAH pricing, Ukrainian cities, Ukrainian payment habits. Operated from Kyiv.' },
      { title: 'All-in-one for specialists', desc: 'Bookings, POS, CRM, payroll, inventory — tools that cost thousands elsewhere, included in one subscription.' },
      { title: 'Private & secure', desc: 'Client data stays on the platform. No data sold to third parties.' },
      { title: 'Instant or manual approval', desc: 'You decide how bookings arrive. Set each service to instant confirmation or manual review.' },
    ],
    ctaCustomerTitle: 'Ready to book?',
    ctaCustomerSub: 'Find a verified specialist near you right now.',
    ctaCustomerBtn: 'Find a specialist',
    ctaSpecialistTitle: 'Ready to grow?',
    ctaSpecialistSub: 'Start your free 2-month trial. No card needed.',
    ctaSpecialistBtn: 'Offer your services',
    contactNote: 'Questions? Reach us at support@miyzapis.com',
  },

  uk: {
    badge: 'Україна · Київ',
    heroTitle: 'Як працює МійЗапис',
    heroSub: 'Українська платформа, що з\'єднує клієнтів і спеціалістів по всій країні. Без комісій. Без онлайн-оплати. Тільки записи, що справді працюють.',
    tabCustomer: 'Для клієнтів',
    tabSpecialist: 'Для спеціалістів',
    customerTrackTitle: 'Запишіться до спеціаліста за хвилину',
    customerSteps: [
      { title: 'Знайдіть по послузі або місту', desc: 'Введіть що шукаєте — стрижка, масаж, огляд авто, репетитор — або перегляньте за містом. Сотні перевірених спеціалістів по всій Україні.' },
      { title: 'Порівняйте і виберіть', desc: 'Рейтинги, ціни, портфоліо й розклад — все на одній картці. Кожен профіль дає чітке уявлення ще до запису.' },
      { title: 'Оберіть час і надішліть запит', desc: 'Обирайте зручний слот і надсилайте запис одним дотиком. Перегляд — без реєстрації, запис — з швидкою реєстрацією.' },
      { title: 'Отримайте підтвердження', desc: 'Частина спеціалістів підтверджує миттєво, інші — розглядають і відповідають за кілька хвилин. Ви завжди отримаєте сповіщення.' },
      { title: 'Приходьте й розраховуйтесь на місці', desc: 'Прийдіть на зустріч і оплатіть спеціалісту готівкою або карткою — на місці. Платформа з вас нічого не бере. Жодних онлайн-зборів для клієнтів.' },
      { title: 'Залиште відгук і заробіть бали', desc: 'Оцініть досвід, допоможіть іншим обрати і накопичуйте бали лояльності з кожним завершеним записом. Бали відкривають переваги й знижки.' },
    ],
    loyaltyTitle: 'Рівні лояльності та бали',
    loyaltyDesc: 'Кожен відгук після запису приносить бали. Накопичуйте — і переходьте на вищий рівень: Бронза, Срібло, Золото, Платина. Вищі рівні дають ексклюзивні знижки у спеціалістів-учасників і пріоритетний запис.',
    walletTitle: 'Ваш гаманець',
    walletDesc: 'Бали лояльності та кешбек зберігаються у вашому гаманці в застосунку. Їх можна витрачати на майбутні записи до спеціалістів, які приймають винагороди.',
    freeNote: 'МійЗапис для клієнтів — завжди безкоштовний.',
    specialistTrackTitle: 'Розвивайте клієнтську базу без комісії',
    specialistSteps: [
      { title: 'Зареєструйтесь і налаштуйте профіль', desc: 'Створіть акаунт спеціаліста або бізнесу, додайте послуги, ціни, розклад і фото портфоліо. Займе 15 хвилин.' },
      { title: 'Отримайте посилання, QR-код і віджет для сайту', desc: 'Кожен спеціаліст отримує унікальний публічний URL для запису, QR-код для роздруківки і вбудовуваний віджет для власного сайту. Клієнти записуються звідусіль.' },
      { title: 'Приймайте записи на своїх умовах', desc: 'Обирайте миттєве підтвердження або ручне погодження — повний контроль. Записи надходять на дашборд з усіма даними клієнта.' },
      { title: 'Керуйте всім в одному місці', desc: 'Дашборд, POS для роздрібних продажів, управління запасами, CRM-клієнтів, зарплатна відомість і бухгалтерія — все вбудовано. Стороннього ПЗ не потрібно.' },
      { title: 'Отримуйте оплату на місці — 100% ваші', desc: 'Клієнти платять вам особисто готівкою або карткою. МійЗапис не бере комісію за послуги. Ваш виторг — тільки ваш.' },
      { title: 'Ростіть завдяки відгукам, лояльності й реферальним', desc: 'Більше відгуків — вище в пошуку. Заохочуйте лояльних клієнтів власними балами. Ділиться реферальними посиланнями, що конвертують.' },
    ],
    pricingTitle: 'Прозора і зрозуміла ціна',
    pricingTrial: '2 місяці безкоштовно — повний доступ, картка не потрібна',
    pricingMonthly: 'Щомісячна підписка через Telegram Stars',
    pricingAnnual: 'Річна підписка через Telegram Stars (найвигідніше)',
    pricingPpu: 'Оплата за запис: ₴20 за завершений запис — без підписки',
    pricingNote: 'Комісія з виторгу за послуги — ніколи.',
    whyTitle: 'Чому МійЗапис',
    whyItems: [
      { title: 'Нуль комісії', desc: 'Ми не забираємо частину вашого виторгу. Спеціалісти залишають собі кожну гривню.' },
      { title: 'Безкоштовно для клієнтів', desc: 'Клієнти нічого не платять платформі. Лише вартість послуги — спеціалісту, на місці.' },
      { title: 'Зроблено для України', desc: 'Гривня, українські міста, звичні форми оплати. Розроблено і управляється в Києві.' },
      { title: 'Все необхідне для спеціаліста', desc: 'Записи, POS, CRM, зарплати, запаси — те, що окремо коштує тисячі, вже включено.' },
      { title: 'Приватно і безпечно', desc: 'Дані клієнтів залишаються на платформі. Жодних продажів третім сторонам.' },
      { title: 'Миттєве або ручне підтвердження', desc: 'Ви самі вирішуєте, як приймати записи: автоматично або після перевірки.' },
    ],
    ctaCustomerTitle: 'Готові записатися?',
    ctaCustomerSub: 'Знайдіть перевіреного спеціаліста поруч прямо зараз.',
    ctaCustomerBtn: 'Знайти спеціаліста',
    ctaSpecialistTitle: 'Готові рости?',
    ctaSpecialistSub: 'Почніть 2-місячний безкоштовний пробний період. Картка не потрібна.',
    ctaSpecialistBtn: 'Пропонувати послуги',
    contactNote: 'Маєте питання? Пишіть на support@miyzapis.com',
  },

  ru: {
    badge: 'Украина · Киев',
    heroTitle: 'Как работает МийЗапис',
    heroSub: 'Украинский маркетплейс, объединяющий клиентов и специалистов по всей стране. Без комиссий. Без онлайн-оплаты. Только записи, которые работают.',
    tabCustomer: 'Для клиентов',
    tabSpecialist: 'Для специалистов',
    customerTrackTitle: 'Запишитесь к специалисту за минуту',
    customerSteps: [
      { title: 'Найдите по услуге или городу', desc: 'Введите что ищёте — стрижка, массаж, техосмотр, репетитор — или просмотрите по городу. Сотни проверенных специалистов по всей Украине.' },
      { title: 'Сравните и выберите', desc: 'Рейтинги, цены, портфолио и расписание — всё на одной карточке. Каждый профиль даст полное представление до записи.' },
      { title: 'Выберите время и отправьте запрос', desc: 'Выбирайте удобный слот и отправляйте запись одним касанием. Просмотр без регистрации, запись — с быстрой регистрацией.' },
      { title: 'Получите подтверждение', desc: 'Часть специалистов подтверждает мгновенно, другие рассматривают и отвечают за несколько минут. Вы всегда получите уведомление.' },
      { title: 'Приходите и платите на месте', desc: 'Приходите на встречу и оплачивайте специалисту наличными или картой — на месте. Платформа с вас ничего не берёт. Никаких онлайн-сборов.' },
      { title: 'Оставьте отзыв и заработайте баллы', desc: 'Оцените опыт, помогите другим выбрать и копите баллы лояльности с каждой завершённой записью. Баллы открывают привилегии и скидки.' },
    ],
    loyaltyTitle: 'Уровни лояльности и баллы',
    loyaltyDesc: 'Каждый отзыв после записи приносит баллы. Накапливайте — и переходите на следующий уровень: Бронза, Серебро, Золото, Платина. Высокие уровни дают эксклюзивные скидки у участвующих специалистов и приоритетную запись.',
    walletTitle: 'Ваш кошелёк',
    walletDesc: 'Баллы лояльности и кешбэк хранятся в кошельке внутри приложения. Их можно тратить на будущие записи к специалистам, принимающим вознаграждения.',
    freeNote: 'МийЗапис для клиентов — всегда бесплатен.',
    specialistTrackTitle: 'Развивайте клиентскую базу без комиссии',
    specialistSteps: [
      { title: 'Зарегистрируйтесь и настройте профиль', desc: 'Создайте аккаунт специалиста или бизнеса, добавьте услуги, цены, расписание и фото портфолио. Займёт 15 минут.' },
      { title: 'Получите ссылку, QR-код и виджет для сайта', desc: 'Каждый специалист получает уникальный публичный URL для записи, QR-код для распечатки и встраиваемый виджет для собственного сайта. Клиенты записываются отовсюду.' },
      { title: 'Принимайте записи на своих условиях', desc: 'Выбирайте мгновенное подтверждение или ручное согласование — полный контроль. Записи приходят в дашборд со всеми данными клиента.' },
      { title: 'Управляйте всем в одном месте', desc: 'Дашборд, POS для розничных продаж, управление запасами, CRM клиентов, расчёт зарплат и бухгалтерия — всё встроено. Сторонних инструментов не нужно.' },
      { title: 'Получайте оплату на месте — 100% ваши', desc: 'Клиенты платят вам лично наличными или картой. МийЗапис не берёт комиссию за услуги. Ваша выручка — только ваша.' },
      { title: 'Растите за счёт отзывов, лояльности и реферальных', desc: 'Больше отзывов — выше в поиске. Поощряйте лояльных клиентов собственными баллами. Делитесь реферальными ссылками, которые конвертируют.' },
    ],
    pricingTitle: 'Прозрачная и понятная цена',
    pricingTrial: '2 месяца бесплатно — полный доступ, карта не нужна',
    pricingMonthly: 'Ежемесячная подписка через Telegram Stars',
    pricingAnnual: 'Годовая подписка через Telegram Stars (лучшая цена)',
    pricingPpu: 'Оплата за запись: ₴20 за завершённую запись — без подписки',
    pricingNote: 'Комиссия с выручки за услуги — никогда.',
    whyTitle: 'Почему МийЗапис',
    whyItems: [
      { title: 'Ноль комиссии', desc: 'Мы не берём долю вашей выручки. Специалисты оставляют себе каждую гривну.' },
      { title: 'Бесплатно для клиентов', desc: 'Клиенты ничего не платят платформе. Только стоимость услуги — специалисту, на месте.' },
      { title: 'Сделано для Украины', desc: 'Гривна, украинские города, привычные способы оплаты. Разработано и управляется из Киева.' },
      { title: 'Всё нужное для специалиста', desc: 'Записи, POS, CRM, зарплаты, запасы — то, что по отдельности стоит тысячи, уже включено.' },
      { title: 'Приватно и безопасно', desc: 'Данные клиентов остаются на платформе. Никакой продажи третьим сторонам.' },
      { title: 'Мгновенное или ручное подтверждение', desc: 'Вы сами решаете, как принимать записи: автоматически или после проверки.' },
    ],
    ctaCustomerTitle: 'Готовы записаться?',
    ctaCustomerSub: 'Найдите проверенного специалиста рядом прямо сейчас.',
    ctaCustomerBtn: 'Найти специалиста',
    ctaSpecialistTitle: 'Готовы к росту?',
    ctaSpecialistSub: 'Начните 2-месячный бесплатный пробный период. Карта не нужна.',
    ctaSpecialistBtn: 'Предложить услуги',
    contactNote: 'Вопросы? Пишите на support@miyzapis.com',
  },
};

/* ------------------------------------------------------------------ */
/*  Icons per step                                                      */
/* ------------------------------------------------------------------ */
const CUSTOMER_ICONS = [
  MagnifyingGlassIcon,
  StarIcon,
  CalendarIcon,
  CheckCircleIcon,
  CreditCardIcon,
  TrophyIcon,
];

const SPECIALIST_ICONS = [
  UserPlusIcon,
  LinkIcon,
  InboxIcon,
  SquaresFourIcon,
  ShieldCheckIcon,
  ChartBarIcon,
];

const WHY_ICONS = [
  ShieldCheckIcon,
  GiftIcon,
  MapPinIcon,
  BriefcaseIcon,
  SealCheckIcon,
  ClockIcon,
];

/* ------------------------------------------------------------------ */
/*  Step card                                                           */
/* ------------------------------------------------------------------ */
interface StepCardProps {
  number: number;
  title: string;
  desc: string;
  Icon: React.ComponentType<{ className?: string }>;
  accent: string; // tailwind bg class for icon bg
  iconColor: string; // tailwind text class
}

const StepCard: React.FC<StepCardProps> = ({ number, title, desc, Icon, accent, iconColor }) => (
  <div className="group relative flex flex-col gap-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 sm:p-6 shadow-sm hover:shadow-md transition active:scale-[0.96]">
    <div className="flex items-start gap-4">
      <div className={`flex-none w-11 h-11 rounded-xl ${accent} flex items-center justify-center ring-1 ring-inset ring-black/5 dark:ring-white/5`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <span className="tabular-nums mt-0.5 text-xs font-bold text-gray-400 dark:text-gray-600 tracking-widest uppercase">
        {String(number).padStart(2, '0')}
      </span>
    </div>
    <div>
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1.5 leading-snug">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{desc}</p>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Why card                                                            */
/* ------------------------------------------------------------------ */
interface WhyCardProps {
  title: string;
  desc: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const WhyCard: React.FC<WhyCardProps> = ({ title, desc, Icon }) => (
  <div className="group flex gap-4 items-start rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition active:scale-[0.96]">
    <div className="flex-none w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center ring-1 ring-inset ring-black/5 dark:ring-white/5">
      <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
    </div>
    <div>
      <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">{title}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{desc}</p>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */
const HowItWorksPage: React.FC = () => {
  const { language } = useLanguage();
  const lang = (language as Lang) in CONTENT ? (language as Lang) : 'uk';
  const c = CONTENT[lang];

  const [activeTab, setActiveTab] = useState<'customer' | 'specialist'>('customer');

  const heroReveal = useScrollReveal();
  const tabReveal = useScrollReveal();
  const loyaltyReveal = useScrollReveal();
  const pricingReveal = useScrollReveal();
  const whyReveal = useScrollReveal();
  const ctaReveal = useScrollReveal();

  const customerAccents = [
    { accent: 'bg-sky-50 dark:bg-sky-900/30', iconColor: 'text-sky-600 dark:text-sky-400' },
    { accent: 'bg-violet-50 dark:bg-violet-900/30', iconColor: 'text-violet-600 dark:text-violet-400' },
    { accent: 'bg-emerald-50 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    { accent: 'bg-amber-50 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400' },
    { accent: 'bg-rose-50 dark:bg-rose-900/30', iconColor: 'text-rose-600 dark:text-rose-400' },
    { accent: 'bg-teal-50 dark:bg-teal-900/30', iconColor: 'text-teal-600 dark:text-teal-400' },
  ];

  const specialistAccents = [
    { accent: 'bg-primary-50 dark:bg-primary-900/30', iconColor: 'text-primary-600 dark:text-primary-400' },
    { accent: 'bg-indigo-50 dark:bg-indigo-900/30', iconColor: 'text-indigo-600 dark:text-indigo-400' },
    { accent: 'bg-cyan-50 dark:bg-cyan-900/30', iconColor: 'text-cyan-600 dark:text-cyan-400' },
    { accent: 'bg-violet-50 dark:bg-violet-900/30', iconColor: 'text-violet-600 dark:text-violet-400' },
    { accent: 'bg-emerald-50 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    { accent: 'bg-amber-50 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400' },
  ];

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-950"
      style={{ fontFamily: "'Manrope', 'Inter', system-ui, sans-serif" }}
    >
      <style>{`
        .hiw-reveal { opacity: 1; transform: none; }
        @media (prefers-reduced-motion: no-preference) {
          .hiw-reveal { opacity: 0; transform: translateY(20px); transition: opacity 0.55s ease, transform 0.55s cubic-bezier(.22,.61,.36,1); }
          .hiw-reveal.is-visible { opacity: 1; transform: translateY(0); }
        }
        .hiw-reveal.is-visible { opacity: 1; transform: translateY(0); }
      `}</style>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        {/* subtle azure gradient wash */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(37,99,235,0.07) 0%, transparent 70%)',
          }}
        />
        <div
          ref={heroReveal.ref}
          className={`hiw-reveal${heroReveal.visible ? ' is-visible' : ''} relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 text-center`}
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 px-3.5 py-1.5 text-xs font-semibold text-primary-700 dark:text-primary-300 mb-6 tracking-wide uppercase">
            <SparklesIcon className="w-3.5 h-3.5" />
            {c.badge}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-5 text-balance leading-tight">
            {c.heroTitle}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto text-balance">
            {c.heroSub}
          </p>
        </div>
      </section>

      {/* ── Tab switcher + steps ───────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Tab pills */}
        <div
          ref={tabReveal.ref}
          className={`hiw-reveal${tabReveal.visible ? ' is-visible' : ''}`}
        >
          <div className="flex justify-center mb-10">
            <div className="inline-flex rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-1 gap-1 shadow-sm">
              <button
                onClick={() => setActiveTab('customer')}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition active:scale-[0.96] ${
                  activeTab === 'customer'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                {c.tabCustomer}
              </button>
              <button
                onClick={() => setActiveTab('specialist')}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition active:scale-[0.96] ${
                  activeTab === 'specialist'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                {c.tabSpecialist}
              </button>
            </div>
          </div>

          {/* Customer track */}
          {activeTab === 'customer' && (
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white text-center mb-8 text-balance">
                {c.customerTrackTitle}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {c.customerSteps.map((step, i) => (
                  <StepCard
                    key={i}
                    number={i + 1}
                    title={step.title}
                    desc={step.desc}
                    Icon={CUSTOMER_ICONS[i]}
                    accent={customerAccents[i].accent}
                    iconColor={customerAccents[i].iconColor}
                  />
                ))}
              </div>

              {/* Loyalty + Wallet callout */}
              <div
                ref={loyaltyReveal.ref}
                className={`hiw-reveal${loyaltyReveal.visible ? ' is-visible' : ''} mt-8 grid sm:grid-cols-2 gap-4`}
              >
                <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 p-5 sm:p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <TrophyIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <h3 className="font-semibold text-amber-900 dark:text-amber-200">{c.loyaltyTitle}</h3>
                  </div>
                  <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">{c.loyaltyDesc}</p>
                </div>
                <div className="rounded-2xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/40 p-5 sm:p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <WalletIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    <h3 className="font-semibold text-primary-900 dark:text-primary-200">{c.walletTitle}</h3>
                  </div>
                  <p className="text-sm text-primary-800 dark:text-primary-300 leading-relaxed">{c.walletDesc}</p>
                </div>
              </div>

              {/* Free badge */}
              <div className="mt-6 flex justify-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/40 px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  <CheckCircleIcon className="w-4 h-4" />
                  {c.freeNote}
                </span>
              </div>
            </div>
          )}

          {/* Specialist track */}
          {activeTab === 'specialist' && (
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white text-center mb-8 text-balance">
                {c.specialistTrackTitle}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {c.specialistSteps.map((step, i) => (
                  <StepCard
                    key={i}
                    number={i + 1}
                    title={step.title}
                    desc={step.desc}
                    Icon={SPECIALIST_ICONS[i]}
                    accent={specialistAccents[i].accent}
                    iconColor={specialistAccents[i].iconColor}
                  />
                ))}
              </div>

              {/* Pricing callout */}
              <div
                ref={pricingReveal.ref}
                className={`hiw-reveal${pricingReveal.visible ? ' is-visible' : ''} mt-8 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 sm:p-7 shadow-sm`}
              >
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-5">{c.pricingTitle}</h3>
                <ul className="space-y-3">
                  {[
                    { text: c.pricingTrial, color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-100 dark:border-emerald-800/40' },
                    { text: c.pricingMonthly, color: 'text-primary-700 dark:text-primary-300', bg: 'bg-primary-50 dark:bg-primary-900/20', border: 'border-primary-100 dark:border-primary-800/40' },
                    { text: c.pricingAnnual, color: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-100 dark:border-violet-800/40' },
                    { text: c.pricingPpu, color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-800/40' },
                  ].map((item, i) => (
                    <li
                      key={i}
                      className={`flex items-start gap-3 rounded-xl ${item.bg} border ${item.border} px-4 py-3`}
                    >
                      <CheckCircleIcon className={`flex-none w-4 h-4 mt-0.5 ${item.color}`} />
                      <span className={`text-sm font-medium ${item.color}`}>{item.text}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide">
                  {c.pricingNote}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Why MiyZapis ──────────────────────────────────────────── */}
      <section className="bg-white dark:bg-gray-900 border-t border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div
            ref={whyReveal.ref}
            className={`hiw-reveal${whyReveal.visible ? ' is-visible' : ''}`}
          >
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white text-center mb-8 text-balance">
              {c.whyTitle}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {c.whyItems.map((item, i) => (
                <WhyCard key={i} title={item.title} desc={item.desc} Icon={WHY_ICONS[i]} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTAs ──────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div
          ref={ctaReveal.ref}
          className={`hiw-reveal${ctaReveal.visible ? ' is-visible' : ''} grid sm:grid-cols-2 gap-5`}
        >
          {/* Customer CTA */}
          <div className="relative overflow-hidden rounded-2xl bg-primary-600 p-7 sm:p-8 flex flex-col gap-5">
            <div
              className="absolute inset-0 pointer-events-none"
              aria-hidden
              style={{
                background: 'radial-gradient(ellipse 80% 80% at 110% 110%, rgba(255,255,255,0.12) 0%, transparent 60%)',
              }}
            />
            <div>
              <h3 className="text-xl font-bold text-white mb-2 text-balance">{c.ctaCustomerTitle}</h3>
              <p className="text-sm text-primary-100 leading-relaxed">{c.ctaCustomerSub}</p>
            </div>
            <Link
              to="/search"
              className="inline-flex items-center gap-2 self-start rounded-xl bg-white text-primary-700 px-5 py-2.5 text-sm font-semibold shadow-sm hover:bg-primary-50 transition active:scale-[0.96]"
            >
              {c.ctaCustomerBtn}
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {/* Specialist CTA */}
          <div className="relative overflow-hidden rounded-2xl bg-gray-900 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-7 sm:p-8 flex flex-col gap-5">
            <div
              className="absolute inset-0 pointer-events-none"
              aria-hidden
              style={{
                background: 'radial-gradient(ellipse 80% 80% at 110% 110%, rgba(37,99,235,0.18) 0%, transparent 60%)',
              }}
            />
            <div>
              <h3 className="text-xl font-bold text-white mb-2 text-balance">{c.ctaSpecialistTitle}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{c.ctaSpecialistSub}</p>
            </div>
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-2 self-start rounded-xl bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 text-sm font-semibold shadow-sm transition active:scale-[0.96]"
            >
              {c.ctaSpecialistBtn}
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Contact note */}
        <div
          className={`hiw-reveal${ctaReveal.visible ? ' is-visible' : ''} mt-8 text-center`}
        >
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {c.contactNote.split('support@miyzapis.com').map((part, i, arr) =>
              i < arr.length - 1 ? (
                <React.Fragment key={i}>
                  {part}
                  <a
                    href="mailto:support@miyzapis.com"
                    className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                  >
                    support@miyzapis.com
                  </a>
                </React.Fragment>
              ) : (
                part
              )
            )}
          </p>
        </div>
      </section>
    </div>
  );
};

export default HowItWorksPage;
