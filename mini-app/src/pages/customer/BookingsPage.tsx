import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Calendar, Clock, MapPin, Phone, MessageCircle, X } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { RootState, AppDispatch } from '@/store';
import { fetchBookingsAsync, cancelBookingAsync } from '@/store/slices/bookingsSlice';
import { useLocale, t, formatCurrency } from '@/hooks/useLocale';
import { bookingsStrings, commonStrings } from '@/utils/translations';
import apiService from '@/services/api.service';
import { format, parseISO } from 'date-fns';

type BookingTab = 'upcoming' | 'past';

export const BookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const locale = useLocale();
  const { hapticFeedback } = useTelegram();

  const [activeTab, setActiveTab] = useState<BookingTab>('upcoming');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { bookings, isLoading, error } = useSelector((state: RootState) => state.bookings);

  useEffect(() => {
    dispatch(fetchBookingsAsync());
  }, [dispatch]);

  const s = (key: string) => t(bookingsStrings, key, locale);
  const c = (key: string) => t(commonStrings, key, locale);

  const now = new Date();
  const upcomingBookings = bookings.filter(
    (b) => b.status !== 'cancelled' && b.status !== 'completed' && new Date(b.scheduledAt) >= now
  );
  const pastBookings = bookings.filter(
    (b) => b.status === 'completed' || b.status === 'cancelled' || new Date(b.scheduledAt) < now
  );

  const displayBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm(s('confirmCancel'))) return;

    hapticFeedback.notificationOccurred('warning');
    setCancellingId(bookingId);

    try {
      await dispatch(cancelBookingAsync({ id: bookingId })).unwrap();
      alert(s('cancelled'));
      hapticFeedback.notificationOccurred('success');
    } catch (error) {
      alert(s('cancelFailed'));
      hapticFeedback.notificationOccurred('error');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header
        title={s('title')}
        showBack
        rightContent={
          <Button
            size="sm"
            onClick={() => {
              hapticFeedback.impactLight();
              navigate('/search');
            }}
          >
            {s('bookNew')}
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto pb-20">
        {/* Tabs */}
        <div className="sticky top-0 z-10 bg-bg-primary/95 backdrop-blur-lg border-b border-white/5">
          <div className="flex gap-2 p-4">
            <button
              onClick={() => {
                setActiveTab('upcoming');
                hapticFeedback.selectionChanged();
              }}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                activeTab === 'upcoming'
                  ? 'bg-accent-primary text-white shadow-glow-blue'
                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
              }`}
            >
              {s('upcoming')} ({upcomingBookings.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('past');
                hapticFeedback.selectionChanged();
              }}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                activeTab === 'past'
                  ? 'bg-accent-primary text-white shadow-glow-blue'
                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
              }`}
            >
              {s('past')} ({pastBookings.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 page-stagger">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-accent-red">{c('error')}</p>
              <p className="text-sm text-text-muted mt-2">{error}</p>
            </div>
          ) : displayBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto mb-4 text-text-muted" />
              <p className="text-text-secondary mb-2">
                {activeTab === 'upcoming' ? s('noUpcoming') : s('noPast')}
              </p>
              {activeTab === 'upcoming' && (
                <>
                  <p className="text-sm text-text-muted mb-4">{s('bookFirst')}</p>
                  <Button onClick={() => navigate('/search')}>
                    {s('bookNew')}
                  </Button>
                </>
              )}
            </div>
          ) : (
            displayBookings.map((booking) => (
              <Card
                key={booking.id}
                hover
                onClick={() => {
                  hapticFeedback.impactLight();
                  navigate(`/booking/${booking.id}`);
                }}
              >
                <div className="space-y-3">
                  {/* Header: Service name & status */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-text-primary">
                        {booking.service?.name || booking.serviceName || 'Service'}
                      </h3>
                      <p className="text-sm text-text-secondary">
                        {[booking.specialist?.firstName, booking.specialist?.lastName].filter(Boolean).join(' ') || ''}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      {c(booking.status)}
                    </span>
                  </div>

                  {/* Date & Time */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Calendar size={16} />
                      <span>{format(parseISO(booking.scheduledAt), 'PPP')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Clock size={16} />
                      <span>{format(parseISO(booking.scheduledAt), 'p')}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-lg font-bold text-accent-primary">
                      {formatCurrency(booking.totalAmount, undefined, locale)}
                    </span>
                    <span className="text-sm text-text-muted">
                      {booking.service?.duration || 0} {c('min')}
                    </span>
                  </div>

                  {/* Actions */}
                  {activeTab === 'upcoming' && booking.status !== 'cancelled' && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Navigate to booking detail for reschedule options
                          navigate(`/booking/${booking.id}`);
                        }}
                      >
                        {s('reschedule')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async (e) => {
                          e.stopPropagation();
                          hapticFeedback.impactLight();
                          try {
                            // Create or get conversation with specialist
                            const specialistUserId = booking.specialist?.userId || booking.specialist?.id;
                            if (specialistUserId) {
                              const conv = await apiService.createConversation(specialistUserId) as any;
                              const convId = conv?.id || conv?.conversationId;
                              if (convId) {
                                navigate(`/messages/${convId}`);
                                return;
                              }
                            }
                            // Fallback: navigate to messages list
                            navigate('/messages');
                          } catch {
                            navigate('/messages');
                          }
                        }}
                      >
                        <MessageCircle size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (booking.specialist?.phoneNumber) {
                            window.open(`tel:${booking.specialist.phoneNumber}`);
                          }
                        }}
                      >
                        <Phone size={16} />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelBooking(booking.id);
                        }}
                        disabled={cancellingId === booking.id}
                      >
                        {cancellingId === booking.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <X size={16} />
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Past booking actions */}
                  {activeTab === 'past' && booking.status === 'completed' && !booking.review && (
                    <div className="pt-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/booking/${booking.id}/review`);
                        }}
                      >
                        {s('leaveReview')}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
