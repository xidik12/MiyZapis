// Branded MiyZapis transactional email templates (en / uk / ru).
//
// Each template stores per-language content blocks only. Full HTML is built
// at lookup time via renderBrandedHtml() so brand styling lives in one place
// (email-layout.ts). Public API unchanged: getEmailTemplate(key, lang) still
// returns { subject, html, text }.

import { renderBrandedHtml, normalizeLang, STYLES, BRAND, EmailLanguage } from './email-layout';

interface TemplateContent {
  subject: string;
  preheader: string;
  bodyHtml: string; // inner content of the card (no outer wrapper)
  text: string;
}

type TemplateBundle = Record<EmailLanguage, TemplateContent>;

// Small helpers for repeated patterns.
const cta = (href: string, label: string) =>
  `<div style="${STYLES.buttonRow}"><a href="${href}" style="${STYLES.primaryButton}">${label}</a></div>`;
const ctaPair = (href1: string, label1: string, href2: string, label2: string) =>
  `<div style="${STYLES.buttonRow}">
    <a href="${href1}" style="${STYLES.primaryButton};margin-right:10px;">${label1}</a>
    <a href="${href2}" style="${STYLES.secondaryButton}">${label2}</a>
  </div>`;
const fallbackLink = (href: string, lead: string) =>
  `<p style="${STYLES.faint}">${lead}<br><a href="${href}" style="${STYLES.link};word-break:break-all;">${href}</a></p>`;

// ─────────────────────────────────────────────────────────────────────────────
// Template definitions
// ─────────────────────────────────────────────────────────────────────────────

const emailTemplatesRaw: Record<string, TemplateBundle> = {

  // ── Welcome ────────────────────────────────────────────────────────────────
  welcome: {
    en: {
      subject: 'Welcome to MiyZapis',
      preheader: 'Your booking platform is ready — let’s get you started.',
      bodyHtml: `
        <h1 style="${STYLES.h1}">Welcome aboard, {{firstName}} 👋</h1>
        <p style="${STYLES.p}">Thanks for joining MiyZapis — the modern booking platform that connects you with talented specialists.</p>
        <div style="${STYLES.infoBox}">
          <h3 style="${STYLES.h3}">A few things to try first</h3>
          <p style="${STYLES.detailRow}">• Complete your profile to get tailored recommendations</p>
          <p style="${STYLES.detailRow}">• Browse our directory of specialists</p>
          <p style="${STYLES.detailRow}">• Book your first appointment</p>
        </div>
        ${cta('{{dashboardUrl}}', 'Open dashboard')}
        <p style="${STYLES.faint}">Need a hand? Visit our <a href="{{helpUrl}}" style="${STYLES.link}">Help Center</a> — or just reply to this email.</p>
      `,
      text: `Welcome aboard, {{firstName}}!\n\nThanks for joining MiyZapis. A few things to try first:\n  - Complete your profile for tailored recommendations\n  - Browse our directory of specialists\n  - Book your first appointment\n\nOpen your dashboard: {{dashboardUrl}}\nHelp center: {{helpUrl}}`,
    },
    uk: {
      subject: 'Ласкаво просимо до МійЗапис',
      preheader: 'Ваша платформа для бронювання готова — почнімо.',
      bodyHtml: `
        <h1 style="${STYLES.h1}">Вітаємо у МійЗапис, {{firstName}} 👋</h1>
        <p style="${STYLES.p}">Дякуємо, що приєдналися — це сучасна платформа, що з’єднує вас із талановитими спеціалістами.</p>
        <div style="${STYLES.infoBox}">
          <h3 style="${STYLES.h3}">Що варто зробити першим</h3>
          <p style="${STYLES.detailRow}">• Заповніть профіль для персональних рекомендацій</p>
          <p style="${STYLES.detailRow}">• Перегляньте каталог спеціалістів</p>
          <p style="${STYLES.detailRow}">• Заброньте свій перший запис</p>
        </div>
        ${cta('{{dashboardUrl}}', 'Перейти до кабінету')}
        <p style="${STYLES.faint}">Потрібна допомога? Завітайте у <a href="{{helpUrl}}" style="${STYLES.link}">Центр допомоги</a> або просто дайте відповідь на цей лист.</p>
      `,
      text: `Вітаємо у МійЗапис, {{firstName}}!\n\nДякуємо, що приєдналися. Що варто зробити першим:\n  - Заповніть профіль\n  - Перегляньте каталог спеціалістів\n  - Заброньте свій перший запис\n\nКабінет: {{dashboardUrl}}\nЦентр допомоги: {{helpUrl}}`,
    },
    ru: {
      subject: 'Добро пожаловать в МойЗапись',
      preheader: 'Ваша платформа для бронирования готова — начнём.',
      bodyHtml: `
        <h1 style="${STYLES.h1}">Добро пожаловать, {{firstName}} 👋</h1>
        <p style="${STYLES.p}">Спасибо, что присоединились — это современная платформа, которая соединяет вас с талантливыми специалистами.</p>
        <div style="${STYLES.infoBox}">
          <h3 style="${STYLES.h3}">Что попробовать первым</h3>
          <p style="${STYLES.detailRow}">• Заполните профиль для персональных рекомендаций</p>
          <p style="${STYLES.detailRow}">• Просмотрите каталог специалистов</p>
          <p style="${STYLES.detailRow}">• Забронируйте свою первую запись</p>
        </div>
        ${cta('{{dashboardUrl}}', 'Перейти в кабинет')}
        <p style="${STYLES.faint}">Нужна помощь? Загляните в <a href="{{helpUrl}}" style="${STYLES.link}">Центр помощи</a> или просто ответьте на это письмо.</p>
      `,
      text: `Добро пожаловать, {{firstName}}!\n\nСпасибо, что присоединились. Что попробовать первым:\n  - Заполните профиль\n  - Просмотрите каталог специалистов\n  - Забронируйте свою первую запись\n\nКабинет: {{dashboardUrl}}\nЦентр помощи: {{helpUrl}}`,
    },
  },

  // ── Email verification ────────────────────────────────────────────────────
  emailVerification: {
    en: {
      subject: 'Verify your email address',
      preheader: 'Confirm your email to finish signing up for MiyZapis.',
      bodyHtml: `
        <h1 style="${STYLES.h1}">Verify your email</h1>
        <p style="${STYLES.p}">Hi {{firstName}}, please confirm your email address to complete your MiyZapis registration.</p>
        ${cta('{{verificationUrl}}', 'Verify email')}
        <p style="${STYLES.small}">This link expires in 24 hours. If you didn’t create a MiyZapis account, you can safely ignore this email.</p>
        ${fallbackLink('{{verificationUrl}}', 'Trouble with the button? Paste this link into your browser:')}
      `,
      text: `Verify your email\n\nHi {{firstName}},\n\nPlease confirm your email to complete your MiyZapis registration:\n{{verificationUrl}}\n\nThis link expires in 24 hours. If you didn’t create an account, you can ignore this email.`,
    },
    uk: {
      subject: 'Підтвердьте свою електронну адресу',
      preheader: 'Підтвердіть пошту, щоб завершити реєстрацію у МійЗапис.',
      bodyHtml: `
        <h1 style="${STYLES.h1}">Підтвердьте свою пошту</h1>
        <p style="${STYLES.p}">Привіт, {{firstName}}. Підтвердіть свою електронну адресу, щоб завершити реєстрацію у МійЗапис.</p>
        ${cta('{{verificationUrl}}', 'Підтвердити пошту')}
        <p style="${STYLES.small}">Посилання діє 24 години. Якщо ви не реєструвалися у МійЗапис, просто проігноруйте цей лист.</p>
        ${fallbackLink('{{verificationUrl}}', 'Не працює кнопка? Скопіюйте це посилання у браузер:')}
      `,
      text: `Підтвердьте свою пошту\n\nПривіт, {{firstName}},\n\nПідтвердіть свою електронну адресу, щоб завершити реєстрацію у МійЗапис:\n{{verificationUrl}}\n\nПосилання діє 24 години. Якщо ви не реєструвалися, проігноруйте цей лист.`,
    },
    ru: {
      subject: 'Подтвердите свой email',
      preheader: 'Подтвердите почту, чтобы завершить регистрацию в МойЗапись.',
      bodyHtml: `
        <h1 style="${STYLES.h1}">Подтвердите свой email</h1>
        <p style="${STYLES.p}">Привет, {{firstName}}. Подтвердите свой email, чтобы завершить регистрацию в МойЗапись.</p>
        ${cta('{{verificationUrl}}', 'Подтвердить email')}
        <p style="${STYLES.small}">Ссылка действует 24 часа. Если вы не создавали аккаунт в МойЗапись, можете просто проигнорировать письмо.</p>
        ${fallbackLink('{{verificationUrl}}', 'Не работает кнопка? Скопируйте ссылку в браузер:')}
      `,
      text: `Подтвердите свой email\n\nПривет, {{firstName}},\n\nПодтвердите свой email, чтобы завершить регистрацию в МойЗапись:\n{{verificationUrl}}\n\nСсылка действует 24 часа. Если вы не создавали аккаунт, проигнорируйте письмо.`,
    },
  },

  // ── Password reset ────────────────────────────────────────────────────────
  passwordReset: {
    en: {
      subject: 'Reset your MiyZapis password',
      preheader: 'A password reset was requested for your account.',
      bodyHtml: `
        <h1 style="${STYLES.h1}">Reset your password</h1>
        <p style="${STYLES.p}">Hi {{firstName}}, we received a request to reset the password on your MiyZapis account.</p>
        ${cta('{{resetUrl}}', 'Reset password')}
        <p style="${STYLES.small}">This link expires in 1 hour. If you didn’t request a reset, you can ignore this email — your password stays the same.</p>
        ${fallbackLink('{{resetUrl}}', 'Trouble with the button? Paste this link into your browser:')}
      `,
      text: `Reset your password\n\nHi {{firstName}},\n\nWe received a request to reset your MiyZapis password:\n{{resetUrl}}\n\nThis link expires in 1 hour. If you didn’t request this, ignore this email — your password stays the same.`,
    },
    uk: {
      subject: 'Скидання пароля МійЗапис',
      preheader: 'Надійшов запит на скидання пароля.',
      bodyHtml: `
        <h1 style="${STYLES.h1}">Скидання пароля</h1>
        <p style="${STYLES.p}">Привіт, {{firstName}}. Ми отримали запит на скидання пароля до вашого акаунту МійЗапис.</p>
        ${cta('{{resetUrl}}', 'Скинути пароль')}
        <p style="${STYLES.small}">Посилання діє 1 годину. Якщо ви не запитували скидання — просто проігноруйте цей лист, пароль не зміниться.</p>
        ${fallbackLink('{{resetUrl}}', 'Не працює кнопка? Скопіюйте посилання у браузер:')}
      `,
      text: `Скидання пароля\n\nПривіт, {{firstName}},\n\nМи отримали запит на скидання пароля МійЗапис:\n{{resetUrl}}\n\nПосилання діє 1 годину. Якщо ви не запитували — проігноруйте лист.`,
    },
    ru: {
      subject: 'Сброс пароля МойЗапись',
      preheader: 'Получен запрос на сброс пароля.',
      bodyHtml: `
        <h1 style="${STYLES.h1}">Сброс пароля</h1>
        <p style="${STYLES.p}">Привет, {{firstName}}. Мы получили запрос на сброс пароля вашего аккаунта МойЗапись.</p>
        ${cta('{{resetUrl}}', 'Сбросить пароль')}
        <p style="${STYLES.small}">Ссылка действует 1 час. Если вы не запрашивали сброс — просто проигнорируйте письмо, пароль останется прежним.</p>
        ${fallbackLink('{{resetUrl}}', 'Не работает кнопка? Скопируйте ссылку в браузер:')}
      `,
      text: `Сброс пароля\n\nПривет, {{firstName}},\n\nМы получили запрос на сброс пароля МойЗапись:\n{{resetUrl}}\n\nСсылка действует 1 час. Если вы не запрашивали — проигнорируйте письмо.`,
    },
  },

  // ── Booking confirmation ──────────────────────────────────────────────────
  bookingConfirmation: {
    en: {
      subject: 'Booking confirmed — {{serviceName}} with {{specialistName}}',
      preheader: 'Your appointment is scheduled.',
      bodyHtml: `
        <h1 style="${STYLES.h1}">Booking confirmed 🎉</h1>
        <p style="${STYLES.p}">Hi {{customerName}}, your appointment is on the calendar. Here are the details:</p>
        <div style="${STYLES.infoBox}">
          <h3 style="${STYLES.h3}">Booking details</h3>
          <p style="${STYLES.detailRow}"><strong>Service:</strong> {{serviceName}}</p>
          <p style="${STYLES.detailRow}"><strong>Specialist:</strong> {{specialistName}}</p>
          <p style="${STYLES.detailRow}"><strong>When:</strong> {{bookingDateTime}}</p>
          <p style="${STYLES.detailRow}"><strong>Duration:</strong> {{duration}} min</p>
          <p style="${STYLES.detailRow}"><strong>Total:</strong> {{totalAmount}} {{currency}}</p>
          {{#if customerNotes}}<p style="${STYLES.detailRow}"><strong>Your notes:</strong> {{customerNotes}}</p>{{/if}}
        </div>
        {{#if serviceLocation}}
        <div style="${STYLES.successBox}">
          <h3 style="${STYLES.h3}">📍 Location</h3>
          <p style="${STYLES.detailRow}"><strong>{{serviceLocation}}</strong></p>
          {{#if locationNotes}}<p style="${STYLES.detailRow};color:${BRAND.muted};font-style:italic;">{{locationNotes}}</p>{{/if}}
          {{#if latitude}}<p style="${STYLES.detailRow}"><a href="https://www.google.com/maps?q={{latitude}},{{longitude}}" style="${STYLES.link};font-weight:600;">Open in Google Maps →</a></p>{{/if}}
        </div>
        {{/if}}
        ${ctaPair('{{bookingUrl}}', 'View booking', '{{chatUrl}}', 'Chat with specialist')}
        <p style="${STYLES.faint}">Please arrive 10 minutes early. To reschedule or cancel, please do so at least 24 hours in advance.</p>
      `,
      text: `Booking confirmed!\n\nHi {{customerName}},\n\nYour appointment is on the calendar:\n  Service: {{serviceName}}\n  Specialist: {{specialistName}}\n  When: {{bookingDateTime}}\n  Duration: {{duration}} min\n  Total: {{totalAmount}} {{currency}}\n  {{#if customerNotes}}Your notes: {{customerNotes}}{{/if}}\n  {{#if serviceLocation}}Location: {{serviceLocation}}{{/if}}\n  {{#if latitude}}Map: https://www.google.com/maps?q={{latitude}},{{longitude}}{{/if}}\n\nView booking: {{bookingUrl}}\nChat with specialist: {{chatUrl}}\n\nPlease arrive 10 minutes early. To reschedule or cancel, do so at least 24 hours in advance.`,
    },
    uk: {
      subject: 'Бронювання підтверджено — {{serviceName}} зі {{specialistName}}',
      preheader: 'Ваш запис у календарі.',
      bodyHtml: `
        <h1 style="${STYLES.h1}">Бронювання підтверджено 🎉</h1>
        <p style="${STYLES.p}">Привіт, {{customerName}}. Ваш запис у календарі. Деталі:</p>
        <div style="${STYLES.infoBox}">
          <h3 style="${STYLES.h3}">Деталі бронювання</h3>
          <p style="${STYLES.detailRow}"><strong>Послуга:</strong> {{serviceName}}</p>
          <p style="${STYLES.detailRow}"><strong>Спеціаліст:</strong> {{specialistName}}</p>
          <p style="${STYLES.detailRow}"><strong>Коли:</strong> {{bookingDateTime}}</p>
          <p style="${STYLES.detailRow}"><strong>Тривалість:</strong> {{duration}} хв</p>
          <p style="${STYLES.detailRow}"><strong>Сума:</strong> {{totalAmount}} {{currency}}</p>
          {{#if customerNotes}}<p style="${STYLES.detailRow}"><strong>Ваші нотатки:</strong> {{customerNotes}}</p>{{/if}}
        </div>
        {{#if serviceLocation}}
        <div style="${STYLES.successBox}">
          <h3 style="${STYLES.h3}">📍 Місце надання</h3>
          <p style="${STYLES.detailRow}"><strong>{{serviceLocation}}</strong></p>
          {{#if locationNotes}}<p style="${STYLES.detailRow};color:${BRAND.muted};font-style:italic;">{{locationNotes}}</p>{{/if}}
          {{#if latitude}}<p style="${STYLES.detailRow}"><a href="https://www.google.com/maps?q={{latitude}},{{longitude}}" style="${STYLES.link};font-weight:600;">Відкрити в Google Maps →</a></p>{{/if}}
        </div>
        {{/if}}
        ${ctaPair('{{bookingUrl}}', 'Переглянути запис', '{{chatUrl}}', 'Чат зі спеціалістом')}
        <p style="${STYLES.faint}">Будь ласка, приходьте за 10 хвилин до часу. Перенесення або скасування — щонайменше за 24 години.</p>
      `,
      text: `Бронювання підтверджено!\n\nПривіт, {{customerName}},\n\nВаш запис у календарі:\n  Послуга: {{serviceName}}\n  Спеціаліст: {{specialistName}}\n  Коли: {{bookingDateTime}}\n  Тривалість: {{duration}} хв\n  Сума: {{totalAmount}} {{currency}}\n  {{#if customerNotes}}Нотатки: {{customerNotes}}{{/if}}\n  {{#if serviceLocation}}Місце: {{serviceLocation}}{{/if}}\n  {{#if latitude}}Карта: https://www.google.com/maps?q={{latitude}},{{longitude}}{{/if}}\n\nПереглянути запис: {{bookingUrl}}\nЧат зі спеціалістом: {{chatUrl}}\n\nБудь ласка, приходьте за 10 хв до часу. Перенесення/скасування — щонайменше за 24 години.`,
    },
    ru: {
      subject: 'Бронирование подтверждено — {{serviceName}} с {{specialistName}}',
      preheader: 'Ваша запись в календаре.',
      bodyHtml: `
        <h1 style="${STYLES.h1}">Бронирование подтверждено 🎉</h1>
        <p style="${STYLES.p}">Привет, {{customerName}}. Ваша запись в календаре. Детали:</p>
        <div style="${STYLES.infoBox}">
          <h3 style="${STYLES.h3}">Детали бронирования</h3>
          <p style="${STYLES.detailRow}"><strong>Услуга:</strong> {{serviceName}}</p>
          <p style="${STYLES.detailRow}"><strong>Специалист:</strong> {{specialistName}}</p>
          <p style="${STYLES.detailRow}"><strong>Когда:</strong> {{bookingDateTime}}</p>
          <p style="${STYLES.detailRow}"><strong>Длительность:</strong> {{duration}} мин</p>
          <p style="${STYLES.detailRow}"><strong>Сумма:</strong> {{totalAmount}} {{currency}}</p>
          {{#if customerNotes}}<p style="${STYLES.detailRow}"><strong>Ваши заметки:</strong> {{customerNotes}}</p>{{/if}}
        </div>
        {{#if serviceLocation}}
        <div style="${STYLES.successBox}">
          <h3 style="${STYLES.h3}">📍 Место</h3>
          <p style="${STYLES.detailRow}"><strong>{{serviceLocation}}</strong></p>
          {{#if locationNotes}}<p style="${STYLES.detailRow};color:${BRAND.muted};font-style:italic;">{{locationNotes}}</p>{{/if}}
          {{#if latitude}}<p style="${STYLES.detailRow}"><a href="https://www.google.com/maps?q={{latitude}},{{longitude}}" style="${STYLES.link};font-weight:600;">Открыть в Google Maps →</a></p>{{/if}}
        </div>
        {{/if}}
        ${ctaPair('{{bookingUrl}}', 'Посмотреть запись', '{{chatUrl}}', 'Чат со специалистом')}
        <p style="${STYLES.faint}">Пожалуйста, приходите за 10 минут. Перенос или отмена — минимум за 24 часа.</p>
      `,
      text: `Бронирование подтверждено!\n\nПривет, {{customerName}},\n\nВаша запись в календаре:\n  Услуга: {{serviceName}}\n  Специалист: {{specialistName}}\n  Когда: {{bookingDateTime}}\n  Длительность: {{duration}} мин\n  Сумма: {{totalAmount}} {{currency}}\n  {{#if customerNotes}}Заметки: {{customerNotes}}{{/if}}\n  {{#if serviceLocation}}Место: {{serviceLocation}}{{/if}}\n  {{#if latitude}}Карта: https://www.google.com/maps?q={{latitude}},{{longitude}}{{/if}}\n\nПосмотреть запись: {{bookingUrl}}\nЧат со специалистом: {{chatUrl}}\n\nПожалуйста, приходите за 10 минут. Перенос/отмена — минимум за 24 часа.`,
    },
  },

  // ── Booking cancelled ─────────────────────────────────────────────────────
  bookingCancelled: {
    en: {
      subject: 'Booking cancelled — {{serviceName}}',
      preheader: 'Your appointment was cancelled.',
      bodyHtml: `
        <h1 style="${STYLES.h1}">Booking cancelled</h1>
        <p style="${STYLES.p}">Hi {{name}}, your booking for <strong>{{serviceName}}</strong> on <strong>{{bookingDateTime}}</strong> has been cancelled.</p>
        {{#if reason}}<div style="${STYLES.warnBox}"><h3 style="${STYLES.h3}">Reason</h3><p style="${STYLES.detailRow}">{{reason}}</p></div>{{/if}}
      `,
      text: `Booking cancelled\n\nHi {{name}},\n\nYour booking for {{serviceName}} on {{bookingDateTime}} has been cancelled.\n{{#if reason}}Reason: {{reason}}{{/if}}`,
    },
    uk: {
      subject: 'Бронювання скасовано — {{serviceName}}',
      preheader: 'Ваш запис скасовано.',
      bodyHtml: `
        <h1 style="${STYLES.h1}">Бронювання скасовано</h1>
        <p style="${STYLES.p}">Привіт, {{name}}. Ваше бронювання <strong>{{serviceName}}</strong> на <strong>{{bookingDateTime}}</strong> скасовано.</p>
        {{#if reason}}<div style="${STYLES.warnBox}"><h3 style="${STYLES.h3}">Причина</h3><p style="${STYLES.detailRow}">{{reason}}</p></div>{{/if}}
      `,
      text: `Бронювання скасовано\n\nПривіт, {{name}},\n\nВаше бронювання {{serviceName}} на {{bookingDateTime}} скасовано.\n{{#if reason}}Причина: {{reason}}{{/if}}`,
    },
    ru: {
      subject: 'Бронирование отменено — {{serviceName}}',
      preheader: 'Ваша запись отменена.',
      bodyHtml: `
        <h1 style="${STYLES.h1}">Бронирование отменено</h1>
        <p style="${STYLES.p}">Привет, {{name}}. Ваше бронирование <strong>{{serviceName}}</strong> на <strong>{{bookingDateTime}}</strong> отменено.</p>
        {{#if reason}}<div style="${STYLES.warnBox}"><h3 style="${STYLES.h3}">Причина</h3><p style="${STYLES.detailRow}">{{reason}}</p></div>{{/if}}
      `,
      text: `Бронирование отменено\n\nПривет, {{name}},\n\nВаше бронирование {{serviceName}} на {{bookingDateTime}} отменено.\n{{#if reason}}Причина: {{reason}}{{/if}}`,
    },
  },

  // ── Booking updated ───────────────────────────────────────────────────────
  bookingUpdated: {
    en: {
      subject: 'Booking updated — {{serviceName}}',
      preheader: 'Your booking details have changed.',
      bodyHtml: `
        <h1 style="${STYLES.h1}">Booking updated</h1>
        <p style="${STYLES.p}">Hi {{name}}, your booking has been updated. Here are the latest details:</p>
        <div style="${STYLES.infoBox}">
          <p style="${STYLES.detailRow}"><strong>Service:</strong> {{serviceName}}</p>
          <p style="${STYLES.detailRow}"><strong>Specialist:</strong> {{specialistName}}</p>
          <p style="${STYLES.detailRow}"><strong>When:</strong> {{bookingDateTime}}</p>
        </div>
        ${cta('{{bookingUrl}}', 'View booking')}
      `,
      text: `Booking updated\n\nHi {{name}},\n\nYour booking has been updated:\n  Service: {{serviceName}}\n  Specialist: {{specialistName}}\n  When: {{bookingDateTime}}\n\nView booking: {{bookingUrl}}`,
    },
    uk: {
      subject: 'Бронювання оновлено — {{serviceName}}',
      preheader: 'Деталі вашого запису змінилися.',
      bodyHtml: `
        <h1 style="${STYLES.h1}">Бронювання оновлено</h1>
        <p style="${STYLES.p}">Привіт, {{name}}. Ваше бронювання було оновлено. Останні деталі:</p>
        <div style="${STYLES.infoBox}">
          <p style="${STYLES.detailRow}"><strong>Послуга:</strong> {{serviceName}}</p>
          <p style="${STYLES.detailRow}"><strong>Спеціаліст:</strong> {{specialistName}}</p>
          <p style="${STYLES.detailRow}"><strong>Коли:</strong> {{bookingDateTime}}</p>
        </div>
        ${cta('{{bookingUrl}}', 'Переглянути запис')}
      `,
      text: `Бронювання оновлено\n\nПривіт, {{name}},\n\nВаше бронювання було оновлено:\n  Послуга: {{serviceName}}\n  Спеціаліст: {{specialistName}}\n  Коли: {{bookingDateTime}}\n\nПереглянути запис: {{bookingUrl}}`,
    },
    ru: {
      subject: 'Бронирование обновлено — {{serviceName}}',
      preheader: 'Детали записи изменились.',
      bodyHtml: `
        <h1 style="${STYLES.h1}">Бронирование обновлено</h1>
        <p style="${STYLES.p}">Привет, {{name}}. Ваше бронирование обновлено. Последние детали:</p>
        <div style="${STYLES.infoBox}">
          <p style="${STYLES.detailRow}"><strong>Услуга:</strong> {{serviceName}}</p>
          <p style="${STYLES.detailRow}"><strong>Специалист:</strong> {{specialistName}}</p>
          <p style="${STYLES.detailRow}"><strong>Когда:</strong> {{bookingDateTime}}</p>
        </div>
        ${cta('{{bookingUrl}}', 'Посмотреть запись')}
      `,
      text: `Бронирование обновлено\n\nПривет, {{name}},\n\nВаше бронирование обновлено:\n  Услуга: {{serviceName}}\n  Специалист: {{specialistName}}\n  Когда: {{bookingDateTime}}\n\nПосмотреть запись: {{bookingUrl}}`,
    },
  },

  // ── Booking reminder (24h) ────────────────────────────────────────────────
  bookingReminder: {
    en: {
      subject: 'Reminder — {{serviceName}} on {{bookingDateTime}}',
      preheader: 'Your appointment is tomorrow.',
      bodyHtml: `
        <h1 style="${STYLES.h1}">Booking reminder</h1>
        <p style="${STYLES.p}">Hi {{customerName}}, this is a friendly reminder of your booking tomorrow:</p>
        <div style="${STYLES.infoBox}">
          <p style="${STYLES.detailRow}"><strong>Service:</strong> {{serviceName}}</p>
          <p style="${STYLES.detailRow}"><strong>Specialist:</strong> {{specialistName}}</p>
          <p style="${STYLES.detailRow}"><strong>When:</strong> {{bookingDateTime}}</p>
        </div>
        ${cta('{{bookingUrl}}', 'View booking')}
      `,
      text: `Booking reminder\n\nHi {{customerName}},\n\nFriendly reminder of your booking tomorrow:\n  Service: {{serviceName}}\n  Specialist: {{specialistName}}\n  When: {{bookingDateTime}}\n\nView booking: {{bookingUrl}}`,
    },
    uk: {
      subject: 'Нагадування — {{serviceName}} {{bookingDateTime}}',
      preheader: 'Ваш запис завтра.',
      bodyHtml: `
        <h1 style="${STYLES.h1}">Нагадування про запис</h1>
        <p style="${STYLES.p}">Привіт, {{customerName}}. Нагадуємо, що у вас запис завтра:</p>
        <div style="${STYLES.infoBox}">
          <p style="${STYLES.detailRow}"><strong>Послуга:</strong> {{serviceName}}</p>
          <p style="${STYLES.detailRow}"><strong>Спеціаліст:</strong> {{specialistName}}</p>
          <p style="${STYLES.detailRow}"><strong>Коли:</strong> {{bookingDateTime}}</p>
        </div>
        ${cta('{{bookingUrl}}', 'Переглянути запис')}
      `,
      text: `Нагадування про запис\n\nПривіт, {{customerName}},\n\nНагадуємо, що у вас запис завтра:\n  Послуга: {{serviceName}}\n  Спеціаліст: {{specialistName}}\n  Коли: {{bookingDateTime}}\n\nПереглянути запис: {{bookingUrl}}`,
    },
    ru: {
      subject: 'Напоминание — {{serviceName}} {{bookingDateTime}}',
      preheader: 'Ваша запись завтра.',
      bodyHtml: `
        <h1 style="${STYLES.h1}">Напоминание о записи</h1>
        <p style="${STYLES.p}">Привет, {{customerName}}. Напоминаем, что у вас запись завтра:</p>
        <div style="${STYLES.infoBox}">
          <p style="${STYLES.detailRow}"><strong>Услуга:</strong> {{serviceName}}</p>
          <p style="${STYLES.detailRow}"><strong>Специалист:</strong> {{specialistName}}</p>
          <p style="${STYLES.detailRow}"><strong>Когда:</strong> {{bookingDateTime}}</p>
        </div>
        ${cta('{{bookingUrl}}', 'Посмотреть запись')}
      `,
      text: `Напоминание о записи\n\nПривет, {{customerName}},\n\nНапоминаем, что у вас запись завтра:\n  Услуга: {{serviceName}}\n  Специалист: {{specialistName}}\n  Когда: {{bookingDateTime}}\n\nПосмотреть запись: {{bookingUrl}}`,
    },
  },

  // ── Generic notification ──────────────────────────────────────────────────
  notificationGeneric: {
    en: {
      subject: '{{title}}',
      preheader: '{{message}}',
      bodyHtml: `
        <h1 style="${STYLES.h1}">{{title}}</h1>
        <p style="${STYLES.p}">Hi {{firstName}},</p>
        <p style="${STYLES.p}">{{message}}</p>
        {{detailsHtml}}
      `,
      text: `{{title}}\n\nHi {{firstName}},\n\n{{message}}`,
    },
    uk: {
      subject: '{{title}}',
      preheader: '{{message}}',
      bodyHtml: `
        <h1 style="${STYLES.h1}">{{title}}</h1>
        <p style="${STYLES.p}">Привіт, {{firstName}},</p>
        <p style="${STYLES.p}">{{message}}</p>
        {{detailsHtml}}
      `,
      text: `{{title}}\n\nПривіт, {{firstName}},\n\n{{message}}`,
    },
    ru: {
      subject: '{{title}}',
      preheader: '{{message}}',
      bodyHtml: `
        <h1 style="${STYLES.h1}">{{title}}</h1>
        <p style="${STYLES.p}">Привет, {{firstName}},</p>
        <p style="${STYLES.p}">{{message}}</p>
        {{detailsHtml}}
      `,
      text: `{{title}}\n\nПривет, {{firstName}},\n\n{{message}}`,
    },
  },

  // ── Trial expiring warning (7 days before) ────────────────────────────────
  trialExpiringWarning: {
    en: {
      subject: 'Your free trial ends in {{daysRemaining}} days',
      preheader: 'Trial ends {{trialEndDate}}.',
      bodyHtml: `
        <h1 style="${STYLES.h1}">Your free trial ends in {{daysRemaining}} days</h1>
        <p style="${STYLES.p}">Hi {{firstName}}, we hope you’ve been enjoying MiyZapis. Your 3-month free trial ends on <strong>{{trialEndDate}}</strong>.</p>
        <div style="${STYLES.warnBox}">
          <h3 style="${STYLES.h3}">What happens next</h3>
          {{#if isCustomer}}
            <p style="${STYLES.detailRow}">• A small deposit (typically 10–20%) will be required at booking</p>
            <p style="${STYLES.detailRow}">• All other features stay fully available</p>
          {{/if}}
          {{#if isSpecialist}}
            <p style="${STYLES.detailRow}">• Pick a plan: pay-per-use (20₴/booking) or monthly ($10/month)</p>
            <p style="${STYLES.detailRow}">• Keep every platform feature you have today</p>
          {{/if}}
        </div>
        ${cta('{{trialInfoUrl}}', 'See pricing')}
        <p style="${STYLES.faint}">Questions? <a href="{{helpUrl}}" style="${STYLES.link}">Contact support</a>.</p>
      `,
      text: `Your free trial ends in {{daysRemaining}} days\n\nHi {{firstName}},\n\nYour 3-month trial ends on {{trialEndDate}}.\n\nWhat happens next:\n{{#if isCustomer}}  - A small deposit (10–20%) will be required at booking\n  - All other features stay fully available\n{{/if}}{{#if isSpecialist}}  - Pick a plan: pay-per-use (20₴/booking) or monthly ($10/month)\n  - Keep every platform feature\n{{/if}}\nPricing: {{trialInfoUrl}}\nSupport: {{helpUrl}}`,
    },
    uk: {
      subject: 'Пробний період закінчується через {{daysRemaining}} днів',
      preheader: 'Пробний завершується {{trialEndDate}}.',
      bodyHtml: `
        <h1 style="${STYLES.h1}">Пробний період закінчується через {{daysRemaining}} днів</h1>
        <p style="${STYLES.p}">Привіт, {{firstName}}. Сподіваємося, вам подобається МійЗапис. Ваш 3-місячний пробний завершується <strong>{{trialEndDate}}</strong>.</p>
        <div style="${STYLES.warnBox}">
          <h3 style="${STYLES.h3}">Що буде далі</h3>
          {{#if isCustomer}}
            <p style="${STYLES.detailRow}">• Невеликий депозит (зазвичай 10–20%) при бронюванні</p>
            <p style="${STYLES.detailRow}">• Усі інші функції залишаються доступними</p>
          {{/if}}
          {{#if isSpecialist}}
            <p style="${STYLES.detailRow}">• Оберіть план: оплата за бронювання (20₴) або місячна ($10/міс)</p>
            <p style="${STYLES.detailRow}">• Усі функції платформи зберігаються</p>
          {{/if}}
        </div>
        ${cta('{{trialInfoUrl}}', 'Переглянути тарифи')}
        <p style="${STYLES.faint}">Є питання? <a href="{{helpUrl}}" style="${STYLES.link}">Зверніться до підтримки</a>.</p>
      `,
      text: `Пробний період закінчується через {{daysRemaining}} днів\n\nПривіт, {{firstName}},\n\nВаш 3-місячний пробний завершується {{trialEndDate}}.\n\nЩо буде далі:\n{{#if isCustomer}}  - Невеликий депозит (10–20%) при бронюванні\n  - Усі інші функції залишаються доступними\n{{/if}}{{#if isSpecialist}}  - Оберіть план: оплата за бронювання (20₴) або місячна ($10/міс)\n  - Усі функції платформи зберігаються\n{{/if}}\nТарифи: {{trialInfoUrl}}\nПідтримка: {{helpUrl}}`,
    },
    ru: {
      subject: 'Пробный период заканчивается через {{daysRemaining}} дней',
      preheader: 'Пробный завершается {{trialEndDate}}.',
      bodyHtml: `
        <h1 style="${STYLES.h1}">Пробный период заканчивается через {{daysRemaining}} дней</h1>
        <p style="${STYLES.p}">Привет, {{firstName}}. Надеемся, вам нравится МойЗапись. Ваш 3-месячный пробный завершается <strong>{{trialEndDate}}</strong>.</p>
        <div style="${STYLES.warnBox}">
          <h3 style="${STYLES.h3}">Что будет дальше</h3>
          {{#if isCustomer}}
            <p style="${STYLES.detailRow}">• Небольшой депозит (обычно 10–20%) при бронировании</p>
            <p style="${STYLES.detailRow}">• Все остальные функции остаются доступными</p>
          {{/if}}
          {{#if isSpecialist}}
            <p style="${STYLES.detailRow}">• Выберите план: за бронирование (20₴) или месячный ($10/мес)</p>
            <p style="${STYLES.detailRow}">• Все функции платформы сохраняются</p>
          {{/if}}
        </div>
        ${cta('{{trialInfoUrl}}', 'Посмотреть тарифы')}
        <p style="${STYLES.faint}">Есть вопросы? <a href="{{helpUrl}}" style="${STYLES.link}">Обратитесь в поддержку</a>.</p>
      `,
      text: `Пробный период заканчивается через {{daysRemaining}} дней\n\nПривет, {{firstName}},\n\nВаш 3-месячный пробный завершается {{trialEndDate}}.\n\nЧто будет дальше:\n{{#if isCustomer}}  - Небольшой депозит (10–20%) при бронировании\n  - Все остальные функции остаются доступными\n{{/if}}{{#if isSpecialist}}  - Выберите план: за бронирование (20₴) или месячный ($10/мес)\n  - Все функции платформы сохраняются\n{{/if}}\nТарифы: {{trialInfoUrl}}\nПоддержка: {{helpUrl}}`,
    },
  },

  // ── Trial expired ─────────────────────────────────────────────────────────
  trialExpired: {
    en: {
      subject: 'Your free trial has ended — thanks for trying MiyZapis',
      preheader: 'Your 3-month trial has ended.',
      bodyHtml: `
        <h1 style="${STYLES.h1}">Thanks for trying MiyZapis 🙌</h1>
        <p style="${STYLES.p}">Hi {{firstName}}, your 3-month free trial ended on <strong>{{trialEndDate}}</strong>.</p>
        <div style="${STYLES.infoBox}">
          <h3 style="${STYLES.h3}">What’s next</h3>
          {{#if isCustomer}}
            <p style="${STYLES.detailRow}">✓ Keep browsing and booking services</p>
            <p style="${STYLES.detailRow}">✓ Small deposits (10–20%) now apply at booking</p>
            <p style="${STYLES.detailRow}">✓ Every other feature stays fully accessible</p>
          {{/if}}
          {{#if isSpecialist}}
            <p style="${STYLES.detailRow}">✓ Keep serving customers and growing your business</p>
            <p style="${STYLES.detailRow}">✓ Pick the pricing plan that fits</p>
            <p style="${STYLES.detailRow}">✓ Every platform feature remains available</p>
          {{/if}}
        </div>
        ${cta('{{dashboardUrl}}', 'Open dashboard')}
        {{#if isSpecialist}}<div style="${STYLES.buttonRow}"><a href="{{pricingUrl}}" style="${STYLES.secondaryButton}">See pricing plans</a></div>{{/if}}
        <p style="${STYLES.faint}">Questions? <a href="{{helpUrl}}" style="${STYLES.link}">Contact support</a>.</p>
      `,
      text: `Thanks for trying MiyZapis!\n\nHi {{firstName}},\n\nYour 3-month free trial ended on {{trialEndDate}}.\n\nWhat’s next:\n{{#if isCustomer}}  ✓ Keep browsing and booking services\n  ✓ Small deposits (10–20%) now apply at booking\n  ✓ Every other feature stays fully accessible\n{{/if}}{{#if isSpecialist}}  ✓ Keep serving customers and growing your business\n  ✓ Pick the pricing plan that fits\n  ✓ Every platform feature remains available\n{{/if}}\nDashboard: {{dashboardUrl}}\n{{#if isSpecialist}}Pricing: {{pricingUrl}}{{/if}}\nSupport: {{helpUrl}}`,
    },
    uk: {
      subject: 'Ваш пробний завершився — дякуємо за використання МійЗапис',
      preheader: 'Ваш 3-місячний пробний завершився.',
      bodyHtml: `
        <h1 style="${STYLES.h1}">Дякуємо, що випробували МійЗапис 🙌</h1>
        <p style="${STYLES.p}">Привіт, {{firstName}}. Ваш 3-місячний пробний завершився <strong>{{trialEndDate}}</strong>.</p>
        <div style="${STYLES.infoBox}">
          <h3 style="${STYLES.h3}">Що далі</h3>
          {{#if isCustomer}}
            <p style="${STYLES.detailRow}">✓ Продовжуйте переглядати та бронювати послуги</p>
            <p style="${STYLES.detailRow}">✓ Тепер потрібен невеликий депозит (10–20%) при бронюванні</p>
            <p style="${STYLES.detailRow}">✓ Усі інші функції залишаються доступними</p>
          {{/if}}
          {{#if isSpecialist}}
            <p style="${STYLES.detailRow}">✓ Продовжуйте обслуговувати клієнтів та розвиватись</p>
            <p style="${STYLES.detailRow}">✓ Оберіть зручний тарифний план</p>
            <p style="${STYLES.detailRow}">✓ Усі функції платформи зберігаються</p>
          {{/if}}
        </div>
        ${cta('{{dashboardUrl}}', 'Перейти до кабінету')}
        {{#if isSpecialist}}<div style="${STYLES.buttonRow}"><a href="{{pricingUrl}}" style="${STYLES.secondaryButton}">Тарифні плани</a></div>{{/if}}
        <p style="${STYLES.faint}">Є питання? <a href="{{helpUrl}}" style="${STYLES.link}">Зверніться до підтримки</a>.</p>
      `,
      text: `Дякуємо, що випробували МійЗапис!\n\nПривіт, {{firstName}},\n\nВаш 3-місячний пробний завершився {{trialEndDate}}.\n\nЩо далі:\n{{#if isCustomer}}  ✓ Продовжуйте переглядати та бронювати\n  ✓ Невеликий депозит (10–20%) при бронюванні\n  ✓ Усі інші функції залишаються доступними\n{{/if}}{{#if isSpecialist}}  ✓ Продовжуйте обслуговувати клієнтів\n  ✓ Оберіть зручний тарифний план\n  ✓ Усі функції платформи зберігаються\n{{/if}}\nКабінет: {{dashboardUrl}}\n{{#if isSpecialist}}Тарифи: {{pricingUrl}}{{/if}}\nПідтримка: {{helpUrl}}`,
    },
    ru: {
      subject: 'Ваш пробный завершился — спасибо за МойЗапись',
      preheader: 'Ваш 3-месячный пробный завершился.',
      bodyHtml: `
        <h1 style="${STYLES.h1}">Спасибо, что попробовали МойЗапись 🙌</h1>
        <p style="${STYLES.p}">Привет, {{firstName}}. Ваш 3-месячный пробный завершился <strong>{{trialEndDate}}</strong>.</p>
        <div style="${STYLES.infoBox}">
          <h3 style="${STYLES.h3}">Что дальше</h3>
          {{#if isCustomer}}
            <p style="${STYLES.detailRow}">✓ Продолжайте просматривать и бронировать услуги</p>
            <p style="${STYLES.detailRow}">✓ Теперь требуется небольшой депозит (10–20%) при бронировании</p>
            <p style="${STYLES.detailRow}">✓ Все остальные функции остаются доступными</p>
          {{/if}}
          {{#if isSpecialist}}
            <p style="${STYLES.detailRow}">✓ Продолжайте обслуживать клиентов и развиваться</p>
            <p style="${STYLES.detailRow}">✓ Выберите удобный тарифный план</p>
            <p style="${STYLES.detailRow}">✓ Все функции платформы сохраняются</p>
          {{/if}}
        </div>
        ${cta('{{dashboardUrl}}', 'Перейти в кабинет')}
        {{#if isSpecialist}}<div style="${STYLES.buttonRow}"><a href="{{pricingUrl}}" style="${STYLES.secondaryButton}">Тарифные планы</a></div>{{/if}}
        <p style="${STYLES.faint}">Есть вопросы? <a href="{{helpUrl}}" style="${STYLES.link}">Обратитесь в поддержку</a>.</p>
      `,
      text: `Спасибо, что попробовали МойЗапись!\n\nПривет, {{firstName}},\n\nВаш 3-месячный пробный завершился {{trialEndDate}}.\n\nЧто дальше:\n{{#if isCustomer}}  ✓ Продолжайте просматривать и бронировать\n  ✓ Небольшой депозит (10–20%) при бронировании\n  ✓ Все остальные функции остаются доступными\n{{/if}}{{#if isSpecialist}}  ✓ Продолжайте обслуживать клиентов\n  ✓ Выберите удобный тарифный план\n  ✓ Все функции платформы сохраняются\n{{/if}}\nКабинет: {{dashboardUrl}}\n{{#if isSpecialist}}Тарифы: {{pricingUrl}}{{/if}}\nПоддержка: {{helpUrl}}`,
    },
  },
};

// Keep the existing public name (other modules import this).
export const emailTemplates = emailTemplatesRaw;

// ─────────────────────────────────────────────────────────────────────────────
// Public API (callers depend on this shape — do not change it)
// ─────────────────────────────────────────────────────────────────────────────

export function getEmailTemplate(templateKey: string, language: string = 'en') {
  const template = emailTemplatesRaw[templateKey];
  if (!template) {
    throw new Error(`Email template '${templateKey}' not found`);
  }
  const lang = normalizeLang(language);
  const content = template[lang] || template.en;
  return {
    subject: content.subject,
    html: renderBrandedHtml({
      lang,
      subject: content.subject,
      preheader: content.preheader,
      bodyHtml: content.bodyHtml,
    }),
    text: content.text.trim(),
  };
}

// Placeholder substitution. Supports {{key}} and {{#if cond}}…{{/if}}.
// Nested conditionals are handled by iterating the regex pass until stable —
// each pass only matches conditionals that contain no inner conditionals.
export function replacePlaceholders(template: string, data: Record<string, any>): string {
  let result = template;

  // Resolve conditionals from the inside out.
  // The inner negative lookahead ensures we only match conditionals that don't
  // contain another {{#if}} inside, so nested blocks resolve correctly.
  const condRegex = /\{\{#if\s+(\w+)\}\}((?:(?!\{\{#if\b)[\s\S])*?)\{\{\/if\}\}/g;
  let prev: string;
  let safety = 16;
  do {
    prev = result;
    result = result.replace(condRegex, (_match, condition, content) => {
      return data[condition] ? content : '';
    });
    safety -= 1;
  } while (result !== prev && safety > 0);

  // Simple {{key}} substitutions last so values can’t inject conditional syntax.
  Object.keys(data).forEach((key) => {
    const value = data[key];
    const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    result = result.replace(placeholder, value === undefined || value === null ? '' : String(value));
  });

  return result;
}
