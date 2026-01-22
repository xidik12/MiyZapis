import React from 'react';
import { environment } from '@/config/environment';
import { useLanguage } from '@/contexts/LanguageContext';

const PrivacyPage: React.FC = () => {
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
            {t('privacy.title')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t('privacy.lastUpdated')} {lastUpdated}
          </p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
            <p className="text-blue-800 dark:text-blue-200 mb-0">
              {formatAppName(t('privacy.intro'))}
            </p>
          </div>

          <h2>{t('privacy.section1.title')}</h2>
          <h3>{t('privacy.section1.personal.title')}</h3>
          <p>
            {t('privacy.section1.personal.body')}
          </p>
          <ul>
            <li>{t('privacy.section1.personal.item1')}</li>
            <li>{t('privacy.section1.personal.item2')}</li>
            <li>{t('privacy.section1.personal.item3')}</li>
            <li>{t('privacy.section1.personal.item4')}</li>
          </ul>

          <h3>{t('privacy.section1.usage.title')}</h3>
          <p>
            {t('privacy.section1.usage.body')}
          </p>
          <ul>
            <li>{t('privacy.section1.usage.item1')}</li>
            <li>{t('privacy.section1.usage.item2')}</li>
            <li>{t('privacy.section1.usage.item3')}</li>
            <li>{t('privacy.section1.usage.item4')}</li>
          </ul>

          <h2>{t('privacy.section2.title')}</h2>
          <p>{t('privacy.section2.body')}</p>
          <ul>
            <li>{t('privacy.section2.item1')}</li>
            <li>{t('privacy.section2.item2')}</li>
            <li>{t('privacy.section2.item3')}</li>
            <li>{t('privacy.section2.item4')}</li>
            <li>{t('privacy.section2.item5')}</li>
            <li>{t('privacy.section2.item6')}</li>
          </ul>

          <h2>{t('privacy.section3.title')}</h2>
          <p>
            {t('privacy.section3.body')}
          </p>
          <ul>
            <li><strong>{t('privacy.section3.item1.label')}</strong> {t('privacy.section3.item1.text')}</li>
            <li><strong>{t('privacy.section3.item2.label')}</strong> {t('privacy.section3.item2.text')}</li>
            <li><strong>{t('privacy.section3.item3.label')}</strong> {t('privacy.section3.item3.text')}</li>
            <li><strong>{t('privacy.section3.item4.label')}</strong> {t('privacy.section3.item4.text')}</li>
          </ul>

          <h2>{t('privacy.section4.title')}</h2>
          <p>
            {t('privacy.section4.body')}
          </p>
          <ul>
            <li>{t('privacy.section4.item1')}</li>
            <li>{t('privacy.section4.item2')}</li>
            <li>{t('privacy.section4.item3')}</li>
            <li>{t('privacy.section4.item4')}</li>
          </ul>

          <h2>{t('privacy.section5.title')}</h2>
          <p>{t('privacy.section5.body')}</p>
          <ul>
            <li>{t('privacy.section5.item1')}</li>
            <li>{t('privacy.section5.item2')}</li>
            <li>{t('privacy.section5.item3')}</li>
            <li>{t('privacy.section5.item4')}</li>
            <li>{t('privacy.section5.item5')}</li>
          </ul>

          <h2>{t('privacy.section6.title')}</h2>
          <p>
            {t('privacy.section6.body')}
          </p>

          <h2>{t('privacy.section7.title')}</h2>
          <p>
            {t('privacy.section7.body')}
          </p>
          <ul>
            <li><strong>{t('privacy.section7.item1.label')}</strong> {t('privacy.section7.item1.text')}</li>
            <li><strong>{t('privacy.section7.item2.label')}</strong> {t('privacy.section7.item2.text')}</li>
            <li><strong>{t('privacy.section7.item3.label')}</strong> {t('privacy.section7.item3.text')}</li>
          </ul>

          <h2>{t('privacy.section8.title')}</h2>
          <p>
            {t('privacy.section8.body')}
          </p>

          <h2>{t('privacy.section9.title')}</h2>
          <p>
            {t('privacy.section9.body')}
          </p>

          <h2>{t('privacy.section10.title')}</h2>
          <p>
            {t('privacy.section10.body')}
          </p>

          <h2>{t('privacy.section11.title')}</h2>
          <p>
            {t('privacy.section11.body')}
          </p>

          <h2>{t('privacy.section12.title')}</h2>
          <p>
            {t('privacy.section12.body')}
          </p>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mt-6">
            <p className="mb-2"><strong>{t('privacy.section12.contact.emailLabel')}</strong> privacy@{environment.APP_NAME.toLowerCase()}.com</p>
            <p className="mb-2"><strong>{t('privacy.section12.contact.addressLabel')}</strong> {t('privacy.section12.contact.addressValue')}</p>
            <p className="mb-0"><strong>{t('privacy.section12.contact.phoneLabel')}</strong> {t('privacy.section12.contact.phoneValue')}</p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mt-8">
            <h3 className="text-yellow-800 dark:text-yellow-200 font-semibold mb-2">{t('privacy.important.title')}</h3>
            <p className="text-yellow-700 dark:text-yellow-300 mb-0">
              {formatAppName(t('privacy.important.body'))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
