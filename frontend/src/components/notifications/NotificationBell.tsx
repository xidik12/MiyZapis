/**
 * Notification Bell Component
 * Shows notification count and opens notification center.
 * Reads unread count from the Redux store (populated by Header on mount).
 */

import React, { useState } from 'react';
import { BellIcon } from '@/components/icons';
import { useAppSelector } from '@/hooks/redux';
import { selectUnreadCount } from '@/store/slices/notificationSlice';
import { useLanguage } from '../../contexts/LanguageContext';
import NotificationCenter from './NotificationCenter';

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = useAppSelector(selectUnreadCount);

  const handleClick = () => {
    setIsOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full transition active:scale-[0.96] ${className}`}
        title={t('notifications.title') || 'Notifications'}
        aria-label={t('notifications.open') || 'Open notifications'}
      >
        <BellIcon className="h-6 w-6" />

        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center animate-pulse tabular-nums">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};

export default NotificationBell;
