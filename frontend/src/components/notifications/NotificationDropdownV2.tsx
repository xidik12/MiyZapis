import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { selectNotifications, markAsRead, markAllAsRead, removeNotification, addNotification } from '@/store/slices/notificationSlice';
import { selectUser } from '@/store/slices/authSlice';
import { notificationService } from '@/services/notification.service';
// Local re-typing: the app's Notification matches the shape NotificationGroup expects.
// Avoids the DOM global Notification clashing with app data.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Notification = any;
import { useLanguage } from '@/contexts/LanguageContext';
import {
  isToday,
  isYesterday,
  isThisWeek} from 'date-fns';
import { BellIcon, XIcon } from '@/components/icons';
import { NotificationGroup } from './NotificationGroup';

interface NotificationDropdownV2Props {
  isOpen: boolean;
  onClose: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars

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
  const user = useAppSelector(selectUser);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const notificationsPath = user?.userType === 'specialist' ? '/specialist/notifications' : '/customer/notifications';
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Group notifications by time
  const groupedNotifications = useMemo(
    () => groupNotificationsByTime(notifications),
    [notifications]
  );

  const totalUnread = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Optimistic update
    dispatch(markAsRead(notificationId));
    try {
      await notificationService.markAsRead(notificationId);
    } catch {
      // Rollback: re-add the unread state by restoring via addNotification won't work cleanly,
      // so we re-fetch state indirectly — mark back as unread by dispatching markAsRead with inverse.
      // Simplest rollback: find the notification in current state and flip it back.
      const snapshot = notifications.find(n => n.id === notificationId);
      if (snapshot && !snapshot.isRead) {
        // It was unread before optimistic update; restore by re-adding with isRead=false
        dispatch(addNotification({ ...snapshot, isRead: false, readAt: undefined }));
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    // Capture pre-optimistic state for rollback
    const unreadSnapshot = notifications.filter(n => !n.isRead);
    // Optimistic update
    dispatch(markAllAsRead());
    try {
      await notificationService.markAllAsRead();
    } catch {
      // Rollback: restore each previously-unread notification
      unreadSnapshot.forEach(n => {
        dispatch(addNotification({ ...n, isRead: false, readAt: undefined }));
      });
    }
  };

  const handleMarkGroupAsRead = async (group: Notification[]) => {
    const unreadInGroup = group.filter(n => !n.isRead);
    // Optimistic
    unreadInGroup.forEach(n => dispatch(markAsRead(n.id)));
    try {
      await Promise.all(unreadInGroup.map(n => notificationService.markAsRead(n.id)));
    } catch {
      // Rollback
      unreadInGroup.forEach(n => dispatch(addNotification({ ...n, isRead: false, readAt: undefined })));
    }
  };

  const handleDelete = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Capture for rollback
    const snapshot = notifications.find(n => n.id === notificationId);
    setDeletingIds(prev => new Set(prev).add(notificationId));
    setTimeout(async () => {
      // Optimistic remove
      dispatch(removeNotification(notificationId));
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
      try {
        await notificationService.deleteNotification(notificationId);
      } catch {
        // Rollback: re-add the notification
        if (snapshot) {
          dispatch(addNotification(snapshot));
        }
      }
    }, 300);
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      // Optimistic
      dispatch(markAsRead(notification.id));
      try {
        await notificationService.markAsRead(notification.id);
      } catch {
        // Rollback
        dispatch(addNotification({ ...notification, isRead: false, readAt: undefined }));
      }
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
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
          className="fixed left-2 right-2 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[420px] max-h-[70vh] sm:max-h-[600px] rounded-2xl shadow-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 z-[60] overflow-hidden"
          style={{ transformOrigin: 'top right' }}
        >
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-gray-50/80 to-transparent dark:from-gray-700/30 sticky top-0 z-20">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {t('notifications.title')}
              </h3>
              {totalUnread > 0 && (
                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-500 text-white tabular-nums">
                  {totalUnread}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {totalUnread > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs sm:text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold px-3 py-1.5 rounded-xl hover:bg-primary-50/80 dark:hover:bg-primary-900/30 transition-all duration-200 active:scale-95"
                >
                  {t('notifications.markAllRead')}
                </button>
              )}
              <button
                onClick={onClose}
                aria-label="Close notifications"
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition duration-200 hover:scale-110 active:scale-[0.96] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
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
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100/80 dark:bg-gray-700 mb-3"
                >
                  <BellIcon className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                </motion.div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                  {t('notifications.noNotifications')}
                </p>
              </div>
            ) : (
              <div>
                {/* Today */}
                <NotificationGroup
                  title={t('notifications.group.today')}
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
                  title={t('notifications.group.yesterday')}
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
                  title={t('notifications.group.older')}
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
                  title={t('notifications.group.older')}
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
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-gradient-to-r from-transparent to-gray-50/80 dark:to-gray-700/30 sticky bottom-0">
              <Link
                to={notificationsPath}
                onClick={onClose}
                className="inline-flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold px-3 py-2 rounded-xl hover:bg-primary-50/80 dark:hover:bg-primary-900/30 transition-all duration-200 active:scale-95"
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
