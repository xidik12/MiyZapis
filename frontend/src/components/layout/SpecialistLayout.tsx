import React, { useState, useEffect, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { selectUser, logout } from '../../store/slices/authSlice';
import { isFeatureEnabled } from '../../config/features';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { getAbsoluteImageUrl } from '../../utils/imageUrl';
import { NotificationBell } from '../notifications/NotificationBell';
import {
  ChartBarIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  StarIcon,
  UserIcon,
  BriefcaseIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  ChevronDownIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  PresentationChartLineIcon,
  GiftIcon,
} from '@/components/icons';

interface SpecialistLayoutProps {
  children: ReactNode;
}

interface SidebarNavItem {
  name: string;
  nameUk: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconActive: React.ComponentType<{ className?: string }>;
  count?: number;
  isNew?: boolean;
}

const navigation: SidebarNavItem[] = [
  {
    name: 'Dashboard',
    nameUk: 'Панель керування',
    href: '/specialist/dashboard',
    icon: HomeIcon,
    iconActive: HomeIcon,
  },
  {
    name: 'Find Services',
    nameUk: 'Пошук послуг',
    href: '/search',
    icon: MagnifyingGlassIcon,
    iconActive: MagnifyingGlassIcon,
  },
  {
    name: 'Bookings',
    nameUk: 'Бронювання',
    href: '/specialist/bookings',
    icon: CalendarIcon,
    iconActive: CalendarIcon,
  },
  {
    name: 'Services',
    nameUk: 'Послуги',
    href: '/specialist/services',
    icon: BriefcaseIcon,
    iconActive: BriefcaseIcon,
  },
  {
    name: 'Schedule',
    nameUk: 'Розклад',
    href: '/specialist/schedule',
    icon: ClipboardDocumentListIcon,
    iconActive: ClipboardDocumentListIcon,
  },
  {
    name: 'Analytics',
    nameUk: 'Аналітика',
    href: '/specialist/analytics',
    icon: PresentationChartLineIcon,
    iconActive: PresentationChartLineIcon,
  },
  {
    name: 'Earnings',
    nameUk: 'Заробіток',
    href: '/specialist/earnings',
    icon: CreditCardIcon,
    iconActive: CreditCardIcon,
  },
  {
    name: 'Finances',
    nameUk: 'Фінанси',
    href: '/specialist/finances',
    icon: ChartBarIcon,
    iconActive: ChartBarIcon,
  },
  {
    name: 'Reviews',
    nameUk: 'Відгуки',
    href: '/specialist/reviews',
    icon: StarIcon,
    iconActive: StarIcon,
  },
  {
    name: 'Loyalty',
    nameUk: 'Лояльність',
    href: '/specialist/loyalty',
    icon: GiftIcon,
    iconActive: GiftIcon,
  },
  {
    name: 'Messages',
    nameUk: 'Повідомлення',
    href: '/specialist/messages',
    icon: ChatBubbleLeftRightIcon,
    iconActive: ChatBubbleLeftRightIcon,
  },
  {
    name: 'Profile',
    nameUk: 'Профіль',
    href: '/specialist/profile',
    icon: UserIcon,
    iconActive: UserIcon,
  },
  {
    name: 'Notifications',
    nameUk: 'Сповіщення',
    href: '/specialist/notifications',
    icon: BellIcon,
    iconActive: BellIcon,
  },
];

const SpecialistLayout: React.FC<SpecialistLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency, getCurrencySymbol } = useCurrency();
  const { t } = useLanguage();
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();
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

  // Notifications are now handled by the NotificationBell component

  const isCurrentPath = (path: string) => location.pathname === path;

  const handleLogout = () => {
    dispatch(logout());
  };

  const currencyOptions = [
    { value: 'USD', label: t('currency.usd'), flag: '🇺🇸' },
    { value: 'KHR', label: t('currency.khr'), flag: '🇰🇭' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col
        ${isCollapsed ? 'w-16' : 'w-72'}
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        transition-all duration-300 ease-in-out
        bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        backdrop-blur-xl bg-opacity-95 dark:bg-opacity-95
      `}>
        {/* Logo section */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          {!isCollapsed && (
            <Link 
              to="/" 
              className="flex items-center space-x-2 group hover:opacity-90 transition-all duration-300"
              onClick={() => {
                // Force navigate to home page and scroll to top
                window.scrollTo(0, 0);
              }}
            >
              <div className="w-8 h-8 bg-primary-600 text-white rounded-lg flex items-center justify-center text-sm font-bold group-hover:scale-110 transition-all duration-300">
                P
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors duration-300">
                Panhaha
              </span>
              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                Pro
              </span>
            </Link>
          )}
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* User profile section */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            {user?.avatar ? (
              <img
                src={getAbsoluteImageUrl(user.avatar)}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
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
                  {t('user.specialist')}
                </p>
                <div className="flex items-center mt-1">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {t('user.online')}
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
            const Icon = isActive ? item.iconActive : item.icon;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200
                  ${isActive
                    ? 'bg-primary-600 text-white shadow-primary'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                  ${isCollapsed ? 'justify-center' : 'justify-between'}
                `}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                  {!isCollapsed && (
                    <span>{t(`dashboard.nav.${item.name.toLowerCase()}`)}</span>
                  )}
                </div>
                
                {!isCollapsed && (item.count || item.isNew) && (
                  <div className="flex items-center space-x-1">
                    {item.count && (
                      <span className={`
                        inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full
                        ${isActive 
                          ? 'bg-white text-primary-600' 
                          : 'bg-primary-100 text-primary-700'
                        }
                      `}>
                        {item.count}
                      </span>
                    )}
                    {item.isNew && (
                      <span className="w-2 h-2 bg-red-400 rounded-full"></span>
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
              flex items-center w-full px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200
              text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 mobile-touch-target
              ${isCollapsed ? 'justify-center' : 'justify-start space-x-3'}
            `}
            aria-label={theme === 'dark' ? t('theme.light') : t('theme.dark')}
          >
            {theme === 'dark' ? (
              <SunIcon className="w-7 h-7 sm:w-6 sm:h-6" />
            ) : (
              <MoonIcon className="w-7 h-7 sm:w-6 sm:h-6" />
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
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none"
              >
                {currencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.flag} {option.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          )}

          {/* Logout button (larger touch target on mobile) */}
          <button
            onClick={handleLogout}
            className={`
              flex items-center w-full px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200
              text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 mobile-touch-target
              ${isCollapsed ? 'justify-center' : 'justify-start space-x-3'}
            `}
          >
            <ArrowRightOnRectangleIcon className="w-7 h-7 sm:w-6 sm:h-6" />
            {!isCollapsed && <span>{t('auth.logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={`flex-1 flex flex-col ${isCollapsed ? 'lg:ml-16' : 'lg:ml-72'} transition-all duration-300`}>
        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-3 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Bars3Icon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <NotificationBell />

            {/* Settings */}
            <Link 
              to="/specialist/settings"
              className="p-3 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Cog6ToothIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SpecialistLayout;
