import React, { useState, useEffect, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { selectUser, logout } from '../../store/slices/authSlice';
import { getAbsoluteImageUrl } from '../../utils/imageUrl';
import { NotificationBell } from '../notifications/NotificationBell';
import { Logo } from '@/components/ui/Logo';
import { MobileBottomNav } from './MobileBottomNav';
import { HouseIcon as HomeIcon, CalendarIcon, Cog6ToothIcon, StarIcon, HeartIcon, GiftIcon, ListIcon as Bars3Icon, SunIcon, MoonIcon, ChevronDownIcon, CreditCardIcon, MagnifyingGlassIcon, ArrowRightOnRectangleIcon, ChatBubbleLeftEllipsisIcon, UsersIcon, WalletIcon, ShareIcon, TrophyIcon, BuildingStorefrontIcon } from '@/components/icons';
// Note: Use active prop for filled icons: <Icon active />
;

interface CustomerLayoutProps {
  children: ReactNode;
}

interface SidebarNavItem {
  name: string;
  nameKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string; active?: boolean }>;
  count?: number;
  isNew?: boolean;
}

const navigation: SidebarNavItem[] = [
  {
    name: 'Dashboard',
    nameKey: 'customer.nav.dashboard',
    href: '/customer/dashboard',
    icon: HomeIcon,
  },
  {
    name: 'Find Services',
    nameKey: 'customer.nav.searchServices',
    href: '/search',
    icon: MagnifyingGlassIcon,
  },
  {
    name: 'Bookings',
    nameKey: 'customer.nav.bookings',
    href: '/customer/bookings',
    icon: CalendarIcon,
  },
  {
    name: 'My Orders',
    nameKey: 'customer.nav.orders',
    href: '/customer/orders',
    icon: BuildingStorefrontIcon,
  },
  {
    name: 'Favorites',
    nameKey: 'customer.nav.favorites',
    href: '/customer/favorites',
    icon: HeartIcon,
  },
  {
    name: 'Reviews',
    nameKey: 'customer.nav.reviews',
    href: '/customer/reviews',
    icon: StarIcon,
  },
  {
    name: 'Messages',
    nameKey: 'customer.nav.messages',
    href: '/customer/messages',
    icon: ChatBubbleLeftEllipsisIcon,
  },
  {
    name: 'Community',
    nameKey: 'customer.nav.community',
    href: '/community',
    icon: UsersIcon,
  },
  {
    name: 'Wallet',
    nameKey: 'customer.nav.wallet',
    href: '/customer/wallet',
    icon: WalletIcon,
  },
  {
    name: 'Payments',
    nameKey: 'customer.nav.payments',
    href: '/customer/payments',
    icon: CreditCardIcon,
  },
  {
    name: 'Loyalty Points',
    nameKey: 'customer.nav.loyalty',
    href: '/customer/loyalty',
    icon: GiftIcon,
  },
  {
    name: 'Badges',
    nameKey: 'customer.nav.badges',
    href: '/customer/badges',
    icon: TrophyIcon,
  },
  {
    name: 'Referrals',
    nameKey: 'customer.nav.referrals',
    href: '/customer/referrals',
    icon: ShareIcon,
  },
  {
    name: 'Settings',
    nameKey: 'customer.nav.settings',
    href: '/customer/settings',
    icon: Cog6ToothIcon,
  },
];

const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const { t } = useLanguage();
  const user = useAppSelector(selectUser);
  const location = useLocation();

  // Check if mobile view
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const isCurrentPath = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      navigate('/');
    } catch (error) {
      // Silently handle any logout errors - client-side logout always succeeds
      // Navigate anyway since tokens are cleared regardless
      navigate('/');
    }
  };

  const currencyOptions = [
    { value: 'UAH', label: 'Гривня (₴)', flag: '🇺🇦' },
    { value: 'USD', label: 'Dollar ($)', flag: '🇺🇸' },
    { value: 'EUR', label: 'Euro (€)', flag: '🇪🇺' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop sidebar (hidden on mobile — mobile uses the bottom nav) */}
      <aside className={`
        hidden lg:flex
        fixed inset-y-0 left-0 z-50 flex-col
        ${isCollapsed ? 'w-16' : 'w-72'}
        translate-x-0
        transition-all duration-300 ease-in-out
        bg-white dark:bg-gray-900 border-r border-gray-200/20 dark:border-gray-700/20
        shadow-xl lg:shadow-none
      `}>
        {/* Logo section */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <img src="/miyzapis-logo-full.png" alt="MiyZapis" className="h-8 w-auto" />
            </div>
          )}
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex w-10 h-10 items-center justify-center rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition duration-200 cursor-pointer hover:shadow-sm active:scale-[0.96]"
          >
            <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* User profile section */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            {user?.avatar ? (
              <img
                src={getAbsoluteImageUrl(user.avatar)}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-10 h-10 rounded-full object-cover ring-1 ring-inset ring-black/10 dark:ring-white/10"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              </div>
            )}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {t('customer.customerLabel')}
                </p>
                <div className="flex items-center mt-1">
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                    ● {t('customer.online')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = isCurrentPath(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  group relative flex items-center px-3 py-2 text-sm rounded-lg transition-colors duration-150 cursor-pointer
                  ${isActive
                    ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 font-semibold'
                    : 'text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100/70 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'
                  }
                  ${isCollapsed ? 'justify-center' : 'justify-between'}
                `}
              >
                {isActive && !isCollapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary-600 dark:bg-primary-400" />
                )}
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} active={isActive} />
                  {!isCollapsed && (
                    <span>{t(item.nameKey)}</span>
                  )}
                </div>

                {!isCollapsed && (item.count || item.isNew) && (
                  <div className="flex items-center space-x-1">
                    {item.count && (
                      <span className={`
                        inline-flex items-center justify-center px-1.5 min-w-[1.25rem] py-0.5 text-xs font-semibold rounded-md tabular-nums
                        ${isActive
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        }
                      `}>
                        {item.count}
                      </span>
                    )}
                    {item.isNew && (
                      <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom controls */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
          {/* Theme toggle (larger touch target on mobile) */}
          <button
            onClick={toggleTheme}
            className={`
              flex items-center w-full px-3 ${isCollapsed ? 'py-2.5 min-h-10 h-10' : 'py-2'} text-sm font-medium rounded-lg transition-colors duration-150 cursor-pointer
              text-gray-600 dark:text-gray-400 hover:bg-gray-100/70 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white mobile-touch-target
              ${isCollapsed ? 'justify-center' : 'justify-start space-x-3'}
            `}
            aria-label={theme === 'dark' ? t('theme.light') : t('theme.dark')}
          >
            {theme === 'dark' ? (
              <SunIcon className="w-5 h-5" />
            ) : (
              <MoonIcon className="w-5 h-5" />
            )}
            {!isCollapsed && (
              <span>{theme === 'dark' ? t('theme.light') : t('theme.dark')}</span>
            )}
          </button>

          {/* Currency selector */}
          {!isCollapsed && (
            <div className="relative">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none"
              >
                {currencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.flag} {option.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-3 top-2.5 w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
            </div>
          )}

          {/* Logout button (larger touch target on mobile) */}
          <button
            onClick={handleLogout}
            className={`
              flex items-center w-full px-3 ${isCollapsed ? 'py-2.5 min-h-10 h-10' : 'py-2'} text-sm font-medium rounded-lg transition-colors duration-150 cursor-pointer
              text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 mobile-touch-target
              ${isCollapsed ? 'justify-center' : 'justify-start space-x-3'}
            `}
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            {!isCollapsed && (
              <span>{t('auth.logout')}</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={`flex-1 min-w-0 flex flex-col overflow-hidden ${isCollapsed ? 'lg:ml-16' : 'lg:ml-72'} transition-all duration-300`}>
        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6">
          {/* Mobile brand (sidebar is hidden on mobile; bottom nav handles navigation) */}
          <Link to="/" className="flex items-center space-x-2 lg:hidden">
            <Logo size="sm" />
            <span className="text-base font-bold text-gray-900 dark:text-white">МійЗапис</span>
          </Link>
          <div className="hidden lg:block" />

          <div className="flex items-center space-x-4">
            {/* Notifications — Settings lives in the nav menu, so it's not duplicated here */}
            <NotificationBell />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 min-w-0 overflow-auto bg-gray-50 dark:bg-gray-900 pb-32 lg:pb-0">
          <div key={location.pathname} className="page-enter min-w-0 px-1 sm:px-2">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <MobileBottomNav />
    </div>
  );
};

export default CustomerLayout;
