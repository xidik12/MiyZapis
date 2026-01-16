import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  EllipsisVerticalIcon
} from '@/components/icons';
import { Avatar } from '@/components/ui/Avatar';

export interface BookingData {
  id: string;
  status: string;
  scheduledDate: string;
  scheduledTime: string;
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    phoneNumber?: string;
  };
  specialist?: {
    id: string;
    firstName: string;
    lastName: string;
    businessName?: string;
    avatar?: string;
  };
  service: {
    id: string;
    name: string;
    duration?: number;
    price?: number;
  };
  location?: {
    address?: string;
    city?: string;
  };
  totalPrice: number;
  paymentStatus?: string;
}

interface BookingCardProps {
  booking: BookingData;
  userRole: 'customer' | 'specialist';
  onClick?: () => void;
  onQuickAction?: (action: string) => void;
  isDragging?: boolean;
}

const BookingCardComponent: React.FC<BookingCardProps> = ({
  booking,
  userRole,
  onClick,
  onQuickAction,
  isDragging = false
}) => {
  const otherParty = userRole === 'customer' ? booking.specialist : booking.customer;
  const displayName = userRole === 'customer'
    ? booking.specialist?.businessName || `${booking.specialist?.firstName} ${booking.specialist?.lastName}`
    : `${booking.customer?.firstName} ${booking.customer?.lastName}`;
  const hasAvatar = otherParty?.avatar;

  const statusColors = {
    PENDING: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300',
    CONFIRMED: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300',
    COMPLETED: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300',
    CANCELLED: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300',
    IN_PROGRESS: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-300',
    NO_SHOW: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-300'
  };

  const statusColor = statusColors[booking.status as keyof typeof statusColors] || statusColors.PENDING;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: isDragging ? 1 : 1.02 }}
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isDragging ? 'opacity-50 rotate-2' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {hasAvatar ? (
            <Avatar
              src={otherParty?.avatar}
              alt={displayName}
              size="md"
              className="w-10 h-10 flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 flex-shrink-0 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm leading-none">
                {displayName?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate leading-tight">
              {displayName}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate leading-tight mt-0.5">
              {booking.service.name}
            </p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onQuickAction) onQuickAction('menu');
          }}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
        >
          <EllipsisVerticalIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Date & Time */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
          <CalendarIcon className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
          <span className="font-medium leading-none">
            {format(new Date(booking.scheduledDate), 'MMM d, yyyy')}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
          <ClockIcon className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
          <span className="font-medium leading-none">{booking.scheduledTime}</span>
          {booking.service.duration && (
            <span className="text-gray-500 dark:text-gray-500 leading-none">
              ({booking.service.duration} min)
            </span>
          )}
        </div>
        {booking.location?.address && (
          <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
            <MapPinIcon className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
            <span className="truncate leading-none">{booking.location.address}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1.5">
          <CurrencyDollarIcon className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
          <span className="font-bold text-sm text-gray-900 dark:text-white leading-none">
            ${booking.totalPrice.toFixed(2)}
          </span>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border leading-none ${statusColor}`}>
          {booking.status.replace('_', ' ')}
        </span>
      </div>
    </motion.div>
  );
};

export const BookingCard = React.memo(BookingCardComponent, (prevProps, nextProps) => {
  // Only re-render if these props change
  return (
    prevProps.booking.id === nextProps.booking.id &&
    prevProps.booking.status === nextProps.booking.status &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.userRole === nextProps.userRole
  );
});
