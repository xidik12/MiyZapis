import React from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { selectNotifications, markAsRead, markAllNotificationsAsRead } from '@/store/slices/notificationSlice';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { 
  BellIcon, 
  CheckIcon,
  CalendarIcon,
  CreditCardIcon,
  StarIcon,
  UserIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

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
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);
  const { t } = useLanguage();

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const recentNotifications = notifications.slice(0, 10);

  const handleMarkAsRead = (notificationId: string) => {
    dispatch(markAsRead(notificationId));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{t('notifications.title')}</h3>
        {unreadNotifications.length > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="max-h-96 overflow-y-auto">
        {recentNotifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <BellIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">{t('notifications.noNotifications')}</p>
          </div>
        ) : (
          <div className="py-2">
            {recentNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-4 ${
                  notification.isRead 
                    ? 'border-transparent' 
                    : 'border-primary-500 bg-primary-50'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${
                      notification.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'
                    }`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                      className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                    >
                      <CheckIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {recentNotifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <Link
            to="/notifications"
            onClick={onClose}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {t('notifications.viewAll')}
          </Link>
        </div>
      )}
    </div>
  );
};