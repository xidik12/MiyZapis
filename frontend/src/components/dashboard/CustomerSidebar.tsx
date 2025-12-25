import React, { useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { selectUser, logout } from '@/store/slices/authSlice';
import { selectFavoritesCount, fetchFavoritesCount } from '@/store/slices/favoritesSlice';
import { getAbsoluteImageUrl } from '@/utils/imageUrl';
import { HouseIcon as HomeIcon, CalendarIcon, HeartIcon, CreditCardIcon, StarIcon, UserIcon, ClockIcon, BellIcon, ArrowRightOnRectangleIcon, ListIcon as Bars3Icon, XIcon as XMarkIcon, MagnifyingGlassIcon, LifebuoyIcon, GiftIcon, ChatBubbleLeftRightIcon } from '@/components/icons';
// Note: Use active prop for filled icons: <Icon active />
;

interface CustomerSidebarProps {
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

const CustomerSidebar: React.FC<CustomerSidebarProps> = ({
  isOpen = false,
  onToggle,
  className = '',
}) => {
  const location = useLocation();
  const { t } = useLanguage();
  const user = useAppSelector(selectUser);
  const favoritesCount = useAppSelector(selectFavoritesCount);
  const dispatch = useAppDispatch();

  // Fetch favorites count on component mount
  useEffect(() => {
    if (user) {
      dispatch(fetchFavoritesCount());
    }
  }, [dispatch, user]);

  const navigationItems: NavigationItem[] = [
    {
      name: 'Dashboard',
      translationKey: 'dashboard.nav.dashboard',
      href: '/customer/dashboard',
      icon: HomeIcon,
    },
    {
      name: 'Messages',
      translationKey: 'dashboard.nav.messages',
      href: '/customer/messages',
      icon: ChatBubbleLeftRightIcon,
    },
    {
      name: 'Search Services',
      translationKey: 'search.title',
      href: '/search',
      icon: MagnifyingGlassIcon,
    },
    {
      name: 'My Bookings',
      translationKey: 'dashboard.nav.bookings',
      href: '/customer/bookings',
      icon: CalendarIcon,
      badge: 0, // Dynamic count from API
    },
    {
      name: 'Booking History',
      translationKey: 'dashboard.nav.history',
      href: '/customer/bookings',
      icon: ClockIcon,
    },
    {
      name: 'Favorites',
      translationKey: 'dashboard.nav.favorites',
      href: '/customer/favorites',
      icon: HeartIcon,
      badge: favoritesCount.specialists + favoritesCount.services,
    },
    {
      name: 'Reviews',
      translationKey: 'dashboard.nav.reviews',
      href: '/customer/reviews',
      icon: StarIcon,
    },
    {
      name: 'Payments',
      translationKey: 'dashboard.nav.payments',
      href: '/customer/payments',
      icon: CreditCardIcon,
    },
    {
      name: 'Loyalty Program',
      translationKey: 'dashboard.customer.loyaltyPoints',
      href: '/customer/loyalty',
      icon: GiftIcon,
      badge: 0, // Dynamic count from API
    },
    {
      name: 'Profile',
      translationKey: 'dashboard.nav.profile',
      href: '/customer/profile',
      icon: UserIcon,
    },
  ];

  const bottomNavigationItems: NavigationItem[] = [
    {
      name: 'Notifications',
      translationKey: 'dashboard.nav.notifications',
      href: '/customer/notifications',
      icon: BellIcon,
      badge: 0, // Dynamic count from API
    },
    {
      name: 'Support',
      translationKey: 'dashboard.nav.support',
      href: '/customer/support',
      icon: LifebuoyIcon,
    },
  ];

  const isActiveRoute = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const navigate = useNavigate();

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
        lg:translate-x-0 lg:static lg:inset-0
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
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {user?.firstName?.charAt(0) || 'C'}
                  </span>
                </div>
              )}
              <div className="hidden sm:block">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                  Customer
                </p>
                {user?.loyaltyPoints && user.loyaltyPoints > 0 && (
                  <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                    {user.loyaltyPoints} {t('dashboard.customer.loyaltyPoints')}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onToggle}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Quick Book Section */}
          <div className="p-4 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 border-b border-gray-200 dark:border-gray-700">
            <Link
              to="/search"
              className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              onClick={() => {
                if (onToggle && window.innerWidth < 1024) {
                  onToggle();
                }
              }}
            >
              <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
              {t('dashboard.customer.bookService')}
            </Link>
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
                      ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg transform scale-105'
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
                      ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
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
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('brand.name')} Customer
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
          className="fixed top-4 left-4 z-30 lg:hidden p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <Bars3Icon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        </button>
      )}
    </>
  );
};

export default CustomerSidebar;
