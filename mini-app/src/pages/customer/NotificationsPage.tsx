import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, Calendar, CreditCard, Star, Settings, Trash2, CheckCheck, Info } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { RootState, AppDispatch } from '@/store';
import {
  fetchNotificationsAsync,
  markNotificationReadAsync,
  markAllNotificationsReadAsync,
  deleteNotificationAsync,
  setFilter,
} from '@/store/slices/notificationsSlice';
import { useLocale, t } from '@/hooks/useLocale';
import { notificationsStrings, commonStrings } from '@/utils/translations';

type FilterType = 'all' | 'unread' | 'bookings' | 'system';

const getNotificationIcon = (type: string) => {
  if (type.includes('BOOKING')) return <Calendar size={18} className="text-accent-primary" />;
  if (type.includes('PAYMENT')) return <CreditCard size={18} className="text-accent-green" />;
  if (type.includes('REVIEW')) return <Star size={18} className="text-accent-yellow" />;
  if (type.includes('SYSTEM')) return <Settings size={18} className="text-blue-400" />;
  return <Bell size={18} className="text-accent-primary" />;
};

const formatTimeAgo = (dateStr: string, locale: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return locale === 'uk' ? 'Щойно' : locale === 'ru' ? 'Только что' : 'Just now';
  if (diffMin < 60) return `${diffMin}${locale === 'uk' ? 'хв' : locale === 'ru' ? 'мин' : 'm'}`;
  if (diffHrs < 24) return `${diffHrs}${locale === 'uk' ? 'г' : locale === 'ru' ? 'ч' : 'h'}`;
  if (diffDays < 7) return `${diffDays}${locale === 'uk' ? 'д' : locale === 'ru' ? 'д' : 'd'}`;
  return date.toLocaleDateString(locale === 'uk' ? 'uk-UA' : locale === 'ru' ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric' });
};

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const locale = useLocale();
  const { hapticFeedback } = useTelegram();

  const { notifications, unreadCount, isLoading, error, filter } = useSelector(
    (state: RootState) => state.notifications
  );

  const s = (key: string) => t(notificationsStrings, key, locale);
  const c = (key: string) => t(commonStrings, key, locale);

  useEffect(() => {
    dispatch(fetchNotificationsAsync());
  }, [dispatch]);

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: s('all') },
    { key: 'unread', label: s('unread') },
    { key: 'bookings', label: s('bookingsFilter') },
    { key: 'system', label: s('systemFilter') },
  ];

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'bookings') return n.type.includes('BOOKING');
    if (filter === 'system') return n.type.includes('SYSTEM') || n.type.includes('PROMOTION');
    return true;
  });

  const handleMarkRead = (id: string) => {
    hapticFeedback.impactLight();
    dispatch(markNotificationReadAsync(id));
  };

  const handleMarkAllRead = () => {
    hapticFeedback.notificationOccurred('success');
    dispatch(markAllNotificationsReadAsync());
  };

  const handleDelete = (id: string) => {
    hapticFeedback.impactLight();
    dispatch(deleteNotificationAsync(id));
  };

  const handleNotificationTap = (notif: Record<string, unknown>) => {
    hapticFeedback.impactLight();
    if (!notif.isRead) {
      dispatch(markNotificationReadAsync(notif.id));
    }

    // Navigate based on notification type/data
    if (notif.data?.actionUrl) {
      navigate(notif.data.actionUrl);
      return;
    }
    if (notif.data?.bookingId) {
      navigate(`/bookings`);
      return;
    }
    if (notif.type.includes('PAYMENT')) {
      navigate('/wallet');
      return;
    }
    if (notif.type.includes('REVIEW')) {
      navigate('/reviews');
      return;
    }
    if (notif.type.includes('BOOKING')) {
      navigate('/bookings');
      return;
    }
    if (notif.type.includes('MESSAGE')) {
      navigate('/messages');
      return;
    }
    if (notif.type.includes('COMMUNITY')) {
      navigate('/community');
      return;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header
        title={s('title')}
        showBack
        rightContent={
          unreadCount > 0 ? (
            <button
              onClick={handleMarkAllRead}
              className="text-accent-primary text-sm font-medium"
            >
              <CheckCheck size={18} />
            </button>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-y-auto pb-20">
        {/* Filter Pills */}
        <div className="px-4 py-3 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => {
                  dispatch(setFilter(f.key));
                  hapticFeedback.selectionChanged();
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  filter === f.key
                    ? 'bg-accent-primary text-white'
                    : 'bg-bg-secondary text-text-secondary'
                }`}
              >
                {f.label}
                {f.key === 'unread' && unreadCount > 0 && (
                  <span className="ml-1.5 bg-white/20 px-1.5 rounded-full">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-4 space-y-2 page-stagger">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-accent-red">{c('error')}</p>
              <p className="text-sm text-text-muted mt-2">{error}</p>
              <Button size="sm" className="mt-4" onClick={() => dispatch(fetchNotificationsAsync())}>
                {c('retry')}
              </Button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell size={48} className="mx-auto mb-4 text-text-muted" />
              <p className="text-text-secondary mb-2">{s('noNotifications')}</p>
              <p className="text-sm text-text-muted">{s('allCaughtUp')}</p>
            </div>
          ) : (
            filteredNotifications.map(notif => (
              <div
                key={notif.id}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  notif.isRead
                    ? 'bg-bg-card/40 border-white/5'
                    : 'bg-bg-card/80 border-accent-primary/20 shadow-sm'
                }`}
                onClick={() => handleNotificationTap(notif)}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  notif.isRead ? 'bg-bg-secondary' : 'bg-accent-primary/10'
                }`}>
                  {getNotificationIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium truncate ${
                      notif.isRead ? 'text-text-secondary' : 'text-text-primary'
                    }`}>
                      {notif.title}
                    </p>
                    <span className="text-[10px] text-text-muted whitespace-nowrap flex-shrink-0">
                      {formatTimeAgo(notif.createdAt, locale)}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{notif.message}</p>
                </div>

                {!notif.isRead && (
                  <div className="w-2 h-2 rounded-full bg-accent-primary flex-shrink-0 mt-2" />
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(notif.id);
                  }}
                  className="text-text-muted hover:text-accent-red transition-colors flex-shrink-0 p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
