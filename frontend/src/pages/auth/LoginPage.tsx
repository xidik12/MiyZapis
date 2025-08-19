import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { login, selectIsAuthenticated, selectAuthError, selectIsLoading, clearError } from '@/store/slices/authSlice';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { LoginRequest } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { environment } from '@/config/environment';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import TelegramLogin from '@/components/auth/TelegramLogin';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const error = useAppSelector(selectAuthError);
  const isLoading = useAppSelector(selectIsLoading);

  const returnUrl = searchParams.get('returnUrl') || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // Clear error when component unmounts or when user starts typing
  useEffect(() => {
    return () => {
      if (error) {
        dispatch(clearError());
      }
    };
  }, [dispatch, error]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(returnUrl, { replace: true });
    }
  }, [isAuthenticated, navigate, returnUrl]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      const loginData: LoginRequest = {
        email: data.email,
        password: data.password,
        platform: 'web',
      };

      await dispatch(login(loginData)).unwrap();
      // Navigation will happen automatically due to the useEffect above
    } catch (error) {
      // Error is handled by the Redux slice
      console.error('Login failed:', error);
    }
  };

  const handleSocialLoginSuccess = () => {
    navigate(returnUrl, { replace: true });
  };

  const handleSocialLoginError = (error: string) => {
    console.error('Social login error:', error);
  };

  // Demo credentials helper
  const fillDemoCredentials = (userType: 'customer' | 'specialist') => {
    if (userType === 'customer') {
      setValue('email', 'customer@example.com');
      setValue('password', 'demo123456');
    } else {
      setValue('email', 'specialist@example.com');
      setValue('password', 'demo123456');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 text-center">
          {t('auth.login.title')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
          {t('auth.login.subtitle')}{' '}
          <Link
            to="/auth/register"
            className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
          >
            {t('auth.login.createAccount')}
          </Link>
        </p>
      </div>

      {/* Mock API indicator */}
      {environment.MOCK_API && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="h-2 w-2 bg-amber-400 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-amber-800">
              Mock Authentication Enabled - Development Mode
            </span>
          </div>
        </div>
      )}

      {/* Demo credentials */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">{t('auth.login.demoAccounts')}</h3>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => fillDemoCredentials('customer')}
            className="text-xs text-blue-600 hover:text-blue-700 block"
          >
            {t('auth.login.useDemoCustomer')}
          </button>
          <button
            type="button"
            onClick={() => fillDemoCredentials('specialist')}
            className="text-xs text-blue-600 hover:text-blue-700 block"
          >
            {t('auth.login.useDemoSpecialist')}
          </button>
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('auth.login.emailLabel')}
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
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 ${
              errors.email ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder={t('auth.login.emailPlaceholder')}
          />
          {errors.email && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('auth.login.passwordLabel')}
          </label>
          <div className="relative mt-1">
            <input
              {...register('password', {
                required: t('auth.error.passwordRequired'),
                minLength: {
                  value: 6,
                  message: t('auth.error.passwordMinLength'),
                },
              })}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 pr-10 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 ${
                errors.password ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder={t('auth.login.passwordPlaceholder')}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              {...register('rememberMe')}
              id="remember-me"
              name="rememberMe"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              {t('auth.login.rememberMe')}
            </label>
          </div>

          <div className="text-sm">
            <Link
              to="/auth/forgot-password"
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              {t('auth.login.forgotPassword')}
            </Link>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" color="white" className="mr-2" />
            ) : null}
            {isLoading ? t('auth.login.signingIn') : t('auth.login.signIn')}
          </button>
        </div>

{/* Social login - only show if at least one provider is configured */}
        {(import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.VITE_TELEGRAM_BOT_USERNAME) && (
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                  {t('auth.login.orContinueWith')}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <GoogleSignIn
                onSuccess={handleSocialLoginSuccess}
                onError={handleSocialLoginError}
                disabled={isLoading}
              />
              
              <TelegramLogin
                onSuccess={handleSocialLoginSuccess}
                onError={handleSocialLoginError}
                disabled={isLoading}
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default LoginPage;