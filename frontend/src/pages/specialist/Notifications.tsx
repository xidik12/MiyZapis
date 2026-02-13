import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { notificationService } from '../../services/notification.service';
// Removed SpecialistPageWrapper - layout is handled by SpecialistLayout
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

const SpecialistNotifications: React.FC = () => {
  const { t, language } = useLanguage();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'booking' | 'payment' | 'review' | 'system'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [isAnimating, setIsAnimating] = useState(false);

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

  // Trigger entrance animation when notifications load
  useEffect(() => {
    if (!loading && notifications.length > 0) {
      setIsAnimating(true);
    }
  }, [loading, notifications.length]);

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
      // Add to deleting set for animation
      setDeletingIds(prev => new Set(prev).add(id));

      // Wait for animation to complete
      setTimeout(async () => {
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

        // Clean up deleting state
        setDeletingIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 300);
    } catch (err) {
      console.error('Failed to delete notification:', err);
      // Remove from deleting set on error
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.isRead;
    return notif.type === filter;
  });

  // Unread count is now managed by state from the service

  return (
    
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8 animate-slide-in-down">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.nav.notifications')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-medium mt-1">
            {t('notifications.subtitle')}
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-red-100/80 text-red-800 dark:bg-red-900/40 dark:text-red-200 border border-red-200/50 dark:border-red-800/50 shadow-sm animate-scale-in">
                {unreadCount} {t('notifications.unread')}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all duration-200 active:scale-95 flex items-center space-x-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t('notifications.markAllRead')}</span>
            <span className="sm:hidden">{t('notifications.markRead')}</span>
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-8 animate-slide-in-up">
        <nav className="flex flex-wrap gap-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl p-2 shadow-glass border border-gray-200/50 dark:border-gray-700/50">
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
              className={`flex-1 min-w-fit py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 ${
                filter === tab.key
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
              {tab.key === 'unread' && unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-lg bg-red-500 text-white animate-pulse">
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
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow animate-pulse">
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
            className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
          >
            {t('common.retry')}
          </button>
        </div>
      )}

      {/* Notifications list */}
      {!loading && !error && (
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
          <div className="text-center py-16 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-glass animate-scale-in">
            <BellIcon className="w-20 h-20 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {t('notifications.noNotifications')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              {t('notifications.noNotificationsDescription')}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification, index) => {
            const IconComponent = getNotificationIcon(notification.type);
            return (
              <div
                key={notification.id}
                className={`
                  group border-l-4 p-5 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 backdrop-blur-xl
                  ${getPriorityColor(notification.priority)}
                  ${!notification.isRead ? 'ring-2 ring-primary-500/30' : ''}
                  ${deletingIds.has(notification.id) ? 'opacity-0 translate-x-full scale-90' : 'opacity-100 translate-x-0 scale-100'}
                `}
                style={{
                  animationDelay: `${index * 50}ms`,
                  animation: isAnimating && !deletingIds.has(notification.id) ? 'slideInRight 0.4s ease-out forwards' : 'none'
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1 min-w-0">
                    <div className={`
                      p-3 rounded-xl transition-all duration-200 group-hover:scale-110 shadow-sm
                      ${notification.priority === 'high' ? 'bg-red-100/80 dark:bg-red-900/40 text-red-600 dark:text-red-400' : ''}
                      ${notification.priority === 'medium' ? 'bg-yellow-100/80 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400' : ''}
                      ${notification.priority === 'low' ? 'bg-blue-100/80 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : ''}
                    `}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className={`font-bold text-base truncate ${
                          !notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <span className="w-2.5 h-2.5 bg-primary-600 rounded-full flex-shrink-0 animate-pulse"></span>
                        )}
                      </div>
                      <p className={`text-sm leading-relaxed ${
                        !notification.isRead ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-semibold">
                        {notification.timestamp}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-2 rounded-xl text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-100/80 dark:hover:bg-green-900/30 transition-all duration-200 hover:scale-110 active:scale-90"
                        title={t('notifications.markAsRead')}
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100/80 dark:hover:bg-red-900/30 transition-all duration-200 hover:scale-110 active:scale-90"
                      title={t('notifications.delete')}
                    >
                      <XMarkIcon className="w-5 h-5" />
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
