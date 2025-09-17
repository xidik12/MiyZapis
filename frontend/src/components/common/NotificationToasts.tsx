import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { selectNotifications, markAsRead } from '@/store/slices/notificationSlice';
import { toast } from 'react-toastify';

export const NotificationToasts: React.FC = () => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);
  const [liveMessage, setLiveMessage] = useState('');

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

      // Update aria-live region for screen readers
      setLiveMessage(notification.message);
    });
  }, [notifications, dispatch]);

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only" role="status">
      {liveMessage}
    </div>
  );
};
