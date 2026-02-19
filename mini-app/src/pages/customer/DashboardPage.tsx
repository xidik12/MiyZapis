import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Calendar, DollarSign, Star, Gift, Clock, Search, Heart, MessageCircle,
  Bell, User, Settings, HelpCircle, Wallet, Users,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { RootState, AppDispatch } from '@/store';
import { fetchBookingsAsync } from '@/store/slices/bookingsSlice';
import { useLocale, t, formatCurrency } from '@/hooks/useLocale';
import { customerDashboardStrings, commonStrings } from '@/utils/translations';
import apiService from '@/services/api.service';
import { format, parseISO } from 'date-fns';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const locale = useLocale();
  const { hapticFeedback } = useTelegram();

  const { user } = useSelector((state: RootState) => state.auth);
  const { bookings, isLoading, error } = useSelector((state: RootState) => state.bookings);

  const [stats, setStats] = useState({ totalBookings: 0, totalSpent: 0, avgRating: 0, loyaltyPoints: 0 });

  const s = (key: string) => t(customerDashboardStrings, key, locale);
  const c = (key: string) => t(commonStrings, key, locale);

  useEffect(() => {
    dispatch(fetchBookingsAsync());
    loadStats();
  }, [dispatch]);

  const loadStats = async () => {
    try {
      const [loyalty] = await Promise.all([
        apiService.getLoyaltyStatus().catch(() => ({ points: 0 })),
      ]);
      setStats(prev => ({ ...prev, loyaltyPoints: (loyalty as any)?.points || 0 }));
    } catch { /* ignore */ }
  };

  useEffect(() => {
    const completed = bookings.filter(b => b.status === 'completed');
    const totalSpent = completed.reduce((sum, b) => sum + b.totalAmount, 0);
    const withReview = bookings.filter(b => b.review);
    const avgRating = withReview.length > 0
      ? withReview.reduce((sum, b) => sum + (b.review?.rating || 0), 0) / withReview.length
      : 0;

    setStats(prev => ({
      ...prev,
      totalBookings: bookings.length,
      totalSpent: Math.round(totalSpent),
      avgRating: Math.round(avgRating * 10) / 10,
    }));
  }, [bookings]);

  const nextBooking = bookings
    .filter(b => (b.status === 'confirmed' || b.status === 'pending') && new Date(b.scheduledAt) > new Date())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];

  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    .slice(0, 3);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-accent-green/15 text-accent-green border-accent-green/20';
      case 'pending': return 'bg-accent-yellow/15 text-accent-yellow border-accent-yellow/20';
      case 'completed': return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
      case 'cancelled': return 'bg-accent-red/15 text-accent-red border-accent-red/20';
      default: return 'bg-bg-hover text-text-secondary border-white/5';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary pb-20">
        <div className="p-4 space-y-6">
          <div className="h-8 w-48 bg-bg-card rounded-lg animate-pulse mx-auto" />
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-bg-card rounded-2xl border border-white/5 p-4 animate-pulse h-24" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-primary">
        <Header title={s('title')} />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-bg-card rounded-2xl border border-white/5 shadow-card p-6 text-center max-w-sm w-full">
            <Calendar size={36} className="mx-auto mb-3 text-accent-red" />
            <h2 className="text-lg font-semibold text-text-primary mb-2">{c('error')}</h2>
            <p className="text-sm text-text-secondary mb-4">{typeof error === 'string' ? error : c('retry')}</p>
            <Button onClick={() => dispatch(fetchBookingsAsync())}>{c('retry')}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header title={s('title')} />

      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-4 space-y-5 page-stagger">
          {/* Welcome */}
          <div className="text-center mb-2">
            <h1 className="text-xl font-bold text-text-primary">
              {s('welcome')}, {user?.firstName || 'User'}!
            </h1>
            <p className="text-sm text-text-secondary">{s('subtitle')}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-4 text-center">
              <Calendar size={18} className="mx-auto mb-1.5 text-accent-primary" />
              <div className="text-xl font-bold text-text-primary">{stats.totalBookings}</div>
              <div className="text-xs text-text-secondary">{s('totalBookings')}</div>
            </Card>
            <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-4 text-center">
              <DollarSign size={18} className="mx-auto mb-1.5 text-accent-green" />
              <div className="text-xl font-bold text-text-primary">{formatCurrency(stats.totalSpent, undefined, locale)}</div>
              <div className="text-xs text-text-secondary">{s('totalSpent')}</div>
            </Card>
            <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-4 text-center">
              <Star size={18} className="mx-auto mb-1.5 text-accent-yellow" />
              <div className="text-xl font-bold text-text-primary">{stats.avgRating || '—'}</div>
              <div className="text-xs text-text-secondary">{s('avgRating')}</div>
            </Card>
            <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-4 text-center">
              <Gift size={18} className="mx-auto mb-1.5 text-accent-purple" />
              <div className="text-xl font-bold text-text-primary">{stats.loyaltyPoints}</div>
              <div className="text-xs text-text-secondary">{s('loyaltyPoints')}</div>
            </Card>
          </div>

          {/* Next Appointment */}
          {nextBooking && (
            <Card
              hover
              className="bg-gradient-to-r from-accent-primary/10 to-accent-primary/5 border-accent-primary/20"
              onClick={() => { hapticFeedback.impactLight(); navigate('/bookings'); }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-accent-primary" />
                <span className="text-sm font-medium text-accent-primary">{s('nextAppointment')}</span>
              </div>
              <p className="font-semibold text-text-primary">{nextBooking.service?.name || nextBooking.serviceName || c('service')}</p>
              <p className="text-sm text-text-secondary">{[nextBooking.specialist?.firstName, nextBooking.specialist?.lastName].filter(Boolean).join(' ') || ''}</p>
              <p className="text-sm text-text-muted mt-1">
                {format(parseISO(nextBooking.scheduledAt), 'PPP')} {c('at')} {format(parseISO(nextBooking.scheduledAt), 'p')}
              </p>
            </Card>
          )}

          {/* Recent Bookings */}
          <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-text-primary">{s('recentBookings')}</h3>
              <Button variant="ghost" size="sm" onClick={() => { hapticFeedback.impactLight(); navigate('/bookings'); }}>
                {c('viewAll')}
              </Button>
            </div>
            {recentBookings.length === 0 ? (
              <div className="text-center py-6">
                <Calendar size={36} className="mx-auto mb-2 text-text-muted" />
                <p className="text-sm text-text-secondary">{s('noBookings')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentBookings.map(b => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-3 bg-bg-secondary/50 rounded-xl cursor-pointer hover:bg-bg-hover/50 transition-all"
                    onClick={() => { hapticFeedback.impactLight(); navigate('/bookings'); }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{b.service?.name || b.serviceName || c('service')}</p>
                      <p className="text-xs text-text-muted">{format(parseISO(b.scheduledAt), 'PPP')}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(b.status)}`}>
                      {c(b.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Feature Grid */}
          <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-4">
            <h3 className="font-semibold text-text-primary mb-3">{s('quickActions')}</h3>
            <div className="grid grid-cols-4 gap-2">
              {([
                { icon: <Search size={20} />, label: s('search'), path: '/search', color: 'text-accent-primary' },
                { icon: <Calendar size={20} />, label: s('bookings'), path: '/bookings', color: 'text-blue-400' },
                { icon: <Heart size={20} />, label: s('favorites'), path: '/favorites', color: 'text-pink-400' },
                { icon: <Wallet size={20} />, label: s('payments'), path: '/wallet', color: 'text-teal-400' },
                { icon: <MessageCircle size={20} />, label: s('messages'), path: '/messages', color: 'text-blue-400' },
                { icon: <Bell size={20} />, label: s('alerts'), path: '/notifications', color: 'text-accent-red' },
                { icon: <Star size={20} />, label: s('reviews'), path: '/reviews', color: 'text-accent-yellow' },
                { icon: <Gift size={20} />, label: s('rewards'), path: '/loyalty', color: 'text-accent-purple' },
                { icon: <Users size={20} />, label: s('community'), path: '/community', color: 'text-orange-400' },
                { icon: <Gift size={20} />, label: s('referrals'), path: '/referrals', color: 'text-teal-400' },
                { icon: <User size={20} />, label: s('profile'), path: '/profile', color: 'text-accent-primary' },
                { icon: <Settings size={20} />, label: s('settings'), path: '/settings', color: 'text-text-secondary' },
                { icon: <HelpCircle size={20} />, label: s('help'), path: '/help', color: 'text-accent-yellow' },
              ] as const).map((item) => (
                <button
                  key={item.path}
                  onClick={() => { hapticFeedback.impactLight(); navigate(item.path); }}
                  className="bg-bg-card rounded-xl border border-white/5 p-3 flex flex-col items-center gap-1.5 hover:bg-bg-hover/50 active:scale-95 transition-all"
                >
                  <span className={item.color}>{item.icon}</span>
                  <span className="text-[10px] font-medium text-text-secondary text-center leading-tight">{item.label}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
