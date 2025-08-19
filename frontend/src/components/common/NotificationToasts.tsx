import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { selectNotifications, markAsRead } from '@/store/slices/notificationSlice';
import { toast } from 'react-toastify';

export const NotificationToasts: React.FC = () => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);

  useEffect(() => {
    // Show toast notifications for new unread notifications
    const unreadNotifications = notifications.filter(n => !n.isRead);
    const recentNotifications = unreadNotifications.filter(n => {
      const notificationTime = new Date(n.createdAt).getTime();
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      return notificationTime > fiveMinutesAgo;
    });

    recentNotifications.forEach(notification => {
      const toastType = notification.type.includes('failed') || notification.type.includes('error') 
        ? 'error' 
        : notification.type.includes('success') || notification.type.includes('completed') || notification.type.includes('confirmed')
        ? 'success'
        : 'info';

      toast[toastType](notification.message, {
        toastId: notification.id, // Prevent duplicate toasts
        onClose: () => {
          dispatch(markAsRead(notification.id));
        },
      });
    });
  }, [notifications, dispatch]);

  return null; // This component doesn't render anything visible
};