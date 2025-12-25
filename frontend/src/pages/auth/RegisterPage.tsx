import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { register as registerUser, selectIsAuthenticated, selectAuthError, selectIsLoading, clearError } from '@/store/slices/authSlice';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import PasswordStrengthIndicator from '@/components/ui/PasswordStrengthIndicator';
import { EyeIcon, EyeSlashIcon } from '@/components/icons';
import { RegisterRequest, UserType } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import EnhancedGoogleSignIn from '@/components/auth/EnhancedGoogleSignIn';
import TelegramLogin from '@/components/auth/TelegramLogin';
import { getPasswordValidationRules, getConfirmPasswordValidationRules } from '@/utils/passwordValidation';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber?: string;
  userType: UserType;
  agreeToTerms: boolean;
  referralCode?: string;
}

const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  const { theme } = useTheme();
  
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const error = useAppSelector(selectAuthError);
  const isLoading = useAppSelector(selectIsLoading);

  const defaultUserType = (searchParams.get('type') as UserType) || 'customer';
  const referralCode = searchParams.get('ref') || searchParams.get('referralCode') || undefined;

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
      referralCode: referralCode,
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
        ...(data.referralCode && { referralCode: data.referralCode }),
      };

      const result = await dispatch(registerUser(registerData)).unwrap();
      
      // Handle the response based on whether email verification is required
      if (result.requiresVerification) {
        // Show success message and redirect to verification page
        navigate('/auth/verify-email', { 
          replace: true,
          state: { 
            email: data.email,
            message: result.message || 'Please check your email to verify your account.'
          }
        });
      } else {
        // Immediate authentication (navigation handled by useEffect)
        // This happens if tokens are provided
      }
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
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center">
          {t('auth.register.title')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
          {t('auth.register.subtitle')}{' '}
          <Link
            to="/auth/login"
            className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 px-2 py-1 rounded-xl hover:bg-primary-50/80 dark:hover:bg-primary-900/30 transition-all duration-200"
          >
            {t('auth.register.signInHere')}
          </Link>
        </p>
      </div>

{/* Social Registration - only show if Google is configured (Telegram temporarily disabled) */}
      {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">Quick Registration</span>
            </div>
          </div>

          <div className="space-y-3">
            <EnhancedGoogleSignIn
              onSuccess={handleSocialLoginSuccess}
              onError={handleSocialLoginError}
              disabled={isLoading}
            />
            
            {/* Telegram Login temporarily disabled */}
            {/* <TelegramLogin
              onSuccess={handleSocialLoginSuccess}
              onError={handleSocialLoginError}
              disabled={isLoading}
            /> */}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">Or register with email</span>
            </div>
          </div>
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <div className="bg-red-50/80 dark:bg-red-900/30 backdrop-blur-sm border border-red-200/50 dark:border-red-800/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Referral Code Notice */}
        {referralCode && (
          <div className="bg-green-50/80 dark:bg-green-900/30 backdrop-blur-sm border border-green-200/50 dark:border-green-800/50 rounded-xl px-4 py-3">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  You're registering with a referral code!
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                  You'll receive bonus points after completing registration.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Account Type Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
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
              <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                watchUserType === 'customer'
                  ? 'border-primary-600 bg-primary-50/80 dark:bg-primary-900/30 backdrop-blur-sm shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm'
              }`}>
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full mr-3 ${
                    watchUserType === 'customer' ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}></div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{t('auth.register.bookServices')}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('auth.register.bookServicesDesc')}</div>
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
              <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                watchUserType === 'specialist'
                  ? 'border-primary-600 bg-primary-50/80 dark:bg-primary-900/30 backdrop-blur-sm shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm'
              }`}>
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full mr-3 ${
                    watchUserType === 'specialist' ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}></div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{t('auth.register.offerServices')}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('auth.register.offerServicesDesc')}</div>
                  </div>
                </div>
              </div>
            </label>
          </div>
          {errors.userType && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.userType.message}</p>
          )}
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
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
              id="firstName"
              type="text"
              autoComplete="given-name"
              className={`mt-1 block w-full px-3 py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 font-medium ${
                errors.firstName ? 'border-red-300 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'
              }`}
              placeholder={t('auth.register.firstNamePlaceholder')}
            />
            {errors.firstName && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
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
              id="lastName"
              type="text"
              autoComplete="family-name"
              className={`mt-1 block w-full px-3 py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 font-medium ${
                errors.lastName ? 'border-red-300 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'
              }`}
              placeholder={t('auth.register.lastNamePlaceholder')}
            />
            {errors.lastName && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
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
            id="email"
            type="email"
            autoComplete="email"
            className={`mt-1 block w-full px-3 py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 font-medium ${
              errors.email ? 'border-red-300 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'
            }`}
            placeholder={t('auth.register.emailPlaceholder')}
          />
          {errors.email && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t('auth.register.phoneLabel')}
          </label>
          <input
            {...register('phoneNumber', {
              pattern: {
                value: /^\+?[\d\s\-\(\)]{10,}$/,
                message: t('auth.error.phoneInvalid'),
              },
            })}
            id="phoneNumber"
            type="tel"
            autoComplete="tel"
            className={`mt-1 block w-full px-3 py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 font-medium ${
              errors.phoneNumber ? 'border-red-300 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'
            }`}
            placeholder={t('auth.register.phonePlaceholder')}
          />
          {errors.phoneNumber && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.phoneNumber.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t('auth.register.passwordLabel')}
          </label>
          <div className="relative mt-1">
            <input
              {...register('password', getPasswordValidationRules(t))}
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`block w-full px-3 py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-10 text-gray-900 dark:text-gray-100 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 font-medium ${
                errors.password ? 'border-red-300 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'
              }`}
              placeholder={t('auth.register.passwordPlaceholder')}
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

          {/* Password Strength Indicator */}
          {watchPassword && (
            <div className="mt-3">
              <PasswordStrengthIndicator
                password={watchPassword}
                showRequirements={true}
              />
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t('auth.register.confirmPasswordLabel')}
          </label>
          <div className="relative mt-1">
            <input
              {...register('confirmPassword', getConfirmPasswordValidationRules(watchPassword, t))}
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`block w-full px-3 py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-10 text-gray-900 dark:text-gray-100 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 font-medium ${
                errors.confirmPassword ? 'border-red-300 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'
              }`}
              placeholder={t('auth.register.confirmPasswordPlaceholder')}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
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
              className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="agree-terms" className="text-gray-700 dark:text-gray-300">
              {t('auth.register.agreeToTerms')}{' '}
              <Link to="/terms" className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-semibold px-1 rounded-xl hover:bg-primary-50/80 dark:hover:bg-primary-900/30 transition-all duration-200">
                {t('auth.register.termsOfService')}
              </Link>{' '}
              {t('auth.register.and')}{' '}
              <Link to="/privacy" className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-semibold px-1 rounded-xl hover:bg-primary-50/80 dark:hover:bg-primary-900/30 transition-all duration-200">
                {t('auth.register.privacyPolicy')}
              </Link>
            </label>
          </div>
        </div>
        {errors.agreeToTerms && (
          <p className="text-sm text-red-600 dark:text-red-400">{errors.agreeToTerms.message}</p>
        )}

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:ring-offset-white dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 hover:scale-105"
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