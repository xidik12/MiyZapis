import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

// ---------------------------------------------------------------------------
// Local content — NOT imported from shared i18n to avoid merge conflicts.
// Ukrainian is the primary audience; all three locales are provided in full.
// ---------------------------------------------------------------------------

const CONTENT = {
  en: {
    title: 'User Agreement',
    lastUpdated: 'Last updated: 1 June 2026',
    legalNote:
      'This document is template content only and does not constitute legal advice. It should be reviewed and adapted by a qualified lawyer before being relied upon.',
    intro:
      'This User Agreement ("Agreement") governs the relationship between MiyZapis and all persons who access or use the platform — whether as customers, specialists, or business accounts. By creating an account or using any part of the platform you confirm that you have read, understood, and agree to be bound by this Agreement.',
    sections: [
      {
        id: '1',
        title: '1. Acceptance & Eligibility',
        paragraphs: [
          'By registering an account or using MiyZapis in any way you agree to this Agreement. If you do not agree, do not use the platform.',
          'You must be at least 18 years old and have full legal capacity under applicable law to enter into binding contracts. By using the platform you represent and warrant that you meet these requirements.',
          'If you are registering on behalf of a legal entity you represent that you are authorised to bind that entity to this Agreement, and "you" includes that entity.',
          'The platform is operated by МійЗапис, hereinafter referred to as "MiyZapis", "we", "us", or "our".',
        ],
      },
      {
        id: '2',
        title: '2. Account Types & Permitted Use',
        paragraphs: [
          'The platform supports three account types, each with distinct permissions:',
        ],
        subsections: [
          {
            title: 'Customer Account',
            items: [
              'Browse specialist and business profiles.',
              'Book appointments and sessions through the platform.',
              'Leave honest reviews based on genuine personal experience.',
              'Manage your own booking history and personal information.',
            ],
          },
          {
            title: 'Specialist Account',
            items: [
              'Create and maintain a professional profile listing your services, prices, and availability.',
              'Receive and manage booking requests from customers.',
              'Access CRM tools, analytics, and scheduling features.',
              'Specialists are independent service providers, not employees or agents of MiyZapis. MiyZapis is not party to any service contract between a specialist and a customer.',
            ],
          },
          {
            title: 'Business Account',
            items: [
              'Manage multiple specialists and locations under one business profile.',
              'Access business-level analytics and staff management tools.',
              'All obligations applicable to Specialist Accounts apply equally to Business Accounts and all specialists registered under them.',
            ],
          },
        ],
      },
      {
        id: '3',
        title: '3. Account Security & Accurate Information',
        paragraphs: [
          'You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account.',
          'You agree to provide accurate, current, and complete information when registering and to keep that information up to date. Providing false information is grounds for immediate termination.',
          'Notify us immediately at info@incognitogeneration.com if you believe your account has been compromised.',
          'You may not share your account, sell it, or transfer it to another person.',
        ],
      },
      {
        id: '4',
        title: '4. Acceptable Use & Prohibited Conduct',
        paragraphs: [
          'You agree to use the platform only for lawful purposes and in a manner that does not infringe the rights of others. The following conduct is strictly prohibited:',
        ],
        list: [
          'Fraud, misrepresentation, or impersonation of any person or entity.',
          'Harassment, abuse, threats, or discriminatory conduct directed at other users.',
          'Scraping, crawling, or otherwise extracting platform data by automated means without our written consent.',
          'Circumventing platform fees by arranging bookings discovered on MiyZapis through external channels to avoid the subscription fee ("fee circumvention").',
          'Posting false, misleading, or defamatory content including fake reviews.',
          'Uploading malware, spam, or any content that disrupts platform operations.',
          'Attempting to reverse-engineer, decompile, or otherwise access the platform\'s source code.',
          'Using the platform for any illegal purpose under Ukrainian law or the laws applicable to you.',
        ],
        paragraphsAfter: [
          'We reserve the right to investigate suspected violations and to take any action we deem appropriate, including suspending or terminating accounts.',
        ],
      },
      {
        id: '5',
        title: '5. Content & Reviews',
        paragraphs: [
          'You retain ownership of content you submit (profile text, photos, reviews). By submitting content you grant MiyZapis a non-exclusive, royalty-free, worldwide licence to display, reproduce, and distribute that content on the platform and in related marketing materials.',
          'Reviews must be based on a genuine, direct experience with the specialist or business. You must not post reviews in exchange for payment, discounts, or other incentives.',
          'MiyZapis does not verify the accuracy of user-submitted content and is not liable for it. We may remove content that violates this Agreement or applicable law without notice.',
          'You represent that your content does not infringe third-party intellectual property rights, privacy rights, or applicable law.',
        ],
      },
      {
        id: '6',
        title: '6. Specialist & Business Relationship with the Platform',
        paragraphs: [
          'Specialists and businesses are independent providers. MiyZapis provides a marketplace and SaaS toolset — it is not a staffing agency, employer, or party to the service contract between a customer and a specialist.',
          'Specialists and businesses are solely responsible for the quality, legality, safety, and delivery of their services. MiyZapis makes no warranty regarding any specialist\'s qualifications, licences, or conduct.',
        ],
        subsections: [
          {
            title: 'Subscription & Fees',
            items: [
              '2-month free trial: New specialist and business accounts receive a 2-month free trial with full platform access.',
              'Monthly subscription via Telegram Stars: After the trial, continued access requires an active monthly or annual subscription paid through Telegram Stars.',
              'Fees are subject to change. We will provide at least 30 days\' notice of any fee change via email or in-platform notification. Continued use after the notice period constitutes acceptance of the new fees.',
            ],
          },
        ],
      },
      {
        id: '7',
        title: '7. Bookings & Payments',
        paragraphs: [
          'MiyZapis facilitates discovery and scheduling only. The platform is a booking venue — it does not process, hold, or facilitate the transfer of service payments between customers and specialists.',
          'Payment for services is arranged and settled directly between the customer and the specialist, in person or by any method they agree upon. MiyZapis is not responsible for payment disputes, refunds, or non-payment.',
          'Customers are advised to confirm service prices with the specialist before attending an appointment.',
          'Cancellations and rescheduling are governed by the individual specialist\'s own cancellation policy, which should be communicated to the customer before booking.',
        ],
      },
      {
        id: '8',
        title: '8. Data Roles',
        paragraphs: [
          'Specialists and businesses who collect personal data about their clients through their use of the platform are independent data controllers in respect of that data and are responsible for complying with applicable data protection law (including the Law of Ukraine "On Personal Data Protection").',
          'MiyZapis is the data controller for platform-level data (account registration data, usage data, etc.) and processes such data as described in our Privacy Policy available at /privacy.',
          'By using the platform you agree to the processing of your data as described in the Privacy Policy.',
        ],
      },
      {
        id: '9',
        title: '9. Suspension & Termination',
        paragraphs: [
          'You may close your account at any time by contacting info@incognitogeneration.com.',
          'We may suspend or terminate your account immediately, without prior notice, if you breach this Agreement, engage in conduct harmful to other users or the platform, fail to pay applicable fees, or if required by law.',
          'Upon termination your right to access the platform ceases immediately. We may retain data as required by law or our Privacy Policy.',
          'Termination does not relieve you of obligations that accrued before termination (including any outstanding fees).',
        ],
      },
      {
        id: '10',
        title: '10. Disclaimers & Limitation of Liability',
        paragraphs: [
          'THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY LAW, MIYZAPIS DISCLAIMS ALL WARRANTIES INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.',
          'MiyZapis does not guarantee the quality, safety, legality, or suitability of any service offered by a specialist or business on the platform. All dealings between customers and specialists are at your own risk.',
          'TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, MIYZAPIS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE PLATFORM, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.',
          'Nothing in this Agreement limits liability that cannot be excluded by law (including liability for gross negligence, wilful misconduct, or personal injury).',
        ],
      },
      {
        id: '11',
        title: '11. Governing Law & Dispute Resolution',
        paragraphs: [
          'This Agreement is governed by the laws of Ukraine, without regard to its conflict of law provisions.',
          'Any dispute arising out of or in connection with this Agreement shall first be submitted to mediation in good faith. If the dispute cannot be resolved by mediation within 30 days, it shall be submitted to the competent courts of Ukraine.',
          'Nothing in this clause prevents either party from seeking urgent injunctive or other equitable relief from a court of competent jurisdiction.',
        ],
      },
      {
        id: '12',
        title: '12. Changes to This Agreement',
        paragraphs: [
          'We may update this Agreement from time to time. When we do, we will revise the "Last updated" date at the top of this page and, for material changes, notify registered users by email or in-platform notification at least 14 days before the change takes effect.',
          'Your continued use of the platform after the effective date of any change constitutes your acceptance of the updated Agreement.',
          'If you do not agree to an updated Agreement you must stop using the platform and close your account before the effective date.',
        ],
      },
      {
        id: '13',
        title: '13. Contact',
        paragraphs: [
          'If you have questions about this Agreement, please contact us:',
        ],
        contact: true,
      },
    ],
  },

  uk: {
    title: 'Угода користувача',
    lastUpdated: 'Останнє оновлення: 1 червня 2026 р.',
    legalNote:
      'Цей документ є шаблонним текстом і не є юридичною консультацією. Перед тим як покладатися на нього, він має бути перевірений і адаптований кваліфікованим юристом.',
    intro:
      'Ця Угода користувача («Угода») регулює відносини між MiyZapis та всіма особами, які отримують доступ до платформи або використовують її — як клієнти, спеціалісти чи бізнес-акаунти. Реєструючи акаунт або використовуючи будь-яку частину платформи, ви підтверджуєте, що ознайомилися з цією Угодою, зрозуміли її та погоджуєтеся дотримуватися її умов.',
    sections: [
      {
        id: '1',
        title: '1. Прийняття умов і вимоги до користувача',
        paragraphs: [
          'Реєструючи акаунт або використовуючи MiyZapis будь-яким способом, ви погоджуєтеся з цією Угодою. Якщо ви не погоджуєтеся, не використовуйте платформу.',
          'Вам має бути не менше 18 років, і ви повинні мати повну дієздатність відповідно до чинного законодавства для укладення обов’язкових договорів. Використовуючи платформу, ви підтверджуєте, що відповідаєте цим вимогам.',
          'Якщо ви реєструєтеся від імені юридичної особи, ви підтверджуєте, що уповноважені зобов’язати цю особу умовами Угоди, а «ви» включає і цю юридичну особу.',
          'Платформою керує МійЗапис, далі іменована «MiyZapis», «ми», «нас» або «наш».',
        ],
      },
      {
        id: '2',
        title: '2. Типи акаунтів і дозволене використання',
        paragraphs: [
          'Платформа підтримує три типи акаунтів, кожен із відповідними правами:',
        ],
        subsections: [
          {
            title: 'Акаунт клієнта',
            items: [
              'Перегляд профілів спеціалістів і компаній.',
              'Запис на прийом та сеанси через платформу.',
              'Залишення чесних відгуків на основі особистого досвіду.',
              'Управління власною історією записів та особистими даними.',
            ],
          },
          {
            title: 'Акаунт спеціаліста',
            items: [
              'Створення та ведення профілю з переліком послуг, цін і розкладу.',
              'Отримання та управління запитами на запис від клієнтів.',
              'Доступ до CRM-інструментів, аналітики та функцій планування.',
              'Спеціалісти є незалежними постачальниками послуг, а не працівниками чи агентами MiyZapis. MiyZapis не є стороною жодного договору про надання послуг між спеціалістом і клієнтом.',
            ],
          },
          {
            title: 'Бізнес-акаунт',
            items: [
              'Управління кількома спеціалістами та локаціями в рамках одного бізнес-профілю.',
              'Доступ до бізнес-аналітики та інструментів управління персоналом.',
              'Усі зобов’язання акаунта спеціаліста рівною мірою поширюються на бізнес-акаунт і всіх спеціалістів, зареєстрованих у ньому.',
            ],
          },
        ],
      },
      {
        id: '3',
        title: '3. Безпека акаунта та достовірність інформації',
        paragraphs: [
          'Ви несете відповідальність за конфіденційність своїх облікових даних і за всі дії, що здійснюються під вашим акаунтом.',
          'Ви зобов’язуєтесь надавати точну, актуальну та повну інформацію під час реєстрації і підтримувати її в актуальному стані. Надання неправдивих відомостей є підставою для негайного видалення акаунта.',
          'Негайно повідомте нас за адресою info@incognitogeneration.com, якщо вважаєте, що ваш акаунт скомпрометовано.',
          'Передача акаунта іншій особі, його продаж або спільне використання заборонені.',
        ],
      },
      {
        id: '4',
        title: '4. Прийнятне використання та заборонена поведінка',
        paragraphs: [
          'Ви погоджуєтесь використовувати платформу лише у законних цілях і так, щоб не порушувати права інших осіб. Наступні дії суворо заборонені:',
        ],
        list: [
          'Шахрайство, введення в оману або видавання себе за іншу особу чи організацію.',
          'Переслідування, зловживання, погрози або дискримінаційна поведінка щодо інших користувачів.',
          'Скрейпінг, парсинг або будь-яке інше автоматизоване отримання даних платформи без нашої письмової згоди.',
          'Обхід платформових комісій шляхом домовленостей із спеціалістами, знайденими на MiyZapis, через зовнішні канали, щоб уникнути підписки («обхід комісій»).',
          'Публікація неправдивого, оманливого або дифамаційного контенту, зокрема фальшивих відгуків.',
          'Завантаження шкідливого програмного забезпечення, спаму або будь-якого контенту, що порушує роботу платформи.',
          'Спроби зворотного проектування, декомпіляції або отримання доступу до вихідного коду платформи.',
          'Використання платформи з будь-якою метою, що суперечить законодавству України або законам, які застосовуються до вас.',
        ],
        paragraphsAfter: [
          'Ми залишаємо за собою право розслідувати підозрілі порушення та вживати будь-яких заходів на свій розсуд, зокрема призупиняти або видаляти акаунти.',
        ],
      },
      {
        id: '5',
        title: '5. Контент і відгуки',
        paragraphs: [
          'Ви зберігаєте право власності на контент, який публікуєте (текст профілю, фото, відгуки). Публікуючи контент, ви надаєте MiyZapis невиключну, безоплатну, всесвітню ліцензію на відображення, відтворення та розповсюдження цього контенту на платформі та в пов’язаних маркетингових матеріалах.',
          'Відгуки повинні ґрунтуватися на реальному особистому досвіді спілкування зі спеціалістом або компанією. Публікація відгуків в обмін на оплату, знижки або інші заохочення заборонена.',
          'MiyZapis не перевіряє точність контенту, наданого користувачами, і не несе за нього відповідальності. Ми можемо видалити контент, що порушує цю Угоду або чинне законодавство, без попереднього повідомлення.',
          'Ви підтверджуєте, що ваш контент не порушує права інтелектуальної власності третіх осіб, права на конфіденційність або чинне законодавство.',
        ],
      },
      {
        id: '6',
        title: '6. Відносини спеціаліста / бізнесу з платформою',
        paragraphs: [
          'Спеціалісти та компанії є незалежними постачальниками. MiyZapis надає майданчик і SaaS-інструментарій — це не кадрова агенція, не роботодавець і не сторона договору про надання послуг між клієнтом і спеціалістом.',
          'Спеціалісти та компанії несуть повну відповідальність за якість, законність, безпеку та надання своїх послуг. MiyZapis не гарантує кваліфікацію, ліцензії або поведінку спеціаліста.',
        ],
        subsections: [
          {
            title: 'Підписка та тарифи',
            items: [
              '2-місячний безкоштовний пробний період: нові акаунти спеціалістів і компаній отримують 2-місячний безкоштовний доступ до всіх функцій платформи.',
              'Щомісячна підписка через Telegram Stars: після закінчення пробного періоду для продовження доступу необхідна активна місячна або річна підписка, оплачена через Telegram Stars.',
              'Тарифи можуть змінюватися. Ми повідомимо про будь-які зміни щонайменше за 30 днів електронною поштою або через сповіщення на платформі. Продовження використання платформи після закінчення цього строку означає прийняття нових тарифів.',
            ],
          },
        ],
      },
      {
        id: '7',
        title: '7. Записи та оплата послуг',
        paragraphs: [
          'MiyZapis забезпечує лише пошук і планування. Платформа є майданчиком для запису — вона не обробляє, не утримує та не здійснює переказ оплати послуг між клієнтами і спеціалістами.',
          'Оплата послуг здійснюється безпосередньо між клієнтом і спеціалістом — особисто або будь-яким способом, на який вони погодилися. MiyZapis не несе відповідальності за платіжні спори, повернення коштів або несплату.',
          'Рекомендуємо клієнтам уточнювати вартість послуг у спеціаліста перед відвідуванням.',
          'Скасування та перенесення записів регулюються власною політикою спеціаліста, яка має бути повідомлена клієнту до оформлення запису.',
        ],
      },
      {
        id: '8',
        title: '8. Ролі у сфері даних',
        paragraphs: [
          'Спеціалісти та компанії, які збирають персональні дані своїх клієнтів у процесі використання платформи, є незалежними контролерами даних щодо цих відомостей і зобов’язані дотримуватися чинного законодавства про захист персональних даних (зокрема Закону України «Про захист персональних даних»).',
          'MiyZapis є контролером даних на рівні платформи (дані реєстрації, дані про використання тощо) і обробляє їх відповідно до нашої Політики конфіденційності за адресою /privacy.',
          'Використовуючи платформу, ви погоджуєтеся з обробкою ваших даних відповідно до Політики конфіденційності.',
        ],
      },
      {
        id: '9',
        title: '9. Призупинення та видалення акаунта',
        paragraphs: [
          'Ви можете закрити акаунт будь-коли, звернувшись до info@incognitogeneration.com.',
          'Ми можемо призупинити або видалити ваш акаунт негайно, без попереднього повідомлення, якщо ви порушуєте цю Угоду, здійснюєте дії, що шкодять іншим користувачам або платформі, не сплачуєте відповідні тарифи чи якщо цього вимагає закон.',
          'Після видалення акаунта ваш доступ до платформи припиняється негайно. Ми можемо зберігати дані відповідно до вимог законодавства або нашої Політики конфіденційності.',
          'Видалення акаунта не звільняє вас від зобов’язань, що виникли до його видалення (зокрема щодо заборгованості з оплати).',
        ],
      },
      {
        id: '10',
        title: '10. Відмова від гарантій і обмеження відповідальності',
        paragraphs: [
          'ПЛАТФОРМА НАДАЄТЬСЯ «ЯК Є» І «ЯК ДОСТУПНА» БЕЗ БУДЬ-ЯКИХ ГАРАНТІЙ — ЯВНИХ АБО НЕПРЯМИХ. У МАКСИМАЛЬНІЙ МІРІ, ДОЗВОЛЕНІЙ ЗАКОНОМ, MIYZAPIS ВІДМОВЛЯЄТЬСЯ ВІД УСІХ ГАРАНТІЙ, ЗОКРЕМА ЩОДО ПРИДАТНОСТІ ДЛЯ ПРОДАЖУ, ПРИДАТНОСТІ ДЛЯ ПЕВНОЇ МЕТИ ТА НЕНАРУШЕННЯ ПРАВ ТРЕТІХ ОСІБ.',
          'MiyZapis не гарантує якість, безпеку, законність або відповідність будь-яких послуг, що пропонуються спеціалістами чи компаніями на платформі. Усі взаємодії між клієнтами та спеціалістами здійснюються на ваш власний ризик.',
          'У МАКСИМАЛЬНІЙ МІРІ, ДОЗВОЛЕНІЙ ЧИННИМ ЗАКОНОДАВСТВОМ, MIYZAPIS НЕ НЕСЕ ВІДПОВІДАЛЬНОСТІ ЗА БУДЬ-ЯКІ НЕПРЯМІ, ВИПАДКОВІ, ОСОБЛИВІ, НАСЛІДКОВІ АБО ШТРАФНІ ЗБИТКИ, ЩО ВИНИКЛИ У ЗВ’ЯЗКУ З ВИКОРИСТАННЯМ ПЛАТФОРМИ, НАВІТЬ ЯКЩО БУЛО ПОПЕРЕДЖЕНО ПРО МОЖЛИВІСТЬ ТАКИХ ЗБИТКІВ.',
          'Ніщо в цій Угоді не обмежує відповідальність, яку неможливо виключити законом (зокрема за грубу недбалість, умисну провину або шкоду здоров’ю).',
        ],
      },
      {
        id: '11',
        title: '11. Регулююче законодавство та вирішення спорів',
        paragraphs: [
          'Ця Угода регулюється законодавством України без урахування норм про колізію права.',
          'Будь-який спір, що виникає з цієї Угоди або у зв’язку з нею, спочатку передається на медіацію добросовісно. Якщо спір не вдається вирішити шляхом медіації протягом 30 днів, він передається до компетентних судів України.',
          'Ніщо у цьому пункті не позбавляє жодну зі сторін права звернутися до компетентного суду за вжиттям термінових заходів із забезпечення позову або іншого засобу захисту.',
        ],
      },
      {
        id: '12',
        title: '12. Зміни до цієї Угоди',
        paragraphs: [
          'Ми можемо час від часу оновлювати цю Угоду. У такому разі ми змінимо дату «Останнього оновлення» вгорі цієї сторінки, а про суттєві зміни повідомимо зареєстрованих користувачів електронною поштою або сповіщенням на платформі щонайменше за 14 днів до набрання чинності.',
          'Продовження використання платформи після набрання чинності будь-якими змінами означає ваше прийняття оновленої Угоди.',
          'Якщо ви не погоджуєтеся з оновленою Угодою, ви повинні припинити використання платформи та закрити акаунт до дати набрання нею чинності.',
        ],
      },
      {
        id: '13',
        title: '13. Контакти',
        paragraphs: [
          'Якщо у вас є запитання щодо цієї Угоди, зв’яжіться з нами:',
        ],
        contact: true,
      },
    ],
  },

  ru: {
    title: 'Пользовательское соглашение',
    lastUpdated: 'Последнее обновление: 1 июня 2026 г.',
    legalNote:
      'Данный документ является шаблонным текстом и не является юридической консультацией. Перед тем как полагаться на него, он должен быть проверен и адаптирован квалифицированным юристом.',
    intro:
      'Настоящее Пользовательское соглашение («Соглашение») регулирует отношения между MiyZapis и всеми лицами, получающими доступ к платформе или использующими её — в качестве клиентов, специалистов или бизнес-аккаунтов. Регистрируя аккаунт или используя любую часть платформы, вы подтверждаете, что ознакомились с настоящим Соглашением, поняли его и соглашаетесь соблюдать его условия.',
    sections: [
      {
        id: '1',
        title: '1. Принятие условий и требования к пользователю',
        paragraphs: [
          'Регистрируя аккаунт или используя MiyZapis любым способом, вы соглашаетесь с настоящим Соглашением. Если вы не согласны, не используйте платформу.',
          'Вам должно быть не менее 18 лет, и вы должны обладать полной дееспособностью в соответствии с применимым законодательством для заключения обязательных договоров. Используя платформу, вы подтверждаете, что отвечаете этим требованиям.',
          'Если вы регистрируетесь от имени юридического лица, вы подтверждаете, что уполномочены обязать это лицо условиями Соглашения, а «вы» включает данное юридическое лицо.',
          'Платформа управляется МійЗапис, далее именуемой «MiyZapis», «мы», «нас» или «нам».',
        ],
      },
      {
        id: '2',
        title: '2. Типы аккаунтов и допустимое использование',
        paragraphs: [
          'Платформа поддерживает три типа аккаунтов, каждый с определёнными правами:',
        ],
        subsections: [
          {
            title: 'Аккаунт клиента',
            items: [
              'Просмотр профилей специалистов и компаний.',
              'Запись на приём и сеансы через платформу.',
              'Оставление честных отзывов на основании личного опыта.',
              'Управление собственной историей записей и личными данными.',
            ],
          },
          {
            title: 'Аккаунт специалиста',
            items: [
              'Создание и ведение профиля с перечнем услуг, цен и расписания.',
              'Получение и управление запросами на запись от клиентов.',
              'Доступ к CRM-инструментам, аналитике и функциям планирования.',
              'Специалисты являются независимыми поставщиками услуг, а не сотрудниками или агентами MiyZapis. MiyZapis не является стороной какого-либо договора об оказании услуг между специалистом и клиентом.',
            ],
          },
          {
            title: 'Бизнес-аккаунт',
            items: [
              'Управление несколькими специалистами и локациями в рамках одного бизнес-профиля.',
              'Доступ к бизнес-аналитике и инструментам управления персоналом.',
              'Все обязательства аккаунта специалиста в равной мере распространяются на бизнес-аккаунт и всех специалистов, зарегистрированных в нём.',
            ],
          },
        ],
      },
      {
        id: '3',
        title: '3. Безопасность аккаунта и достоверность информации',
        paragraphs: [
          'Вы несёте ответственность за конфиденциальность своих учётных данных и за все действия, осуществляемые под вашим аккаунтом.',
          'Вы обязуетесь предоставлять точную, актуальную и полную информацию при регистрации и поддерживать её в актуальном состоянии. Предоставление ложных сведений является основанием для немедленного удаления аккаунта.',
          'Немедленно уведомите нас по адресу info@incognitogeneration.com, если считаете, что ваш аккаунт скомпрометирован.',
          'Передача аккаунта другому лицу, его продажа или совместное использование запрещены.',
        ],
      },
      {
        id: '4',
        title: '4. Допустимое использование и запрещённые действия',
        paragraphs: [
          'Вы соглашаетесь использовать платформу только в законных целях и таким образом, чтобы не нарушать права других лиц. Следующие действия строго запрещены:',
        ],
        list: [
          'Мошенничество, введение в заблуждение или выдача себя за другое лицо или организацию.',
          'Преследование, злоупотребления, угрозы или дискриминационные действия в отношении других пользователей.',
          'Скрейпинг, парсинг или любое иное автоматизированное получение данных платформы без нашего письменного согласия.',
          'Обход платформенных комиссий путём договорённостей со специалистами, найденными на MiyZapis, через внешние каналы во избежание подписки («обход комиссий»).',
          'Публикация ложного, вводящего в заблуждение или диффамационного контента, включая фиктивные отзывы.',
          'Загрузка вредоносного программного обеспечения, спама или любого контента, нарушающего работу платформы.',
          'Попытки обратного проектирования, декомпиляции или получения доступа к исходному коду платформы.',
          'Использование платформы в любых целях, противоречащих законодательству Украины или законам, применимым к вам.',
        ],
        paragraphsAfter: [
          'Мы оставляем за собой право расследовать предполагаемые нарушения и принимать любые меры по нашему усмотрению, включая приостановление или удаление аккаунтов.',
        ],
      },
      {
        id: '5',
        title: '5. Контент и отзывы',
        paragraphs: [
          'Вы сохраняете право собственности на контент, который публикуете (текст профиля, фотографии, отзывы). Публикуя контент, вы предоставляете MiyZapis неисключительную, безвозмездную, всемирную лицензию на отображение, воспроизведение и распространение этого контента на платформе и в связанных маркетинговых материалах.',
          'Отзывы должны основываться на реальном личном опыте взаимодействия со специалистом или компанией. Публикация отзывов в обмен на оплату, скидки или иные поощрения запрещена.',
          'MiyZapis не проверяет точность контента, предоставленного пользователями, и не несёт за него ответственности. Мы можем удалить контент, нарушающий настоящее Соглашение или действующее законодательство, без предварительного уведомления.',
          'Вы подтверждаете, что ваш контент не нарушает права интеллектуальной собственности третьих лиц, права на конфиденциальность или действующее законодательство.',
        ],
      },
      {
        id: '6',
        title: '6. Отношения специалиста / бизнеса с платформой',
        paragraphs: [
          'Специалисты и компании являются независимыми поставщиками. MiyZapis предоставляет площадку и SaaS-инструментарий — это не кадровое агентство, не работодатель и не сторона договора об оказании услуг между клиентом и специалистом.',
          'Специалисты и компании несут полную ответственность за качество, законность, безопасность и оказание своих услуг. MiyZapis не даёт гарантий в отношении квалификации, лицензий или поведения специалиста.',
        ],
        subsections: [
          {
            title: 'Подписка и тарифы',
            items: [
              '2-месячный бесплатный пробный период: новые аккаунты специалистов и компаний получают 2-месячный бесплатный доступ ко всем функциям платформы.',
              'Ежемесячная подписка через Telegram Stars: после окончания пробного периода для продолжения доступа необходима активная ежемесячная или годовая подписка, оплаченная через Telegram Stars.',
              'Тарифы могут изменяться. Мы уведомим об изменениях не менее чем за 30 дней по электронной почте или через уведомление на платформе. Продолжение использования платформы по истечении этого срока означает принятие новых тарифов.',
            ],
          },
        ],
      },
      {
        id: '7',
        title: '7. Записи и оплата услуг',
        paragraphs: [
          'MiyZapis обеспечивает только поиск и планирование. Платформа является площадкой для записи — она не обрабатывает, не удерживает и не осуществляет перевод оплаты услуг между клиентами и специалистами.',
          'Оплата услуг производится непосредственно между клиентом и специалистом — лично или любым согласованным ими способом. MiyZapis не несёт ответственности за платёжные споры, возвраты средств или неоплату.',
          'Рекомендуем клиентам уточнять стоимость услуг у специалиста перед посещением.',
          'Отмена и перенос записей регулируются собственной политикой специалиста, которая должна быть сообщена клиенту до оформления записи.',
        ],
      },
      {
        id: '8',
        title: '8. Роли в сфере данных',
        paragraphs: [
          'Специалисты и компании, собирающие персональные данные своих клиентов в процессе использования платформы, являются независимыми контролёрами данных в отношении этих сведений и обязаны соблюдать действующее законодательство о защите персональных данных (в том числе Закон Украины «О защите персональных данных»).',
          'MiyZapis является контролёром данных на уровне платформы (данные регистрации, данные об использовании и т. д.) и обрабатывает их в соответствии с нашей Политикой конфиденциальности по адресу /privacy.',
          'Используя платформу, вы соглашаетесь с обработкой ваших данных в соответствии с Политикой конфиденциальности.',
        ],
      },
      {
        id: '9',
        title: '9. Приостановление и удаление аккаунта',
        paragraphs: [
          'Вы можете закрыть аккаунт в любое время, обратившись по адресу info@incognitogeneration.com.',
          'Мы можем приостановить или удалить ваш аккаунт немедленно, без предварительного уведомления, если вы нарушаете настоящее Соглашение, осуществляете действия, наносящие вред другим пользователям или платформе, не оплачиваете соответствующие тарифы или если этого требует закон.',
          'После удаления аккаунта ваш доступ к платформе прекращается немедленно. Мы можем хранить данные в соответствии с требованиями законодательства или нашей Политикой конфиденциальности.',
          'Удаление аккаунта не освобождает вас от обязательств, возникших до его удаления (включая задолженность по оплате).',
        ],
      },
      {
        id: '10',
        title: '10. Отказ от гарантий и ограничение ответственности',
        paragraphs: [
          'ПЛАТФОРМА ПРЕДОСТАВЛЯЕТСЯ «КАК ЕСТЬ» И «КАК ДОСТУПНА» БЕЗ КАКИХ-ЛИБО ГАРАНТИЙ — ЯВНЫХ ИЛИ ПОДРАЗУМЕВАЕМЫХ. В МАКСИМАЛЬНОЙ МЕРЕ, ДОПУСКАЕМОЙ ЗАКОНОМ, MIYZAPIS ОТКАЗЫВАЕТСЯ ОТ ВСЕХ ГАРАНТИЙ, В ТОМ ЧИСЛЕ В ОТНОШЕНИИ ПРИГОДНОСТИ ДЛЯ ПРОДАЖИ, ПРИГОДНОСТИ ДЛЯ ОПРЕДЕЛЁННОЙ ЦЕЛИ И НЕНАРУШЕНИЯ ПРАВ ТРЕТЬИХ ЛИЦ.',
          'MiyZapis не гарантирует качество, безопасность, законность или соответствие каких-либо услуг, предлагаемых специалистами или компаниями на платформе. Все взаимодействия между клиентами и специалистами осуществляются на ваш собственный риск.',
          'В МАКСИМАЛЬНОЙ МЕРЕ, ДОПУСКАЕМОЙ ПРИМЕНИМЫМ ЗАКОНОДАТЕЛЬСТВОМ, MIYZAPIS НЕ НЕСЁТ ОТВЕТСТВЕННОСТИ ЗА КОСВЕННЫЕ, СЛУЧАЙНЫЕ, ОСОБЫЕ, ПОСЛЕДУЮЩИЕ ИЛИ ШТРАФНЫЕ УБЫТКИ, ВОЗНИКШИЕ В СВЯЗИ С ИСПОЛЬЗОВАНИЕМ ПЛАТФОРМЫ, ДАЖЕ ЕСЛИ БЫЛО УВЕДОМЛЕНО О ВОЗМОЖНОСТИ ТАКИХ УБЫТКОВ.',
          'Ничто в настоящем Соглашении не ограничивает ответственность, которую невозможно исключить по закону (включая ответственность за грубую небрежность, умышленные действия или причинение вреда здоровью).',
        ],
      },
      {
        id: '11',
        title: '11. Применимое право и разрешение споров',
        paragraphs: [
          'Настоящее Соглашение регулируется законодательством Украины без учёта норм о коллизии права.',
          'Любой спор, вытекающий из настоящего Соглашения или связанный с ним, сначала передаётся на медиацию добросовестно. Если спор не удаётся урегулировать путём медиации в течение 30 дней, он передаётся в компетентные суды Украины.',
          'Ничто в настоящем пункте не лишает ни одну из сторон права обратиться в суд компетентной юрисдикции за принятием срочных обеспечительных мер или иного средства защиты.',
        ],
      },
      {
        id: '12',
        title: '12. Изменения настоящего Соглашения',
        paragraphs: [
          'Мы можем время от времени обновлять настоящее Соглашение. В этом случае мы изменим дату «Последнего обновления» в верхней части этой страницы, а о существенных изменениях уведомим зарегистрированных пользователей по электронной почте или через уведомление на платформе не менее чем за 14 дней до вступления в силу.',
          'Продолжение использования платформы после вступления в силу любых изменений означает ваше принятие обновлённого Соглашения.',
          'Если вы не согласны с обновлённым Соглашением, вы должны прекратить использование платформы и закрыть аккаунт до даты его вступления в силу.',
        ],
      },
      {
        id: '13',
        title: '13. Контакты',
        paragraphs: [
          'Если у вас есть вопросы по настоящему Соглашению, свяжитесь с нами:',
        ],
        contact: true,
      },
    ],
  },
} as const;

type Locale = keyof typeof CONTENT;

interface Section {
  id: string;
  title: string;
  paragraphs?: readonly string[];
  list?: readonly string[];
  paragraphsAfter?: readonly string[];
  subsections?: ReadonlyArray<{
    title: string;
    items: readonly string[];
  }>;
  contact?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const UserAgreementPage: React.FC = () => {
  const { language } = useLanguage();
  const locale = (language as Locale) in CONTENT ? (language as Locale) : 'en';
  const content = CONTENT[locale];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {content.title}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">{content.lastUpdated}</p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          {/* Legal disclaimer banner */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 mb-8">
            <p className="text-amber-800 dark:text-amber-200 mb-0 text-sm font-medium">
              ⚠ {content.legalNote}
            </p>
          </div>

          {/* Intro */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
            <p className="text-blue-800 dark:text-blue-200 mb-0">{content.intro}</p>
          </div>

          {/* Sections */}
          {(content.sections as readonly Section[]).map((section) => (
            <div key={section.id}>
              <h2>{section.title}</h2>

              {section.paragraphs?.map((p, i) => (
                <p key={i}>{p}</p>
              ))}

              {section.subsections?.map((sub) => (
                <div key={sub.title}>
                  <h3>{sub.title}</h3>
                  <ul>
                    {sub.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}

              {section.list && (
                <ul>
                  {section.list.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}

              {section.paragraphsAfter?.map((p, i) => (
                <p key={i}>{p}</p>
              ))}

              {section.contact && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mt-4">
                  <p className="mb-2">
                    <strong>Email:</strong>{' '}
                    <a
                      href="mailto:info@incognitogeneration.com"
                      className="text-blue-600 dark:text-blue-400 underline transition active:scale-[0.96] inline-block"
                    >
                      info@incognitogeneration.com
                    </a>
                  </p>
                  <p className="mb-2">
                    <strong>
                      {locale === 'uk' ? 'Адреса:' : locale === 'ru' ? 'Адрес:' : 'Address:'}
                    </strong>{' '}
                    Kyiv, Ukraine
                  </p>
                  <p className="mb-0">
                    <strong>
                      {locale === 'uk'
                        ? 'Політика конфіденційності:'
                        : locale === 'ru'
                          ? 'Политика конфиденциальности:'
                          : 'Privacy Policy:'}
                    </strong>{' '}
                    <Link
                      to="/privacy"
                      className="text-blue-600 dark:text-blue-400 underline transition active:scale-[0.96] inline-block"
                    >
                      miyzapis.com/privacy
                    </Link>
                  </p>
                </div>
              )}
            </div>
          ))}

          {/* Footer note */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mt-8">
            <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">
              {locale === 'uk'
                ? 'Важливо'
                : locale === 'ru'
                  ? 'Важно'
                  : 'Important'}
            </h3>
            <p className="text-red-700 dark:text-red-300 mb-0">
              {locale === 'uk'
                ? 'Ця Угода є юридично обов’язковим документом. Якщо у вас є сумніви щодо будь-якого з положень, будь ласка, зверніться за юридичною консультацією перед використанням платформи.'
                : locale === 'ru'
                  ? 'Настоящее Соглашение является юридически обязательным документом. Если у вас есть сомнения в отношении какого-либо из положений, пожалуйста, обратитесь за юридической консультацией перед использованием платформы.'
                  : 'This Agreement is a legally binding document. If you have any doubts about any of its provisions, please seek legal advice before using the platform.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAgreementPage;
