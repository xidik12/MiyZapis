import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import PasswordStrengthIndicator from '@/components/ui/PasswordStrengthIndicator';
import Modal from '@/components/ui/Modal';
import { getPasswordValidationRules, getConfirmPasswordValidationRules } from '@/utils/passwordValidation';
import { authService } from '@/services/auth.service';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';

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
    } catch (error: any) {
      console.error('Change password failed:', error);
      toast.error(error.message || t('auth.passwordChangeFailed') || 'Failed to change password. Please try again.');
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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      closeOnBackdrop={!isLoading}
      closeOnEscape={!isLoading}
      ariaLabel="Change password"
      contentClassName="flex flex-col"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-100 p-2 dark:bg-primary-900/20">
              <KeyIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Change Password
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Update your account password
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="modal-body space-y-6">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                For security, you'll need to enter your current password to change it.
              </p>
            </div>

            <div>
              <label
                htmlFor="currentPassword"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Current Password
              </label>
              <div className="relative">
                <input
                  {...register('currentPassword', {
                    required: 'Current password is required',
                  })}
                  type={showCurrentPassword ? 'text' : 'password'}
                  className={`w-full rounded-lg border px-3 py-2 pr-10 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    theme === 'dark'
                      ? 'border-gray-600 bg-gray-700 text-gray-100'
                      : 'border-gray-300 bg-white text-gray-900'
                  } ${
                    errors.currentPassword
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : ''
                  }`}
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
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

            <div>
              <label
                htmlFor="newPassword"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  {...register('newPassword', getPasswordValidationRules(t))}
                  type={showNewPassword ? 'text' : 'password'}
                  className={`w-full rounded-lg border px-3 py-2 pr-10 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    theme === 'dark'
                      ? 'border-gray-600 bg-gray-700 text-gray-100'
                      : 'border-gray-300 bg-white text-gray-900'
                  } ${
                    errors.newPassword
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : ''
                  }`}
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
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

              {watchedNewPassword && (
                <div className="mt-3">
                  <PasswordStrengthIndicator password={watchedNewPassword} showRequirements />
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  {...register(
                    'confirmPassword',
                    getConfirmPasswordValidationRules(watchedNewPassword, t)
                  )}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`w-full rounded-lg border px-3 py-2 pr-10 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    theme === 'dark'
                      ? 'border-gray-600 bg-gray-700 text-gray-100'
                      : 'border-gray-300 bg-white text-gray-900'
                  } ${
                    errors.confirmPassword
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : ''
                  }`}
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
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
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !watchedNewPassword}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {isLoading && <LoadingSpinner size="sm" color="white" />}
            <span>{isLoading ? 'Changing Password...' : 'Change Password'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ChangePasswordModal;
