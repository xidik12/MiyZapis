import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Search,
  MapPin,
  Star,
  Clock,
  TrendingUp,
  Calendar,
  Heart,
  Filter,
  Wallet,
  Award,
  Users,
  Briefcase,
  Bell,
  MessageCircle,
  Gift,
  User,
  LayoutDashboard,
  Settings,
  HelpCircle,
  CreditCard,
  BarChart3,
  CalendarClock,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { RootState, AppDispatch } from '@/store';
import { fetchServicesAsync, fetchCategoriesAsync } from '@/store/slices/servicesSlice';
import { fetchSpecialistsAsync } from '@/store/slices/specialistsSlice';
import { processCategories, homeStrings, getCategoryInfo } from '@/utils/categories';
import { useLocale, t } from '@/hooks/useLocale';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const locale = useLocale();
  const { user, isAuthenticated, hapticFeedback } = useTelegram();
  const [searchQuery, setSearchQuery] = useState('');

  const { services, categories: apiCategories, isLoading, categoriesLoading } = useSelector(
    (state: RootState) => state.services
  );
  const { specialists, isLoading: specialistsLoading } = useSelector(
    (state: RootState) => state.specialists
  );
  const { isAuthenticated: authState, user: authUser } = useSelector((state: RootState) => state.auth);
  const userRole = authUser?.role;
  const notifUnread = useSelector((state: RootState) => state.notifications?.unreadCount ?? 0);

  useEffect(() => {
    dispatch(fetchCategoriesAsync());
    dispatch(fetchServicesAsync({ limit: 6, sort: 'popular' }));
    dispatch(fetchSpecialistsAsync({ limit: 4 }));
  }, [dispatch]);

  const s = (key: string) => t(homeStrings, key, locale);

  // Process categories through registry for proper names/icons/colors
  const displayCategories = processCategories(apiCategories as any[], locale);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/search');
    }
    hapticFeedback.impactLight();
  };

  const handleCategoryPress = (category: any) => {
    navigate(`/search?category=${encodeURIComponent(category.id)}`);
    hapticFeedback.selectionChanged();
  };

  const handleServicePress = (service: any) => {
    navigate(`/service/${service.id}`);
    hapticFeedback.impactLight();
  };

  const handleSpecialistPress = (specialist: any) => {
    navigate(`/specialist/${specialist.id}`);
    hapticFeedback.impactLight();
  };

  const handleBookNowPress = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated && !authState) {
      navigate('/auth');
    } else {
      navigate('/booking');
    }
    hapticFeedback.impactMedium();
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header
        title={user ? `${s('hi')}, ${user.firstName}!` : s('welcome')}
        subtitle={s('findService')}
        rightContent={
          <div className="flex items-center gap-1">
            {(isAuthenticated || authState) && (
              <button
                onClick={() => { hapticFeedback.impactLight(); navigate('/notifications'); }}
                className="relative p-2 touch-manipulation"
              >
                <Bell size={20} className="text-text-secondary" />
                {notifUnread > 0 && (
                  <span className="absolute top-1 right-1 bg-accent-red text-white text-[8px] font-bold min-w-[14px] h-3.5 rounded-full flex items-center justify-center px-0.5">
                    {notifUnread > 99 ? '99+' : notifUnread}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => navigate('/search')}
              className="p-2 touch-manipulation"
            >
              <Filter size={20} className="text-text-secondary" />
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto pb-20 page-stagger">
        {/* Search Bar */}
        <div className="px-4 py-3 bg-bg-card">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder={s('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search size={18} />}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} size="md">
              <Search size={18} />
            </Button>
          </div>
        </div>

        {/* Welcome banner for unauthenticated users */}
        {!isAuthenticated && !authState && (
          <div className="mx-4 mt-3 rounded-2xl overflow-hidden bg-gradient-to-br from-[#3b97f2] via-[#2563eb] to-[#1d4ed8] p-5 text-white shadow-lg">
            <h2 className="text-xl font-bold mb-1">{s('welcomeTitle') || 'Welcome to MiyZapis'}</h2>
            <p className="text-blue-100 text-sm mb-3">{s('welcomeSubtitle') || 'Book appointments with top specialists near you'}</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { hapticFeedback.impactMedium(); navigate('/auth'); }}
                className="w-full bg-white text-[#3b97f2] font-semibold py-2.5 px-4 rounded-xl text-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <User size={16} />
                {s('signIn') || 'Sign In / Register'}
              </button>
              <p className="text-blue-200 text-[11px] text-center">{s('welcomeHint') || 'Sign in to book, track, and manage appointments'}</p>
            </div>
          </div>
        )}

        {/* Dashboard Grid — BTC Seer style */}
        <div className="px-4 py-3 space-y-3">
            {/* My Services */}
            <div>
              <h3 className="text-accent-yellow text-[10px] font-semibold uppercase tracking-wider mb-1.5 px-1">{s('catMyServices')}</h3>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { icon: <Calendar size={18} />, label: s('bookings'), path: '/bookings', color: 'text-accent-primary' },
                  { icon: <Search size={18} />, label: s('explore'), path: '/search', color: 'text-blue-400' },
                  { icon: <Heart size={18} />, label: s('favorites'), path: '/favorites', color: 'text-accent-red' },
                  { icon: <Wallet size={18} />, label: s('wallet'), path: '/wallet', color: 'text-accent-green' },
                  { icon: <Award size={18} />, label: s('loyalty'), path: '/loyalty', color: 'text-purple-400' },
                  { icon: <Star size={18} />, label: s('reviews'), path: '/reviews', color: 'text-accent-yellow' },
                  { icon: <CreditCard size={18} />, label: s('payments'), path: '/payment-methods', color: 'text-sky-400' },
                  { icon: <LayoutDashboard size={18} />, label: s('dashboard'), path: '/dashboard', color: 'text-indigo-400' },
                ].map(item => (
                  <button
                    key={item.path}
                    onClick={() => { hapticFeedback.selectionChanged(); navigate(item.path); }}
                    className="bg-bg-card rounded-xl border border-white/5 p-3 flex flex-col items-center gap-1.5 hover:border-accent-primary/25 active:scale-95 transition-all"
                  >
                    <span className={`w-5 h-5 ${item.color}`}>{item.icon}</span>
                    <span className="text-[10px] text-text-secondary font-medium leading-tight text-center">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Social */}
            <div>
              <h3 className="text-accent-yellow text-[10px] font-semibold uppercase tracking-wider mb-1.5 px-1">{s('catSocial')}</h3>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { icon: <Users size={18} />, label: s('community'), path: '/community', color: 'text-indigo-400' },
                  { icon: <MessageCircle size={18} />, label: s('messages'), path: '/messages', color: 'text-blue-400' },
                  { icon: <Bell size={18} />, label: s('notifications'), path: '/notifications', color: 'text-amber-400' },
                  { icon: <Gift size={18} />, label: s('referrals'), path: '/referrals', color: 'text-pink-400' },
                ].map(item => (
                  <button
                    key={item.path}
                    onClick={() => { hapticFeedback.selectionChanged(); navigate(item.path); }}
                    className="bg-bg-card rounded-xl border border-white/5 p-3 flex flex-col items-center gap-1.5 hover:border-accent-primary/25 active:scale-95 transition-all"
                  >
                    <span className={`w-5 h-5 ${item.color}`}>{item.icon}</span>
                    <span className="text-[10px] text-text-secondary font-medium leading-tight text-center">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Account */}
            <div>
              <h3 className="text-accent-yellow text-[10px] font-semibold uppercase tracking-wider mb-1.5 px-1">{s('catAccount')}</h3>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { icon: <User size={18} />, label: s('profile'), path: '/profile', color: 'text-accent-primary' },
                  { icon: <Settings size={18} />, label: s('settings'), path: '/settings', color: 'text-gray-400' },
                  { icon: <HelpCircle size={18} />, label: s('help'), path: '/help', color: 'text-cyan-400' },
                ].map(item => (
                  <button
                    key={item.path}
                    onClick={() => { hapticFeedback.selectionChanged(); navigate(item.path); }}
                    className="bg-bg-card rounded-xl border border-white/5 p-3 flex flex-col items-center gap-1.5 hover:border-accent-primary/25 active:scale-95 transition-all"
                  >
                    <span className={`w-5 h-5 ${item.color}`}>{item.icon}</span>
                    <span className="text-[10px] text-text-secondary font-medium leading-tight text-center">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Specialist Business — only if specialist */}
            {userRole === 'specialist' && (
              <div>
                <h3 className="text-accent-yellow text-[10px] font-semibold uppercase tracking-wider mb-1.5 px-1">{s('catSpecialist')}</h3>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { icon: <LayoutDashboard size={18} />, label: s('specDashboard'), path: '/specialist-dashboard', color: 'text-accent-primary' },
                    { icon: <Calendar size={18} />, label: s('specBookings'), path: '/specialist-bookings', color: 'text-blue-400' },
                    { icon: <CalendarClock size={18} />, label: s('specSchedule'), path: '/specialist/schedule', color: 'text-orange-400' },
                    { icon: <DollarSign size={18} />, label: s('specEarnings'), path: '/specialist/earnings', color: 'text-accent-green' },
                    { icon: <BarChart3 size={18} />, label: s('specAnalytics'), path: '/specialist/analytics', color: 'text-purple-400' },
                    { icon: <Star size={18} />, label: s('specReviews'), path: '/specialist/reviews', color: 'text-accent-yellow' },
                    { icon: <UserCheck size={18} />, label: s('specClients'), path: '/specialist/clients', color: 'text-pink-400' },
                    { icon: <Briefcase size={18} />, label: s('specSettings'), path: '/specialist/settings', color: 'text-gray-400' },
                  ].map(item => (
                    <button
                      key={item.path}
                      onClick={() => { hapticFeedback.selectionChanged(); navigate(item.path); }}
                      className="bg-bg-card rounded-xl border border-white/5 p-3 flex flex-col items-center gap-1.5 hover:border-accent-primary/25 active:scale-95 transition-all"
                    >
                      <span className={`w-5 h-5 ${item.color}`}>{item.icon}</span>
                      <span className="text-[10px] text-text-secondary font-medium leading-tight text-center">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* Categories */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">{s('categories')}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/categories')}
            >
              {s('viewAll')}
            </Button>
          </div>

          {categoriesLoading ? (
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-bg-card rounded-2xl border border-white/5 p-4 text-center animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-bg-hover mx-auto mb-2" />
                  <div className="h-3 w-16 bg-bg-hover rounded mx-auto mb-1" />
                  <div className="h-2 w-10 bg-bg-hover rounded mx-auto" />
                </div>
              ))}
            </div>
          ) : displayCategories.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {displayCategories.slice(0, 6).map((category) => (
                <Card
                  key={category.id}
                  hover
                  onClick={() => handleCategoryPress(category)}
                  className="text-center"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 text-xl"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    {category.icon}
                  </div>
                  <h3 className="font-medium text-sm text-text-primary mb-1 line-clamp-1">
                    {category.name}
                  </h3>
                  <p className="text-xs text-text-secondary">
                    {category.count} {s('services')}
                  </p>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-bg-card rounded-2xl border border-white/5 p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-bg-hover flex items-center justify-center mx-auto mb-3">
                <Briefcase size={24} className="text-text-muted" />
              </div>
              <p className="text-sm text-text-secondary">{s('noCategories')}</p>
              <p className="text-xs text-text-muted mt-1">{s('beFirstSpecialist')}</p>
            </div>
          )}
        </div>

        {/* Popular Services */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-accent-primary" />
              <h2 className="text-lg font-semibold text-text-primary">{s('popularServices')}</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/search?sort=popular')}
            >
              {s('viewAll')}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {[1, 2].map((i) => (
                <div key={i} className="min-w-[280px] flex-shrink-0 bg-bg-card rounded-2xl border border-white/5 p-4 animate-pulse">
                  <div className="aspect-video bg-bg-hover rounded-2xl mb-3" />
                  <div className="h-4 w-40 bg-bg-hover rounded mb-2" />
                  <div className="h-3 w-24 bg-bg-hover rounded mb-3" />
                  <div className="flex justify-between">
                    <div className="h-5 w-16 bg-bg-hover rounded" />
                    <div className="h-8 w-20 bg-bg-hover rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : services.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {services.map((service: any) => (
                <Card
                  key={service.id}
                  hover
                  onClick={() => handleServicePress(service)}
                  className="min-w-[280px] flex-shrink-0"
                >
                  <div className="aspect-video bg-bg-hover rounded-2xl mb-3 overflow-hidden">
                    {service.images?.[0] ? (
                      <img
                        src={service.images[0]}
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl">{getCategoryInfo(service.category).icon}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div>
                      <h3 className="font-semibold text-text-primary line-clamp-1">{service.name}</h3>
                      <p className="text-sm text-text-secondary line-clamp-1">
                        {service.specialist?.user
                          ? `${service.specialist.user.firstName} ${service.specialist.user.lastName}`.trim()
                          : service.specialist?.name || service.specialist}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-accent-yellow fill-current" />
                        <span className="text-sm font-medium text-text-primary">
                          {service.specialist?.rating || 0}
                        </span>
                        <span className="text-sm text-text-secondary">
                          ({service.specialist?.reviewCount || 0})
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} className="text-text-secondary" />
                        <span className="text-sm text-text-secondary">{service.duration}{s('min')}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-accent-primary">
                        {service.price} {service.currency || 'UAH'}
                      </span>
                      <Button size="sm" onClick={handleBookNowPress}>
                        {s('bookNow')}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-bg-card rounded-2xl border border-white/5 p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-bg-hover flex items-center justify-center mx-auto mb-3">
                <TrendingUp size={24} className="text-text-muted" />
              </div>
              <p className="text-sm text-text-secondary">{s('noServices')}</p>
            </div>
          )}
        </div>

        {/* Nearby Specialists */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-accent-primary" />
              <h2 className="text-lg font-semibold text-text-primary">{s('nearbySpecialists')}</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/search?nearby=true')}
            >
              {s('viewAll')}
            </Button>
          </div>

          {specialistsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-bg-card rounded-2xl border border-white/5 p-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-bg-hover" />
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-bg-hover rounded mb-2" />
                      <div className="h-3 w-24 bg-bg-hover rounded mb-2" />
                      <div className="h-3 w-40 bg-bg-hover rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : specialists.length > 0 ? (
            <div className="space-y-3">
              {specialists.map((specialist: any) => (
                <Card
                  key={specialist.id}
                  hover
                  onClick={() => handleSpecialistPress(specialist)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-bg-hover">
                        {specialist.avatar ? (
                          <img
                            src={specialist.avatar}
                            alt={specialist.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-text-muted text-lg font-semibold">
                            {(specialist.name || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      {specialist.isOnline && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-accent-green rounded-full border-2 border-bg-card" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text-primary truncate">{specialist.name}</h3>
                      <p className="text-sm text-text-secondary truncate">
                        {specialist.businessName || specialist.city || ''}
                      </p>

                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-accent-yellow fill-current" />
                          <span className="text-sm font-medium text-text-primary">{specialist.rating || 0}</span>
                        </div>
                        {specialist.city && (
                          <span className="text-sm text-text-secondary">• {specialist.city}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-bg-card rounded-2xl border border-white/5 p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-bg-hover flex items-center justify-center mx-auto mb-3">
                <MapPin size={24} className="text-text-muted" />
              </div>
              <p className="text-sm text-text-secondary">{s('noSpecialists')}</p>
            </div>
          )}
        </div>

        {/* CTA Section */}
        {!isAuthenticated && !authState && (
          <div className="px-4 py-6 mx-4 my-4 bg-gradient-to-r from-accent-primary to-purple-600 rounded-2xl text-white">
            <h3 className="text-xl font-bold mb-2">{s('readyToStart')}</h3>
            <p className="text-teal-100 mb-4">
              {s('signUpOffer')}
            </p>
            <Button
              variant="secondary"
              onClick={() => navigate('/auth')}
              className="bg-bg-card text-accent-primary hover:bg-bg-hover"
            >
              {s('getStarted')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
