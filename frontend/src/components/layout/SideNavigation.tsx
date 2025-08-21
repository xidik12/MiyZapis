import React, { useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { selectUser, selectIsAuthenticated, logout } from '@/store/slices/authSlice';
import { useLanguage } from '@/contexts/LanguageContext';
import { environment } from '@/config/environment';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  QuestionMarkCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  UserCircleIcon as UserCircleIconSolid,
} from '@heroicons/react/24/solid';
import { ThemeToggle } from '../ui/ThemeToggle';
import { LanguageToggle } from '../ui/LanguageToggle';
import { CurrencyToggle } from '../ui/CurrencyToggle';

interface SideNavigationProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const SideNavigation: React.FC<SideNavigationProps> = ({
  isCollapsed,
  onToggleCollapse,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const mainNavItems = [
    {
      name: t('nav.home'),
      href: '/',
      icon: HomeIcon,
      activeIcon: HomeIconSolid,
      current: location.pathname === '/',
    },
    {
      name: t('nav.services'),
      href: '/search',
      icon: MagnifyingGlassIcon,
      activeIcon: MagnifyingGlassIconSolid,
      current: location.pathname === '/search',
    },
    {
      name: t('nav.howItWorks'),
      href: '#how-it-works',
      icon: QuestionMarkCircleIcon,
      activeIcon: QuestionMarkCircleIcon,
      current: false,
      isHashLink: true,
    },
    {
      name: t('nav.forSpecialists'),
      href: '#for-specialists',
      icon: UserPlusIcon,
      activeIcon: UserPlusIcon,
      current: false,
      isHashLink: true,
    },
  ];

  const userNavItems = isAuthenticated ? [
    {
      name: user?.userType === 'specialist' ? t('nav.dashboard') : t('nav.dashboard'), 
      href: user?.userType === 'specialist' ? '/specialist/dashboard' : '/dashboard',
      icon: UserCircleIcon,
      activeIcon: UserCircleIconSolid,
      current: location.pathname.includes('/dashboard'),
    },
  ] : [];

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

  const handleHashLink = (href: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.querySelector(href);
        element?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const element = document.querySelector(href);
      element?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const NavItem = ({ item, showText = true }: { item: any; showText?: boolean }) => {
    const Icon = item.current ? item.activeIcon : item.icon;
    
    if (item.isHashLink) {
      return (
        <button
          onClick={() => handleHashLink(item.href)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 group ${
            item.current
              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
              : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
          }`}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          {showText && (
            <span className="font-medium text-sm">{item.name}</span>
          )}
        </button>
      );
    }

    return (
      <Link
        to={item.href}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 group ${
          item.current
            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
            : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
        }`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {showText && (
          <span className="font-medium text-sm">{item.name}</span>
        )}
      </Link>
    );
  };

  return (
    <aside className={`hidden lg:flex fixed left-0 top-0 h-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-r border-gray-200/20 dark:border-gray-700/20 z-30 transition-all duration-300 flex-col ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200/20 dark:border-gray-700/20">
        {!isCollapsed && (
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 ukraine-gradient rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
              <span className="text-white font-bold text-sm">М</span>
            </div>
            <span className="text-lg font-bold ukraine-text-gradient">
              {environment.APP_NAME}
            </span>
          </Link>
        )}
        
        {isCollapsed && (
          <Link to="/" className="flex justify-center w-full">
            <div className="w-8 h-8 ukraine-gradient rounded-lg flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300">
              <span className="text-white font-bold text-sm">М</span>
            </div>
          </Link>
        )}
        
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="w-4 h-4" />
          ) : (
            <ChevronLeftIcon className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 p-4 space-y-6">
        <div>
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              {t('nav.main')}
            </h3>
          )}
          <nav className="space-y-1">
            {mainNavItems.map((item) => (
              <NavItem key={item.name} item={item} showText={!isCollapsed} />
            ))}
          </nav>
        </div>

        {/* User Navigation */}
        {isAuthenticated && userNavItems.length > 0 && (
          <div>
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                {t('nav.myAccount')}
              </h3>
            )}
            <nav className="space-y-1">
              {userNavItems.map((item) => (
                <NavItem key={item.name} item={item} showText={!isCollapsed} />
              ))}
            </nav>
          </div>
        )}

        {/* Settings */}
        <div>
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              {t('nav.settings')}
            </h3>
          )}
          <div className="space-y-3">
            {isCollapsed ? (
              <div className="flex flex-col items-center space-y-2">
                <ThemeToggle size="sm" />
                <div className="w-4 h-px bg-gray-200 dark:bg-gray-700"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('settings.language')}</span>
                  <LanguageToggle />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('settings.currency')}</span>
                  <CurrencyToggle />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('settings.theme')}</span>
                  <ThemeToggle size="sm" />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200/20 dark:border-gray-700/20">
        {isAuthenticated ? (
          <div className="space-y-2">
            {!isCollapsed && (
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <UserCircleIcon className="w-8 h-8 text-gray-400" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">{t('nav.signOut')}</span>}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link
              to="/auth/login"
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">{t('nav.signIn')}</span>}
            </Link>
            <Link
              to="/auth/register"
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-all duration-200 ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <UserPlusIcon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">{t('nav.getStarted')}</span>}
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
};