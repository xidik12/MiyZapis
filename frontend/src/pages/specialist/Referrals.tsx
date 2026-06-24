import React from 'react';
import { ReferralDashboard } from '../../components/referral';
import { useLanguage } from '@/contexts/LanguageContext';
import { HelpTip } from '@/components/common/HelpTip';

// ---------------------------------------------------------------------------
// Help content — trilingual
// ---------------------------------------------------------------------------

const REFERRALS_HELP = {
  en: {
    overview:
      'Referrals\n\nEarn rewards by inviting new clients to MiyZapis.\n\n' +
      'How it works:\n' +
      '1. Click "Create referral link" and generate a personal invite link\n' +
      '2. Share the link with friends, family, or followers\n' +
      '3. When someone registers and books a service using your link, the referral is tracked\n' +
      '4. Once they complete a booking, the referral is "completed" and you earn points\n\n' +
      'Key metrics:\n' +
      '• Total referrals — number of links/invites you have created\n' +
      '• Completed — referrals where the invited person actually booked\n' +
      '• Conversion rate — completed ÷ total referrals × 100% (what % of your invites led to a booking)\n' +
      '• Points earned — total reward points accumulated from completed referrals\n\n' +
      'Limits:\n' +
      '• Daily limit — maximum new referral links you can create per day\n' +
      '• Pending limit — maximum referrals awaiting completion at one time',
  },
  uk: {
    overview:
      'Реферали\n\nОтримуйте винагороду, запрошуючи нових клієнтів до MiyZapis.\n\n' +
      'Як це працює:\n' +
      '1. Натисніть "Створити реферальне посилання" та згенеруйте особисте запрошення\n' +
      '2. Поділіться посиланням із друзями, родиною або підписниками\n' +
      '3. Коли хтось реєструється та записується через ваше посилання — реферал відстежується\n' +
      '4. Після завершення запису реферал стає "виконаним" і ви отримуєте бали\n\n' +
      'Ключові показники:\n' +
      '• Всього рефералів — кількість створених вами посилань/запрошень\n' +
      '• Виконані — реферали, де запрошена особа дійсно записалася\n' +
      '• Конверсія — виконані ÷ всього рефералів × 100% (який % запрошень призвів до запису)\n' +
      '• Зароблено балів — загальна кількість балів за виконані реферали\n\n' +
      'Ліміти:\n' +
      '• Денний ліміт — максимальна кількість нових реферальних посилань на день\n' +
      '• Ліміт очікуючих — максимальна кількість рефералів, що очікують на виконання одночасно',
  },
  ru: {
    overview:
      'Рефералы\n\nПолучайте вознаграждение, приглашая новых клиентов на MiyZapis.\n\n' +
      'Как это работает:\n' +
      '1. Нажмите "Создать реферальную ссылку" и сгенерируйте личное приглашение\n' +
      '2. Поделитесь ссылкой с друзьями, родственниками или подписчиками\n' +
      '3. Когда кто-то регистрируется и записывается через вашу ссылку — реферал отслеживается\n' +
      '4. После завершения записи реферал становится "выполненным" и вы получаете баллы\n\n' +
      'Ключевые показатели:\n' +
      '• Всего рефералов — количество созданных вами ссылок/приглашений\n' +
      '• Выполненные — рефералы, где приглашённый человек действительно записался\n' +
      '• Конверсия — выполненные ÷ всего рефералов × 100% (какой % приглашений привёл к записи)\n' +
      '• Заработано баллов — общее количество баллов за выполненные рефералы\n\n' +
      'Лимиты:\n' +
      '• Дневной лимит — максимальное количество новых реферальных ссылок в день\n' +
      '• Лимит ожидающих — максимальное количество рефералов, ожидающих выполнения одновременно',
  },
};

const SpecialistReferrals: React.FC = () => {
  const { language } = useLanguage();
  const h = (REFERRALS_HELP as Record<string, typeof REFERRALS_HELP.en>)[language] || REFERRALS_HELP.en;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-1">
          <HelpTip title="Referrals" content={h.overview} />
        </div>
        <ReferralDashboard userType="specialist" />
      </div>
    </div>
  );
};

export default SpecialistReferrals;