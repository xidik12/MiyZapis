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
  const [step, setStep] = useState<'verify' | 'password'>('verify');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [channels, setChannels] = useState<string[]>([]);
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

  const handleSendOtp = async () => {
    setIsSending(true);
    try {
      const result = await authService.requestPasswordChangeOtp();
      setChannels(result.channels || []);
      setOtpSent(true);
      toast.success(
        t('auth.changePasswordModal.codeSent') || 'Verification code sent! Check your email' + (result.channels?.includes('telegram') ? ' and Telegram' : '') + '.'
      );
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      toast.error(err.message || 'Failed to send verification code');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOtp = () => {
    if (otpCode.length !== 6) {
      toast.error(t('auth.changePasswordModal.invalidCode') || 'Please enter the 6-digit code');
      return;
    }
    setStep('password');
  };

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsLoading(true);
    try {
      await authService.changePassword(otpCode, data.newPassword);
      toast.success(t('auth.passwordChanged') || 'Password changed successfully!');
      handleFullClose();
      if (onSuccess) onSuccess();
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (err.message?.toLowerCase().includes('expired') || err.message?.toLowerCase().includes('invalid')) {
        setStep('verify');
        setOtpCode('');
        setOtpSent(false);
      }
      toast.error(err.message || t('auth.passwordChangeFailed') || 'Failed to change password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFullClose = () => {
    if (!isLoading) {
      reset();
      setStep('verify');
      setOtpCode('');
      setOtpSent(false);
      setChannels([]);
      onClose();
    }
  };

  if (!isOpen) return null;

  const channelText = channels.length > 0
    ? channels.map(c => c === 'email' ? (t('auth.changePasswordModal.channelEmail') || 'email') : (t('auth.changePasswordModal.channelTelegram') || 'Telegram')).join(` ${t('common.and') || 'and'} `)
    : (t('auth.changePasswordModal.channelEmail') || 'email');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleFullClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative w-full max-w-lg rounded-xl shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
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
                  {step === 'verify'
                    ? (t('auth.changePasswordModal.verifySubtitle') || 'Verify your identity first')
                    : (t('auth.changePasswordModal.subtitle') || 'Set your new password')
                  }
                </p>
              </div>
            </div>
            <button onClick={handleFullClose} disabled={isLoading} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl transition-colors">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Step indicator */}
          <div className="px-6 pt-4">
            <div className="flex items-center space-x-2">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${step === 'verify' ? 'bg-primary-600 text-white' : 'bg-green-500 text-white'}`}>
                {step === 'verify' ? '1' : '✓'}
              </div>
              <div className={`flex-1 h-0.5 ${step === 'password' ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${step === 'password' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                2
              </div>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">{t('auth.changePasswordModal.stepVerify') || 'Verify'}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{t('auth.changePasswordModal.stepPassword') || 'New Password'}</span>
            </div>
          </div>

          {/* Step 1: Verify identity */}
          {step === 'verify' && (
            <div className="p-6 space-y-5">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {t('auth.changePasswordModal.verifyInfo') || 'For security, we\'ll send a 6-digit verification code to your email and Telegram (if connected).'}
                </p>
              </div>

              {!otpSent ? (
                <button
                  onClick={handleSendOtp}
                  disabled={isSending}
                  className="w-full px-4 py-3 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center justify-center space-x-2"
                >
                  {isSending && <LoadingSpinner size="sm" color="white" />}
                  <span>{isSending ? (t('auth.changePasswordModal.sending') || 'Sending...') : (t('auth.changePasswordModal.sendCode') || 'Send Verification Code')}</span>
                </button>
              ) : (
                <>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      ✓ {t('auth.changePasswordModal.codeSentTo') || 'Code sent via'} {channelText}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('auth.changePasswordModal.codeLabel') || 'Verification Code'}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className={`w-full px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                        theme === 'dark' ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'
                      }`}
                      placeholder="••••••"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={handleSendOtp}
                      disabled={isSending}
                      className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium disabled:opacity-50"
                    >
                      {isSending ? (t('auth.changePasswordModal.resending') || 'Resending...') : (t('auth.changePasswordModal.resendCode') || 'Resend code')}
                    </button>
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <button type="button" onClick={handleFullClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={handleVerifyOtp}
                      disabled={otpCode.length !== 6}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
                    >
                      {t('auth.changePasswordModal.verify') || 'Verify & Continue'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: Set new password */}
          {step === 'password' && (
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3">
                <p className="text-sm text-green-700 dark:text-green-300">
                  ✓ {t('auth.changePasswordModal.verified') || 'Identity verified. Enter your new password below.'}
                </p>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('auth.changePasswordModal.newLabel')}
                </label>
                <div className="relative">
                  <input
                    {...register('newPassword', getPasswordValidationRules(t))}
                    type={showNewPassword ? 'text' : 'password'}
                    className={`w-full px-3 py-2 pr-10 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                      theme === 'dark' ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'
                    } ${errors.newPassword ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                    placeholder={t('auth.changePasswordModal.newPlaceholder')}
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {showNewPassword ? <EyeSlashIcon className="h-5 w-5 text-gray-400" /> : <EyeIcon className="h-5 w-5 text-gray-400" />}
                  </button>
                </div>
                {errors.newPassword && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.newPassword.message}</p>}
                {watchedNewPassword && (
                  <div className="mt-3">
                    <PasswordStrengthIndicator password={watchedNewPassword} showRequirements={true} />
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('auth.changePasswordModal.confirmLabel')}
                </label>
                <div className="relative">
                  <input
                    {...register('confirmPassword', getConfirmPasswordValidationRules(watchedNewPassword, t))}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`w-full px-3 py-2 pr-10 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                      theme === 'dark' ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'
                    } ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                    placeholder={t('auth.changePasswordModal.confirmPlaceholder')}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5 text-gray-400" /> : <EyeIcon className="h-5 w-5 text-gray-400" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>}
              </div>

              {/* Buttons */}
              <div className="flex justify-between pt-2">
                <button type="button" onClick={() => setStep('verify')} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                  ← {t('common.back') || 'Back'}
                </button>
                <div className="flex space-x-3">
                  <button type="button" onClick={handleFullClose} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors">
                    {t('common.cancel')}
                  </button>
                  <button type="submit" disabled={isLoading || !watchedNewPassword} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center space-x-2">
                    {isLoading && <LoadingSpinner size="sm" color="white" />}
                    <span>{isLoading ? (t('auth.changePasswordModal.submitting')) : (t('auth.changePasswordModal.submit'))}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
