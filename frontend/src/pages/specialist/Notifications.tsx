import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { notificationService } from '../../services/notification.service';
// Removed SpecialistPageWrapper - layout is handled by SpecialistLayout
import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

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

const SpecialistNotifications: React.FC = () => {
  const { t, language } = useLanguage();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'booking' | 'payment' | 'review' | 'system'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications from service
  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await notificationService.getNotifications({
        page: 1,
        limit: 50
      });
      
      // Map service notifications to component format
      const mappedNotifications: Notification[] = response.notifications.map(notif => ({
        id: notif.id,
        type: notif.type as 'booking' | 'payment' | 'review' | 'system' | 'reminder',
        title: notif.title,
        message: notif.message,
        timestamp: notif.createdAt,
        isRead: notif.isRead,
        priority: 'medium' as const, // Default priority
        actionUrl: notif.actionUrl
      }));
      
      setNotifications(mappedNotifications);
      setUnreadCount(response.unreadCount);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Failed to load notifications');
      
      // Try to force local mode if backend fails
      notificationService.forceLocalMode();
      
      // Retry once with local service
      try {
        const response = await notificationService.getNotifications({
          page: 1,
          limit: 50
        });
        
        const mappedNotifications: Notification[] = response.notifications.map(notif => ({
          id: notif.id,
          type: notif.type as 'booking' | 'payment' | 'review' | 'system' | 'reminder',
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
      } catch (localErr) {
        console.error('Local notifications also failed:', localErr);
        setError('Could not load notifications');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load notifications on component mount
  useEffect(() => {
    loadNotifications();
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return CalendarIcon;
      case 'payment':
        return CreditCardIcon;
      case 'review':
        return UserIcon;
      case 'reminder':
        return ExclamationTriangleIcon;
      case 'system':
        return InformationCircleIcon;
      default:
        return BellIcon;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-800';
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount(prev => {
        const next = Math.max(0, prev - 1);
        try { window.dispatchEvent(new CustomEvent('notifications:update', { detail: { unreadCount: next } })); } catch {}
        return next;
      });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
      try { window.dispatchEvent(new CustomEvent('notifications:update', { detail: { unreadCount: 0 } })); } catch {}
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => {
        const filtered = prev.filter(notif => notif.id !== id);
        const deletedNotif = prev.find(notif => notif.id === id);
        if (deletedNotif && !deletedNotif.isRead) {
          setUnreadCount(count => {
            const next = Math.max(0, count - 1);
            try { window.dispatchEvent(new CustomEvent('notifications:update', { detail: { unreadCount: next } })); } catch {}
            return next;
          });
        }
        return filtered;
      });
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.isRead;
    return notif.type === filter;
  });

  // Unread count is now managed by state from the service

  return (
    
      <div className="p-2 sm:p-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.nav.notifications')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('notifications.subtitle')}
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                {unreadCount} {t('notifications.unread')}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={markAllAsRead}
            className="px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
          >
            <CheckIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t('notifications.markAllRead')}</span>
            <span className="sm:hidden">{t('notifications.markRead')}</span>
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-6">
        <nav className="flex flex-wrap gap-2 sm:space-x-8 sm:gap-0">
          {[
            { key: 'all', label: t('notifications.filter.all') },
            { key: 'unread', label: t('notifications.filter.unread') },
            { key: 'booking', label: t('notifications.filter.booking') },
            { key: 'payment', label: t('notifications.filter.payment') },
            { key: 'review', label: t('notifications.filter.review') },
            { key: 'system', label: t('notifications.filter.system') },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                filter === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.key === 'unread' && unreadCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow animate-pulse">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('notifications.error.title')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <button 
            onClick={loadNotifications}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            {t('common.retry')}
          </button>
        </div>
      )}

      {/* Notifications list */}
      {!loading && !error && (
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <BellIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('notifications.noNotifications')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('notifications.noNotificationsDescription')}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const IconComponent = getNotificationIcon(notification.type);
            return (
              <div
                key={notification.id}
                className={`
                  border-l-4 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md
                  ${getPriorityColor(notification.priority)}
                  ${!notification.isRead ? 'ring-2 ring-primary-500 ring-opacity-20' : ''}
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`
                      p-2 rounded-lg
                      ${notification.priority === 'high' ? 'bg-red-100 text-red-600' : ''}
                      ${notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' : ''}
                      ${notification.priority === 'low' ? 'bg-blue-100 text-blue-600' : ''}
                    `}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className={`font-medium ${
                          !notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${
                        !notification.isRead ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {notification.timestamp}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                        title={t('notifications.markAsRead')}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title={t('notifications.delete')}
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

export default SpecialistNotifications;
