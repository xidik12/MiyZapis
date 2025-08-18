import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { t } = useLanguage();

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('auth.resetPassword.title')}</h2>
      <p className="text-gray-600 mb-8">
        {token ? t('auth.resetPassword.enterNewPassword') : t('auth.resetPassword.invalidToken')}
      </p>
      
      {!token ? (
        <Link
          to="/auth/forgot-password"
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          {t('auth.resetPassword.requestNewLink')}
        </Link>
      ) : (
        <div className="text-sm text-gray-500">
          {t('auth.resetPassword.formPlaceholder')}
        </div>
      )}
    </div>
  );
};

export default ResetPasswordPage;