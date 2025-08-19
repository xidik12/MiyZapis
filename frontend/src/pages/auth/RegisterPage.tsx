import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { register as registerUser, selectIsAuthenticated, selectAuthError, selectIsLoading, clearError } from '@/store/slices/authSlice';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { RegisterRequest, UserType } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import TelegramLogin from '@/components/auth/TelegramLogin';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber?: string;
  userType: UserType;
  agreeToTerms: boolean;
}

const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const error = useAppSelector(selectAuthError);
  const isLoading = useAppSelector(selectIsLoading);

  const defaultUserType = (searchParams.get('type') as UserType) || 'customer';

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      userType: defaultUserType,
      agreeToTerms: false,
    },
  });

  const watchPassword = watch('password');
  const watchUserType = watch('userType');

  // Clear error when component unmounts
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
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const registerData: RegisterRequest = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phoneNumber: data.phoneNumber || undefined,
        userType: data.userType,
      };

      await dispatch(registerUser(registerData)).unwrap();
      // Navigation will happen automatically due to the useEffect above
    } catch (error) {
      // Error is handled by the Redux slice
      console.error('Registration failed:', error);
    }
  };

  const handleSocialLoginSuccess = () => {
    navigate('/', { replace: true });
  };

  const handleSocialLoginError = (error: string) => {
    console.error('Social login error:', error);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 text-center">
          {t('auth.register.title')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t('auth.register.subtitle')}{' '}
          <Link
            to="/auth/login"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            {t('auth.register.signInHere')}
          </Link>
        </p>
      </div>

      {/* Social Registration */}
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Quick Registration</span>
          </div>
        </div>

        <div className="space-y-3">
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

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or register with email</span>
          </div>
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Account Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {t('auth.register.accountType')}
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="relative">
              <input
                {...register('userType', { required: t('auth.error.accountTypeRequired') })}
                type="radio"
                value="customer"
                className="sr-only"
              />
              <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                watchUserType === 'customer' 
                  ? 'border-primary-600 bg-primary-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}>
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full mr-3 ${
                    watchUserType === 'customer' ? 'bg-primary-600' : 'bg-gray-300'
                  }`}></div>
                  <div>
                    <div className="font-medium text-gray-900">{t('auth.register.bookServices')}</div>
                    <div className="text-sm text-gray-600">{t('auth.register.bookServicesDesc')}</div>
                  </div>
                </div>
              </div>
            </label>

            <label className="relative">
              <input
                {...register('userType', { required: t('auth.error.accountTypeRequired') })}
                type="radio"
                value="specialist"
                className="sr-only"
              />
              <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                watchUserType === 'specialist' 
                  ? 'border-primary-600 bg-primary-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}>
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full mr-3 ${
                    watchUserType === 'specialist' ? 'bg-primary-600' : 'bg-gray-300'
                  }`}></div>
                  <div>
                    <div className="font-medium text-gray-900">{t('auth.register.offerServices')}</div>
                    <div className="text-sm text-gray-600">{t('auth.register.offerServicesDesc')}</div>
                  </div>
                </div>
              </div>
            </label>
          </div>
          {errors.userType && (
            <p className="mt-2 text-sm text-red-600">{errors.userType.message}</p>
          )}
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              {t('auth.register.firstNameLabel')}
            </label>
            <input
              {...register('firstName', {
                required: t('auth.error.firstNameRequired'),
                minLength: {
                  value: 2,
                  message: t('auth.error.firstNameMinLength'),
                },
              })}
              type="text"
              autoComplete="given-name"
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white ${
                errors.firstName ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder={t('auth.register.firstNamePlaceholder')}
            />
            {errors.firstName && (
              <p className="mt-2 text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              {t('auth.register.lastNameLabel')}
            </label>
            <input
              {...register('lastName', {
                required: t('auth.error.lastNameRequired'),
                minLength: {
                  value: 2,
                  message: t('auth.error.lastNameMinLength'),
                },
              })}
              type="text"
              autoComplete="family-name"
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white ${
                errors.lastName ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder={t('auth.register.lastNamePlaceholder')}
            />
            {errors.lastName && (
              <p className="mt-2 text-sm text-red-600">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            {t('auth.register.emailLabel')}
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
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder={t('auth.register.emailPlaceholder')}
          />
          {errors.email && (
            <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
            {t('auth.register.phoneLabel')}
          </label>
          <input
            {...register('phoneNumber', {
              pattern: {
                value: /^\+?[\d\s\-\(\)]{10,}$/,
                message: t('auth.error.phoneInvalid'),
              },
            })}
            type="tel"
            autoComplete="tel"
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white ${
              errors.phoneNumber ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder={t('auth.register.phonePlaceholder')}
          />
          {errors.phoneNumber && (
            <p className="mt-2 text-sm text-red-600">{errors.phoneNumber.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            {t('auth.register.passwordLabel')}
          </label>
          <div className="relative mt-1">
            <input
              {...register('password', {
                required: t('auth.error.passwordRequired'),
                minLength: {
                  value: 8,
                  message: t('auth.error.passwordMinLengthRegister'),
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: t('auth.error.passwordPattern'),
                },
              })}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 pr-10 text-gray-900 bg-white ${
                errors.password ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder={t('auth.register.passwordPlaceholder')}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            {t('auth.register.confirmPasswordLabel')}
          </label>
          <div className="relative mt-1">
            <input
              {...register('confirmPassword', {
                required: t('auth.error.confirmPasswordRequired'),
                validate: value => value === watchPassword || t('auth.error.passwordsDoNotMatch'),
              })}
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 pr-10 text-gray-900 bg-white ${
                errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder={t('auth.register.confirmPasswordPlaceholder')}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Terms Agreement */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              {...register('agreeToTerms', {
                required: t('auth.error.termsRequired'),
              })}
              id="agree-terms"
              type="checkbox"
              className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="agree-terms" className="text-gray-700">
              {t('auth.register.agreeToTerms')}{' '}
              <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                {t('auth.register.termsOfService')}
              </Link>{' '}
              {t('auth.register.and')}{' '}
              <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                {t('auth.register.privacyPolicy')}
              </Link>
            </label>
          </div>
        </div>
        {errors.agreeToTerms && (
          <p className="text-sm text-red-600">{errors.agreeToTerms.message}</p>
        )}

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" color="white" className="mr-2" />
            ) : null}
            {isLoading ? t('auth.register.creatingAccount') : t('auth.register.createAccount')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;