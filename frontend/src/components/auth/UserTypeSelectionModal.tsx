import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { UserIcon, WrenchScrewdriverIcon, XIcon as XMarkIcon } from '@/components/icons';

interface UserTypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUserType: (userType: 'customer' | 'specialist') => void;
  userEmail?: string;
  userName?: string;
}

const UserTypeSelectionModal: React.FC<UserTypeSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectUserType,
  userEmail,
  userName,
}) => {
  const { t } = useLanguage();
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  if (!isOpen) return null;

  const handleSelectUserType = (userType: 'customer' | 'specialist') => {
    if (!agreeToTerms) {
      return; // Don't proceed if terms not accepted
    }
    onSelectUserType(userType);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-md transform rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('auth.userType.title')}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* User Info */}
          {(userName || userEmail) && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {t('auth.userType.welcomeMessage')}
              </p>
              {userName && (
                <p className="font-medium text-gray-900 dark:text-white">
                  {userName}
                </p>
              )}
              {userEmail && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {userEmail}
                </p>
              )}
            </div>
          )}

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
            {t('auth.userType.description')}
          </p>

          {/* Terms Agreement */}
          <div className="mb-6 p-4 bg-yellow-50/80 dark:bg-yellow-900/20 border border-yellow-200/50 dark:border-yellow-800/50 rounded-xl">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="agree-terms-google"
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 cursor-pointer"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="agree-terms-google" className="text-gray-700 dark:text-gray-300 cursor-pointer">
                  {t('auth.register.agreeToTerms')}{' '}
                  <Link
                    to="/terms"
                    target="_blank"
                    className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-semibold underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t('auth.register.termsOfService')}
                  </Link>{' '}
                  {t('auth.register.and')}{' '}
                  <Link
                    to="/privacy"
                    target="_blank"
                    className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-semibold underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t('auth.register.privacyPolicy')}
                  </Link>
                </label>
              </div>
            </div>
            {!agreeToTerms && (
              <p className="mt-2 text-xs text-yellow-700 dark:text-yellow-400 ml-7">
                ⚠️ {t('auth.error.termsRequired')}
              </p>
            )}
          </div>

          {/* User Type Options */}
          <div className="space-y-4">
            {/* Customer Option */}
            <button
              onClick={() => handleSelectUserType('customer')}
              disabled={!agreeToTerms}
              className={`w-full p-4 border-2 rounded-xl transition-all group ${
                agreeToTerms
                  ? 'border-gray-200 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer'
                  : 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40">
                  <UserIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {t('auth.userType.customer.title')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('auth.userType.customer.description')}
                  </p>
                </div>
              </div>
            </button>

            {/* Specialist Option */}
            <button
              onClick={() => handleSelectUserType('specialist')}
              disabled={!agreeToTerms}
              className={`w-full p-4 border-2 rounded-xl transition-all group ${
                agreeToTerms
                  ? 'border-gray-200 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer'
                  : 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40">
                  <WrenchScrewdriverIcon className="w-6 h-6 text-green-600 dark:text-green-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {t('auth.userType.specialist.title')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('auth.userType.specialist.description')}
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('auth.userType.footerNote')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserTypeSelectionModal;
