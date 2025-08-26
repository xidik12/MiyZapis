import React from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ArrowLeftIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/LanguageContext';
import { authService } from '@/services/auth.service';

interface ForgotPasswordFormData {
  email: string;
}

const ForgotPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { t } = useLanguage();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ForgotPasswordFormData>();

  const watchedEmail = watch('email');

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await authService.forgotPassword(data.email);
      setIsSubmitted(true);
    } catch (error: any) {
      console.error('Forgot password failed:', error);
      setError(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <EnvelopeIcon className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('auth.forgotPassword.checkEmail')}
          </h2>
          <p className="text-gray-600">
            {t('auth.forgotPassword.sentResetLink')}
          </p>
          <p className="font-medium text-gray-900 mt-1">{watchedEmail}</p>
        </div>
        <div className="text-sm text-gray-600 space-y-2">
          <p>{t('auth.forgotPassword.didntReceive')}</p>
          <button
            onClick={() => setIsSubmitted(false)}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            {t('auth.forgotPassword.tryDifferentEmail')}
          </button>
        </div>
        <Link
          to="/auth/login"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          {t('auth.forgotPassword.backToSignIn')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/auth/login"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          {t('auth.forgotPassword.backToSignIn')}
        </Link>
        <h2 className="text-3xl font-bold text-gray-900">
          {t('auth.forgotPassword.title')}
        </h2>
        <p className="mt-2 text-gray-600">
          {t('auth.forgotPassword.subtitle')}
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            {t('auth.forgotPassword.emailLabel')}
          </label>
          <input
            {...register('email', {
              required: t('auth.error.emailRequired'),
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: t('auth.error.emailInvalid'),
              },
            })}
            type="email"
            autoComplete="email"
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder={t('auth.forgotPassword.emailPlaceholder')}
          />
          {errors.email && (
            <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" color="white" className="mr-2" />
            ) : null}
            {isLoading ? t('auth.forgotPassword.sending') : t('auth.forgotPassword.sendResetLink')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;