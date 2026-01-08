import React, { useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
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
} from '@/components/icons';
import { ThemeToggle } from '../ui/ThemeToggle';
import { LanguageToggle } from '../ui/LanguageToggle';
import { CurrencyToggle } from '../ui/CurrencyToggle';
import { LogoIcon } from '../common/Logo';

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
      current: location.pathname === '/',
    },
    {
      name: t('nav.services'),
      href: '/search',
      icon: MagnifyingGlassIcon,
      current: location.pathname === '/search',
    },
    {
      name: t('nav.howItWorks'),
      href: '#how-it-works',
      icon: QuestionMarkCircleIcon,
      current: false,
      isHashLink: true,
    },
    {
      name: t('nav.forSpecialists'),
      href: '#for-specialists',
      icon: UserPlusIcon,
      current: false,
      isHashLink: true,
    },
  ];

  const userNavItems = isAuthenticated ? [
    {
      name: user?.userType === 'specialist' ? t('nav.dashboard') : t('nav.dashboard'),
      href: user?.userType === 'specialist' ? '/specialist/dashboard' : '/dashboard',
      icon: UserCircleIcon,
      current: location.pathname.includes('/dashboard'),
    },
  ] : [];

  const navItemBase =
    'flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300 group border border-transparent transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-secondary-400 hover:-translate-y-0.5';
  const navItemActive =
    'bg-white/75 dark:bg-[rgba(35,28,52,0.9)] border-[rgba(223,214,207,0.45)] dark:border-[rgba(90,70,110,0.55)] text-[rgb(45,37,32)] dark:text-white shadow-primary';
  const navItemIdle =
    'text-[rgb(92,83,77)] dark:text-[rgb(206,199,216)] hover:text-[rgb(45,37,32)] dark:hover:text-white hover:bg-white/60 dark:hover:bg-[rgba(147,197,253,0.12)]';

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
    const Icon = item.icon;

    if (item.isHashLink) {
      return (
        <button
          onClick={() => handleHashLink(item.href)}
          className={clsx('w-full', navItemBase, item.current ? navItemActive : navItemIdle)}
        >
          <Icon className="w-5 h-5 flex-shrink-0" active={item.current} />
          {showText && (
            <span className="font-medium text-sm">{item.name}</span>
          )}
        </button>
      );
    }

    return (
      <Link
        to={item.href}
        className={clsx(navItemBase, item.current ? navItemActive : navItemIdle)}
      >
        <Icon className="w-5 h-5 flex-shrink-0" active={item.current} />
        {showText && (
          <span className="font-medium text-sm">{item.name}</span>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={`hidden lg:flex fixed left-0 top-0 h-full backdrop-blur-xl border-r border-[rgba(223,214,207,0.35)] dark:border-[rgba(90,70,110,0.55)] z-30 transition-all duration-300 flex-col ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
      style={{
        background: 'rgba(var(--bg-primary), 0.82)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[rgba(223,214,207,0.35)] dark:border-[rgba(90,70,110,0.55)]">
        {!isCollapsed && (
          <Link to="/" className="flex items-center gap-3 group">
            <LogoIcon size={36} />
            <span className="text-lg font-semibold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
              {t('brand.name')}
            </span>
          </Link>
        )}

        {isCollapsed && (
          <Link to="/" className="flex justify-center w-full">
            <LogoIcon size={36} />
          </Link>
        )}
        
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-2xl bg-white/60 dark:bg-[rgba(35,28,52,0.85)] border border-[rgba(223,214,207,0.45)] dark:border-[rgba(90,70,110,0.55)] text-[rgb(92,83,77)] dark:text-[rgb(206,199,216)] hover:-translate-y-0.5 hover:shadow-primary transition-all duration-300"
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
            <h3 className="text-xs font-semibold uppercase tracking-[0.28em] text-[rgba(92,83,77,0.7)] dark:text-[rgba(206,199,216,0.7)] mb-3">
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
              <h3 className="text-xs font-semibold uppercase tracking-[0.28em] text-[rgba(92,83,77,0.7)] dark:text-[rgba(206,199,216,0.7)] mb-3">
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
            <h3 className="text-xs font-semibold uppercase tracking-[0.28em] text-[rgba(92,83,77,0.7)] dark:text-[rgba(206,199,216,0.7)] mb-3">
              {t('nav.settings')}
            </h3>
          )}
          <div className="space-y-3">
            {isCollapsed ? (
              <div className="flex flex-col items-center space-y-2">
                <ThemeToggle size="sm" />
                <div className="w-4 h-px bg-[rgba(223,214,207,0.6)] dark:bg-[rgba(90,70,110,0.6)]"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[rgb(92,83,77)] dark:text-[rgb(206,199,216)]">{t('settings.language')}</span>
                  <LanguageToggle />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[rgb(92,83,77)] dark:text-[rgb(206,199,216)]">{t('settings.currency')}</span>
                  <CurrencyToggle />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[rgb(92,83,77)] dark:text-[rgb(206,199,216)]">{t('settings.theme')}</span>
                  <ThemeToggle size="sm" />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-[rgba(223,214,207,0.35)] dark:border-[rgba(90,70,110,0.55)]">
        {isAuthenticated ? (
          <div className="space-y-2">
            {!isCollapsed && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/70 dark:bg-[rgba(35,28,52,0.85)] border border-[rgba(223,214,207,0.45)] dark:border-[rgba(90,70,110,0.55)] shadow-sm">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <UserCircleIcon className="w-8 h-8 text-[rgba(200,16,46,0.4)]" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[rgb(45,37,32)] dark:text-[rgb(242,241,244)] truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-[rgba(92,83,77,0.8)] dark:text-[rgba(206,199,216,0.7)] truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[rgb(92,83,77)] dark:text-[rgb(206,199,216)] hover:text-[rgb(200,16,46)] dark:hover:text-[rgb(241,149,162)] hover:bg-[rgba(200,16,46,0.08)] dark:hover:bg-[rgba(200,16,46,0.2)] border border-transparent transition-all duration-300 transform hover:-translate-y-0.5 ${
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[rgb(92,83,77)] dark:text-[rgb(206,199,216)] hover:text-[rgb(45,37,32)] dark:hover:text-white hover:bg-white/60 dark:hover:bg-[rgba(147,197,253,0.12)] border border-transparent transition-all duration-300 transform hover:-translate-y-0.5 ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">{t('nav.signIn')}</span>}
            </Link>
            <Link
              to="/auth/register"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-panhaha-gradient text-white shadow-primary hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 ${
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
