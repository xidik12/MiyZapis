import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { t } = useLanguage();

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('auth.verifyEmail.title')}</h2>
      <p className="text-gray-600 mb-8">
        {token ? t('auth.verifyEmail.verifying') : t('auth.verifyEmail.invalidLink')}
      </p>
      
      <Link
        to="/auth/login"
        className="text-primary-600 hover:text-primary-700 font-medium"
      >
        {t('auth.verifyEmail.continueToSignIn')}
      </Link>
    </div>
  );
};

export default VerifyEmailPage;