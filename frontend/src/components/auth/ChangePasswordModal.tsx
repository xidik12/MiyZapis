import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import PasswordStrengthIndicator from '@/components/ui/PasswordStrengthIndicator';
import { getPasswordValidationRules, getConfirmPasswordValidationRules } from '@/utils/passwordValidation';
import { authService } from '@/services/auth.service';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { XIcon as XMarkIcon, EyeIcon, EyeSlashIcon, KeyIcon } from '@/components/icons';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<ChangePasswordFormData>();

  const watchedNewPassword = watch('newPassword');

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsLoading(true);

    try {
      // Call the change password API endpoint
      await authService.changePassword(data.currentPassword, data.newPassword);

      toast.success(t('auth.passwordChanged') || 'Password changed successfully!');

      // Reset form and close modal
      reset();
      onClose();

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Change password failed:', error);
      toast.error(err.message || t('auth.passwordChangeFailed') || 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      reset();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative w-full max-w-lg rounded-xl shadow-xl ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-xl">
                <KeyIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('auth.changePasswordModal.title')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('auth.changePasswordModal.subtitle')}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Info Message */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {t('auth.changePasswordModal.info')}
              </p>
            </div>

            {/* Current Password Field */}
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('auth.changePasswordModal.currentLabel')}
              </label>
              <div className="relative">
                <input
                  {...register('currentPassword', {
                    required: t('auth.error.currentPasswordRequired') || 'Current password is required',
                  })}
                  type={showCurrentPassword ? 'text' : 'password'}
                  className={`w-full px-3 py-2 pr-10 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-gray-100 border-gray-600'
                      : 'bg-white text-gray-900 border-gray-300'
                  } ${
                    errors.currentPassword
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : ''
                  }`}
                  placeholder={t('auth.changePasswordModal.currentPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showCurrentPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>

              {errors.currentPassword && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {errors.currentPassword.message}
                </p>
              )}
            </div>

            {/* New Password Field */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('auth.changePasswordModal.newLabel')}
              </label>
              <div className="relative">
                <input
                  {...register('newPassword', getPasswordValidationRules(t))}
                  type={showNewPassword ? 'text' : 'password'}
                  className={`w-full px-3 py-2 pr-10 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-gray-100 border-gray-600'
                      : 'bg-white text-gray-900 border-gray-300'
                  } ${
                    errors.newPassword
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : ''
                  }`}
                  placeholder={t('auth.changePasswordModal.newPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showNewPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>

              {errors.newPassword && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {errors.newPassword.message}
                </p>
              )}

              {/* Password Strength Indicator */}
              {watchedNewPassword && (
                <div className="mt-3">
                  <PasswordStrengthIndicator
                    password={watchedNewPassword}
                    showRequirements={true}
                  />
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('auth.changePasswordModal.confirmLabel')}
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword', getConfirmPasswordValidationRules(watchedNewPassword, t))}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`w-full px-3 py-2 pr-10 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-gray-100 border-gray-600'
                      : 'bg-white text-gray-900 border-gray-300'
                  } ${
                    errors.confirmPassword
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : ''
                  }`}
                  placeholder={t('auth.changePasswordModal.confirmPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>

              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={isLoading || !watchedNewPassword}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center space-x-2"
              >
                {isLoading && <LoadingSpinner size="sm" color="white" />}
                <span>{isLoading ? t('auth.changePasswordModal.submitting') : t('auth.changePasswordModal.submit')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
