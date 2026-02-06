import React from 'react';
import { environment } from '@/config/environment';
import { useLanguage } from '@/contexts/LanguageContext';

const PrivacyPage: React.FC = () => {
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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('privacy.title')}</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t('privacy.lastUpdated').replace('{date}', lastUpdated)}
          </p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
            <p className="text-blue-800 dark:text-blue-200 mb-0">
              {r('privacy.intro')}
            </p>
          </div>

          <h2>{t('privacy.collect.title')}</h2>
          <h3>{t('privacy.collect.personal.title')}</h3>
          <p>{t('privacy.collect.personal.text')}</p>
          <ul>
            <li>{t('privacy.collect.personal.item1')}</li>
            <li>{t('privacy.collect.personal.item2')}</li>
            <li>{t('privacy.collect.personal.item3')}</li>
            <li>{t('privacy.collect.personal.item4')}</li>
          </ul>

          <h3>{t('privacy.collect.usage.title')}</h3>
          <p>{t('privacy.collect.usage.text')}</p>
          <ul>
            <li>{t('privacy.collect.usage.item1')}</li>
            <li>{t('privacy.collect.usage.item2')}</li>
            <li>{t('privacy.collect.usage.item3')}</li>
            <li>{t('privacy.collect.usage.item4')}</li>
          </ul>

          <h2>{t('privacy.use.title')}</h2>
          <p>{t('privacy.use.text')}</p>
          <ul>
            <li>{t('privacy.use.item1')}</li>
            <li>{t('privacy.use.item2')}</li>
            <li>{t('privacy.use.item3')}</li>
            <li>{t('privacy.use.item4')}</li>
            <li>{t('privacy.use.item5')}</li>
            <li>{t('privacy.use.item6')}</li>
          </ul>

          <h2>{t('privacy.sharing.title')}</h2>
          <p>{t('privacy.sharing.text')}</p>
          <ul>
            <li><strong>{t('privacy.sharing.item1')}</strong></li>
            <li><strong>{t('privacy.sharing.item2')}</strong></li>
            <li><strong>{t('privacy.sharing.item3')}</strong></li>
            <li><strong>{t('privacy.sharing.item4')}</strong></li>
          </ul>

          <h2>{t('privacy.security.title')}</h2>
          <p>{t('privacy.security.text')}</p>
          <ul>
            <li>{t('privacy.security.item1')}</li>
            <li>{t('privacy.security.item2')}</li>
            <li>{t('privacy.security.item3')}</li>
            <li>{t('privacy.security.item4')}</li>
          </ul>

          <h2>{t('privacy.rights.title')}</h2>
          <p>{t('privacy.rights.text')}</p>
          <ul>
            <li>{t('privacy.rights.item1')}</li>
            <li>{t('privacy.rights.item2')}</li>
            <li>{t('privacy.rights.item3')}</li>
            <li>{t('privacy.rights.item4')}</li>
            <li>{t('privacy.rights.item5')}</li>
          </ul>

          <h2>{t('privacy.cookies.title')}</h2>
          <p>{t('privacy.cookies.text')}</p>

          <h2>{t('privacy.thirdParty.title')}</h2>
          <p>{t('privacy.thirdParty.text')}</p>
          <ul>
            <li><strong>{t('privacy.thirdParty.stripe')}</strong></li>
            <li><strong>{t('privacy.thirdParty.google')}</strong></li>
            <li><strong>{t('privacy.thirdParty.telegram')}</strong></li>
          </ul>

          <h2>{t('privacy.retention.title')}</h2>
          <p>{t('privacy.retention.text')}</p>

          <h2>{t('privacy.children.title')}</h2>
          <p>{t('privacy.children.text')}</p>

          <h2>{t('privacy.international.title')}</h2>
          <p>{t('privacy.international.text')}</p>

          <h2>{t('privacy.changes.title')}</h2>
          <p>{t('privacy.changes.text')}</p>

          <h2>{t('privacy.contactInfo.title')}</h2>
          <p>{t('privacy.contactInfo.text')}</p>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mt-6">
            <p className="mb-2"><strong>{t('privacy.contactInfo.email')}</strong> privacy@miyzapys.com</p>
            <p className="mb-2"><strong>{t('privacy.contactInfo.address')}</strong> Kyiv, Ukraine</p>
            <p className="mb-0"><strong>{t('privacy.contactInfo.phone')}</strong> +380 (44) 123-4567</p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 mt-8">
            <h3 className="text-yellow-800 dark:text-yellow-200 font-semibold mb-2">{t('privacy.important')}</h3>
            <p className="text-yellow-700 dark:text-yellow-300 mb-0">
              {r('privacy.importantText')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
