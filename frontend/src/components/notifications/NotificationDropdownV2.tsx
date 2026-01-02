import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { selectNotifications, markAsRead, markAllAsRead, removeNotification } from '@/store/slices/notificationSlice';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  isToday,
  isYesterday,
  isThisWeek,
  startOfDay,
  differenceInDays
} from 'date-fns';
import { BellIcon, XIcon } from '@/components/icons';
import { NotificationGroup } from './NotificationGroup';

interface NotificationDropdownV2Props {
  isOpen: boolean;
  onClose: () => void;
}

type TimeGroup = 'today' | 'yesterday' | 'this_week' | 'earlier';

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

interface GroupedNotifications {
  today: Notification[];
  yesterday: Notification[];
  this_week: Notification[];
  earlier: Notification[];
}

const groupNotificationsByTime = (notifications: Notification[]): GroupedNotifications => {
  const grouped: GroupedNotifications = {
    today: [],
    yesterday: [],
    this_week: [],
    earlier: []
  };

  notifications.forEach(notification => {
    const date = new Date(notification.createdAt);

    if (isToday(date)) {
      grouped.today.push(notification);
    } else if (isYesterday(date)) {
      grouped.yesterday.push(notification);
    } else if (isThisWeek(date, { weekStartsOn: 1 })) {
      // Week starts on Monday
      grouped.this_week.push(notification);
    } else {
      grouped.earlier.push(notification);
    }
  });

  return grouped;
};

export const NotificationDropdownV2: React.FC<NotificationDropdownV2Props> = ({
  isOpen,
  onClose,
}) => {
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);
  const { t } = useLanguage();
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Group notifications by time
  const groupedNotifications = useMemo(
    () => groupNotificationsByTime(notifications),
    [notifications]
  );

  const totalUnread = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(markAsRead(notificationId));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  const handleMarkGroupAsRead = (group: Notification[]) => {
    group.forEach(notification => {
      if (!notification.isRead) {
        dispatch(markAsRead(notification.id));
      }
    });
  };

  const handleDelete = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingIds(prev => new Set(prev).add(notificationId));
    setTimeout(() => {
      dispatch(removeNotification(notificationId));
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
    }, 300);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      dispatch(markAsRead(notification.id));
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    onClose();
  };

  // Close on outside click and Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasNotifications = notifications.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute right-0 mt-2 w-[420px] max-w-[92vw] max-h-[600px] rounded-2xl shadow-2xl backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border border-gray-200/50 dark:border-gray-700/50 z-50 overflow-hidden"
          style={{ transformOrigin: 'top right' }}
        >
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between bg-gradient-to-r from-gray-50/80 to-transparent dark:from-gray-700/30 sticky top-0 z-20 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {t('notifications.title')}
              </h3>
              {totalUnread > 0 && (
                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-500 text-white">
                  {totalUnread}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {totalUnread > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs sm:text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold px-3 py-1.5 rounded-xl hover:bg-primary-50/80 dark:hover:bg-primary-900/30 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  {t('notifications.markAllRead')}
                </button>
              )}
              <button
                onClick={onClose}
                aria-label="Close notifications"
                className="p-2 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-all duration-200 hover:scale-110 active:scale-90 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notifications Groups */}
          <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(600px - 120px)' }}>
            {!hasNotifications ? (
              // Empty State
              <div className="px-4 py-12 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-sm mb-3"
                >
                  <BellIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </motion.div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                  {t('notifications.noNotifications')}
                </p>
              </div>
            ) : (
              <div>
                {/* Today */}
                <NotificationGroup
                  title="TODAY"
                  notifications={groupedNotifications.today}
                  onNotificationClick={handleNotificationClick}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                  onMarkAllAsRead={() => handleMarkGroupAsRead(groupedNotifications.today)}
                  deletingIds={deletingIds}
                  defaultExpanded={true}
                />

                {/* Yesterday */}
                <NotificationGroup
                  title="YESTERDAY"
                  notifications={groupedNotifications.yesterday}
                  onNotificationClick={handleNotificationClick}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                  onMarkAllAsRead={() => handleMarkGroupAsRead(groupedNotifications.yesterday)}
                  deletingIds={deletingIds}
                  defaultExpanded={true}
                />

                {/* This Week */}
                <NotificationGroup
                  title="THIS WEEK"
                  notifications={groupedNotifications.this_week}
                  onNotificationClick={handleNotificationClick}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                  onMarkAllAsRead={() => handleMarkGroupAsRead(groupedNotifications.this_week)}
                  deletingIds={deletingIds}
                  defaultExpanded={false}
                />

                {/* Earlier */}
                <NotificationGroup
                  title="EARLIER"
                  notifications={groupedNotifications.earlier}
                  onNotificationClick={handleNotificationClick}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                  onMarkAllAsRead={() => handleMarkGroupAsRead(groupedNotifications.earlier)}
                  deletingIds={deletingIds}
                  defaultExpanded={false}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          {hasNotifications && (
            <div className="px-4 py-3 border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-transparent to-gray-50/80 dark:to-gray-700/30 sticky bottom-0 backdrop-blur-sm">
              <Link
                to="/notifications"
                onClick={onClose}
                className="inline-flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold px-3 py-2 rounded-xl hover:bg-primary-50/80 dark:hover:bg-primary-900/30 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {t('notifications.viewAll')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
