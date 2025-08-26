import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const faqs = [
  // Booking and Scheduling
  {
    question: 'How do I book a service on MiyZapis?',
    questionUk: 'Як забронювати послугу на МійЗапис?',
    questionRu: 'Как забронировать услугу на МояЗапись?',
    answer: 'To book a service, browse our specialists, select a service, choose your preferred time slot, and complete the booking with payment.',
    answerUk: 'Щоб забронювати послугу, переглядайте наших спеціалістів, оберіть послугу, виберіть зручний часовий проміжок та завершіть бронювання з оплатою.',
    answerRu: 'Чтобы забронировать услугу, просматривайте наших специалистов, выберите услугу, выберите удобный временной слот и завершите бронирование с оплатой.',
    category: 'booking',
    tags: '["booking", "scheduling", "payment"]',
    sortOrder: 1
  },
  {
    question: 'Can I reschedule my appointment?',
    questionUk: 'Чи можу я перенести зустріч?',
    questionRu: 'Могу ли я перенести встречу?',
    answer: 'Yes, you can reschedule your appointment up to 24 hours before the scheduled time through your bookings page.',
    answerUk: 'Так, ви можете перенести зустріч до 24 годин до запланованого часу через сторінку ваших бронювань.',
    answerRu: 'Да, вы можете перенести встречу до 24 часов до запланированного времени через страницу ваших бронирований.',
    category: 'booking',
    tags: '["rescheduling", "cancellation", "booking"]',
    sortOrder: 2
  },
  {
    question: 'What happens if I need to cancel my booking?',
    questionUk: 'Що станеться, якщо мені потрібно скасувати бронювання?',
    questionRu: 'Что произойдет, если мне нужно отменить бронирование?',
    answer: 'You can cancel your booking up to 24 hours in advance for a full refund. Cancellations within 24 hours may incur a fee.',
    answerUk: 'Ви можете скасувати бронювання до 24 годин заздалегідь для повного відшкодування. Скасування протягом 24 годин може мати комісію.',
    answerRu: 'Вы можете отменить бронирование до 24 часов заранее для полного возмещения. Отмена в течение 24 часов может повлечь за собой комиссию.',
    category: 'booking',
    tags: '["cancellation", "refund", "policy"]',
    sortOrder: 3
  },

  // Payments and Billing
  {
    question: 'What payment methods do you accept?',
    questionUk: 'Які способи оплати ви приймаєте?',
    questionRu: 'Какие способы оплаты вы принимаете?',
    answer: 'We accept all major credit cards, debit cards, and digital wallets like Apple Pay and Google Pay.',
    answerUk: 'Ми приймаємо всі основні кредитні картки, дебетові картки та цифрові гаманці, такі як Apple Pay та Google Pay.',
    answerRu: 'Мы принимаем все основные кредитные карты, дебетовые карты и цифровые кошельки, такие как Apple Pay и Google Pay.',
    category: 'payment',
    tags: '["payment", "billing", "cards"]',
    sortOrder: 1
  },
  {
    question: 'When will I be charged for my booking?',
    questionUk: 'Коли з мене спишуть оплату за бронювання?',
    questionRu: 'Когда с меня спишут оплату за бронирование?',
    answer: 'Payment is typically processed at the time of booking. Some specialists may require a deposit with the remainder due at the appointment.',
    answerUk: 'Оплата зазвичай обробляється під час бронювання. Деякі спеціалісти можуть вимагати депозит із залишком, що сплачується на прийомі.',
    answerRu: 'Оплата обычно обрабатывается во время бронирования. Некоторые специалисты могут требовать депозит с остатком, подлежащим оплате на приеме.',
    category: 'payment',
    tags: '["payment", "timing", "deposit"]',
    sortOrder: 2
  },

  // Account and Profile
  {
    question: 'How do I update my profile information?',
    questionUk: 'Як оновити інформацію в моєму профілі?',
    questionRu: 'Как обновить информацию в моем профиле?',
    answer: 'Go to your profile page and click the edit button. You can update your personal information, preferences, and contact details.',
    answerUk: 'Перейдіть на сторінку вашого профілю та натисніть кнопку редагування. Ви можете оновити особисту інформацію, налаштування та контактні дані.',
    answerRu: 'Перейдите на страницу вашего профиля и нажмите кнопку редактирования. Вы можете обновить личную информацию, настройки и контактные данные.',
    category: 'account',
    tags: '["profile", "settings", "personal info"]',
    sortOrder: 1
  },
  {
    question: 'How do I change my password?',
    questionUk: 'Як змінити пароль?',
    questionRu: 'Как изменить пароль?',
    answer: 'You can change your password in your account settings or use the "Forgot Password" option on the login page.',
    answerUk: 'Ви можете змінити пароль у налаштуваннях акаунта або скористатися опцією "Забули пароль" на сторінці входу.',
    answerRu: 'Вы можете изменить пароль в настройках аккаунта или использовать опцию "Забыли пароль" на странице входа.',
    category: 'account',
    tags: '["password", "security", "login"]',
    sortOrder: 2
  },

  // Reviews and Ratings
  {
    question: 'How do I leave a review for a specialist?',
    questionUk: 'Як залишити відгук про спеціаліста?',
    questionRu: 'Как оставить отзыв о специалисте?',
    answer: 'After your appointment, you can leave a review from your bookings page or you will receive an email invitation to review.',
    answerUk: 'Після вашого прийому ви можете залишити відгук зі сторінки ваших бронювань або отримаєте електронне запрошення для огляду.',
    answerRu: 'После вашего приема вы можете оставить отзыв со страницы ваших бронирований или получите электронное приглашение для обзора.',
    category: 'reviews',
    tags: '["reviews", "ratings", "feedback"]',
    sortOrder: 1
  },

  // General Questions
  {
    question: 'Is my personal information secure?',
    questionUk: 'Чи захищена моя особиста інформація?',
    questionRu: 'Защищена ли моя личная информация?',
    answer: 'Yes, we use industry-standard encryption and security measures to protect your personal information and payment data.',
    answerUk: 'Так, ми використовуємо стандартне шифрування та заходи безпеки для захисту вашої особистої інформації та платіжних даних.',
    answerRu: 'Да, мы используем стандартное шифрование и меры безопасности для защиты вашей личной информации и платежных данных.',
    category: 'general',
    tags: '["security", "privacy", "data protection"]',
    sortOrder: 1
  },
  {
    question: 'How can I contact customer support?',
    questionUk: 'Як я можу зв\'язатися з підтримкою клієнтів?',
    questionRu: 'Как я могу связаться с поддержкой клиентов?',
    answer: 'You can contact our support team via email at support@miyzapis.com, phone, or through the live chat feature.',
    answerUk: 'Ви можете зв\'язатися з нашою командою підтримки електронною поштою support@miyzapis.com, телефоном або через функцію онлайн-чату.',
    answerRu: 'Вы можете связаться с нашей командой поддержки по электронной почте support@miyzapis.com, телефону или через функцию онлайн-чата.',
    category: 'general',
    tags: '["support", "contact", "help"]',
    sortOrder: 2
  }
];

async function seedFAQs() {
  console.log('Starting FAQ seeding...');

  try {
    // Clear existing FAQs
    await prisma.fAQ.deleteMany();
    console.log('Cleared existing FAQs');

    // Create new FAQs
    for (const faq of faqs) {
      await prisma.fAQ.create({
        data: faq
      });
    }

    console.log(`Created ${faqs.length} FAQs`);
    console.log('FAQ seeding completed successfully');
  } catch (error) {
    console.error('Error seeding FAQs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedFAQs()
    .catch((error) => {
      console.error('Failed to seed FAQs:', error);
      process.exit(1);
    });
}

export { seedFAQs };