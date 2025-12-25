/**
 * Notification Bell Component
 * Shows notification count and opens notification center
 */

import React, { useState, useEffect, useRef } from 'react';
import { BellIcon } from '@/components/icons';
import { notificationService } from '../../services/notification.service';
import NotificationCenter from './NotificationCenter';

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load unread count
  const loadUnreadCount = async () => {
    try {
      const result = await notificationService.getUnreadCount();
      setUnreadCount(result.unreadCount);
    } catch (error) {
      console.error('Error loading unread count:', error);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Load count on mount and periodically
  useEffect(() => {
    loadUnreadCount();
    
    // Refresh count every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Listen for notification changes
  useEffect(() => {
    const unsubscribe = notificationService.addListener(() => {
      loadUnreadCount();
    });
    // Also listen to global updates from NotificationCenter (mark-all, delete-all)
    const onGlobalUpdate = (e: any) => {
      const detail = e?.detail || {};
      if (typeof detail.unreadCount === 'number') {
        setUnreadCount(detail.unreadCount);
        return;
      }
      if (typeof detail.delta === 'number') {
        setUnreadCount((prev) => Math.max(0, prev + detail.delta));
        return;
      }
      // Fallback: pull fresh count
      loadUnreadCount();
    };
    window.addEventListener('notifications:update', onGlobalUpdate as any);

    return () => {
      unsubscribe();
      window.removeEventListener('notifications:update', onGlobalUpdate as any);
    };
  }, []);

  const handleClick = () => {
    setIsOpen(true);
    // Refresh count when opening
    loadUnreadCount();
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleClick}
        className={`relative p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full transition-colors ${className}`}
        title="Notifications"
        aria-label="Open notifications"
      >
        <BellIcon className="h-6 w-6" />
        
        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* Loading indicator */}
        {loading && (
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-gray-400 rounded-full animate-pulse" />
        )}
      </button>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={isOpen}
        onClose={() => { setIsOpen(false); btnRef.current?.focus(); }}
      />
    </>
  );
};

export default NotificationBell;
