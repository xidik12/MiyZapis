import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

// ---------------------------------------------------------------------------
// Embedded content (en / uk / ru) — no shared i18n files touched
// ---------------------------------------------------------------------------

interface Section {
  title: string;
  body: React.ReactNode;
}

interface PolicyContent {
  pageTitle: string;
  lastUpdatedLabel: string;
  lastUpdatedDate: string;
  legalNotice: string;
  entityPlaceholder: string;
  contactBoxLabel: string;
  sections: Section[];
}

// helper: tabular-nums wrapper
const Num: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="tabular-nums">{children}</span>
);

// ---------------------------------------------------------------------------
// English
// ---------------------------------------------------------------------------
const en: PolicyContent = {
  pageTitle: 'Refund & Cancellation Policy',
  lastUpdatedLabel: 'Last updated:',
  lastUpdatedDate: 'June 1, 2026',
  legalNotice:
    'This document is a policy template and does not constitute legal advice. We recommend having it reviewed by a qualified lawyer before relying on it in a legal context.',
  entityPlaceholder: 'MiyZapis',
  contactBoxLabel: 'Billing questions?',
  sections: [
    {
      title: '1. Scope',
      body: (
        <>
          <p>
            This Refund &amp; Cancellation Policy applies to two distinct relationships on the
            MiyZapis platform:
          </p>
          <ol className="list-[lower-alpha] pl-6 space-y-1">
            <li>
              <strong>Customer bookings</strong> — when a client books a service offered by a
              specialist or business through MiyZapis.
            </li>
            <li>
              <strong>Specialist / business subscriptions</strong> — when a specialist or business
              pays for a MiyZapis subscription plan (billed via Telegram Stars) or uses
              pay-per-booking billing (₴<Num>20</Num>/booking).
            </li>
          </ol>
          <p>
            Operating entity: MiyZapis (
            <span className="italic text-gray-500 dark:text-gray-400">MiyZapis</span>
            ).
          </p>
        </>
      ),
    },
    {
      title: '2. Booking Cancellations by Customers',
      body: (
        <>
          <h3 className="text-base font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">
            How to cancel
          </h3>
          <p>
            Open the booking in the MiyZapis app and tap <strong>Cancel booking</strong>, or
            contact the specialist directly through the platform chat. We recommend cancelling as
            early as possible so the specialist can re-open the time slot.
          </p>

          <h3 className="text-base font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">
            Cancellation windows &amp; fees
          </h3>
          <p>
            Each specialist may configure their own cancellation policy per service. For
            example, a specialist may require cancellation at least <Num>24</Num> hours in advance
            and set a no-show or late-cancellation fee. These terms are shown to customers before
            they confirm a booking.
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Within the specialist's cancellation window</strong> — cancellation is free;
              no charge applies.
            </li>
            <li>
              <strong>Outside the cancellation window</strong> — a deposit or no-show fee may apply
              <em> if</em> the specialist has configured one.
            </li>
          </ul>

          <h3 className="text-base font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">
            Current payment status (important)
          </h3>
          <p>
            As of the date of this policy, MiyZapis does not process online payments for most
            service bookings — payment happens in person at the time of service. This means that
            in practice, most cancellations result in <strong>no online charge</strong>, regardless
            of the cancellation window. Specialist-configured cancellation conditions are
            currently informational. If and when online deposit collection is introduced, this
            section will be updated and customers notified.
          </p>
        </>
      ),
    },
    {
      title: '3. Cancellations & No-Shows by the Specialist',
      body: (
        <>
          <p>
            If a specialist cancels a confirmed booking, the customer owes nothing. Any deposit
            collected online (if online deposits are enabled at the time) will be refunded in
            full to the original payment method within <Num>5</Num>–<Num>10</Num> business days.
          </p>
          <p>
            If a specialist repeatedly cancels or fails to honour bookings, MiyZapis may review
            the account in accordance with our Terms of Service.
          </p>
        </>
      ),
    },
    {
      title: '4. Rescheduling',
      body: (
        <p>
          Rescheduling is handled directly between the customer and the specialist via the
          platform chat or by cancelling and re-booking. Rescheduling is subject to the
          specialist's availability and their cancellation policy. MiyZapis does not charge
          a rescheduling fee.
        </p>
      ),
    },
    {
      title: '5. Reviews After Cancellation',
      body: (
        <p>
          Customers who cancel a booking before the service takes place are not entitled to
          leave a review for that booking. Reviews may only be submitted after a service has
          been marked as completed. Specialists retain the right to respond to any review in
          accordance with our community guidelines.
        </p>
      ),
    },
    {
      title: '6. Specialist & Business Subscription Payments',
      body: (
        <>
          <h3 className="text-base font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">
            Billing methods
          </h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Subscription plans (monthly / annual)</strong> — paid via Telegram Stars.
            </li>
            <li>
              <strong>Pay-per-booking</strong> — ₴<Num>20</Num> charged per completed booking
              confirmation; no upfront subscription required.
            </li>
          </ul>

          <h3 className="text-base font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">
            Telegram Stars — non-refundable
          </h3>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 my-3">
            <p className="mb-0 text-amber-900 dark:text-amber-200">
              <strong>Important:</strong> Telegram Stars purchases are governed by Telegram's own
              terms and are <strong>generally non-refundable</strong> once the Stars have been
              used to activate a subscription. MiyZapis has no ability to issue refunds for
              Telegram Stars payments on Telegram's behalf. If you believe you were charged in
              error, contact Telegram Support directly in addition to reaching out to us.
            </p>
          </div>

          <h3 className="text-base font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">
            Cancelling a subscription / stopping auto-renewal
          </h3>
          <p>
            You can cancel auto-renewal at any time through the Telegram Subscriptions settings.
            After cancellation, your subscription remains active until the end of the current
            paid period — you will not be charged again after that date. No partial refunds are
            issued for unused days in the current period.
          </p>

          <h3 className="text-base font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">
            Free trial
          </h3>
          <p>
            New specialist accounts receive a <Num>2</Num>-month free trial. You may cancel the
            trial at any time before it converts to a paid subscription — no charge will be
            made. If you do not cancel before the trial ends, the subscription will activate
            and you will be billed via Telegram Stars.
          </p>
        </>
      ),
    },
    {
      title: '7. How to Request Help with a Billing Issue',
      body: (
        <>
          <p>
            For any billing question, disputed charge, or refund request, please contact us:
          </p>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mt-4">
            <p className="mb-2">
              <strong>Email:</strong>{' '}
              <a
                href="mailto:support@miyzapis.com"
                className="text-blue-600 dark:text-blue-400 underline underline-offset-2
                           transition-all duration-150 hover:text-blue-700 dark:hover:text-blue-300
                           active:scale-[0.96] inline-block"
              >
                support@miyzapis.com
              </a>
            </p>
            <p className="mb-0 text-sm text-gray-600 dark:text-gray-400">
              We aim to respond within <Num>2</Num> business days. Please include your account
              email, booking or transaction reference, and a brief description of the issue.
            </p>
          </div>
        </>
      ),
    },
    {
      title: '8. Changes to This Policy',
      body: (
        <p>
          MiyZapis reserves the right to update this policy at any time. Material changes will
          be communicated via in-app notification or email at least <Num>14</Num> days before
          taking effect. Continued use of the platform after a change takes effect constitutes
          acceptance of the updated policy.
        </p>
      ),
    },
    {
      title: '9. Governing Law',
      body: (
        <p>
          This policy is governed by and construed in accordance with the laws of Ukraine.
          Any disputes arising under this policy shall be subject to the jurisdiction of the
          competent courts of Ukraine.
        </p>
      ),
    },
  ],
};

// ---------------------------------------------------------------------------
// Ukrainian (primary)
// ---------------------------------------------------------------------------
const uk: PolicyContent = {
  pageTitle: 'Політика повернення коштів та скасування',
  lastUpdatedLabel: 'Останнє оновлення:',
  lastUpdatedDate: '1 червня 2026 р.',
  legalNotice:
    'Цей документ є шаблоном політики і не є юридичною порадою. Рекомендуємо проконсультуватися з кваліфікованим юристом перед використанням у правовому контексті.',
  entityPlaceholder: 'MiyZapis',
  contactBoxLabel: 'Питання щодо оплати?',
  sections: [
    {
      title: '1. Сфера застосування',
      body: (
        <>
          <p>
            Ця Політика повернення коштів та скасування поширюється на дві окремі відносини на
            платформі МійЗапис:
          </p>
          <ol className="list-[lower-alpha] pl-6 space-y-1">
            <li>
              <strong>Бронювання послуг клієнтами</strong> — коли клієнт записується на послугу
              спеціаліста або бізнесу через МійЗапис.
            </li>
            <li>
              <strong>Підписки спеціалістів / бізнесів</strong> — коли спеціаліст або бізнес
              оплачує тарифний план МійЗапис (через Telegram Stars) або використовує оплату за
              кожне бронювання (₴<Num>20</Num>/бронювання).
            </li>
          </ol>
          <p>
            Оператор: МійЗапис (
            <span className="italic text-gray-500 dark:text-gray-400">MiyZapis</span>
            ).
          </p>
        </>
      ),
    },
    {
      title: '2. Скасування бронювання клієнтом',
      body: (
        <>
          <h3 className="text-base font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">
            Як скасувати
          </h3>
          <p>
            Відкрийте бронювання в додатку МійЗапис і натисніть <strong>Скасувати запис</strong>,
            або зверніться до спеціаліста безпосередньо через чат платформи. Рекомендуємо
            скасовувати якомога раніше, щоб спеціаліст міг відкрити вільний час.
          </p>

          <h3 className="text-base font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">
            Вікна скасування та плата
          </h3>
          <p>
            Кожен спеціаліст може налаштувати власну політику скасування для кожної послуги.
            Наприклад, спеціаліст може вимагати скасування щонайменше за <Num>24</Num> години та
            встановити плату за неявку або пізнє скасування. Ці умови відображаються клієнту
            перед підтвердженням запису.
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>У межах вікна скасування спеціаліста</strong> — скасування безкоштовне;
              жодної плати не стягується.
            </li>
            <li>
              <strong>Поза межами вікна скасування</strong> — може стягуватися завдаток або
              плата за неявку, <em>якщо</em> спеціаліст її налаштував.
            </li>
          </ul>

          <h3 className="text-base font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">
            Поточний статус платежів (важливо)
          </h3>
          <p>
            На дату цієї політики МійЗапис не обробляє онлайн-платежі за більшість бронювань
            послуг — оплата відбувається особисто під час надання послуги. Тому на практиці
            більшість скасувань <strong>не тягнуть жодного онлайн-списання</strong>, незалежно
            від вікна скасування. Умови скасування, налаштовані спеціалістом, наразі мають
            інформаційний характер. Якщо та коли буде запроваджено онлайн-збір завдатків, цей
            розділ буде оновлено, а клієнтів повідомлено.
          </p>
        </>
      ),
    },
    {
      title: '3. Скасування та неявка спеціаліста',
      body: (
        <>
          <p>
            Якщо спеціаліст скасовує підтверджений запис, клієнт нічого не зобов’язаний
            сплачувати. Будь-який завдаток, зібраний онлайн (якщо на той момент діє онлайн-збір
            завдатків), буде повернуто в повному обсязі на оригінальний платіжний метод протягом{' '}
            <Num>5</Num>–<Num>10</Num> робочих днів.
          </p>
          <p>
            Якщо спеціаліст систематично скасовує або ігнорує записи, МійЗапис може переглянути
            обліковий запис відповідно до Умов надання послуг.
          </p>
        </>
      ),
    },
    {
      title: '4. Перенесення запису',
      body: (
        <p>
          Перенесення запису здійснюється безпосередньо між клієнтом і спеціалістом через чат
          платформи або шляхом скасування та повторного бронювання. Перенесення залежить від
          доступності спеціаліста та його політики скасування. МійЗапис не стягує плату за
          перенесення.
        </p>
      ),
    },
    {
      title: '5. Відгуки після скасування',
      body: (
        <p>
          Клієнти, які скасували запис до надання послуги, не мають права залишати відгук щодо
          цього бронювання. Відгуки можна залишати лише після того, як послугу позначено як
          виконану. Спеціалісти мають право відповідати на будь-який відгук відповідно до наших
          правил спільноти.
        </p>
      ),
    },
    {
      title: '6. Платежі за підписку спеціаліста / бізнесу',
      body: (
        <>
          <h3 className="text-base font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">
            Способи оплати
          </h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Тарифні плани (місячний / річний)</strong> — оплата через Telegram Stars.
            </li>
            <li>
              <strong>Оплата за бронювання</strong> — ₴<Num>20</Num> за кожне підтверджене
              бронювання; передплата не потрібна.
            </li>
          </ul>

          <h3 className="text-base font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">
            Telegram Stars — не повертаються
          </h3>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 my-3">
            <p className="mb-0 text-amber-900 dark:text-amber-200">
              <strong>Важливо:</strong> Покупки Telegram Stars регулюються власними умовами
              Telegram і <strong>як правило, не підлягають поверненню</strong> після використання
              Stars для активації підписки. МійЗапис не може повертати платежі Telegram Stars від
              імені Telegram. Якщо ви вважаєте, що з вас стягнуто помилкову суму, зверніться
              безпосередньо до служби підтримки Telegram, а також повідомте нас.
            </p>
          </div>

          <h3 className="text-base font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">
            Скасування підписки / вимкнення автопоновлення
          </h3>
          <p>
            Ви можете скасувати автопоновлення в будь-який час через налаштування підписок у
            Telegram. Після скасування підписка залишається активною до кінця оплаченого
            периоду — наступного списання не буде. Повернення коштів за невикористані дні
            поточного периоду не здійснюється.
          </p>

          <h3 className="text-base font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">
            Безкоштовний пробний период
          </h3>
          <p>
            Нові акаунти спеціалістів отримують <Num>2</Num>-місячний безкоштовний пробний
            период. Ви можете скасувати пробний период у будь-який час до його переходу в
            платну підписку — жодна плата не буде стягнута. Якщо пробний период не скасовано до
            закінчення, підписка активується і буде виставлено рахунок через Telegram Stars.
          </p>
        </>
      ),
    },
    {
      title: '7. Як звернутися з питанням щодо оплати',
      body: (
        <>
          <p>
            З будь-яким питанням щодо оплати, оскарженого списання або запиту на повернення
            коштів звертайтеся до нас:
          </p>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mt-4">
            <p className="mb-2">
              <strong>Email:</strong>{' '}
              <a
                href="mailto:support@miyzapis.com"
                className="text-blue-600 dark:text-blue-400 underline underline-offset-2
                           transition-all duration-150 hover:text-blue-700 dark:hover:text-blue-300
                           active:scale-[0.96] inline-block"
              >
                support@miyzapis.com
              </a>
            </p>
            <p className="mb-0 text-sm text-gray-600 dark:text-gray-400">
              Ми намагаємося відповідати протягом <Num>2</Num> робочих днів. Вкажіть email
              акаунту, номер бронювання або транзакції та короткий опис проблеми.
            </p>
          </div>
        </>
      ),
    },
    {
      title: '8. Зміни до цієї політики',
      body: (
        <p>
          МійЗапис залишає за собою право оновлювати цю політику в будь-який час. Про суттєві
          зміни буде повідомлено через сповіщення в додатку або електронною поштою щонайменше за{' '}
          <Num>14</Num> днів до набрання чинності. Подальше використання платформи після набрання
          змінами чинності означає їх прийняття.
        </p>
      ),
    },
    {
      title: '9. Застосовне право',
      body: (
        <p>
          Ця політика регулюється та тлумачиться відповідно до законодавства України. Будь-які
          суперечки, що виникають у зв’язку з цією політикою, підлягають розгляду компетентними
          судами України.
        </p>
      ),
    },
  ],
};

// ---------------------------------------------------------------------------
// Russian
// ---------------------------------------------------------------------------
const ru: PolicyContent = {
  pageTitle: 'Политика возврата средств и отмены',
  lastUpdatedLabel: 'Последнее обновление:',
  lastUpdatedDate: '1 июня 2026 г.',
  legalNotice:
    'Этот документ является шаблоном политики и не является юридической консультацией. Рекомендуем проконсультироваться с квалифицированным юристом перед использованием в правовом контексте.',
  entityPlaceholder: 'MiyZapis',
  contactBoxLabel: 'Вопросы по оплате?',
  sections: [
    {
      title: '1. Область применения',
      body: (
        <>
          <p>
            Настоящая Политика возврата средств и отмены распространяется на два типа отношений
            на платформе МийЗапис:
          </p>
          <ol className="list-[lower-alpha] pl-6 space-y-1">
            <li>
              <strong>Бронирование услуг клиентами</strong> — когда клиент записывается на услугу
              специалиста или бизнеса через МийЗапис.
            </li>
            <li>
              <strong>Подписки специалистов / бизнесов</strong> — когда специалист или бизнес
              оплачивает тарифный план МийЗапис (через Telegram Stars) или использует оплату за
              каждое бронирование (₴<Num>20</Num>/бронирование).
            </li>
          </ol>
          <p>
            Оператор: МийЗапис (
            <span className="italic text-gray-500 dark:text-gray-400">MiyZapis</span>
            ).
          </p>
        </>
      ),
    },
    {
      title: '2. Отмена бронирования клиентом',
      body: (
        <>
          <h3 className="text-base font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">
            Как отменить
          </h3>
          <p>
            Откройте бронирование в приложении МийЗапис и нажмите <strong>Отменить запись</strong>,
            или свяжитесь со специалистом напрямую через чат платформы. Рекомендуем отменять как
            можно раньше, чтобы специалист мог освободить время.
          </p>

          <h3 className="text-base font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">
            Окна отмены и сборы
          </h3>
          <p>
            Каждый специалист может настроить собственную политику отмены для каждой услуги.
            Например, специалист может требовать отмены не менее чем за <Num>24</Num> часа и
            установить штраф за неявку или позднюю отмену. Эти условия отображаются клиенту
            до подтверждения записи.
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>В пределах окна отмены специалиста</strong> — отмена бесплатна; никакой
              платы не взимается.
            </li>
            <li>
              <strong>За пределами окна отмены</strong> — может взиматься задаток или штраф за
              неявку, <em>если</em> специалист его настроил.
            </li>
          </ul>

          <h3 className="text-base font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">
            Текущий статус платежей (важно)
          </h3>
          <p>
            На дату настоящей политики МийЗапис не обрабатывает онлайн-платежи за большинство
            бронирований услуг — оплата происходит лично при оказании услуги. Поэтому на практике
            большинство отмен <strong>не влекут никаких онлайн-списаний</strong>, независимо от
            окна отмены. Условия отмены, настроенные специалистом, в настоящее время носят
            информационный характер. Если и когда будет введён онлайн-сбор задатков, данный
            раздел будет обновлён, а клиенты — уведомлены.
          </p>
        </>
      ),
    },
    {
      title: '3. Отмена и неявка специалиста',
      body: (
        <>
          <p>
            Если специалист отменяет подтверждённую запись, клиент ничего не обязан платить.
            Любой задаток, собранный онлайн (если на тот момент действует онлайн-сбор задатков),
            будет возвращён в полном объёме на исходный способ оплаты в течение{' '}
            <Num>5</Num>–<Num>10</Num> рабочих дней.
          </p>
          <p>
            Если специалист систематически отменяет или игнорирует записи, МийЗапис может
            пересмотреть учётную запись в соответствии с Условиями предоставления услуг.
          </p>
        </>
      ),
    },
    {
      title: '4. Перенос записи',
      body: (
        <p>
          Перенос осуществляется непосредственно между клиентом и специалистом через чат
          платформы или путём отмены и повторного бронирования. Перенос зависит от доступности
          специалиста и его политики отмены. МийЗапис не взимает плату за перенос.
        </p>
      ),
    },
    {
      title: '5. Отзывы после отмены',
      body: (
        <p>
          Клиенты, отменившие запись до оказания услуги, не вправе оставлять отзыв по данному
          бронированию. Отзывы можно оставлять только после того, как услуга отмечена как
          выполненная. Специалисты вправе отвечать на любой отзыв в соответствии с нашими
          правилами сообщества.
        </p>
      ),
    },
    {
      title: '6. Платежи за подписку специалиста / бизнеса',
      body: (
        <>
          <h3 className="text-base font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">
            Способы оплаты
          </h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Тарифные планы (ежемесячный / годовой)</strong> — оплата через Telegram
              Stars.
            </li>
            <li>
              <strong>Оплата за бронирование</strong> — ₴<Num>20</Num> за каждое подтверждённое
              бронирование; предоплата не требуется.
            </li>
          </ul>

          <h3 className="text-base font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">
            Telegram Stars — возврат невозможен
          </h3>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 my-3">
            <p className="mb-0 text-amber-900 dark:text-amber-200">
              <strong>Важно:</strong> Покупки Telegram Stars регулируются собственными условиями
              Telegram и <strong>как правило, не подлежат возврату</strong> после использования
              Stars для активации подписки. МийЗапис не может возвращать платежи Telegram Stars
              от имени Telegram. Если вы считаете, что с вас была снята ошибочная сумма,
              обратитесь непосредственно в службу поддержки Telegram, а также сообщите нам.
            </p>
          </div>

          <h3 className="text-base font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">
            Отмена подписки / отключение автопродления
          </h3>
          <p>
            Вы можете отменить автопродление в любое время через настройки подписок в Telegram.
            После отмены подписка остаётся активной до конца оплаченного периода — следующего
            списания не будет. Возврат средств за неиспользованные дни текущего периода не
            осуществляется.
          </p>

          <h3 className="text-base font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">
            Бесплатный пробный период
          </h3>
          <p>
            Новые аккаунты специалистов получают <Num>2</Num>-месячный бесплатный пробный период.
            Вы можете отменить пробный период в любое время до его перехода в платную подписку —
            никакая плата взиматься не будет. Если пробный период не отменён до истечения, подписка
            активируется и будет выставлен счёт через Telegram Stars.
          </p>
        </>
      ),
    },
    {
      title: '7. Как обратиться с вопросом по оплате',
      body: (
        <>
          <p>
            По любому вопросу оплаты, оспариваемому списанию или запросу на возврат средств
            обращайтесь к нам:
          </p>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mt-4">
            <p className="mb-2">
              <strong>Email:</strong>{' '}
              <a
                href="mailto:support@miyzapis.com"
                className="text-blue-600 dark:text-blue-400 underline underline-offset-2
                           transition-all duration-150 hover:text-blue-700 dark:hover:text-blue-300
                           active:scale-[0.96] inline-block"
              >
                support@miyzapis.com
              </a>
            </p>
            <p className="mb-0 text-sm text-gray-600 dark:text-gray-400">
              Мы стараемся отвечать в течение <Num>2</Num> рабочих дней. Укажите email аккаунта,
              номер бронирования или транзакции и краткое описание проблемы.
            </p>
          </div>
        </>
      ),
    },
    {
      title: '8. Изменения в настоящей политике',
      body: (
        <p>
          МийЗапис оставляет за собой право обновлять настоящую политику в любое время.
          О существенных изменениях будет сообщено через уведомление в приложении или по
          электронной почте не менее чем за <Num>14</Num> дней до вступления в силу. Дальнейшее
          использование платформы после вступления изменений в силу означает их принятие.
        </p>
      ),
    },
    {
      title: '9. Применимое право',
      body: (
        <p>
          Настоящая политика регулируется и толкуется в соответствии с законодательством Украины.
          Любые споры, возникающие в связи с настоящей политикой, подлежат рассмотрению
          компетентными судами Украины.
        </p>
      ),
    },
  ],
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CONTENT = { en, uk, ru } as const;

const RefundPolicyPage: React.FC = () => {
  const { language } = useLanguage();
  const content = CONTENT[language as keyof typeof CONTENT] ?? uk;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {content.pageTitle}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {content.lastUpdatedLabel}{' '}
            <span className="tabular-nums">{content.lastUpdatedDate}</span>
          </p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">

          {/* Legal notice banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
            <p className="text-blue-800 dark:text-blue-200 mb-0 text-sm">
              ⚠ {content.legalNotice}
            </p>
          </div>

          {/* Numbered sections */}
          {content.sections.map((section) => (
            <section key={section.title} className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                {section.title}
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-3 leading-relaxed">
                {section.body}
              </div>
            </section>
          ))}

          {/* Contact / support box at bottom */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mt-8">
            <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {content.contactBoxLabel}
            </p>
            <a
              href="mailto:support@miyzapis.com"
              className="text-blue-600 dark:text-blue-400 underline underline-offset-2
                         font-medium transition-all duration-150
                         hover:text-blue-700 dark:hover:text-blue-300
                         active:scale-[0.96] inline-block"
            >
              support@miyzapis.com
            </a>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RefundPolicyPage;
