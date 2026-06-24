import React, { useState, useEffect, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { selectUser, logout } from '../../store/slices/authSlice';
import { Logo } from '@/components/ui/Logo';
import { getAbsoluteImageUrl } from '../../utils/imageUrl';
import { NotificationBell } from '../notifications/NotificationBell';
import { MobileTabBar, TabItem, TabSection } from './MobileTabBar';
import { ChartBarIcon, CalendarIcon, ClipboardDocumentListIcon, Cog6ToothIcon, CreditCardIcon, StarIcon, BriefcaseIcon, ListIcon as Bars3Icon, SunIcon, MoonIcon, ChevronDownIcon, BellIcon, ChatBubbleLeftRightIcon, MagnifyingGlassIcon, ArrowRightOnRectangleIcon, HouseIcon as HomeIcon, PresentationChartLineIcon, GiftIcon, UsersIcon, ShareIcon, BuildingOfficeIcon, CurrencyDollarIcon, UserIcon, ArchiveBoxIcon, BuildingStorefrontIcon, WalletIcon, SparklesIcon, RocketLaunchIcon, FunnelIcon, CheckCircleIcon, UserPlusIcon, UserGroupIcon, CalendarDaysIcon, GlobeIcon, InboxIcon, TrophyIcon, ArrowPathIcon } from '@/components/icons';
// Note: Use active prop for filled icons: <Icon active />
;

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
    icon: CalendarDaysIcon,
    iconActive: CalendarDaysIcon,
  },
  {
    name: 'Analytics',
    nameUk: 'Аналітика',
    href: '/specialist/analytics',
    icon: PresentationChartLineIcon,
    iconActive: PresentationChartLineIcon,
  },
  {
    name: 'Clients',
    nameUk: 'Клієнти',
    href: '/specialist/clients',
    icon: UsersIcon,
    iconActive: UsersIcon,
  },
  {
    name: 'Segments & Campaigns',
    nameUk: 'Сегменти та кампанії',
    href: '/specialist/segments',
    icon: FunnelIcon,
    iconActive: FunnelIcon,
  },
  {
    name: 'Tasks',
    nameUk: 'Завдання',
    href: '/specialist/tasks',
    icon: CheckCircleIcon,
    iconActive: CheckCircleIcon,
  },
  {
    name: 'Leads',
    nameUk: 'Ліди',
    href: '/specialist/leads',
    icon: UserPlusIcon,
    iconActive: UserPlusIcon,
  },
  {
    name: 'Community',
    nameUk: 'Спільнота',
    href: '/community',
    icon: GlobeIcon,
    iconActive: GlobeIcon,
  },
  {
    name: 'Earnings',
    nameUk: 'Заробіток',
    href: '/specialist/earnings',
    icon: CurrencyDollarIcon,
    iconActive: CurrencyDollarIcon,
  },
  {
    name: 'Finances',
    nameUk: 'Фінанси',
    href: '/specialist/finances',
    icon: ChartBarIcon,
    iconActive: ChartBarIcon,
  },
  {
    name: 'Inventory',
    nameUk: 'Склад',
    href: '/specialist/inventory',
    icon: ArchiveBoxIcon,
    iconActive: ArchiveBoxIcon,
  },
  {
    name: 'POS',
    nameUk: 'Каса',
    href: '/specialist/pos',
    icon: BuildingStorefrontIcon,
    iconActive: BuildingStorefrontIcon,
  },
  {
    name: 'Sales',
    nameUk: 'Продажі',
    href: '/specialist/sales',
    icon: GiftIcon,
    iconActive: GiftIcon,
  },
  {
    name: 'Marketing',
    nameUk: 'Маркетинг',
    href: '/specialist/marketing',
    icon: SparklesIcon,
    iconActive: SparklesIcon,
  },
  {
    name: 'Promote',
    nameUk: 'Просування',
    href: '/specialist/promote',
    icon: RocketLaunchIcon,
    iconActive: RocketLaunchIcon,
  },
  {
    name: 'Purchasing',
    nameUk: 'Закупівлі',
    href: '/specialist/purchasing',
    icon: InboxIcon,
    iconActive: InboxIcon,
  },
  {
    name: 'Payroll',
    nameUk: 'Зарплата',
    href: '/specialist/payroll',
    icon: WalletIcon,
    iconActive: WalletIcon,
  },
  {
    name: 'Team',
    nameUk: 'Команда',
    href: '/specialist/team',
    icon: UserGroupIcon,
    iconActive: UserGroupIcon,
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
    icon: TrophyIcon,
    iconActive: TrophyIcon,
  },
  {
    name: 'Referrals',
    nameUk: 'Реферали',
    href: '/specialist/referrals',
    icon: ShareIcon,
    iconActive: ShareIcon,
  },
  {
    name: 'Messages',
    nameUk: 'Повідомлення',
    href: '/specialist/messages',
    icon: ChatBubbleLeftRightIcon,
    iconActive: ChatBubbleLeftRightIcon,
  },
  {
    name: 'Notifications',
    nameUk: 'Сповіщення',
    href: '/specialist/notifications',
    icon: BellIcon,
    iconActive: BellIcon,
  },
  {
    name: 'Billing',
    nameUk: 'Підписка',
    href: '/specialist/billing',
    icon: CreditCardIcon,
    iconActive: CreditCardIcon,
  },
  {
    name: 'Settings',
    nameUk: 'Налаштування',
    href: '/specialist/settings',
    icon: Cog6ToothIcon,
    iconActive: Cog6ToothIcon,
  },
];

// Sidebar nav grouped into collapsible categories. Keyed by item.name so the
// flat `navigation` array above remains the single source of truth.
const NAV_GROUP_OF: Record<string, string> = {
  Dashboard: 'pinned', Bookings: 'pinned',
  'Find Services': 'work', Services: 'work', Clients: 'work', Tasks: 'work', Schedule: 'work', Analytics: 'work',
  Earnings: 'finance', Finances: 'finance', Inventory: 'finance', POS: 'finance', Purchasing: 'finance', Payroll: 'finance', Sales: 'finance', Team: 'finance',
  'Segments & Campaigns': 'growth', Leads: 'growth', Marketing: 'growth', Promote: 'growth', Loyalty: 'growth', Referrals: 'growth', Reviews: 'growth',
  Community: 'account',
};
const SIDEBAR_GROUPS: { key: string; titleKey: string; fallback: string }[] = [
  { key: 'work', titleKey: 'nav.section.work', fallback: 'Work' },
  { key: 'finance', titleKey: 'nav.section.finance', fallback: 'Finance' },
  { key: 'growth', titleKey: 'nav.section.growth', fallback: 'Growth' },
  { key: 'account', titleKey: 'nav.section.account', fallback: 'Account' },
];
const groupOf = (name: string): string => NAV_GROUP_OF[name] || 'account';
// Labels that don't follow `dashboard.nav.<name.toLowerCase()>`.
const NAV_LABEL_OVERRIDE: Record<string, string> = {
  'Segments & Campaigns': 'dashboard.nav.segments',
};
const labelKeyOf = (name: string): string =>
  NAV_LABEL_OVERRIDE[name] || `dashboard.nav.${name.toLowerCase()}`;

const SpecialistLayout: React.FC<SpecialistLayoutProps> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();
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

  // Collapsible sidebar categories (persisted; the active route's group stays open).
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('spec_nav_open_groups');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return { work: true, finance: false, growth: false, account: false };
  });
  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem('spec_nav_open_groups', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  useEffect(() => {
    const active = navigation.find((i) => location.pathname === i.href);
    const g = active ? groupOf(active.name) : null;
    if (g && g !== 'pinned') setOpenGroups((prev) => (prev[g] ? prev : { ...prev, [g]: true }));
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
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
            <Link 
              to="/" 
              className="flex items-center space-x-2 group hover:opacity-90 transition-all duration-300"
              onClick={() => {
                // Force navigate to home page and scroll to top
                window.scrollTo(0, 0);
              }}
            >
              <Logo size="md" className="group-hover:scale-105 transition-all duration-300" />
              <span className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors duration-300">
                МійЗапис
              </span>
              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                Pro
              </span>
            </Link>
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
                  {t('user.specialist')}
                </p>
                <div className="flex items-center mt-1">
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                    {t('user.online')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {(() => {
            const renderItem = (item: SidebarNavItem) => {
              const isActive = isCurrentPath(item.href);
              const Icon = isActive ? item.iconActive : item.icon;
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
                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                    {!isCollapsed && <span>{t(labelKeyOf(item.name)) || item.name}</span>}
                  </div>
                  {!isCollapsed && (item.count || item.isNew) && (
                    <div className="flex items-center space-x-1">
                      {item.count && (
                        <span className={`inline-flex items-center justify-center px-1.5 min-w-[1.25rem] py-0.5 text-xs font-semibold rounded-md tabular-nums ${isActive ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                          {item.count}
                        </span>
                      )}
                      {item.isNew && <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span>}
                    </div>
                  )}
                </Link>
              );
            };

            const pinned = navigation.filter((i) => groupOf(i.name) === 'pinned');
            return (
              <>
                {pinned.map(renderItem)}
                {SIDEBAR_GROUPS.map((g) => {
                  const items = navigation.filter((i) => groupOf(i.name) === g.key);
                  if (items.length === 0) return null;
                  // Icon-rail mode: drop headers, just separate groups with a divider.
                  if (isCollapsed) {
                    return (
                      <div key={g.key} className="mt-1 pt-1 border-t border-gray-100 dark:border-gray-700/60 space-y-1">
                        {items.map(renderItem)}
                      </div>
                    );
                  }
                  const open = openGroups[g.key] !== false;
                  return (
                    <div key={g.key} className="pt-2">
                      <button
                        type="button"
                        onClick={() => toggleGroup(g.key)}
                        aria-expanded={open}
                        className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition cursor-pointer rounded-lg active:scale-[0.96]"
                      >
                        <span>{t(g.titleKey) || g.fallback}</span>
                        <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
                      </button>
                      {open && <div className="mt-1 space-y-1">{items.map(renderItem)}</div>}
                    </div>
                  );
                })}
              </>
            );
          })()}
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
            {!isCollapsed && <span>{t('auth.logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={`flex-1 min-w-0 flex flex-col ${isCollapsed ? 'lg:ml-16' : 'lg:ml-72'} transition-all duration-300`}>
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

      {/* Mobile bottom tab bar for specialists */}
      <SpecialistMobileBottomNav />
    </div>
  );
};

// Specialist-specific mobile bottom navigation
// Bottom nav has 5 slots: 4 primary destinations + a "More" button that
// opens a sheet listing every secondary destination (including the new
// Accounting / Calendar sync / Businesses pages).
const specialistBottomNavItems: TabItem[] = [
  { nameKey: 'nav.tab.dashboard', fallback: 'Home', href: '/specialist/dashboard', icon: HomeIcon },
  { nameKey: 'nav.tab.bookings', fallback: 'Bookings', href: '/specialist/bookings', icon: CalendarIcon },
  { nameKey: 'nav.tab.schedule', fallback: 'Schedule', href: '/specialist/schedule', icon: CalendarDaysIcon },
  { nameKey: 'nav.tab.messages', fallback: 'Chat', href: '/specialist/messages', icon: ChatBubbleLeftRightIcon },
];

// Secondary destinations, grouped into labelled sections for the menu sheet.
const specialistSections: TabSection[] = [
  { title: 'nav.section.work', items: [
    { nameKey: 'dashboard.nav.find services', fallback: 'Find Services', href: '/search', icon: MagnifyingGlassIcon },
    { nameKey: 'dashboard.nav.services', fallback: 'Services', href: '/specialist/services', icon: BriefcaseIcon },
    { nameKey: 'dashboard.nav.clients', fallback: 'Clients', href: '/specialist/clients', icon: UsersIcon },
    { nameKey: 'dashboard.nav.tasks', fallback: 'Tasks', href: '/specialist/tasks', icon: CheckCircleIcon },
    { nameKey: 'dashboard.nav.schedule', fallback: 'Schedule', href: '/specialist/schedule', icon: CalendarDaysIcon },
    { nameKey: 'dashboard.nav.analytics', fallback: 'Analytics', href: '/specialist/analytics', icon: PresentationChartLineIcon },
    { nameKey: 'dashboard.nav.calendarSync', fallback: 'Calendar sync', href: '/specialist/calendar-settings', icon: ArrowPathIcon },
  ]},
  { title: 'nav.section.finance', items: [
    { nameKey: 'dashboard.nav.earnings', fallback: 'Earnings', href: '/specialist/earnings', icon: CurrencyDollarIcon },
    { nameKey: 'dashboard.nav.finances', fallback: 'Finances', href: '/specialist/finances', icon: ChartBarIcon },
    { nameKey: 'dashboard.nav.inventory', fallback: 'Inventory', href: '/specialist/inventory', icon: ArchiveBoxIcon },
    { nameKey: 'dashboard.nav.pos', fallback: 'POS', href: '/specialist/pos', icon: BuildingStorefrontIcon },
    { nameKey: 'dashboard.nav.purchasing', fallback: 'Purchasing', href: '/specialist/purchasing', icon: InboxIcon },
    { nameKey: 'dashboard.nav.payroll', fallback: 'Payroll', href: '/specialist/payroll', icon: WalletIcon },
    { nameKey: 'dashboard.nav.team', fallback: 'Team', href: '/specialist/team', icon: UserGroupIcon },
    { nameKey: 'dashboard.nav.sales', fallback: 'Sales', href: '/specialist/sales', icon: GiftIcon },
  ]},
  { title: 'nav.section.growth', items: [
    { nameKey: 'dashboard.nav.segments', fallback: 'Segments & Campaigns', href: '/specialist/segments', icon: FunnelIcon },
    { nameKey: 'dashboard.nav.leads', fallback: 'Leads', href: '/specialist/leads', icon: UserPlusIcon },
    { nameKey: 'dashboard.nav.marketing', fallback: 'Marketing', href: '/specialist/marketing', icon: SparklesIcon },
    { nameKey: 'dashboard.nav.promote', fallback: 'Promote', href: '/specialist/promote', icon: RocketLaunchIcon },
    { nameKey: 'dashboard.nav.loyalty', fallback: 'Loyalty', href: '/specialist/loyalty', icon: TrophyIcon },
    { nameKey: 'dashboard.nav.referrals', fallback: 'Referrals', href: '/specialist/referrals', icon: ShareIcon },
    { nameKey: 'dashboard.nav.reviews', fallback: 'Reviews', href: '/specialist/reviews', icon: StarIcon },
    { nameKey: 'dashboard.nav.businesses', fallback: 'Businesses', href: '/specialist/businesses', icon: BuildingOfficeIcon },
  ]},
  { title: 'nav.section.account', items: [
    { nameKey: 'dashboard.nav.billing', fallback: 'Subscription', href: '/specialist/billing', icon: CreditCardIcon },
    { nameKey: 'dashboard.nav.community', fallback: 'Community', href: '/community', icon: GlobeIcon },
    { nameKey: 'dashboard.nav.notifications', fallback: 'Notifications', href: '/specialist/notifications', icon: BellIcon },
    { nameKey: 'dashboard.nav.profile', fallback: 'Profile', href: '/specialist/profile', icon: UserIcon },
    { nameKey: 'dashboard.nav.settings', fallback: 'Settings', href: '/specialist/settings', icon: Cog6ToothIcon },
  ]},
];

const SpecialistMobileBottomNav: React.FC = () => (
  <MobileTabBar primary={specialistBottomNavItems} sections={specialistSections} />
);

export default SpecialistLayout;
