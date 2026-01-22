import React from 'react';
import { environment } from '@/config/environment';
import { useLanguage } from '@/contexts/LanguageContext';

const TermsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const appName = environment.APP_NAME;
  const formatAppName = (value: string) => value.replace('{appName}', appName);

  const lastUpdated = new Date().toLocaleDateString(language === 'kh' ? 'km-KH' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {t('terms.title')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t('terms.lastUpdated')} {lastUpdated}
          </p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
            <p className="text-blue-800 dark:text-blue-200 mb-0">
              {formatAppName(t('terms.intro'))}
            </p>
          </div>

          <h2>{t('terms.section1.title')}</h2>
          <p>
            {formatAppName(t('terms.section1.body'))}
          </p>

          <h2>{t('terms.section2.title')}</h2>
          <p>
            {formatAppName(t('terms.section2.body'))}
          </p>

          <h2>{t('terms.section3.title')}</h2>
          <h3>{t('terms.section3.accountCreation.title')}</h3>
          <ul>
            <li>{t('terms.section3.accountCreation.item1')}</li>
            <li>{t('terms.section3.accountCreation.item2')}</li>
            <li>{t('terms.section3.accountCreation.item3')}</li>
            <li>{t('terms.section3.accountCreation.item4')}</li>
          </ul>

          <h3>{t('terms.section3.accountTypes.title')}</h3>
          <p>{t('terms.section3.accountTypes.body')}</p>
          <ul>
            <li><strong>{t('terms.section3.accountTypes.customerLabel')}</strong> {t('terms.section3.accountTypes.customerText')}</li>
            <li><strong>{t('terms.section3.accountTypes.specialistLabel')}</strong> {t('terms.section3.accountTypes.specialistText')}</li>
          </ul>

          <h2>{t('terms.section4.title')}</h2>
          <ul>
            <li>{t('terms.section4.item1')}</li>
            <li>{t('terms.section4.item2')}</li>
            <li>{t('terms.section4.item3')}</li>
            <li>{t('terms.section4.item4')}</li>
            <li>{t('terms.section4.item5')}</li>
          </ul>

          <h2>{t('terms.section5.title')}</h2>
          <ul>
            <li>{t('terms.section5.item1')}</li>
            <li>{t('terms.section5.item2')}</li>
            <li>{t('terms.section5.item3')}</li>
            <li>{t('terms.section5.item4')}</li>
            <li>{t('terms.section5.item5')}</li>
          </ul>

          <h2>{t('terms.section6.title')}</h2>
          <h3>{t('terms.section6.bookingProcess.title')}</h3>
          <p>
            {t('terms.section6.bookingProcess.body')}
          </p>

          <h3>{t('terms.section6.payment.title')}</h3>
          <ul>
            <li>{t('terms.section6.payment.item1')}</li>
            <li>{t('terms.section6.payment.item2')}</li>
            <li>{t('terms.section6.payment.item3')}</li>
            <li>{t('terms.section6.payment.item4')}</li>
          </ul>

          <h3>{t('terms.section6.cancellation.title')}</h3>
          <ul>
            <li>{t('terms.section6.cancellation.item1')}</li>
            <li>{t('terms.section6.cancellation.item2')}</li>
            <li>{t('terms.section6.cancellation.item3')}</li>
          </ul>

          <h2>{t('terms.section7.title')}</h2>
          <p>
            {formatAppName(t('terms.section7.body'))}
          </p>
          <ul>
            <li>{t('terms.section7.item1')}</li>
            <li>{t('terms.section7.item2')}</li>
            <li>{t('terms.section7.item3')}</li>
          </ul>

          <h2>{t('terms.section8.title')}</h2>
          <h3>{t('terms.section8.verification.title')}</h3>
          <p>
            {t('terms.section8.verification.body')}
          </p>

          <h3>{t('terms.section8.reviews.title')}</h3>
          <ul>
            <li>{t('terms.section8.reviews.item1')}</li>
            <li>{t('terms.section8.reviews.item2')}</li>
            <li>{t('terms.section8.reviews.item3')}</li>
          </ul>

          <h2>{t('terms.section9.title')}</h2>
          <p>{t('terms.section9.body')}</p>
          <ul>
            <li>{t('terms.section9.item1')}</li>
            <li>{t('terms.section9.item2')}</li>
            <li>{t('terms.section9.item3')}</li>
            <li>{t('terms.section9.item4')}</li>
            <li>{t('terms.section9.item5')}</li>
            <li>{t('terms.section9.item6')}</li>
          </ul>

          <h2>{t('terms.section10.title')}</h2>
          <p>
            {formatAppName(t('terms.section10.body'))}
          </p>

          <h2>{t('terms.section11.title')}</h2>
          <p>
            {t('terms.section11.body')}
          </p>

          <h2>{t('terms.section12.title')}</h2>
          <h3>{t('terms.section12.mediation.title')}</h3>
          <p>
            {t('terms.section12.mediation.body')}
          </p>

          <h3>{t('terms.section12.liability.title')}</h3>
          <p>
            {formatAppName(t('terms.section12.liability.body'))}
          </p>

          <h2>{t('terms.section13.title')}</h2>
          <p>
            {t('terms.section13.body')}
          </p>

          <h2>{t('terms.section14.title')}</h2>
          <p>
            {t('terms.section14.body')}
          </p>

          <h2>{t('terms.section15.title')}</h2>
          <p>
            {t('terms.section15.body')}
          </p>

          <h2>{t('terms.section16.title')}</h2>
          <p>
            {t('terms.section16.body')}
          </p>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mt-6">
            <p className="mb-2"><strong>{t('terms.section16.contact.emailLabel')}</strong> legal@{environment.APP_NAME.toLowerCase()}.com</p>
            <p className="mb-2"><strong>{t('terms.section16.contact.supportLabel')}</strong> support@{environment.APP_NAME.toLowerCase()}.com</p>
            <p className="mb-0"><strong>{t('terms.section16.contact.addressLabel')}</strong> {t('terms.section16.contact.addressValue')}</p>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mt-8">
            <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">{t('terms.important.title')}</h3>
            <p className="text-red-700 dark:text-red-300 mb-0">
              {formatAppName(t('terms.important.body'))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
