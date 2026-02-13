import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { selectUser, logout } from '@/store/slices/authSlice';
import { getAbsoluteImageUrl } from '@/utils/imageUrl';
import { HouseIcon as HomeIcon, CalendarIcon, CogIcon, ChartBarIcon, PresentationChartLineIcon, CurrencyDollarIcon, StarIcon, ChatBubbleLeftRightIcon, UserIcon, ClockIcon, BellIcon, ArrowRightOnRectangleIcon, ListIcon as Bars3Icon, XIcon as XMarkIcon, Cog6ToothIcon, WrenchScrewdriverIcon, UserGroupIcon, UsersIcon } from '@/components/icons';
// Note: Use active prop for filled icons: <Icon active />
;

interface SpecialistSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

interface NavigationItem {
  name: string;
  translationKey: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { active?: boolean }>;
  badge?: number;
  comingSoon?: boolean;
}

const SpecialistSidebar: React.FC<SpecialistSidebarProps> = ({
  isOpen = false,
  onToggle,
  className = '',
}) => {
  const location = useLocation();
  const { t } = useLanguage();
  const user = useAppSelector(selectUser);

  const navigationItems: NavigationItem[] = [
    {
      name: 'Dashboard',
      translationKey: 'dashboard.nav.dashboard',
      href: '/specialist/dashboard',
      icon: HomeIcon,
    },
    {
      name: 'Bookings',
      translationKey: 'dashboard.nav.bookings',
      href: '/specialist/bookings',
      icon: CalendarIcon,
      badge: 0, // Dynamic count from API
    },
    {
      name: 'Clients',
      translationKey: 'dashboard.nav.clients',
      href: '/specialist/clients',
      icon: UsersIcon,
    },
    {
      name: 'Services',
      translationKey: 'dashboard.nav.services',
      href: '/specialist/services',
      icon: WrenchScrewdriverIcon,
    },
    {
      name: 'Schedule',
      translationKey: 'dashboard.nav.schedule',
      href: '/specialist/schedule',
      icon: ClockIcon,
    },
    {
      name: 'Analytics',
      translationKey: 'dashboard.nav.analytics',
      href: '/specialist/analytics',
      icon: PresentationChartLineIcon,
    },
    {
      name: 'Community',
      translationKey: 'dashboard.nav.community',
      href: '/community',
      icon: UserGroupIcon,
    },
    {
      name: 'Earnings',
      translationKey: 'dashboard.nav.earnings',
      href: '/specialist/earnings',
      icon: CurrencyDollarIcon,
    },
    {
      name: 'Finances',
      translationKey: 'dashboard.nav.finances',
      href: '/specialist/finances',
      icon: ChartBarIcon,
    },
    {
      name: 'Reviews',
      translationKey: 'dashboard.nav.reviews',
      href: '/specialist/reviews',
      icon: StarIcon,
      badge: 0, // Dynamic count from API
    },
    {
      name: 'Messages',
      translationKey: 'dashboard.nav.messages',
      href: '/specialist/messages',
      icon: ChatBubbleLeftRightIcon,
      badge: 0, // Dynamic count from API
    },
    {
      name: 'Profile',
      translationKey: 'dashboard.nav.profile',
      href: '/specialist/profile',
      icon: UserIcon,
    },
    {
      name: 'Settings',
      translationKey: 'dashboard.nav.settings',
      href: '/specialist/settings',
      icon: Cog6ToothIcon,
    },
  ];

  const bottomNavigationItems: NavigationItem[] = [
    {
      name: 'Notifications',
      translationKey: 'dashboard.nav.notifications',
      href: '/specialist/notifications',
      icon: BellIcon,
      badge: 0, // Dynamic count from API
    },
  ];

  const isActiveRoute = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

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

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 
        shadow-xl transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0 lg:h-screen
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        border-r border-gray-200 dark:border-gray-700
        ${className}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              {user?.avatar ? (
                <img
                  src={getAbsoluteImageUrl(user.avatar)}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-10 h-10 rounded-xl object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {user?.firstName?.charAt(0) || 'S'}
                  </span>
                </div>
              )}
              <div className="hidden sm:block">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                  Specialist
                </p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const isActive = isActiveRoute(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200
                    ${isActive
                      ? 'bg-primary-500 text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }
                    ${item.comingSoon ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  onClick={(e) => {
                    if (item.comingSoon) {
                      e.preventDefault();
                      return;
                    }
                    if (onToggle && window.innerWidth < 1024) {
                      onToggle();
                    }
                  }}
                >
                  <Icon
                    className={`
                      mr-3 flex-shrink-0 h-6 w-6 transition-colors
                      ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'}
                    `}
                    active={isActive}
                  />
                  <span className="flex-1">
                    {t(item.translationKey)}
                  </span>
                  {item.badge && item.badge > 0 && (
                    <span className={`
                      inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full
                      ${isActive
                        ? 'bg-white bg-opacity-20 text-white'
                        : 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                      }
                    `}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                  {item.comingSoon && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      Soon
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Bottom section */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-2">
            {bottomNavigationItems.map((item) => {
              const isActive = isActiveRoute(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200
                    ${isActive
                      ? 'bg-primary-500 text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }
                  `}
                  onClick={() => {
                    if (onToggle && window.innerWidth < 1024) {
                      onToggle();
                    }
                  }}
                >
                  <Icon
                    className={`
                      mr-3 flex-shrink-0 h-6 w-6 transition-colors
                      ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'}
                    `}
                    active={isActive}
                  />
                  <span className="flex-1">
                    {t(item.translationKey)}
                  </span>
                  {item.badge && item.badge > 0 && (
                    <span className={`
                      inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full
                      ${isActive
                        ? 'bg-white bg-opacity-20 text-white'
                        : 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                      }
                    `}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="w-full group flex items-center px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
            >
              <ArrowRightOnRectangleIcon className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-red-500" />
              <span>Logout</span>
            </button>
          </div>

          {/* Brand footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 cursor-default select-none transition-all duration-300 hover:text-primary-500 hover:scale-110 hover:drop-shadow-[0_0_6px_rgba(102,126,234,0.5)]">
                {t('brand.name')} Specialist
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                v2.0.0
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile toggle button */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed top-4 left-4 z-30 lg:hidden p-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <Bars3Icon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        </button>
      )}
    </>
  );
};

export default SpecialistSidebar;
