import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { register as registerUser, selectIsAuthenticated, selectAuthError, selectIsLoading, clearError } from '@/store/slices/authSlice';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import PasswordStrengthIndicator from '@/components/ui/PasswordStrengthIndicator';
import {
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  BuildingOfficeIcon,
  CheckCircleIcon
} from '@/components/icons';
import { RegisterRequest, UserType } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import EnhancedGoogleSignIn from '@/components/auth/EnhancedGoogleSignIn';
import TelegramLogin from '@/components/auth/TelegramLogin';
import { environment } from '@/config/environment';
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

  const defaultUserType = (searchParams.get('type')?.toUpperCase() as UserType) || 'CUSTOMER';
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
          <label className="block text-base font-semibold text-gray-900 dark:text-white mb-2">
            {t('auth.register.accountType')}
          </label>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Choose the account type that best describes you
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Customer Option */}
            <label className="relative cursor-pointer group">
              <input
                {...register('userType', { required: t('auth.error.accountTypeRequired') })}
                type="radio"
                value="CUSTOMER"
                className="sr-only peer"
              />
              <div className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                watchUserType === 'CUSTOMER'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm'
              }`}>
                {/* Selection Indicator */}
                {watchUserType === 'CUSTOMER' && (
                  <div className="absolute top-3 right-3">
                    <CheckCircleIcon className="w-5 h-5 text-blue-500" />
                  </div>
                )}

                {/* Icon and Content */}
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                    watchUserType === 'CUSTOMER'
                      ? 'bg-blue-100 dark:bg-blue-800/50'
                      : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30'
                  }`}>
                    <UserIcon className={`w-5 h-5 transition-colors duration-200 ${
                      watchUserType === 'CUSTOMER'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 group-hover:text-blue-500'
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-bold mb-1 transition-colors duration-200 ${
                      watchUserType === 'CUSTOMER'
                        ? 'text-blue-900 dark:text-blue-100'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {t('auth.register.bookServices')}
                    </h3>
                    <p className={`text-xs leading-snug transition-colors duration-200 ${
                      watchUserType === 'CUSTOMER'
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {t('auth.register.bookServicesDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </label>

            {/* Specialist Option */}
            <label className="relative cursor-pointer group">
              <input
                {...register('userType', { required: t('auth.error.accountTypeRequired') })}
                type="radio"
                value="SPECIALIST"
                className="sr-only peer"
              />
              <div className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                watchUserType === 'SPECIALIST'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-green-300 dark:hover:border-green-600 hover:shadow-sm'
              }`}>
                {/* Selection Indicator */}
                {watchUserType === 'SPECIALIST' && (
                  <div className="absolute top-3 right-3">
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  </div>
                )}

                {/* Icon and Content */}
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                    watchUserType === 'SPECIALIST'
                      ? 'bg-green-100 dark:bg-green-800/50'
                      : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-green-50 dark:group-hover:bg-green-900/30'
                  }`}>
                    <WrenchScrewdriverIcon className={`w-5 h-5 transition-colors duration-200 ${
                      watchUserType === 'SPECIALIST'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-600 dark:text-gray-400 group-hover:text-green-500'
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-bold mb-1 transition-colors duration-200 ${
                      watchUserType === 'SPECIALIST'
                        ? 'text-green-900 dark:text-green-100'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {t('auth.register.individualSpecialist')}
                    </h3>
                    <p className={`text-xs leading-snug transition-colors duration-200 ${
                      watchUserType === 'SPECIALIST'
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {t('auth.register.individualSpecialistDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </label>

            {/* Business Option */}
            <label className="relative cursor-pointer group">
              <input
                {...register('userType', { required: t('auth.error.accountTypeRequired') })}
                type="radio"
                value="BUSINESS"
                className="sr-only peer"
              />
              <div className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                watchUserType === 'BUSINESS'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-sm'
              }`}>
                {/* Selection Indicator */}
                {watchUserType === 'BUSINESS' && (
                  <div className="absolute top-3 right-3">
                    <CheckCircleIcon className="w-5 h-5 text-purple-500" />
                  </div>
                )}

                {/* Icon and Content */}
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                    watchUserType === 'BUSINESS'
                      ? 'bg-purple-100 dark:bg-purple-800/50'
                      : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/30'
                  }`}>
                    <BuildingOfficeIcon className={`w-5 h-5 transition-colors duration-200 ${
                      watchUserType === 'BUSINESS'
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-gray-600 dark:text-gray-400 group-hover:text-purple-500'
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-bold mb-1 transition-colors duration-200 ${
                      watchUserType === 'BUSINESS'
                        ? 'text-purple-900 dark:text-purple-100'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {t('auth.register.businessAccount')}
                    </h3>
                    <p className={`text-xs leading-snug transition-colors duration-200 ${
                      watchUserType === 'BUSINESS'
                        ? 'text-purple-700 dark:text-purple-300'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {t('auth.register.businessAccountDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </label>
          </div>
          {errors.userType && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.userType.message}
            </p>
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
              className={`mt-1 block w-full px-3 py-3 sm:py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 font-medium ${
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
              className={`mt-1 block w-full px-3 py-3 sm:py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 font-medium ${
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
            className={`mt-1 block w-full px-3 py-3 sm:py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 font-medium ${
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
            className={`mt-1 block w-full px-3 py-3 sm:py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 font-medium ${
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
              className={`block w-full px-3 py-3 sm:py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-10 text-gray-900 dark:text-gray-100 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 font-medium ${
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
              className={`block w-full px-3 py-3 sm:py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-10 text-gray-900 dark:text-gray-100 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 font-medium ${
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
              <Link to="/terms" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors duration-200">
                {t('auth.register.termsOfService')}
              </Link>{' '}
              {t('auth.register.and')}{' '}
              <Link to="/privacy" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors duration-200">
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
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 hover:scale-105"
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
