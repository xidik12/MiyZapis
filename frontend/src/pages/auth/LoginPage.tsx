import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { login, selectIsAuthenticated, selectAuthError, selectIsLoading, clearError } from '@/store/slices/authSlice';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EyeIcon, EyeSlashIcon } from '@/components/icons';
import { LoginRequest } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { environment } from '@/config/environment';
import EnhancedGoogleSignIn from '@/components/auth/EnhancedGoogleSignIn';
import TelegramLogin from '@/components/auth/TelegramLogin';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  const { theme } = useTheme();
  
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

  // Handle navigation state messages (e.g., from email verification)
  useEffect(() => {
    const navigationState = location.state as { message?: string } | null;
    if (navigationState?.message) {
      setSuccessMessage(navigationState.message);
      // Clear the message from browser history
      window.history.replaceState(null, '', location.pathname);
    }
  }, [location]);

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


  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center">
          {t('auth.login.title')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
          {t('auth.login.subtitle')}{' '}
          <Link
            to="/auth/register"
            className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 px-2 py-1 rounded-xl hover:bg-primary-50/80 dark:hover:bg-primary-900/30 transition-all duration-200"
          >
            {t('auth.login.createAccount')}
          </Link>
        </p>
      </div>


      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {successMessage && (
          <div className="bg-green-50/80 dark:bg-green-900/30 backdrop-blur-sm border border-green-200/50 dark:border-green-800/50 text-green-600 dark:text-green-400 px-4 py-3 rounded-xl font-medium">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="bg-red-50/80 dark:bg-red-900/30 backdrop-blur-sm border border-red-200/50 dark:border-red-800/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl font-medium">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
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
            id="email"
            type="email"
            autoComplete="email"
            className={`mt-1 block w-full px-3 py-3 sm:py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 font-medium ${
              errors.email ? 'border-red-300 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'
            }`}
            placeholder={t('auth.login.emailPlaceholder')}
          />
          {errors.email && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
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
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className={`block w-full px-3 py-3 sm:py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-10 text-gray-900 dark:text-gray-100 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 font-medium ${
                errors.password ? 'border-red-300 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'
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

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
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
              className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 px-2 py-1 rounded-xl hover:bg-primary-50/80 dark:hover:bg-primary-900/30 transition-all duration-200"
            >
              {t('auth.login.forgotPassword')}
            </Link>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 hover:scale-105"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" color="white" className="mr-2" />
            ) : null}
            {isLoading ? t('auth.login.signingIn') : t('auth.login.signIn')}
          </button>
        </div>

{/* Social login - only show if Google is configured (Telegram temporarily disabled) */}
        {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
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
              <EnhancedGoogleSignIn
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
