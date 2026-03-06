import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import PasswordStrengthIndicator from '@/components/ui/PasswordStrengthIndicator';
import { ArrowLeftIcon, CheckCircleIcon } from '@/components/icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { authService } from '@/services/auth.service';
import { getPasswordValidationRules, getConfirmPasswordValidationRules } from '@/utils/passwordValidation';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const { t } = useLanguage();
  const { theme } = useTheme();

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
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Password reset failed:', error);
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center space-y-6">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
          theme === 'dark' ? 'bg-green-900/30 backdrop-blur-sm' : 'bg-green-100/80 backdrop-blur-sm'
        }`}>
          <CheckCircleIcon className={`w-8 h-8 ${
            theme === 'dark' ? 'text-green-400' : 'text-green-600'
          }`} />
        </div>
        <div>
          <h2 className={`text-2xl font-bold mb-2 ${
            theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
          }`}>
            {t('auth.resetPassword.success')}
          </h2>
          <p className={`${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {t('auth.resetPassword.successMessage')}
          </p>
        </div>
        <button
          onClick={() => navigate('/auth/login')}
          className={`inline-flex items-center px-4 py-3 border border-transparent rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 ${
            theme === 'dark' ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white'
          }`}
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
          <h2 className={`text-2xl font-bold mb-2 ${
            theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
          }`}>
            {t('auth.resetPassword.invalidToken')}
          </h2>
          <p className={`${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {t('auth.resetPassword.tokenExpired')}
          </p>
        </div>
        <Link
          to="/auth/forgot-password"
          className={`inline-flex items-center font-semibold px-2 py-1 rounded-xl transition-all duration-200 ${
            theme === 'dark'
              ? 'text-primary-400 hover:text-primary-300 hover:bg-primary-900/30'
              : 'text-primary-600 hover:text-primary-700 hover:bg-primary-50/80'
          }`}
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
          className={`inline-flex items-center text-sm mb-4 font-semibold px-2 py-1 rounded-xl transition-all duration-200 ${
            theme === 'dark'
              ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
          }`}
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          {t('auth.resetPassword.backToSignIn')}
        </Link>
        <h2 className={`text-3xl font-bold ${
          theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
        }`}>
          {t('auth.resetPassword.title')}
        </h2>
        <p className={`mt-2 ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {t('auth.resetPassword.subtitle')}
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <div className={`rounded-xl p-4 border backdrop-blur-sm ${
            theme === 'dark'
              ? 'bg-red-900/30 border-red-800/50'
              : 'bg-red-50/80 border-red-200/50'
          }`}>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-red-400' : 'text-red-600'
            }`}>{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="password" className={`block text-sm font-semibold ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {t('auth.resetPassword.newPasswordLabel')}
          </label>
          <input
            {...register('password', getPasswordValidationRules(t))}
            type="password"
            autoComplete="new-password"
            className={`mt-1 block w-full px-3 py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 font-medium ${
              theme === 'dark'
                ? 'bg-gray-800/80 text-gray-100 border-gray-700 focus:ring-offset-gray-900'
                : 'bg-white/80 text-gray-900 border-gray-200'
            } ${
              errors.password
                ? theme === 'dark' ? 'border-red-500' : 'border-red-300'
                : ''
            }`}
            placeholder={t('auth.resetPassword.newPasswordPlaceholder')}
          />
          {errors.password && (
            <p className={`mt-2 text-sm ${
              theme === 'dark' ? 'text-red-400' : 'text-red-600'
            }`}>{errors.password.message}</p>
          )}

          {/* Password Strength Indicator */}
          {watchedPassword && (
            <div className="mt-3">
              <PasswordStrengthIndicator
                password={watchedPassword}
                showRequirements={true}
              />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className={`block text-sm font-semibold ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {t('auth.resetPassword.confirmPasswordLabel')}
          </label>
          <input
            {...register('confirmPassword', getConfirmPasswordValidationRules(watchedPassword, t))}
            type="password"
            autoComplete="new-password"
            className={`mt-1 block w-full px-3 py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 font-medium ${
              theme === 'dark'
                ? 'bg-gray-800/80 text-gray-100 border-gray-700 focus:ring-offset-gray-900'
                : 'bg-white/80 text-gray-900 border-gray-200'
            } ${
              errors.confirmPassword
                ? theme === 'dark' ? 'border-red-500' : 'border-red-300'
                : ''
            }`}
            placeholder={t('auth.resetPassword.confirmPasswordPlaceholder')}
          />
          {errors.confirmPassword && (
            <p className={`mt-2 text-sm ${
              theme === 'dark' ? 'text-red-400' : 'text-red-600'
            }`}>{errors.confirmPassword.message}</p>
          )}
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
              theme === 'dark' ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white'
            }`}
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