import React from 'react';
import Modal from '@/components/ui/Modal';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  UserIcon,
  WrenchScrewdriverIcon,
  BuildingOfficeIcon,
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      ariaLabel={t('auth.userType.title')}
      contentClassName="flex flex-col"
    >
      <div className="flex h-full flex-col">
        <div className="modal-header">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('auth.userType.title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
            aria-label={t('common.close') || 'Close'}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="modal-body space-y-6">
            {(userName || userEmail) && (
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">
                  {t('auth.userType.welcomeMessage')}
                </p>
                {userName && (
                  <p className="font-medium text-gray-900 dark:text-white">{userName}</p>
                )}
                {userEmail && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{userEmail}</p>
                )}
              </div>
            )}

            <p className="text-center text-gray-600 dark:text-gray-400">
              {t('auth.userType.description')}
            </p>

            <div className="space-y-4">
              <button
                onClick={() => onSelectUserType('customer')}
                className="group w-full rounded-xl border-2 border-gray-200 p-4 transition-all hover:border-primary-500 hover:bg-primary-50 dark:border-gray-600 dark:hover:bg-primary-900/20"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 transition group-hover:bg-primary-100 dark:bg-blue-900/30 dark:group-hover:bg-primary-900/40">
                    <UserIcon className="h-6 w-6 text-blue-600 transition group-hover:text-primary-600 dark:text-blue-400 dark:group-hover:text-primary-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {t('auth.userType.customer.title')}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('auth.userType.customer.description')}
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => onSelectUserType('specialist')}
                className="group w-full rounded-xl border-2 border-gray-200 p-4 transition-all hover:border-primary-500 hover:bg-primary-50 dark:border-gray-600 dark:hover:bg-primary-900/20"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 transition group-hover:bg-primary-100 dark:bg-green-900/30 dark:group-hover:bg-primary-900/40">
                    <WrenchScrewdriverIcon className="h-6 w-6 text-green-600 transition group-hover:text-primary-600 dark:text-green-400 dark:group-hover:text-primary-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {t('auth.userType.specialist.title')}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('auth.userType.specialist.description')}
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => onSelectUserType('specialist')}
                className="group w-full rounded-xl border-2 border-gray-200 p-4 transition-all hover:border-primary-500 hover:bg-primary-50 dark:border-gray-600 dark:hover:bg-primary-900/20"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 transition group-hover:bg-primary-100 dark:bg-purple-900/30 dark:group-hover:bg-primary-900/40">
                    <BuildingOfficeIcon className="h-6 w-6 text-purple-600 transition group-hover:text-primary-600 dark:text-purple-400 dark:group-hover:text-primary-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {t('auth.register.businessAccount')}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('auth.register.businessAccountDesc')}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-4 text-center text-xs text-gray-500 dark:text-gray-400">
          {t('auth.userType.footerNote')}
        </div>
      </div>
    </Modal>
  );
};

export default UserTypeSelectionModal;
