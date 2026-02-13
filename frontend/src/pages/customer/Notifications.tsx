import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { notificationService } from '../../services/notification.service';
import { BellIcon, CheckIcon, XIcon as XMarkIcon, EyeIcon, CalendarIcon, UserIcon, CreditCardIcon, WarningIcon as ExclamationTriangleIcon, InformationCircleIcon } from '@/components/icons';

interface Notification {
  id: string;
  type: 'booking' | 'payment' | 'review' | 'system' | 'reminder';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

const CustomerNotifications: React.FC = () => {
  const { t } = useLanguage();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'booking' | 'payment' | 'review' | 'system'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await notificationService.getNotifications({
        page: 1,
        limit: 50
      });

      const mappedNotifications: Notification[] = response.notifications.map(notif => ({
        id: notif.id,
        type: notif.type as Notification['type'],
        title: notif.title,
        message: notif.message,
        timestamp: notif.createdAt,
        isRead: notif.isRead,
        priority: 'medium' as const,
        actionUrl: notif.actionUrl
      }));

      setNotifications(mappedNotifications);
      setUnreadCount(response.unreadCount);
    } catch (err) {
      notificationService.forceLocalMode();

      try {
        const response = await notificationService.getNotifications({
          page: 1,
          limit: 50
        });

        const mappedNotifications: Notification[] = response.notifications.map(notif => ({
          id: notif.id,
          type: notif.type as Notification['type'],
          title: notif.title,
          message: notif.message,
          timestamp: notif.createdAt,
          isRead: notif.isRead,
          priority: 'medium' as const,
          actionUrl: notif.actionUrl
        }));

        setNotifications(mappedNotifications);
        setUnreadCount(response.unreadCount);
        setError(null);
      } catch {
        setError(t('notifications.error.loadFailed') || 'Could not load notifications');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking': return CalendarIcon;
      case 'payment': return CreditCardIcon;
      case 'review': return UserIcon;
      case 'reminder': return ExclamationTriangleIcon;
      case 'system': return InformationCircleIcon;
      default: return BellIcon;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default: return 'border-l-gray-500 bg-gray-50 dark:bg-gray-800';
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(notif => notif.id === id ? { ...notif, isRead: true } : notif)
      );
      setUnreadCount(prev => {
        const next = Math.max(0, prev - 1);
        try { window.dispatchEvent(new CustomEvent('notifications:update', { detail: { unreadCount: next } })); } catch {}
        return next;
      });
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
      setUnreadCount(0);
      try { window.dispatchEvent(new CustomEvent('notifications:update', { detail: { unreadCount: 0 } })); } catch {}
    } catch {}
  };

  const deleteNotification = async (id: string) => {
    try {
      setDeletingIds(prev => new Set(prev).add(id));
      setTimeout(async () => {
        await notificationService.deleteNotification(id);
        setNotifications(prev => {
          const deletedNotif = prev.find(notif => notif.id === id);
          if (deletedNotif && !deletedNotif.isRead) {
            setUnreadCount(count => {
              const next = Math.max(0, count - 1);
              try { window.dispatchEvent(new CustomEvent('notifications:update', { detail: { unreadCount: next } })); } catch {}
              return next;
            });
          }
          return prev.filter(notif => notif.id !== id);
        });
        setDeletingIds(prev => { const next = new Set(prev); next.delete(id); return next; });
      }, 300);
    } catch {
      setDeletingIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.isRead;
    return notif.type === filter;
  });

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.nav.notifications') || 'Notifications'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('notifications.subtitle') || 'Stay updated with your bookings and activity'}
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-xl text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200">
                {unreadCount} {t('notifications.unread') || 'unread'}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
          className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors flex items-center space-x-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckIcon className="w-4 h-4" />
          <span className="hidden sm:inline">{t('notifications.markAllRead') || 'Mark all read'}</span>
        </button>
      </div>

      {/* Filter tabs */}
      <div className="mb-6">
        <nav className="flex flex-wrap gap-2 bg-white dark:bg-gray-800 rounded-xl p-1.5 shadow-sm border border-gray-200 dark:border-gray-700">
          {[
            { key: 'all', label: t('notifications.filter.all') || 'All' },
            { key: 'unread', label: t('notifications.filter.unread') || 'Unread' },
            { key: 'booking', label: t('notifications.filter.booking') || 'Bookings' },
            { key: 'system', label: t('notifications.filter.system') || 'System' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`flex-1 min-w-fit py-2 px-3 rounded-lg font-medium text-sm transition-colors ${
                filter === tab.key
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
              {tab.key === 'unread' && unreadCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold rounded-md bg-red-500 text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm animate-pulse">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('notifications.error.title') || 'Something went wrong'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={loadNotifications}
            className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
          >
            {t('common.retry') || 'Try again'}
          </button>
        </div>
      )}

      {/* Notifications list */}
      {!loading && !error && (
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <BellIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {t('notifications.noNotifications') || 'No notifications'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {t('notifications.noNotificationsDescription') || "You're all caught up!"}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const IconComponent = getNotificationIcon(notification.type);
              return (
                <div
                  key={notification.id}
                  className={`
                    group border-l-4 p-4 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300
                    ${getPriorityColor(notification.priority)}
                    ${!notification.isRead ? 'ring-1 ring-primary-500/20' : ''}
                    ${deletingIds.has(notification.id) ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className={`
                        p-2.5 rounded-xl
                        ${notification.priority === 'high' ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' : ''}
                        ${notification.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400' : ''}
                        ${notification.priority === 'low' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : ''}
                      `}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-0.5">
                          <h4 className={`font-semibold text-sm truncate ${
                            !notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className={`text-sm ${
                          !notification.isRead ? 'text-gray-800 dark:text-gray-200' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                          {notification.timestamp}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                          title={t('notifications.markAsRead') || 'Mark as read'}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                        title={t('notifications.delete') || 'Delete'}
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerNotifications;
