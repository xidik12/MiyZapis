import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/LanguageContext';
import { authService } from '@/services/auth.service';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const { t } = useLanguage();

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>();

  const watchedPassword = watch('password');

  // Check if token exists
  useEffect(() => {
    if (!token) {
      setError('Reset token is missing or invalid');
    }
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      await authService.resetPassword(token, data.password);
      setIsSuccess(true);
    } catch (error: any) {
      console.error('Password reset failed:', error);
      setError(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircleIcon className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('auth.resetPassword.success')}
          </h2>
          <p className="text-gray-600">
            {t('auth.resetPassword.successMessage')}
          </p>
        </div>
        <button
          onClick={() => navigate('/auth/login')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {t('auth.resetPassword.signInNow')}
        </button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="text-center space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('auth.resetPassword.invalidToken')}
          </h2>
          <p className="text-gray-600">
            {t('auth.resetPassword.tokenExpired')}
          </p>
        </div>
        <Link
          to="/auth/forgot-password"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
        >
          {t('auth.resetPassword.requestNewLink')}
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
          {t('auth.resetPassword.backToSignIn')}
        </Link>
        <h2 className="text-3xl font-bold text-gray-900">
          {t('auth.resetPassword.title')}
        </h2>
        <p className="mt-2 text-gray-600">
          {t('auth.resetPassword.subtitle')}
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            {t('auth.resetPassword.newPasswordLabel')}
          </label>
          <input
            {...register('password', {
              required: t('auth.error.passwordRequired'),
              minLength: {
                value: 8,
                message: t('auth.error.passwordMinLength'),
              },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: t('auth.error.passwordPattern'),
              },
            })}
            type="password"
            autoComplete="new-password"
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
              errors.password ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder={t('auth.resetPassword.newPasswordPlaceholder')}
          />
          {errors.password && (
            <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            {t('auth.resetPassword.confirmPasswordLabel')}
          </label>
          <input
            {...register('confirmPassword', {
              required: t('auth.error.confirmPasswordRequired'),
              validate: (value) =>
                value === watchedPassword || t('auth.error.passwordsNotMatch'),
            })}
            type="password"
            autoComplete="new-password"
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
              errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder={t('auth.resetPassword.confirmPasswordPlaceholder')}
          />
          {errors.confirmPassword && (
            <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
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
            {isLoading ? t('auth.resetPassword.resetting') : t('auth.resetPassword.resetPassword')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResetPasswordPage;