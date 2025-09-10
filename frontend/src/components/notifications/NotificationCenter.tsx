/**
 * Notification Center Component
 * Comprehensive notifications UI with full functionality
 */

import React, { useState, useEffect, useRef } from 'react';
import { notificationService } from '../../services/notification.service';
import { Notification, NotificationType } from '../../types';
import { 
  BellIcon, 
  CheckIcon, 
  TrashIcon,
  EllipsisHorizontalIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CreditCardIcon,
  CalendarIcon,
  StarIcon,
  CogIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

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
  const panelRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const swiping = useRef(false);
  const [translateX, setTranslateX] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
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
      const filters = selectedFilter !== 'all' ? { type: selectedFilter } : {};
      const result = await notificationService.getNotifications(filters);
      setNotifications(result.notifications);
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
  }, [isOpen, selectedFilter]);

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
      await notificationService.markAsRead(notificationId);
      await loadNotifications(); // Reload to update counts
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
      try {
        window.dispatchEvent(new CustomEvent('notifications:update', { detail: { unreadCount: 0 } }));
      } catch {}
      await loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Delete all notifications
  const deleteAllNotifications = async () => {
    const { confirm } = await import('../ui/Confirm');
    const ok = await confirm({
      title: 'Delete all notifications?',
      message: 'This cannot be undone.',
      confirmText: 'Delete all',
      cancelText: 'Cancel',
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
  const getNotificationIcon = (type: NotificationType) => {
    const iconProps = { className: "h-5 w-5" };
    
    switch (type) {
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
    switch (type) {
      case 'booking':
        return 'text-blue-600 bg-blue-100';
      case 'payment':
        return 'text-green-600 bg-green-100';
      case 'review':
        return 'text-yellow-600 bg-yellow-100';
      case 'system':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
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

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 ${className}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Notification Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-2xl border-l border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-out translate-x-0 animate-slide-in-right will-change-transform overscroll-contain"
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
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <BellIcon className="h-6 w-6 text-gray-700 dark:text-gray-200" />
            <h2 className="text-lg font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            aria-label="Close notifications"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">Swipe right or press Esc to close</span>
        </div>

        {/* Service Status */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${serviceStatus.mode === 'backend' ? 'bg-green-500' : 'bg-orange-500'}`} />
              <span>Mode: {serviceStatus.mode}</span>
            </div>
            {serviceStatus.mode === 'local' && (
              <button
                onClick={() => notificationService.resetBackendConnection()}
                className="text-blue-500 hover:text-blue-400"
              >
                Try Backend
              </button>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-10">
          {/* Filter Tabs */}
          <div className="flex gap-1 mb-3">
            {['all', 'booking', 'payment', 'review', 'system'].map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter as NotificationType | 'all')}
                className={`px-3 py-1 text-sm rounded-full capitalize transition-colors ${
                  selectedFilter === filter
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <CheckIcon className="h-4 w-4" />
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={deleteAllNotifications}
                  className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                >
                  <TrashIcon className="h-4 w-4" />
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div
          className="flex-1 overflow-y-auto"
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
              <BellIcon className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-lg font-medium text-gray-800 dark:text-gray-200">No notifications</p>
              <p className="text-sm">You're all caught up!</p>
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
                <div className="divide-y divide-gray-200 dark:divide-gray-700 relative">
                  <div style={{ height: before }} />
                  {items.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      !notification.isRead ? 'bg-blue-50 dark:bg-primary-900/20' : ''
                    }`}
                  >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`p-2 rounded-full ${getNotificationColor(notification.type)} dark:bg-opacity-20` }>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-medium ${
                        !notification.isRead ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1 text-blue-600 hover:text-blue-700"
                          title="Mark as read"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-1 text-red-600 hover:text-red-500"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Unread indicator */}
                  {!notification.isRead && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-500 rounded-r" />
                  )}
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
  );
};

export default NotificationCenter;
