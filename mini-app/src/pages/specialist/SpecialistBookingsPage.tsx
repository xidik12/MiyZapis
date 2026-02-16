import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  DollarSign,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Sheet } from '@/components/ui/Sheet';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { RootState, AppDispatch } from '@/store';
import { fetchBookingsAsync } from '@/store/slices/bookingsSlice';
import { addToast } from '@/store/slices/uiSlice';
import apiService from '@/services/api.service';
import { useLocale, t, formatCurrency } from '@/hooks/useLocale';
import { specialistBookingsStrings, commonStrings } from '@/utils/translations';
import { format, parseISO, isToday } from 'date-fns';

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

export const SpecialistBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const locale = useLocale();
  const { hapticFeedback } = useTelegram();

  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [showRejectSheet, setShowRejectSheet] = useState(false);
  const [rejectingBookingId, setRejectingBookingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { bookings, isLoading, error } = useSelector((state: RootState) => state.bookings);

  const s = useCallback((key: string) => t(specialistBookingsStrings, key, locale), [locale]);
  const c = useCallback((key: string) => t(commonStrings, key, locale), [locale]);

  useEffect(() => {
    dispatch(fetchBookingsAsync({ userType: 'specialist' }));
  }, [dispatch]);

  // Stats
  const stats = useMemo(() => {
    const pendingCount = bookings.filter(b => b.status === 'pending').length;
    const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
    const todayCount = bookings.filter(b => {
      try {
        return isToday(parseISO(b.scheduledAt));
      } catch {
        return false;
      }
    }).length;
    return { pendingCount, confirmedCount, todayCount };
  }, [bookings]);

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    const filtered = activeFilter === 'all'
      ? bookings
      : bookings.filter(b => b.status === activeFilter);
    return [...filtered].sort(
      (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
    );
  }, [bookings, activeFilter]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-accent-green/15 text-accent-green border-accent-green/20';
      case 'pending':
        return 'bg-accent-yellow/15 text-accent-yellow border-accent-yellow/20';
      case 'completed':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
      case 'cancelled':
        return 'bg-accent-red/15 text-accent-red border-accent-red/20';
      default:
        return 'bg-bg-hover text-text-secondary border-white/5';
    }
  };

  const handleAccept = async (bookingId: string) => {
    hapticFeedback.impactLight();
    setActionLoading(bookingId);
    try {
      await apiService.confirmBooking(bookingId);
      dispatch(addToast({
        type: 'success',
        title: c('success'),
        message: s('accepted'),
      }));
      hapticFeedback.notificationSuccess();
      dispatch(fetchBookingsAsync({ userType: 'specialist' }));
    } catch {
      dispatch(addToast({
        type: 'error',
        title: c('error'),
        message: s('actionFailed'),
      }));
      hapticFeedback.notificationError();
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenRejectSheet = (bookingId: string) => {
    hapticFeedback.impactLight();
    setRejectingBookingId(bookingId);
    setRejectReason('');
    setShowRejectSheet(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectingBookingId) return;

    setActionLoading(rejectingBookingId);
    try {
      await apiService.rejectBooking(rejectingBookingId, rejectReason);
      dispatch(addToast({
        type: 'success',
        title: c('success'),
        message: s('rejected'),
      }));
      hapticFeedback.notificationSuccess();
      setShowRejectSheet(false);
      setRejectingBookingId(null);
      setRejectReason('');
      dispatch(fetchBookingsAsync({ userType: 'specialist' }));
    } catch {
      dispatch(addToast({
        type: 'error',
        title: c('error'),
        message: s('actionFailed'),
      }));
      hapticFeedback.notificationError();
    } finally {
      setActionLoading(null);
    }
  };

  const filterTabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: s('all') },
    { key: 'pending', label: s('pendingTab') },
    { key: 'confirmed', label: s('confirmedTab') },
    { key: 'completed', label: s('completedTab') },
    { key: 'cancelled', label: s('cancelledTab') },
  ];

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-primary">
        <Header title={s('title')} showBackButton />
        <div className="flex-1 p-4 space-y-4">
          {/* Stats skeleton */}
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-bg-card/80 rounded-2xl border border-white/5 p-4 animate-pulse">
                <div className="h-6 w-8 bg-bg-secondary rounded mb-1 mx-auto" />
                <div className="h-3 w-16 bg-bg-secondary rounded mx-auto" />
              </div>
            ))}
          </div>
          {/* Tabs skeleton */}
          <div className="flex gap-2 overflow-x-auto">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 w-24 bg-bg-card rounded-xl animate-pulse flex-shrink-0" />
            ))}
          </div>
          {/* Cards skeleton */}
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-bg-card/80 rounded-2xl border border-white/5 p-4 animate-pulse">
              <div className="h-5 w-40 bg-bg-secondary rounded mb-3" />
              <div className="h-4 w-32 bg-bg-secondary rounded mb-2" />
              <div className="h-4 w-48 bg-bg-secondary rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-primary">
        <Header title={s('title')} showBackButton />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle size={48} className="mx-auto mb-3 text-accent-red" />
            <p className="text-accent-red mb-2">{c('error')}</p>
            <p className="text-sm text-text-muted mb-4">{error}</p>
            <Button onClick={() => dispatch(fetchBookingsAsync({ userType: 'specialist' }))}>
              {c('retry')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header title={s('title')} showBackButton />

      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-4 space-y-4 page-stagger">
          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-3 text-center">
              <div className="text-xl font-bold text-accent-yellow">{stats.pendingCount}</div>
              <div className="text-xs text-text-secondary">{s('pendingCount')}</div>
            </Card>
            <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-3 text-center">
              <div className="text-xl font-bold text-accent-green">{stats.confirmedCount}</div>
              <div className="text-xs text-text-secondary">{s('confirmedCount')}</div>
            </Card>
            <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-3 text-center">
              <div className="text-xl font-bold text-accent-primary">{stats.todayCount}</div>
              <div className="text-xs text-text-secondary">{s('totalToday')}</div>
            </Card>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveFilter(tab.key);
                  hapticFeedback.selectionChanged();
                }}
                className={`flex-shrink-0 py-2.5 px-4 rounded-xl font-medium text-sm transition-all ${
                  activeFilter === tab.key
                    ? 'bg-accent-primary text-white shadow-glow-blue'
                    : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Bookings List */}
          {filteredBookings.length === 0 ? (
            <div className="text-center py-16">
              <Calendar size={48} className="mx-auto mb-4 text-text-muted" />
              <p className="text-text-secondary font-medium">{s('noBookings')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBookings.map((booking) => (
                <Card
                  key={booking.id}
                  className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card"
                >
                  <div className="p-4 space-y-3">
                    {/* Top row: customer + status */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
                          <User size={18} className="text-accent-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-text-primary truncate">
                            {booking.customer?.firstName} {booking.customer?.lastName}
                          </h3>
                          <p className="text-sm text-text-secondary truncate">
                            {booking.service?.name || booking.serviceName}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${getStatusColor(booking.status)}`}
                      >
                        {c(booking.status)}
                      </span>
                    </div>

                    {/* Date, time, amount */}
                    <div className="flex items-center flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <Calendar size={14} />
                        <span>{format(parseISO(booking.scheduledAt), 'PPP')}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <Clock size={14} />
                        <span>{format(parseISO(booking.scheduledAt), 'p')}</span>
                      </div>
                      <div className="flex items-center gap-1.5 ml-auto">
                        <DollarSign size={14} className="text-accent-primary" />
                        <span className="font-semibold text-accent-primary">
                          {formatCurrency(booking.totalAmount, undefined, locale)}
                        </span>
                      </div>
                    </div>

                    {/* Actions for pending bookings */}
                    {booking.status === 'pending' && (
                      <div className="flex gap-3 pt-2 border-t border-white/5">
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1"
                          disabled={actionLoading === booking.id}
                          loading={actionLoading === booking.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAccept(booking.id);
                          }}
                        >
                          <CheckCircle size={16} className="mr-1.5" />
                          {s('accept')}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                          disabled={actionLoading === booking.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenRejectSheet(booking.id);
                          }}
                        >
                          <XCircle size={16} className="mr-1.5" />
                          {s('reject')}
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reject Reason Sheet */}
      <Sheet
        isOpen={showRejectSheet}
        onClose={() => {
          setShowRejectSheet(false);
          setRejectingBookingId(null);
          setRejectReason('');
        }}
        title={s('rejectReason')}
      >
        <div className="space-y-4">
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            className="input-telegram w-full rounded-xl text-sm resize-none"
            placeholder={s('rejectReasonPlaceholder')}
          />

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowRejectSheet(false);
                setRejectingBookingId(null);
                setRejectReason('');
              }}
              className="flex-1"
            >
              {c('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              className="flex-1"
              disabled={actionLoading !== null}
              loading={actionLoading !== null}
            >
              {s('confirmReject')}
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
};
