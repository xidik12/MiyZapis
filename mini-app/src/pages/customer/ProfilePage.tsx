import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Settings,
  Heart,
  Star,
  Calendar,
  Award,
  Edit,
  Camera,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Wallet,
  MessageCircle,
  Users,
  LayoutDashboard,
  CreditCard,
  Gift,
  Briefcase,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { RootState, AppDispatch } from '@/store';
import { updateProfileAsync, logout } from '@/store/slices/authSlice';
import { fetchBookingsAsync } from '@/store/slices/bookingsSlice';
import { addToast } from '@/store/slices/uiSlice';
import { useLocale, t } from '@/hooks/useLocale';
import { profileStrings, commonStrings, serviceDetailStrings, specialistDashboardStrings, bookingFlowStrings } from '@/utils/translations';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { hapticFeedback, showAlert, showConfirm } = useTelegram();
  const locale = useLocale();

  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  const { bookings } = useSelector((state: RootState) => state.bookings);
  const isSpecialist = user?.role === 'specialist';

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });

  useEffect(() => {
    if (user) {
      dispatch(fetchBookingsAsync({ limit: 5 }));
    }
  }, [user, dispatch]);

  const handleEditProfile = () => {
    setShowEditProfile(true);
    hapticFeedback.impactLight();
  };

  const handleSaveProfile = async () => {
    try {
      await dispatch(updateProfileAsync(profileData)).unwrap();
      dispatch(addToast({
        type: 'success',
        title: t(commonStrings, 'success', locale),
        message: t(profileStrings, 'editProfile', locale),
      }));
      setShowEditProfile(false);
      hapticFeedback.notificationSuccess();
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        title: t(commonStrings, 'error', locale),
        message: t(commonStrings, 'retry', locale),
      }));
      hapticFeedback.notificationError();
    }
  };

  const handleLogout = async () => {
    const confirmed = await showConfirm(t(profileStrings, 'signOut', locale) + '?');
    if (confirmed) {
      dispatch(logout());
      hapticFeedback.impactMedium();
      navigate('/auth');
    }
  };

  const handleAvatarUpload = () => {
    // TODO: Implement avatar upload functionality
    hapticFeedback.impactLight();
    dispatch(addToast({
      type: 'info',
      title: t(commonStrings, 'comingSoon', locale),
      message: t(profileStrings, 'avatarUpload', locale),
    }));
  };

  const getCompletedBookingsCount = () => {
    return bookings.filter(booking => booking.status === 'completed').length;
  };

  const getAverageRating = () => {
    const completedWithReviews = bookings.filter(
      booking => booking.status === 'completed' && booking.review
    );
    if (completedWithReviews.length === 0) return 0;

    const totalRating = completedWithReviews.reduce(
      (sum, booking) => sum + (booking.review?.rating || 0), 0
    );
    return (totalRating / completedWithReviews.length).toFixed(1);
  };

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-primary">
        <Header title={t(profileStrings, 'profile', locale)} />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-bg-card rounded-2xl border border-white/5 shadow-card p-6 text-center max-w-sm w-full">
            <User size={36} className="mx-auto mb-3 text-text-muted" />
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              {locale === 'uk' ? 'Ви не увійшли' : locale === 'ru' ? 'Вы не вошли' : 'Not logged in'}
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              {locale === 'uk' ? 'Увійдіть, щоб бачити профіль' : locale === 'ru' ? 'Войдите, чтобы видеть профиль' : 'Sign in to view your profile'}
            </p>
            <Button onClick={() => navigate('/auth')}>
              {t(profileStrings, 'signOut', locale) === 'Sign Out' ? 'Sign In' : locale === 'uk' ? 'Увійти' : 'Войти'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header title={t(profileStrings, 'profile', locale)} />

      <div className="flex-1 overflow-y-auto pb-20 page-stagger">
        {/* Profile Header */}
        <div className="px-4 py-6 bg-gradient-to-b from-accent-primary to-accent-primary/80 text-white">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-white bg-opacity-20">
                <img
                  src={user.avatar || '/api/placeholder/80/80'}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={handleAvatarUpload}
                className="absolute bottom-0 right-0 w-6 h-6 bg-white bg-opacity-90 rounded-full flex items-center justify-center"
              >
                <Camera size={12} className="text-accent-primary" />
              </button>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold">
                {user.firstName} {user.lastName}
              </h1>
              <p className="opacity-80">{user.email}</p>
              {user.phone && (
                <p className="opacity-80 text-sm">{user.phone}</p>
              )}
            </div>
            <button
              onClick={handleEditProfile}
              className="p-2 bg-white bg-opacity-20 rounded-lg"
            >
              <Edit size={18} />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white border-opacity-20">
            <div className="text-center">
              <div className="text-lg font-bold">{bookings.length}</div>
              <div className="text-xs opacity-80">{t(profileStrings, 'totalBookings', locale)}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{getCompletedBookingsCount()}</div>
              <div className="text-xs opacity-80">{t(profileStrings, 'completedBookings', locale)}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{getAverageRating()}</div>
              <div className="text-xs opacity-80">{t(profileStrings, 'avgRating', locale)}</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-4">
          <h2 className="text-lg font-semibold text-text-primary mb-3">{t(profileStrings, 'quickActions', locale)}</h2>
          <div className="grid grid-cols-2 gap-3">
            <Card hover onClick={() => navigate('/bookings')}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-primary/10 rounded-lg flex items-center justify-center">
                  <Calendar size={20} className="text-accent-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-text-primary">{t(commonStrings, 'bookings', locale)}</h3>
                  <p className="text-xs text-text-secondary">{bookings.length} {t(profileStrings, 'totalBookings', locale).toLowerCase()}</p>
                </div>
              </div>
            </Card>

            <Card hover onClick={() => navigate('/wallet')}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-green/15 rounded-lg flex items-center justify-center">
                  <Wallet size={20} className="text-accent-green" />
                </div>
                <div>
                  <h3 className="font-medium text-text-primary">{t(profileStrings, 'wallet', locale)}</h3>
                  <p className="text-xs text-text-secondary">{t(profileStrings, 'balance', locale)}</p>
                </div>
              </div>
            </Card>

            <Card hover onClick={() => navigate('/favorites')}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-red/15 rounded-lg flex items-center justify-center">
                  <Heart size={20} className="text-accent-red" />
                </div>
                <div>
                  <h3 className="font-medium text-text-primary">{t(profileStrings, 'favorites', locale)}</h3>
                  <p className="text-xs text-text-secondary">{t(profileStrings, 'savedServices', locale)}</p>
                </div>
              </div>
            </Card>

            <Card hover onClick={() => navigate('/loyalty')}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-purple/15 rounded-lg flex items-center justify-center">
                  <Award size={20} className="text-accent-purple" />
                </div>
                <div>
                  <h3 className="font-medium text-text-primary">{t(profileStrings, 'rewards', locale)}</h3>
                  <p className="text-xs text-text-secondary">{t(profileStrings, 'loyaltyPoints', locale)}</p>
                </div>
              </div>
            </Card>

            <Card hover onClick={() => navigate('/reviews')}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-yellow/15 rounded-lg flex items-center justify-center">
                  <Star size={20} className="text-accent-yellow" />
                </div>
                <div>
                  <h3 className="font-medium text-text-primary">{t(serviceDetailStrings, 'reviews', locale)}</h3>
                  <p className="text-xs text-text-secondary">{t(profileStrings, 'myReviews', locale)}</p>
                </div>
              </div>
            </Card>

            <Card hover onClick={() => navigate('/community')}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Users size={20} className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-medium text-text-primary">{t(profileStrings, 'community', locale)}</h3>
                  <p className="text-xs text-text-secondary">{t(profileStrings, 'postsAndTips', locale)}</p>
                </div>
              </div>
            </Card>

            <Card hover onClick={() => navigate('/referrals')}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-500/15 rounded-lg flex items-center justify-center">
                  <Gift size={20} className="text-pink-500" />
                </div>
                <div>
                  <h3 className="font-medium text-text-primary">{locale === 'uk' ? 'Реферали' : locale === 'ru' ? 'Рефералы' : 'Referrals'}</h3>
                  <p className="text-xs text-text-secondary">{locale === 'uk' ? 'Запросіть друзів' : locale === 'ru' ? 'Пригласите друзей' : 'Invite friends'}</p>
                </div>
              </div>
            </Card>

            <Card hover onClick={() => navigate('/payment-methods')}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/15 rounded-lg flex items-center justify-center">
                  <CreditCard size={20} className="text-blue-500" />
                </div>
                <div>
                  <h3 className="font-medium text-text-primary">{locale === 'uk' ? 'Оплата' : locale === 'ru' ? 'Оплата' : 'Payment'}</h3>
                  <p className="text-xs text-text-secondary">{locale === 'uk' ? 'Методи оплати' : locale === 'ru' ? 'Методы оплаты' : 'Payment methods'}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Specialist Section */}
        {isSpecialist && (
          <div className="px-4 py-4">
            <h2 className="text-lg font-semibold text-text-primary mb-3">{locale === 'uk' ? 'Для спеціаліста' : locale === 'ru' ? 'Для специалиста' : 'Specialist'}</h2>
            <div className="grid grid-cols-2 gap-3">
              <Card hover onClick={() => navigate('/specialist-dashboard')}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent-primary/10 rounded-lg flex items-center justify-center">
                    <LayoutDashboard size={20} className="text-accent-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-text-primary">{locale === 'uk' ? 'Панель' : locale === 'ru' ? 'Панель' : 'Dashboard'}</h3>
                    <p className="text-xs text-text-secondary">{locale === 'uk' ? 'Ваш бізнес' : locale === 'ru' ? 'Ваш бизнес' : 'Your business'}</p>
                  </div>
                </div>
              </Card>

              <Card hover onClick={() => navigate('/specialist/settings')}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent-purple/15 rounded-lg flex items-center justify-center">
                    <Briefcase size={20} className="text-accent-purple" />
                  </div>
                  <div>
                    <h3 className="font-medium text-text-primary">{locale === 'uk' ? 'Налаштування' : locale === 'ru' ? 'Настройки' : 'Settings'}</h3>
                    <p className="text-xs text-text-secondary">{locale === 'uk' ? 'Бізнес профіль' : locale === 'ru' ? 'Бизнес профиль' : 'Business profile'}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Recent Bookings */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-text-primary">{t(profileStrings, 'recentBookings', locale)}</h2>
            <button
              onClick={() => navigate('/bookings')}
              className="text-accent-primary text-sm"
            >
              {t(commonStrings, 'viewAll', locale)}
            </button>
          </div>

          {bookings.length === 0 ? (
            <Card>
              <div className="text-center py-6">
                <Calendar size={32} className="text-text-secondary mx-auto mb-2" />
                <p className="text-text-secondary">{t(profileStrings, 'noBookingsYet', locale)}</p>
                <Button
                  size="sm"
                  onClick={() => navigate('/search')}
                  className="mt-3"
                >
                  {t(profileStrings, 'bookFirstService', locale)}
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {bookings.slice(0, 3).map((booking) => (
                <Card key={booking.id} hover>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-bg-hover">
                      <img
                        src={booking.specialist.avatar || '/api/placeholder/48/48'}
                        alt={booking.specialist.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-text-primary">{booking.service.name}</h3>
                      <p className="text-sm text-text-secondary">{booking.specialist.name}</p>
                      <p className="text-xs text-text-secondary">
                        {new Date(booking.startTime).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          booking.status === 'completed'
                            ? 'bg-accent-green/15 text-accent-green'
                            : booking.status === 'confirmed'
                            ? 'bg-accent-primary/10 text-accent-primary'
                            : booking.status === 'pending'
                            ? 'bg-accent-yellow/15 text-accent-yellow'
                            : 'bg-accent-red/15 text-accent-red'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="px-4 py-4">
          <h2 className="text-lg font-semibold text-text-primary mb-3">{t(profileStrings, 'settings', locale)}</h2>
          <div className="space-y-1">
            <Card hover onClick={() => { hapticFeedback.impactLight(); navigate('/settings'); }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings size={20} className="text-text-secondary" />
                  <span className="text-text-primary">{t(profileStrings, 'settings', locale)}</span>
                </div>
                <ChevronRight size={18} className="text-text-secondary" />
              </div>
            </Card>

            <Card hover onClick={() => { hapticFeedback.impactLight(); navigate('/notifications'); }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell size={20} className="text-text-secondary" />
                  <span className="text-text-primary">{locale === 'uk' ? 'Сповіщення' : locale === 'ru' ? 'Уведомления' : 'Notifications'}</span>
                </div>
                <ChevronRight size={18} className="text-text-secondary" />
              </div>
            </Card>

            <Card hover onClick={() => { hapticFeedback.impactLight(); navigate('/dashboard'); }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LayoutDashboard size={20} className="text-text-secondary" />
                  <span className="text-text-primary">{locale === 'uk' ? 'Дашборд' : locale === 'ru' ? 'Дашборд' : 'Dashboard'}</span>
                </div>
                <ChevronRight size={18} className="text-text-secondary" />
              </div>
            </Card>

            <Card hover onClick={() => { hapticFeedback.impactLight(); navigate('/help'); }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HelpCircle size={20} className="text-text-secondary" />
                  <span className="text-text-primary">{locale === 'uk' ? 'Допомога' : locale === 'ru' ? 'Помощь' : 'Help & Support'}</span>
                </div>
                <ChevronRight size={18} className="text-text-secondary" />
              </div>
            </Card>

            <Card hover onClick={handleLogout}>
              <div className="flex items-center gap-3">
                <LogOut size={20} className="text-accent-red" />
                <span className="text-accent-red">{t(profileStrings, 'signOut', locale)}</span>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Profile Sheet */}
      <Sheet
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        title={t(profileStrings, 'editProfile', locale)}
      >
        <div className="space-y-4">
          <Input
            label={t(bookingFlowStrings, 'firstName', locale)}
            value={profileData.firstName}
            onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
            icon={<User size={18} />}
            placeholder={t(bookingFlowStrings, 'firstName', locale)}
          />

          <Input
            label={t(bookingFlowStrings, 'lastName', locale)}
            value={profileData.lastName}
            onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
            icon={<User size={18} />}
            placeholder={t(bookingFlowStrings, 'lastName', locale)}
          />

          <Input
            label={t(bookingFlowStrings, 'phoneNumber', locale)}
            type="tel"
            value={profileData.phone}
            onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
            icon={<Phone size={18} />}
            placeholder={t(bookingFlowStrings, 'phoneNumber', locale)}
          />

          <Input
            label={t(bookingFlowStrings, 'email', locale)}
            type="email"
            value={profileData.email}
            onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
            icon={<Mail size={18} />}
            placeholder={t(bookingFlowStrings, 'email', locale)}
          />

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowEditProfile(false)}
              className="flex-1"
            >
              {t(commonStrings, 'cancel', locale)}
            </Button>
            <Button
              onClick={handleSaveProfile}
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? t(commonStrings, 'loading', locale) : t(commonStrings, 'saveChanges', locale)}
            </Button>
          </div>
        </div>
      </Sheet>

    </div>
  );
};
