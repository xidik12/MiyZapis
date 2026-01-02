import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  BellIcon,
  CheckIcon,
  CalendarIcon,
  CreditCardIcon,
  StarIcon,
  UserIcon,
  WarningIcon as ExclamationTriangleIcon,
  TrashIcon,
  EyeIcon
} from '@/components/icons';
import { Avatar } from '@/components/ui/Avatar';

interface NotificationCardProps {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
    isRead: boolean;
    createdAt: string;
    actionUrl?: string;
  };
  onClick: () => void;
  onMarkAsRead: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  isDeleting?: boolean;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'booking_confirmed':
    case 'booking_updated':
    case 'new_booking':
      return <CalendarIcon className="w-5 h-5" />;
    case 'payment_received':
    case 'payment_failed':
      return <CreditCardIcon className="w-5 h-5" />;
    case 'review_received':
      return <StarIcon className="w-5 h-5" />;
    case 'booking_cancelled':
      return <ExclamationTriangleIcon className="w-5 h-5" />;
    default:
      return <BellIcon className="w-5 h-5" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'booking_confirmed':
    case 'booking_updated':
    case 'new_booking':
      return {
        icon: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        border: 'border-blue-500'
      };
    case 'payment_received':
      return {
        icon: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-100 dark:bg-green-900/30',
        border: 'border-green-500'
      };
    case 'payment_failed':
      return {
        icon: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-100 dark:bg-red-900/30',
        border: 'border-red-500'
      };
    case 'review_received':
      return {
        icon: 'text-yellow-600 dark:text-yellow-400',
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        border: 'border-yellow-500'
      };
    case 'booking_cancelled':
      return {
        icon: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-100 dark:bg-red-900/30',
        border: 'border-red-500'
      };
    default:
      return {
        icon: 'text-gray-600 dark:text-gray-400',
        bg: 'bg-gray-100 dark:bg-gray-700/80',
        border: 'border-gray-300'
      };
  }
};

const getPriorityLevel = (type: string): 'urgent' | 'important' | 'normal' => {
  if (type === 'booking_cancelled' || type === 'payment_failed') {
    return 'urgent';
  }
  if (type === 'payment_received' || type === 'new_booking') {
    return 'important';
  }
  return 'normal';
};

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onClick,
  onMarkAsRead,
  onDelete,
  isDeleting = false
}) => {
  const colors = getNotificationColor(notification.type);
  const priority = getPriorityLevel(notification.type);

  // Extract avatar/name from data if available
  const avatarUrl = notification.data?.customerAvatar || notification.data?.specialistAvatar;
  const actorName = notification.data?.customerName || notification.data?.specialistName;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{
        opacity: isDeleting ? 0 : 1,
        x: isDeleting ? 100 : 0,
        scale: isDeleting ? 0.9 : 1
      }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="group relative"
    >
      <div
        onClick={onClick}
        className={`
          px-4 py-3.5 cursor-pointer transition-all duration-200
          flex items-start gap-3
          ${notification.isRead
            ? 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 opacity-70'
            : `bg-primary-50/50 dark:bg-primary-900/20 hover:bg-primary-100/50 dark:hover:bg-primary-900/30`
          }
          ${priority === 'urgent' ? 'border-l-4 border-red-500' : ''}
          ${priority === 'important' ? 'border-l-4 border-yellow-500' : ''}
        `}
      >
        {/* Avatar or Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {avatarUrl ? (
            <Avatar
              src={avatarUrl}
              alt={actorName || 'User'}
              size="md"
              className="w-10 h-10"
            />
          ) : (
            <div className={`p-2.5 rounded-xl ${colors.bg} transition-all duration-200 group-hover:scale-110`}>
              <div className={colors.icon}>
                {getNotificationIcon(notification.type)}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Primary message */}
          <p className={`text-sm leading-relaxed transition-colors duration-200 ${
            notification.isRead
              ? 'text-gray-600 dark:text-gray-300'
              : 'text-gray-900 dark:text-white font-semibold'
          }`}>
            {notification.message}
          </p>

          {/* Secondary info */}
          {notification.data?.serviceName && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {notification.data.serviceName}
            </p>
          )}

          {/* Timestamp */}
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </p>

            {/* Unread indicator dot */}
            {!notification.isRead && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary-500" />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {notification.actionUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = notification.actionUrl!;
              }}
              className="p-2 rounded-xl hover:bg-blue-100/80 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:scale-110 active:scale-90"
              title="View"
              aria-label="View notification details"
            >
              <EyeIcon className="w-4 h-4" />
            </button>
          )}

          {!notification.isRead && (
            <button
              onClick={onMarkAsRead}
              className="p-2 rounded-xl hover:bg-green-100/80 dark:hover:bg-green-900/30 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-all duration-200 hover:scale-110 active:scale-90"
              title="Mark as read"
              aria-label="Mark notification as read"
            >
              <CheckIcon className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onDelete}
            className="p-2 rounded-xl hover:bg-red-100/80 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 hover:scale-110 active:scale-90"
            title="Delete"
            aria-label="Delete notification"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
