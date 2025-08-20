import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  UserIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

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

  if (!isOpen) return null;

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
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
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

          {/* User Type Options */}
          <div className="space-y-4">
            {/* Customer Option */}
            <button
              onClick={() => onSelectUserType('customer')}
              className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all group"
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
              onClick={() => onSelectUserType('specialist')}
              className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all group"
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
