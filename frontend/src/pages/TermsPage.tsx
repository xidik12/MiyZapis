import React from 'react';
import { environment } from '@/config/environment';
import { useLanguage } from '@/contexts/LanguageContext';

const TermsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const localeMap = { en: 'en-US', uk: 'uk-UA', ru: 'ru-RU' };
  const lastUpdated = new Date().toLocaleDateString(localeMap[language] || 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const r = (key: string) => t(key).replace(/\{appName\}/g, environment.APP_NAME);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('terms.title')}</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t('terms.lastUpdated').replace('{date}', lastUpdated)}
          </p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
            <p className="text-blue-800 dark:text-blue-200 mb-0">
              {r('terms.intro')}
            </p>
          </div>

          <h2>{t('terms.acceptance.title')}</h2>
          <p>{r('terms.acceptance.text')}</p>

          <h2>{t('terms.description.title')}</h2>
          <p>{r('terms.description.text')}</p>

          <h2>{t('terms.accounts.title')}</h2>
          <h3>{t('terms.accounts.creation.title')}</h3>
          <ul>
            <li>{t('terms.accounts.creation.item1')}</li>
            <li>{t('terms.accounts.creation.item2')}</li>
            <li>{t('terms.accounts.creation.item3')}</li>
            <li>{t('terms.accounts.creation.item4')}</li>
          </ul>

          <h3>{t('terms.accounts.types.title')}</h3>
          <p>{t('terms.accounts.types.text')}</p>
          <ul>
            <li><strong>{t('terms.accounts.types.customer')}</strong></li>
            <li><strong>{t('terms.accounts.types.specialist')}</strong></li>
          </ul>

          <h2>{t('terms.customerResp.title')}</h2>
          <ul>
            <li>{t('terms.customerResp.item1')}</li>
            <li>{t('terms.customerResp.item2')}</li>
            <li>{t('terms.customerResp.item3')}</li>
            <li>{t('terms.customerResp.item4')}</li>
            <li>{t('terms.customerResp.item5')}</li>
          </ul>

          <h2>{t('terms.specialistResp.title')}</h2>
          <ul>
            <li>{t('terms.specialistResp.item1')}</li>
            <li>{t('terms.specialistResp.item2')}</li>
            <li>{t('terms.specialistResp.item3')}</li>
            <li>{t('terms.specialistResp.item4')}</li>
            <li>{t('terms.specialistResp.item5')}</li>
          </ul>

          <h2>{t('terms.booking.title')}</h2>
          <h3>{t('terms.booking.process.title')}</h3>
          <p>{t('terms.booking.process.text')}</p>

          <h3>{t('terms.booking.payment.title')}</h3>
          <ul>
            <li>{t('terms.booking.payment.item1')}</li>
            <li>{t('terms.booking.payment.item2')}</li>
            <li>{t('terms.booking.payment.item3')}</li>
            <li>{t('terms.booking.payment.item4')}</li>
          </ul>

          <h3>{t('terms.booking.cancellation.title')}</h3>
          <ul>
            <li>{t('terms.booking.cancellation.item1')}</li>
            <li>{t('terms.booking.cancellation.item2')}</li>
            <li>{t('terms.booking.cancellation.item3')}</li>
          </ul>

          <h2>{t('terms.fees.title')}</h2>
          <p>{r('terms.fees.text')}</p>
          <ul>
            <li>{t('terms.fees.item1')}</li>
            <li>{t('terms.fees.item2')}</li>
            <li>{t('terms.fees.item3')}</li>
          </ul>

          <h2>{t('terms.quality.title')}</h2>
          <h3>{t('terms.quality.verification.title')}</h3>
          <p>{t('terms.quality.verification.text')}</p>

          <h3>{t('terms.quality.reviews.title')}</h3>
          <ul>
            <li>{t('terms.quality.reviews.item1')}</li>
            <li>{t('terms.quality.reviews.item2')}</li>
            <li>{t('terms.quality.reviews.item3')}</li>
          </ul>

          <h2>{t('terms.prohibited.title')}</h2>
          <p>{t('terms.prohibited.text')}</p>
          <ul>
            <li>{t('terms.prohibited.item1')}</li>
            <li>{t('terms.prohibited.item2')}</li>
            <li>{t('terms.prohibited.item3')}</li>
            <li>{t('terms.prohibited.item4')}</li>
            <li>{t('terms.prohibited.item5')}</li>
            <li>{t('terms.prohibited.item6')}</li>
          </ul>

          <h2>{t('terms.ip.title')}</h2>
          <p>{r('terms.ip.text')}</p>

          <h2>{t('terms.privacy.title')}</h2>
          <p>{t('terms.privacy.text')}</p>

          <h2>{t('terms.disputes.title')}</h2>
          <h3>{t('terms.disputes.mediation.title')}</h3>
          <p>{t('terms.disputes.mediation.text')}</p>

          <h3>{t('terms.disputes.liability.title')}</h3>
          <p>{r('terms.disputes.liability.text')}</p>

          <h2>{t('terms.termination.title')}</h2>
          <p>{t('terms.termination.text')}</p>

          <h2>{t('terms.changes.title')}</h2>
          <p>{t('terms.changes.text')}</p>

          <h2>{t('terms.law.title')}</h2>
          <p>{t('terms.law.text')}</p>

          <h2>{t('terms.contactInfo.title')}</h2>
          <p>{t('terms.contactInfo.text')}</p>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mt-6">
            <p className="mb-2"><strong>{t('terms.contactInfo.email')}</strong> legal@miyzapys.com</p>
            <p className="mb-2"><strong>{t('terms.contactInfo.support')}</strong> support@miyzapys.com</p>
            <p className="mb-0"><strong>{t('terms.contactInfo.address')}</strong> Kyiv, Ukraine</p>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mt-8">
            <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">{t('terms.important')}</h3>
            <p className="text-red-700 dark:text-red-300 mb-0">
              {r('terms.importantText')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
