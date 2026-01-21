/**
 * Notification Center Component
 * Comprehensive notifications UI with full functionality
 */

import React, { useState, useEffect, useRef } from 'react';
import { notificationService } from '../../services/notification.service';
import { Notification, NotificationType } from '../../types';
import { useLanguage } from '@/contexts/LanguageContext';
import { BellIcon, CheckIcon, TrashIcon, EllipsisHorizontalIcon, WarningIcon as ExclamationTriangleIcon, InformationCircleIcon, CreditCardIcon, CalendarIcon, StarIcon, CogIcon, XIcon as XMarkIcon } from '@/components/icons';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  isOpen, 
  onClose, 
  className = '' 
}) => {
  const { t, language } = useLanguage();
  const panelRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const swiping = useRef(false);
  const [translateX, setTranslateX] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<NotificationType | 'all'>('all');
  const [serviceStatus, setServiceStatus] = useState<{
    mode: 'backend' | 'local';
    hasLocalData: boolean;
    localCount: number;
  }>({ mode: 'backend', hasLocalData: false, localCount: 0 });

  // Window for simple list virtualization to avoid rendering all rows at once
  const [win, setWin] = useState<{ start: number; end: number }>({ start: 0, end: 20 });

  // Load notifications
  const loadNotifications = async () => {
    try {
      setLoading(true);
      // Always fetch all, apply category filtering client-side
      const result = await notificationService.getNotifications();
      setAllNotifications(result.notifications);
      // Apply category filter client-side to accommodate backend type values (e.g. BOOKING_CONFIRMED)
      const filtered = filterByCategory(result.notifications, selectedFilter);
      setNotifications(filtered);
      setUnreadCount(result.unreadCount);
      
      // Get service status
      const status = notificationService.getStatus();
      setServiceStatus(status);
      
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load notifications on mount and when filter changes
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  // Re-filter when selectedFilter or data changes
  useEffect(() => {
    const filtered = filterByCategory(allNotifications, selectedFilter);
    setNotifications(filtered);
  }, [selectedFilter, allNotifications]);

  // Close on Esc
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const LoadingSkeleton = () => (
    <div className="p-4 space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="skeleton w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-2/3" />
            <div className="skeleton h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      // Optimistic update
      const target = notifications.find(n => n.id === notificationId);
      if (target && !target.isRead) {
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        try {
          window.dispatchEvent(new CustomEvent('notifications:update', { detail: { unreadCount: Math.max(0, (unreadCount - 1)) } }));
        } catch {}
      }
      await notificationService.markAsRead(notificationId);
      // Refresh in background to ensure consistency
      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      // Optimistically zero counts and notify listeners
      setUnreadCount(0);
      // Optimistically mark all as read in UI
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setAllNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      try {
        window.dispatchEvent(new CustomEvent('notifications:update', { detail: { unreadCount: 0 } }));
      } catch {}
      await loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Helper: filter notifications by category tab
  const filterByCategory = (items: Notification[], filter: NotificationType | 'all') => {
    if (filter === 'all') return items;
    const f = filter.toLowerCase();
    return items.filter(n => {
      const t = (n.type || '').toLowerCase();
      // Accept both backend-style (BOOKING_CONFIRMED) and frontend-style (booking_confirmed)
      switch (f) {
        case 'booking':
          return t.includes('booking');
        case 'payment':
          return t.includes('payment');
        case 'review':
          return t.includes('review');
        case 'system':
          return t.includes('system');
        default:
          return true;
      }
    });
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      // Optimistic update, adjust unread count if needed
      const target = notifications.find(n => n.id === notificationId);
      if (target && !target.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
        try {
          window.dispatchEvent(new CustomEvent('notifications:update', { detail: { unreadCount: Math.max(0, (unreadCount - 1)) } }));
        } catch {}
      }
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      await notificationService.deleteNotification(notificationId);
      loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Delete all notifications
  const deleteAllNotifications = async () => {
    const { confirm } = await import('../ui/Confirm');
    const ok = await confirm({
      title: t('notifications.clearConfirm.title') || 'Delete all notifications?',
      message: t('notifications.clearConfirm.message') || 'This cannot be undone.',
      confirmText: t('notifications.clearConfirm.confirm') || 'Delete all',
      cancelText: t('notifications.clearConfirm.cancel') || 'Cancel',
      variant: 'destructive'
    });
    if (!ok) return;
    try {
      await notificationService.deleteAllNotifications();
      setUnreadCount(0);
      try {
        window.dispatchEvent(new CustomEvent('notifications:update', { detail: { unreadCount: 0 } }));
      } catch {}
      await loadNotifications();
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };


  // Get notification type icon
  const getNotificationCategory = (type: NotificationType) => {
    const normalized = (type || '').toLowerCase();
    if (normalized.includes('booking')) return 'booking';
    if (normalized.includes('payment')) return 'payment';
    if (normalized.includes('review')) return 'review';
    if (normalized.includes('system')) return 'system';
    return 'system';
  };

  const getNotificationIcon = (type: NotificationType) => {
    const iconProps = { className: "h-5 w-5" };
    const category = getNotificationCategory(type);
    
    switch (category) {
      case 'booking':
        return <CalendarIcon {...iconProps} />;
      case 'payment':
        return <CreditCardIcon {...iconProps} />;
      case 'review':
        return <StarIcon {...iconProps} />;
      case 'system':
        return <InformationCircleIcon {...iconProps} />;
      default:
        return <BellIcon {...iconProps} />;
    }
  };

  // Get notification type color
  const getNotificationColor = (type: NotificationType) => {
    const category = getNotificationCategory(type);
    switch (category) {
      case 'booking':
        return 'text-blue-600 bg-blue-500/10 ring-1 ring-blue-500/20 dark:text-blue-300 dark:bg-blue-500/15 dark:ring-blue-400/20';
      case 'payment':
        return 'text-emerald-600 bg-emerald-500/10 ring-1 ring-emerald-500/20 dark:text-emerald-300 dark:bg-emerald-500/15 dark:ring-emerald-400/20';
      case 'review':
        return 'text-amber-600 bg-amber-500/10 ring-1 ring-amber-500/20 dark:text-amber-300 dark:bg-amber-500/15 dark:ring-amber-400/20';
      case 'system':
        return 'text-slate-600 bg-slate-500/10 ring-1 ring-slate-500/20 dark:text-slate-300 dark:bg-slate-500/15 dark:ring-slate-400/20';
      default:
        return 'text-slate-600 bg-slate-500/10 ring-1 ring-slate-500/20 dark:text-slate-300 dark:bg-slate-500/15 dark:ring-slate-400/20';
    }
  };

  // Format relative time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('notifications.time.justNow') || 'Just now';
    if (diffMins < 60) {
      const tpl = t('notifications.time.minutesAgo') || '{n}m ago';
      return tpl.replace('{n}', String(diffMins));
    }
    if (diffHours < 24) {
      const tpl = t('notifications.time.hoursAgo') || '{n}h ago';
      return tpl.replace('{n}', String(diffHours));
    }
    if (diffDays < 7) {
      const tpl = t('notifications.time.daysAgo') || '{n}d ago';
      return tpl.replace('{n}', String(diffDays));
    }
    const locale = language === 'uk' ? 'uk-UA' : language === 'ru' ? 'ru-RU' : 'en-US';
    return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const interp = (tpl: string, vars: Record<string, string | number>) =>
    (tpl || '').replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));

  const localizeNotification = (n: Notification): { title: string; message: string } => {
    const service = n.data?.serviceName || '';
    const date = n.data?.date || '';
    switch (n.type) {
      case 'booking_confirmed':
        return {
          title: t('notifications.bookingConfirmed.title') || 'Booking confirmed',
          message: interp(t('notifications.bookingConfirmed.message') || 'You have confirmed the booking for {service} on {date}.', { service, date })
        };
      case 'new_booking':
        return {
          title: t('notifications.newBooking.title') || 'New booking request requires confirmation',
          message: interp(t('notifications.newBooking.message') || 'New booking request for {service} on {date} - requires your confirmation.', { service, date })
        };
      case 'booking_cancelled':
        return {
          title: t('notifications.bookingCancelled.title') || 'Booking cancelled',
          message: interp(t('notifications.bookingCancelled.message') || 'The booking for {service} on {date} was cancelled.', { service, date })
        };
      case 'booking_reminder':
        return {
          title: t('notifications.bookingReminder.title') || 'Booking reminder',
          message: interp(t('notifications.bookingReminder.message') || 'Reminder: {service} on {date}.', { service, date })
        };
      case 'payment_received':
        return {
          title: t('notifications.paymentReceived.title') || 'Payment received',
          message: t('notifications.paymentReceived.message') || 'Payment completed successfully.'
        };
      case 'payment_failed':
        return {
          title: t('notifications.paymentFailed.title') || 'Payment failed',
          message: t('notifications.paymentFailed.message') || 'Payment failed. Please try again.'
        };
      case 'review_received':
        return {
          title: t('notifications.reviewReceived.title') || 'New Review Received',
          message: interp(t('notifications.reviewReceived.message') || 'You received a {rating}-star review for "{service}"', { rating: n.data?.rating || '', service })
        };
      case 'booking_updated':
        return {
          title: t('notifications.bookingUpdated.title') || 'Booking updated',
          message: interp(t('notifications.bookingUpdated.message') || 'Your booking for {service} on {date} has been updated.', { service, date })
        };
      case 'system_announcement':
      default:
        return { title: n.title, message: n.message };
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 ${className}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-l from-black/60 via-black/40 to-black/20 backdrop-blur-sm" onClick={onClose} />
      
      {/* Notification Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        className="absolute right-0 top-0 h-full w-full max-w-md bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-gray-100 shadow-2xl border-l border-white/60 dark:border-gray-700/70 ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-2xl transform transition-transform duration-300 ease-out translate-x-0 animate-slide-in-right will-change-transform overscroll-contain relative overflow-hidden flex flex-col"
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={(e) => {
          const t = e.touches[0];
          touchStartX.current = t.clientX;
          touchStartY.current = t.clientY;
          swiping.current = true;
        }}
        onTouchMove={(e) => {
          if (!swiping.current) return;
          const t = e.touches[0];
          const dx = t.clientX - (touchStartX.current || 0);
          const dy = t.clientY - (touchStartY.current || 0);
          // Only treat as horizontal swipe if mostly horizontal and moving right
          if (Math.abs(dx) > Math.abs(dy) && dx > 0) {
            setTranslateX(dx);
          }
        }}
        onTouchEnd={() => {
          if (!swiping.current) return;
          swiping.current = false;
          if (translateX > 80) {
            // Close on sufficient swipe to the right
            onClose();
            setTranslateX(0);
          } else {
            // Snap back
            setTranslateX(0);
          }
        }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-16 h-56 w-56 rounded-full bg-primary-500/15 blur-3xl" />
          <div className="absolute top-1/3 -right-24 h-44 w-44 rounded-full bg-sky-400/10 blur-2xl" />
        </div>

        <div className="relative flex h-full flex-col">
          {/* Header */}
          <div className="relative px-4 pt-4 pb-3 border-b border-gray-200/70 dark:border-gray-700/70 bg-gradient-to-r from-white/80 via-white/60 to-transparent dark:from-gray-900/70 dark:via-gray-900/40">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-500/10 ring-1 ring-primary-500/20 shadow-sm">
                  <BellIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">{t('notifications.title') || 'Notifications'}</h2>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:block">
                    {t('notifications.swipeHint') || 'Swipe right or press Esc to close'}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-red-500 to-rose-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm ring-1 ring-white/30">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-xl bg-white/70 dark:bg-gray-800/70 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 ring-1 ring-gray-200/70 dark:ring-gray-700/60 hover:scale-105 active:scale-95"
                aria-label={t('notifications.close') || 'Close notifications'}
              >
                <XMarkIcon className="h-5 w-5 text-gray-600 dark:text-gray-200" />
              </button>
            </div>
          </div>

          {/* Service Status removed per UX request */}

          {/* Controls */}
          <div className="px-4 pt-3 pb-4 border-b border-gray-200/70 dark:border-gray-700/70 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 rounded-2xl bg-gray-100/80 dark:bg-gray-800/80 p-1 ring-1 ring-gray-200/70 dark:ring-gray-700/60 mb-3">
              {['all', 'booking', 'payment', 'review', 'system'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter as NotificationType | 'all')}
                  className={`px-3 py-1.5 text-xs rounded-xl font-semibold capitalize transition-all duration-200 ${
                    selectedFilter === filter
                      ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/70 dark:bg-gray-900 dark:text-white dark:ring-gray-700/70'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-gray-700/70'
                  }`}
                >
                  {filter === 'all' ? (t('notifications.filter.all') || 'All')
                    : filter === 'booking' ? (t('notifications.filter.booking') || 'Bookings')
                    : filter === 'payment' ? (t('notifications.filter.payment') || 'Payments')
                    : filter === 'review' ? (t('notifications.filter.review') || 'Reviews')
                    : (t('notifications.filter.system') || 'System')}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-300 bg-primary-50/80 dark:bg-primary-900/20 ring-1 ring-primary-200/70 dark:ring-primary-800/50 px-3 py-1.5 rounded-full hover:bg-primary-100/80 dark:hover:bg-primary-900/40 transition-all duration-200"
                  >
                    <CheckIcon className="h-4 w-4" />
                    {t('notifications.markAllRead') || 'Mark all read'}
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={deleteAllNotifications}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-300 bg-red-50/80 dark:bg-red-900/20 ring-1 ring-red-200/70 dark:ring-red-800/50 px-3 py-1.5 rounded-full hover:bg-red-100/80 dark:hover:bg-red-900/40 transition-all duration-200"
                  >
                    <TrashIcon className="h-4 w-4" />
                    {t('notifications.clearAll') || 'Clear all'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div
            className="flex-1 min-h-0 overflow-y-auto custom-scrollbar"
            onScroll={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              const rowH = 80;
              const start = Math.floor(el.scrollTop / rowH);
              const end = start + Math.ceil(el.clientHeight / rowH) + 5;
              // Throttle updates to once per frame for smoother scrolling
              if (!(window as any)._notifRaf) {
                (window as any)._notifRaf = requestAnimationFrame(() => {
                  setWin({ start, end });
                  (window as any)._notifRaf = null;
                });
              }
            }}
          >
          {loading ? (
            <LoadingSkeleton />
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <div className="mx-auto mb-3 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100/80 dark:bg-gray-800/70 ring-1 ring-gray-200/70 dark:ring-gray-700/60">
                <BellIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('notifications.empty') || 'No notifications'}</p>
              <p className="text-sm">{t('notifications.caughtUp') || "You're all caught up!"}</p>
            </div>
          ) : (
            (() => {
              const rowH = 80;
              const start = Math.max(0, win?.start ?? 0);
              const end = Math.min(notifications.length, win?.end ?? 20);
              const items = notifications.slice(start, end);
              const before = start * rowH;
              const after = (notifications.length - end) * rowH;
              return (
                <div className="divide-y divide-gray-200/70 dark:divide-gray-800/70 relative">
                  <div style={{ height: before }} />
                  {items.map((notification) => (
                  <div
                    key={notification.id}
                    className={`group relative px-4 py-4 transition-all duration-200 ${
                      !notification.isRead
                        ? 'bg-white/80 dark:bg-gray-900/70 shadow-sm'
                        : 'bg-white/50 dark:bg-gray-900/40'
                    } hover:bg-white/90 dark:hover:bg-gray-900/80`}
                  >
                    <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-primary-500/10 via-transparent to-transparent" />
                    {!notification.isRead && (
                      <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-gradient-to-b from-primary-400 to-primary-600" />
                    )}
                    <div className="relative z-10 flex items-start gap-3">
                      {/* Icon */}
                      <div className={`p-2.5 rounded-2xl ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm font-semibold tracking-tight ${
                            !notification.isRead ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {localizeNotification(notification).title}
                          </h4>
                          {!notification.isRead && (
                            <span className="h-1.5 w-1.5 rounded-full bg-primary-500 shadow-sm" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {localizeNotification(notification).message}
                        </p>
                        <p className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mt-2">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-2 rounded-xl bg-white/70 dark:bg-gray-800/70 ring-1 ring-gray-200/70 dark:ring-gray-700/60 text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-300 transition-all duration-200 hover:scale-105 active:scale-95"
                            title={t('notifications.markRead') || 'Mark as read'}
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-2 rounded-xl bg-white/70 dark:bg-gray-800/70 ring-1 ring-gray-200/70 dark:ring-gray-700/60 text-gray-500 hover:text-red-600 dark:hover:text-red-300 transition-all duration-200 hover:scale-105 active:scale-95"
                          title={t('notifications.delete') || 'Delete'}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  ))}
                  <div style={{ height: after }} />
                </div>
              );
            })()
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
