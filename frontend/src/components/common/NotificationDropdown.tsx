import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { selectNotifications, markAsRead, markAllAsRead, removeNotification } from '@/store/slices/notificationSlice';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { BellIcon, CheckIcon, CalendarIcon, CreditCardIcon, StarIcon, UserIcon, WarningIcon as ExclamationTriangleIcon, TrashIcon, XIcon } from '@/components/icons';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'booking_confirmed':
    case 'booking_updated':
    case 'new_booking':
      return <CalendarIcon className="w-5 h-5 text-primary-600" />;
    case 'payment_received':
    case 'payment_failed':
      return <CreditCardIcon className="w-5 h-5 text-green-600" />;
    case 'review_received':
      return <StarIcon className="w-5 h-5 text-yellow-600" />;
    case 'booking_cancelled':
      return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
    default:
      return <BellIcon className="w-5 h-5 text-gray-600" />;
  }
};

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
}) => {
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);
  const { t } = useLanguage();
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [isAnimating, setIsAnimating] = useState(false);

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const recentNotifications = notifications.slice(0, 10);

  const handleMarkAsRead = (notificationId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    dispatch(markAsRead(notificationId));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
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

  const handleNotificationClick = (notification: Record<string, unknown>) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    onClose();
  };

  // Trigger entrance animation
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  // Close on outside click and Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsAnimating(false);
        setTimeout(onClose, 200);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAnimating(false);
        setTimeout(onClose, 200);
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

  return (
    <div
      ref={dropdownRef}
      className={`absolute right-0 mt-2 w-96 max-w-[90vw] bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-50 overflow-hidden transform transition-all duration-300 ease-out ${
        isAnimating ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'
      }`}
      style={{ transformOrigin: 'top right' }}
    >
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between bg-gradient-to-r from-gray-50/80 to-transparent dark:from-gray-700/30">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('notifications.title')}</h3>
        <div className="flex items-center gap-2">
          {unreadNotifications.length > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs sm:text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold px-3 py-1.5 rounded-xl hover:bg-primary-50/80 dark:hover:bg-primary-900/30 transition-all duration-200 active:scale-95"
            >
              {t('notifications.markAllRead')}
            </button>
          )}
          <button
            onClick={() => {
              setIsAnimating(false);
              setTimeout(onClose, 200);
            }}
            aria-label="Close notifications"
            className="p-2 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-all duration-200 hover:scale-110 active:scale-90 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Notifications list */}
      <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
        {recentNotifications.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-sm mb-3">
              <BellIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{t('notifications.noNotifications')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100/50 dark:divide-gray-700/50">
            {recentNotifications.map((notification, index) => (
              <div
                key={notification.id}
                className={`group relative px-4 py-3.5 cursor-pointer border-l-[3px] transition-all duration-300 hover:pl-5 ${
                  deletingIds.has(notification.id)
                    ? 'opacity-0 translate-x-full scale-90'
                    : 'opacity-100 translate-x-0 scale-100'
                } ${
                  notification.isRead
                    ? 'border-transparent hover:bg-gray-50/80 dark:hover:bg-gray-700/40'
                    : 'border-primary-500 bg-primary-50/40 dark:bg-primary-900/20 hover:bg-primary-50/60 dark:hover:bg-primary-900/30'
                }`}
                style={{
                  animationDelay: `${index * 50}ms`,
                  animation: isAnimating ? 'slideInRight 0.3s ease-out forwards' : 'none'
                }}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={`p-2 rounded-xl transition-all duration-200 group-hover:scale-110 ${
                      notification.isRead
                        ? 'bg-gray-100/80 dark:bg-gray-700/80'
                        : 'bg-white/80 dark:bg-gray-800/80 shadow-sm'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed transition-colors duration-200 ${
                      notification.isRead
                        ? 'text-gray-600 dark:text-gray-300'
                        : 'text-gray-900 dark:text-white font-semibold'
                    }`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {!notification.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                        className="p-2 rounded-xl hover:bg-green-100/80 dark:hover:bg-green-900/30 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-all duration-200 hover:scale-110 active:scale-90"
                        title="Mark as read"
                      >
                        <CheckIcon className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(notification.id, e)}
                      className="p-2 rounded-xl hover:bg-red-100/80 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 hover:scale-110 active:scale-90"
                      title="Delete"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {recentNotifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-transparent to-gray-50/80 dark:to-gray-700/30">
          <Link
            to="/notifications"
            onClick={() => {
              setIsAnimating(false);
              setTimeout(onClose, 200);
            }}
            className="inline-flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold px-3 py-2 rounded-xl hover:bg-primary-50/80 dark:hover:bg-primary-900/30 transition-all duration-200 active:scale-95"
          >
            {t('notifications.viewAll')}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
};
