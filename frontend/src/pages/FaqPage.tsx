import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

// ─── Local content (no shared i18n files touched) ────────────────────────────

type Lang = 'en' | 'uk' | 'ru';

interface FaqItem {
  q: string;
  a: string;
}

interface FaqSection {
  title: string;
  items: FaqItem[];
}

interface FaqContent {
  pageTitle: string;
  pageSubtitle: string;
  ctaText: string;
  ctaButton: string;
  sections: FaqSection[];
}

const CONTENT: Record<Lang, FaqContent> = {
  // ── ENGLISH ───────────────────────────────────────────────────────────────
  en: {
    pageTitle: 'Frequently Asked Questions',
    pageSubtitle:
      'Everything you need to know about MiyZapis — from booking your first appointment to growing your business.',
    ctaText: "Can't find what you're looking for?",
    ctaButton: 'Contact Support',
    sections: [
      {
        title: 'For Customers',
        items: [
          {
            q: 'What is MiyZapis?',
            a: 'MiyZapis is a Ukrainian marketplace for booking personal-service specialists — hair stylists, beauty masters, massage therapists, tutors, and more. You find a specialist you like, pick a convenient time slot, and confirm in seconds. No phone calls, no waiting on hold.',
          },
          {
            q: 'How do I book an appointment?',
            a: 'Open the specialist\'s booking page (shared via a direct link, QR code, or found through search), choose a service, pick a free time slot, and confirm. You\'ll get an instant booking confirmation by email or Telegram.',
          },
          {
            q: 'Do I pay online or in person?',
            a: 'Payment for services is always made in person — cash or card at the venue. MiyZapis does not process or hold money for services. You pay the specialist directly on the day of your visit.',
          },
          {
            q: 'What is a deposit and is it refundable?',
            a: 'Some specialists require a deposit to secure a slot. Deposit terms (amount, refund policy) are set by the specialist and shown before you confirm. If cancellation and refund rules are not stated, contact the specialist directly — MiyZapis does not manage deposit funds.',
          },
          {
            q: 'Instant confirmation vs. specialist approval — what is the difference?',
            a: 'Specialists choose how to accept bookings. "Instant confirmation" means your slot is locked automatically. "Requires approval" means the specialist reviews your request and manually confirms or declines it — you\'ll be notified as soon as they respond.',
          },
          {
            q: 'Can I cancel or reschedule?',
            a: 'Yes. Open your bookings list, find the appointment, and use the Cancel or Reschedule option. Cancellation policies vary per specialist — check the booking details before cancelling, especially if a deposit was paid.',
          },
          {
            q: 'What are loyalty points and what are they worth?',
            a: 'You earn points for every completed booking on MiyZapis. There are four tiers — Bronze, Silver, Gold, and Platinum — each with increasing benefits. Points can be redeemed toward future bookings as configured by each specialist. The more you book, the more you save.',
          },
          {
            q: 'What is the MiyZapis wallet?',
            a: 'The wallet stores any credits or refunded amounts credited to your account by specialists. You can apply wallet balance toward eligible bookings. The wallet does not hold live payment card details.',
          },
          {
            q: 'How do reviews work?',
            a: 'After a completed appointment, you can leave a rating and a written review for the specialist. Reviews are visible on the specialist\'s public profile and help future customers make informed choices. Only verified customers who completed a booking can leave a review.',
          },
          {
            q: 'Is MiyZapis free for customers?',
            a: 'Yes. Browsing and booking are completely free for customers. You pay only the specialist\'s service fee, directly to them in person.',
          },
        ],
      },
      {
        title: 'For Specialists & Businesses',
        items: [
          {
            q: 'How do I join as a specialist?',
            a: 'Register on MiyZapis, complete your profile (services, schedule, photos, pricing), and you\'re ready to accept bookings. You get a personal public booking page at miyzapis.com/s/your-slug, plus a QR code and an embeddable widget.',
          },
          {
            q: 'Is there a free trial?',
            a: 'Yes — every new specialist gets a 2-month free trial with full access to all platform features. No payment details required to start.',
          },
          {
            q: 'What does it cost after the trial?',
            a: 'After the trial, subscribe via Telegram Stars — monthly or annual (annual is ~18 months for the price of 12). There is no commission on your service revenue.',
          },
          {
            q: 'Does MiyZapis take a commission on my earnings?',
            a: 'No. MiyZapis earns from subscriptions only — not from a percentage of your service prices. The money your clients pay you is entirely yours.',
          },
          {
            q: 'How do clients find me?',
            a: 'You get a branded public link (miyzapis.com/s/your-slug) to share anywhere — social media, messaging, Google Business, flyers. We also generate a ready-to-print QR code and an embeddable booking button for your website.',
          },
          {
            q: 'What tools do I get on the platform?',
            a: 'MiyZapis is a full business suite:\n• Online booking calendar & schedule management\n• Point-of-sale (POS) for in-person transactions\n• Inventory & product tracking\n• Client CRM with visit history\n• Staff management & payroll\n• Basic accounting & revenue reports\n• Loyalty program for your customers\n• Promoted listings for extra visibility',
          },
          {
            q: 'How do payouts work?',
            a: 'Clients pay you directly in person (cash or card reader). MiyZapis does not intermediate service payments, so there are no payout delays, holds, or transfer fees on your revenue.',
          },
          {
            q: 'Can I manage multiple staff members?',
            a: 'Yes. You can add team members, assign them to services, set individual schedules, and manage payroll — all from the MiyZapis business dashboard.',
          },
        ],
      },
      {
        title: 'Trust, Privacy & Support',
        items: [
          {
            q: 'Is my personal data safe?',
            a: 'MiyZapis stores only the data necessary to operate the platform (name, contact details, booking history). Data is processed in accordance with Ukrainian law and GDPR principles. We do not sell your data to third parties.',
          },
          {
            q: 'What payment data does MiyZapis store?',
            a: 'None. Because payments for services are made in person, MiyZapis never receives, stores, or processes your card number or banking details. The only financial data on the platform is wallet balances and booking amounts.',
          },
          {
            q: 'Which sign-in methods are available?',
            a: 'You can sign in with email & password, Google account, or Telegram. All three are available for both customers and specialists.',
          },
          {
            q: 'Where is MiyZapis based?',
            a: 'MiyZapis is operated from Kyiv, Ukraine.',
          },
          {
            q: 'How do I contact support?',
            a: 'Email us at info@incognitogeneration.com — we aim to respond within one business day. For urgent issues, use the in-app support chat (available after sign-in at /customer/support).',
          },
        ],
      },
    ],
  },

  // ── UKRAINIAN ─────────────────────────────────────────────────────────────
  uk: {
    pageTitle: 'Часті запитання',
    pageSubtitle:
      'Все, що вам потрібно знати про МійЗапис — від першого запису до розвитку бізнесу.',
    ctaText: 'Не знайшли відповіді?',
    ctaButton: 'Написати в підтримку',
    sections: [
      {
        title: 'Для клієнтів',
        items: [
          {
            q: 'Що таке МійЗапис?',
            a: 'МійЗапис — це український онлайн-маркетплейс для запису до спеціалістів: перукарів, майстрів краси, масажистів, репетиторів та багатьох інших. Знайдіть потрібного фахівця, оберіть зручний час — і підтвердіть запис за кілька секунд. Жодних дзвінків і черг.',
          },
          {
            q: 'Як записатися на прийом?',
            a: 'Перейдіть на сторінку запису фахівця (посилання, QR-код або пошук), оберіть послугу та вільний час — і підтвердіть. Ви одразу отримаєте підтвердження на email або в Telegram.',
          },
          {
            q: 'Оплата онлайн чи на місці?',
            a: 'Послуги оплачуються виключно на місці — готівкою або карткою безпосередньо у фахівця. МійЗапис не приймає й не утримує кошти за послуги.',
          },
          {
            q: 'Що таке завдаток і чи повертається він?',
            a: 'Деякі фахівці вимагають завдаток для підтвердження запису. Умови (сума, повернення) встановлює сам фахівець — вони відображаються до підтвердження запису. Якщо умови не вказані, уточнюйте у фахівця напряму. МійЗапис не управляє коштами завдатку.',
          },
          {
            q: 'Миттєве підтвердження та підтвердження фахівцем — у чому різниця?',
            a: 'Фахівець сам обирає режим прийому записів. «Миттєве підтвердження» — час блокується автоматично. «Потребує підтвердження» — фахівець вручну схвалює або відхиляє запит, і ви отримаєте сповіщення, щойно він відповість.',
          },
          {
            q: 'Чи можна скасувати або перенести запис?',
            a: 'Так. Відкрийте список записів, знайдіть потрібний і скористайтеся кнопкою «Скасувати» або «Перенести». Умови скасування залежать від фахівця — перевірте деталі запису, особливо якщо було сплачено завдаток.',
          },
          {
            q: 'Що таке бонусні бали та що можна отримати?',
            a: 'За кожен завершений запис на МийЗапис ви отримуєте бонусні бали. Діє чотири рівні: Бронза, Срібло, Золото та Платина — кожен з більшими привілеями. Бали можна використовувати для оплати майбутніх записів відповідно до умов фахівця.',
          },
          {
            q: 'Що таке гаманець МійЗапис?',
            a: 'Гаманець зберігає кредити або повернені кошти, нараховані фахівцями на ваш рахунок. Баланс можна використати для оплати відповідних записів. Реквізити платіжних карток у гаманці не зберігаються.',
          },
          {
            q: 'Як працюють відгуки?',
            a: 'Після завершеного запису ви можете залишити оцінку та коментар. Відгуки відображаються на публічному профілі фахівця і допомагають іншим клієнтам зробити правильний вибір. Залишити відгук можуть лише клієнти, які фактично відвідали фахівця.',
          },
          {
            q: 'МійЗапис безкоштовний для клієнтів?',
            a: 'Так. Перегляд профілів та запис — абсолютно безкоштовні. Ви платите лише фахівцеві за його послугу, і тільки на місці.',
          },
        ],
      },
      {
        title: 'Для фахівців і бізнесу',
        items: [
          {
            q: 'Як долучитися як фахівець?',
            a: 'Зареєструйтеся на МийЗапис, заповніть профіль (послуги, розклад, фото, ціни) — і починайте приймати записи. Ви отримаєте особисту публічну сторінку за адресою miyzapis.com/s/ваш-нікнейм, QR-код і вбудовуваний віджет.',
          },
          {
            q: 'Чи є безкоштовний пробний період?',
            a: 'Так — кожен новий фахівець отримує 2 місяці безкоштовного доступу до всіх функцій платформи. Платіжні дані для початку не потрібні.',
          },
          {
            q: 'Скільки коштує після пробного періоду?',
            a: 'Після пробного — підписка через Telegram Stars: щомісячна або річна (річна ≈ 18 місяців за ціною 12). Комісія від вашої виручки не береться.',
          },
          {
            q: 'Чи бере МійЗапис комісію з моїх доходів?',
            a: 'Ні. МійЗапис заробляє лише на підписках — не на відсотку від вартості ваших послуг. Гроші, які платять вам клієнти, залишаються повністю вашими.',
          },
          {
            q: 'Як клієнти мене знаходять?',
            a: 'Ви отримуєте персональне посилання (miyzapis.com/s/ваш-нікнейм) для поширення в соцмережах, месенджерах, Google Business та на друкованих матеріалах. Ми також генеруємо QR-код готовий до друку та кнопку-віджет для вашого сайту.',
          },
          {
            q: 'Які інструменти доступні на платформі?',
            a: 'МійЗапис — це повноцінний бізнес-інструмент:\n• Онлайн-календар і управління розкладом\n• Каса (POS) для розрахунків на місці\n• Облік товарів і витратних матеріалів\n• CRM-клієнтська база з історією відвідувань\n• Управління персоналом і нарахування зарплат\n• Базова бухгалтерія та звіти про виручку\n• Програма лояльності для ваших клієнтів\n• Платне просування для більшої видимості',
          },
          {
            q: 'Як відбуваються виплати?',
            a: 'Клієнти платять вам безпосередньо на місці (готівкою або через термінал). МійЗапис не є посередником у грошових розрахунках — ніяких затримок, блокувань чи комісій за переказ ваших коштів.',
          },
          {
            q: 'Чи можна управляти кількома співробітниками?',
            a: 'Так. Ви можете додавати членів команди, призначати їх на послуги, задавати індивідуальні розклади та вести табель зарплат — усе в одному кабінеті.',
          },
        ],
      },
      {
        title: 'Безпека, конфіденційність і підтримка',
        items: [
          {
            q: 'Чи захищені мої особисті дані?',
            a: 'МійЗапис зберігає лише ті дані, що необхідні для роботи сервісу (ім\'я, контактні дані, історія записів). Обробка здійснюється відповідно до законодавства України та принципів GDPR. Ми не продаємо ваші дані третім особам.',
          },
          {
            q: 'Які платіжні дані зберігає МійЗапис?',
            a: 'Жодних. Оскільки послуги оплачуються на місці, платформа ніколи не отримує, не зберігає і не обробляє ваші реквізити банківської картки. Єдині фінансові дані на платформі — баланс гаманця і суми записів.',
          },
          {
            q: 'Які способи входу доступні?',
            a: 'Ви можете увійти через email і пароль, обліковий запис Google або Telegram — для клієнтів і фахівців однаково.',
          },
          {
            q: 'Де знаходиться МійЗапис?',
            a: 'МійЗапис працює з Києва, Україна.',
          },
          {
            q: 'Як звернутися до підтримки?',
            a: 'Пишіть нам на info@incognitogeneration.com — відповідаємо протягом одного робочого дня. Для термінових питань є чат підтримки в особистому кабінеті (після входу, розділ /customer/support).',
          },
        ],
      },
    ],
  },

  // ── RUSSIAN ───────────────────────────────────────────────────────────────
  ru: {
    pageTitle: 'Часто задаваемые вопросы',
    pageSubtitle:
      'Всё, что вам нужно знать о МийЗапис — от первой записи до развития бизнеса.',
    ctaText: 'Не нашли ответ?',
    ctaButton: 'Написать в поддержку',
    sections: [
      {
        title: 'Для клиентов',
        items: [
          {
            q: 'Что такое МийЗапис?',
            a: 'МийЗапис — украинский маркетплейс для онлайн-записи к специалистам: парикмахерам, мастерам красоты, массажистам, репетиторам и другим. Найдите нужного специалиста, выберите удобное время — и подтвердите запись за секунды. Никаких звонков и ожидания.',
          },
          {
            q: 'Как записаться на приём?',
            a: 'Перейдите на страницу записи специалиста (ссылка, QR-код или поиск), выберите услугу и свободное время — и подтвердите. Вы сразу получите подтверждение на email или в Telegram.',
          },
          {
            q: 'Оплата онлайн или на месте?',
            a: 'Услуги оплачиваются исключительно на месте — наличными или картой непосредственно у специалиста. МийЗапис не принимает и не удерживает средства за услуги.',
          },
          {
            q: 'Что такое задаток и возвращается ли он?',
            a: 'Некоторые специалисты требуют задаток для подтверждения записи. Условия (сумма, возврат) устанавливает сам специалист и они отображаются до подтверждения. Если условия не указаны, уточняйте у специалиста напрямую — МийЗапис не управляет средствами задатка.',
          },
          {
            q: 'Мгновенное подтверждение и подтверждение специалистом — в чём разница?',
            a: 'Специалист сам выбирает режим приёма записей. «Мгновенное подтверждение» — время блокируется автоматически. «Требует подтверждения» — специалист вручную одобряет или отклоняет запрос, вы получите уведомление, как только он ответит.',
          },
          {
            q: 'Можно ли отменить или перенести запись?',
            a: 'Да. Откройте список записей, найдите нужную и воспользуйтесь кнопкой «Отменить» или «Перенести». Условия отмены зависят от специалиста — проверьте детали, особенно если был уплачен задаток.',
          },
          {
            q: 'Что такое бонусные баллы и на что их можно потратить?',
            a: 'За каждую завершённую запись на МийЗапис вы получаете бонусные баллы. Действует четыре уровня: Бронза, Серебро, Золото и Платина — каждый с большими привилегиями. Баллы можно использовать для оплаты будущих записей по условиям специалиста.',
          },
          {
            q: 'Что такое кошелёк МийЗапис?',
            a: 'Кошелёк хранит кредиты или возвращённые средства, начисленные специалистами на ваш счёт. Баланс можно использовать для оплаты подходящих записей. Реквизиты платёжных карт в кошельке не хранятся.',
          },
          {
            q: 'Как работают отзывы?',
            a: 'После завершённой записи вы можете оставить оценку и комментарий. Отзывы отображаются на публичном профиле специалиста и помогают другим клиентам сделать правильный выбор. Оставить отзыв могут только клиенты, которые фактически посетили специалиста.',
          },
          {
            q: 'МийЗапис бесплатен для клиентов?',
            a: 'Да. Просмотр профилей и запись — абсолютно бесплатны. Вы платите только специалисту за его услугу, и только на месте.',
          },
        ],
      },
      {
        title: 'Для специалистов и бизнеса',
        items: [
          {
            q: 'Как стать специалистом на платформе?',
            a: 'Зарегистрируйтесь на МийЗапис, заполните профиль (услуги, расписание, фото, цены) — и начинайте принимать записи. Вы получите личную публичную страницу по адресу miyzapis.com/s/ваш-никнейм, QR-код и встраиваемый виджет.',
          },
          {
            q: 'Есть ли пробный период?',
            a: 'Да — каждый новый специалист получает 2 месяца бесплатного доступа ко всем функциям платформы. Платёжные данные для начала не нужны.',
          },
          {
            q: 'Сколько стоит после пробного периода?',
            a: 'После пробного — подписка через Telegram Stars: ежемесячная или годовая (годовая ≈ 18 месяцев по цене 12). Комиссия с вашей выручки не берётся.',
          },
          {
            q: 'Берёт ли МийЗапис комиссию с моих доходов?',
            a: 'Нет. МийЗапис зарабатывает только на подписках — не на проценте от стоимости ваших услуг. Деньги, которые платят вам клиенты, остаются полностью вашими.',
          },
          {
            q: 'Как клиенты меня находят?',
            a: 'Вы получаете персональную ссылку (miyzapis.com/s/ваш-никнейм) для распространения в соцсетях, мессенджерах, Google Business и на печатных материалах. Мы также генерируем QR-код, готовый к печати, и кнопку-виджет для вашего сайта.',
          },
          {
            q: 'Какие инструменты доступны на платформе?',
            a: 'МийЗапис — это полноценный бизнес-инструмент:\n• Онлайн-календарь и управление расписанием\n• Касса (POS) для расчётов на месте\n• Учёт товаров и расходных материалов\n• CRM-клиентская база с историей посещений\n• Управление персоналом и начисление зарплат\n• Базовая бухгалтерия и отчёты о выручке\n• Программа лояльности для ваших клиентов\n• Платное продвижение для большей видимости',
          },
          {
            q: 'Как происходят выплаты?',
            a: 'Клиенты платят вам напрямую на месте (наличными или через терминал). МийЗапис не является посредником в денежных расчётах — никаких задержек, блокировок или комиссий за перевод ваших средств.',
          },
          {
            q: 'Можно ли управлять несколькими сотрудниками?',
            a: 'Да. Вы можете добавлять членов команды, назначать их на услуги, задавать индивидуальные расписания и вести табель зарплат — всё в одном кабинете.',
          },
        ],
      },
      {
        title: 'Безопасность, конфиденциальность и поддержка',
        items: [
          {
            q: 'Мои личные данные в безопасности?',
            a: 'МийЗапис хранит только данные, необходимые для работы сервиса (имя, контактные данные, история записей). Обработка осуществляется в соответствии с законодательством Украины и принципами GDPR. Мы не продаём ваши данные третьим лицам.',
          },
          {
            q: 'Какие платёжные данные хранит МийЗапис?',
            a: 'Никаких. Поскольку услуги оплачиваются на месте, платформа никогда не получает, не хранит и не обрабатывает реквизиты вашей банковской карты. Единственные финансовые данные на платформе — баланс кошелька и суммы записей.',
          },
          {
            q: 'Какие способы входа доступны?',
            a: 'Вы можете войти через email и пароль, аккаунт Google или Telegram — для клиентов и специалистов одинаково.',
          },
          {
            q: 'Где находится МийЗапис?',
            a: 'МийЗапис работает из Киева, Украина.',
          },
          {
            q: 'Как обратиться в поддержку?',
            a: 'Пишите нам на info@incognitogeneration.com — отвечаем в течение одного рабочего дня. Для срочных вопросов есть чат поддержки в личном кабинете (после входа, раздел /customer/support).',
          },
        ],
      },
    ],
  },
};

// ─── Accordion item ───────────────────────────────────────────────────────────

const AccordionItem: React.FC<{ item: FaqItem; isOpen: boolean; onToggle: () => void }> = ({
  item,
  isOpen,
  onToggle,
}) => {
  // Format newlines in answers as line breaks
  const answerLines = item.a.split('\n');

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <button
        className="w-full flex items-center justify-between gap-4 py-4 text-left
                   text-gray-900 dark:text-gray-100 font-medium
                   hover:text-blue-600 dark:hover:text-blue-400
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                   active:scale-[0.98] transition-all duration-150"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="text-sm sm:text-base leading-snug">{item.q}</span>
        <span
          className={`flex-shrink-0 w-5 h-5 text-blue-600 dark:text-blue-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        >
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="pb-4 pr-9">
          {answerLines.map((line, i) => {
            if (line.startsWith('•')) {
              return (
                <p key={i} className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed pl-4 mb-1">
                  {line}
                </p>
              );
            }
            return (
              <p key={i} className={`text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed ${i < answerLines.length - 1 ? 'mb-2' : ''}`}>
                {line}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Section ──────────────────────────────────────────────────────────────────

const FaqSection: React.FC<{ section: FaqSection; defaultOpen?: boolean }> = ({
  section,
  defaultOpen = false,
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpen ? 0 : null);

  return (
    <div className="mb-8">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b-2 border-blue-200 dark:border-blue-800">
        {section.title}
      </h2>
      <div className="bg-white dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-700 px-4 sm:px-6 divide-y-0">
        {section.items.map((item, idx) => (
          <AccordionItem
            key={idx}
            item={item}
            isOpen={openIndex === idx}
            onToggle={() => setOpenIndex(openIndex === idx ? null : idx)}
          />
        ))}
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const FaqPage: React.FC = () => {
  const { language } = useLanguage();
  const content = CONTENT[language as Lang] ?? CONTENT.uk;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {content.pageTitle}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {content.pageSubtitle}
          </p>
        </div>

        {/* Sections */}
        {content.sections.map((section, idx) => (
          <FaqSection key={idx} section={section} defaultOpen={idx === 0} />
        ))}

        {/* CTA */}
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 sm:p-8 text-center">
          <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg mb-4">
            {content.ctaText}
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700
                       text-white font-medium text-sm sm:text-base
                       transition-all duration-150 active:scale-[0.96]
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            {content.ctaButton}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default FaqPage;
