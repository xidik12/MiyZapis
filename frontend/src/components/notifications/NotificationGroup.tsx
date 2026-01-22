import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, CheckIcon } from '@/components/icons';
import { NotificationCard } from './NotificationCard';
import { useLanguage } from '@/contexts/LanguageContext';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

interface NotificationGroupProps {
  title: string;
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onMarkAsRead: (notificationId: string, e: React.MouseEvent) => void;
  onDelete: (notificationId: string, e: React.MouseEvent) => void;
  onMarkAllAsRead?: () => void;
  deletingIds: Set<string>;
  defaultExpanded?: boolean;
}

export const NotificationGroup: React.FC<NotificationGroupProps> = ({
  title,
  notifications,
  onNotificationClick,
  onMarkAsRead,
  onDelete,
  onMarkAllAsRead,
  deletingIds,
  defaultExpanded = true
}) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (notifications.length === 0) {
    return null;
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="border-b border-gray-100/50 dark:border-gray-700/50 last:border-b-0">
      {/* Group Header */}
      <div
        className="sticky top-0 z-10 px-4 py-2.5 bg-gray-50/95 dark:bg-gray-800/95 backdrop-blur-sm flex items-center justify-between cursor-pointer hover:bg-gray-100/95 dark:hover:bg-gray-700/95 transition-colors duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {/* Expand/Collapse Icon */}
          <motion.div
            animate={{ rotate: isExpanded ? 0 : -90 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDownIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </motion.div>

          {/* Title */}
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
            {title}
          </h4>

          {/* Count Badge */}
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            {notifications.length}
          </span>

          {/* Unread Badge */}
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-500 text-white">
              {unreadCount} {t('notifications.new')}
            </span>
          )}
        </div>

        {/* Mark All as Read (for this group) */}
        {unreadCount > 0 && onMarkAllAsRead && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkAllAsRead();
            }}
            className="flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold px-2.5 py-1 rounded-lg hover:bg-primary-50/80 dark:hover:bg-primary-900/30 transition-all duration-200 hover:scale-105 active:scale-95"
            title={t('notifications.markAllRead')}
          >
            <CheckIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('notifications.markAll')}</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-gray-100/30 dark:divide-gray-700/30">
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                >
                  <NotificationCard
                    notification={notification}
                    onClick={() => onNotificationClick(notification)}
                    onMarkAsRead={(e) => onMarkAsRead(notification.id, e)}
                    onDelete={(e) => onDelete(notification.id, e)}
                    isDeleting={deletingIds.has(notification.id)}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
