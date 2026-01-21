import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { selectUser, selectIsAuthenticated, logout } from '@/store/slices/authSlice';
import { selectNotifications } from '@/store/slices/notificationSlice';
import { environment } from '@/config/environment';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAbsoluteImageUrl } from '@/utils/imageUrl';
import {
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  UserCircleIcon,
  ChevronDownIcon,
  HomeIcon,
} from '@/components/icons';
import { NotificationDropdownV2 as NotificationDropdown } from '../notifications/NotificationDropdownV2';
import { UserDropdown } from '../common/UserDropdown';
import { ThemeToggle } from '../ui/ThemeToggle';
import { LanguageToggle } from '../ui/LanguageToggle';
import { CurrencyToggle } from '../ui/CurrencyToggle';
import { Logo } from '../common/Logo';

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { t, language } = useLanguage();
  
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const notifications = useAppSelector(selectNotifications);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Update notification messages when language changes
  // Note: Removed dispatch call to prevent Redux serialization error
  // The updateNotificationMessages action doesn't perform any actual updates

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      navigate('/', { replace: true });
    } catch (error) {
      // Silently handle logout errors - user is logged out regardless
      // Navigate anyway since client-side logout always succeeds
      navigate('/', { replace: true });
    }
  };

  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  const navigationItems = [
    { name: t('nav.home'), href: '/', current: location.pathname === '/', icon: HomeIcon },
    { name: t('nav.services'), href: '/search', current: location.pathname === '/search' },
    { name: t('nav.howItWorks'), href: '#how-it-works', current: false, isHashLink: true },
    { name: t('nav.forSpecialists'), href: '#for-specialists', current: false, isHashLink: true },
  ];

  const navItemBase =
    'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 nav-item-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-secondary-400';

  return (
    <header
      className="sticky top-0 z-50 w-full border-b transition-all duration-200 backdrop-blur-xl bg-white/70 dark:bg-secondary-900/70"
      style={{
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderColor: 'rgb(var(--role-border) / 0.3)',
        boxShadow: '0 4px 24px -8px rgba(0, 0, 0, 0.08)',
      }}
    >
      <div className="w-full max-w-7xl mx-auto mobile-container prevent-overflow">
        <div className="flex justify-between items-center h-14 xs:h-16 sm:h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Logo size="md" showText showTagline className="hidden sm:flex" />
            <Logo size="sm" showText={false} className="sm:hidden" />
          </div>

          {/* Desktop navigation */}
          <nav className="hidden sm:flex space-x-8">
            {navigationItems.map((item) => {
              if (item.isHashLink) {
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      if (location.pathname !== '/') {
                        navigate('/');
                        setTimeout(() => {
                          const element = document.querySelector(item.href);
                          element?.scrollIntoView({ behavior: 'smooth' });
                        }, 150);
                      } else {
                        const element = document.querySelector(item.href);
                        element?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className={clsx(
                      navItemBase,
                      'cursor-pointer text-[rgb(92,83,77)] hover:text-[rgb(45,37,32)] hover:bg-white/60 dark:text-[rgb(206,199,216)] dark:hover:text-white dark:hover:bg-[rgba(147,197,253,0.12)]'
                    )}
                  >
                    {item.icon && <item.icon className="w-4 h-4" />}
                    <span className={item.href === '/' ? 'hidden lg:inline' : ''}>{item.name}</span>
                  </a>
                );
              }
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    navItemBase,
                    item.current
                      ? 'text-white bg-primary-500 shadow-lg shadow-primary-500/30 hover:-translate-y-0.5'
                      : 'text-secondary-600 hover:text-secondary-900 hover:bg-white/60 dark:text-secondary-300 dark:hover:text-white dark:hover:bg-white/10'
                  )}
                >
                  {item.icon && <item.icon className="w-4 h-4" />}
                  <span className={item.href === '/' ? 'hidden lg:inline' : ''}>{item.name}</span>
                </Link>
              );
            })}
          </nav>


          {/* Right side actions */}
          <div className="flex items-center space-x-1 xs:space-x-2 sm:space-x-3">
            {/* Hide currency/language toggles on mobile and small tablets */}
            <div className="hidden lg:flex items-center gap-3 bg-white/60 dark:bg-[rgba(28,23,41,0.75)] border border-[rgba(223,214,207,0.45)] dark:border-[rgba(90,70,110,0.55)] rounded-full px-3 py-1 shadow-sm">
              <CurrencyToggle />
              <span className="h-4 w-px bg-[rgba(223,214,207,0.5)] dark:bg-[rgba(90,70,110,0.6)]" />
              <LanguageToggle />
            </div>
            
            {/* Theme toggle - larger on mobile for better touch targets */}
            <ThemeToggle size="lg" className="sm:!h-10 sm:!w-10 rounded-2xl shadow-md hover:-translate-y-0.5 transition-transform duration-300" />

            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="p-2.5 sm:p-2.5 rounded-2xl bg-white/60 dark:bg-[rgba(35,28,52,0.8)] border border-[rgba(223,214,207,0.45)] dark:border-[rgba(90,70,110,0.55)] text-[rgb(92,83,77)] dark:text-[rgb(206,199,216)] hover:-translate-y-0.5 hover:shadow-primary transition-all duration-300 mobile-touch-target"
                  >
                    <BellIcon
                      className={`w-7 h-7 sm:w-6 sm:h-6 ${unreadNotifications > 0 ? 'text-primary-500' : ''}`}
                      active={unreadNotifications > 0}
                    />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-primary">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                  </button>
                  <NotificationDropdown 
                    isOpen={isNotificationOpen}
                    onClose={() => setIsNotificationOpen(false)}
                  />
                </div>

                {/* User menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-white/60 dark:bg-[rgba(35,28,52,0.85)] border border-[rgba(223,214,207,0.45)] dark:border-[rgba(90,70,110,0.55)] text-[rgb(92,83,77)] dark:text-[rgb(206,199,216)] hover:-translate-y-0.5 hover:shadow-primary transition-all duration-300 mobile-touch-target"
                  >
                    {user?.avatar ? (
                      <img
                        src={getAbsoluteImageUrl(user.avatar)}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-9 h-9 sm:w-8 sm:h-8 rounded-full object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="w-9 h-9 sm:w-8 sm:h-8" />
                    )}
                    <span className="hidden sm:block text-sm font-semibold">
                      {user?.firstName}
                    </span>
                    <ChevronDownIcon className="w-5 h-5 sm:w-4 sm:h-4" />
                  </button>
                  <UserDropdown 
                    isOpen={isUserMenuOpen}
                    onClose={() => setIsUserMenuOpen(false)}
                    onLogout={handleLogout}
                  />
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  className="hidden sm:flex text-sm font-semibold text-[rgb(92,83,77)] dark:text-[rgb(206,199,216)] px-4 py-2 rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/60 dark:hover:bg-[rgba(147,197,253,0.15)] hover:text-[rgb(45,37,32)] dark:hover:text-white"
                >
                  {t('nav.signIn')}
                </Link>
                <Link
                  to="/auth/register"
                  className="bg-primary-600 text-white px-3 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-xl shadow-lg shadow-primary-500/30 hover:shadow-primary-500/40 whitespace-nowrap"
                >
                  {t('nav.getStarted')}
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden mobile-touch-target p-2.5 rounded-2xl bg-white/60 dark:bg-[rgba(35,28,52,0.8)] border border-[rgba(223,214,207,0.45)] dark:border-[rgba(90,70,110,0.55)] text-[rgb(92,83,77)] dark:text-[rgb(206,199,216)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary mobile-touch"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-7 h-7" />
              ) : (
                <Bars3Icon className="w-7 h-7" />
              )}
            </button>
          </div>
        </div>
      </div>


      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden glass-card border-t border-[rgba(223,214,207,0.35)] dark:border-[rgba(90,70,110,0.55)] w-full"
          style={{
            background: 'rgba(var(--bg-primary), 0.85)',
            backdropFilter: 'blur(18px)',
          }}
        >
          <div className="mobile-container py-4 space-y-3 mobile-scroll">
            {navigationItems.map((item) => {
              if (item.isHashLink) {
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      setIsMobileMenuOpen(false); // Close mobile menu
                      // Navigate to home page first if not already there
                      if (location.pathname !== '/') {
                        navigate('/');
                        // Wait a bit for navigation, then scroll
                        setTimeout(() => {
                          const element = document.querySelector(item.href);
                          element?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      } else {
                        // Already on home page, just scroll
                        const element = document.querySelector(item.href);
                        element?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className={`block px-4 py-3 text-base font-medium rounded-lg cursor-pointer mobile-touch-target transition-colors duration-200 ${
                      item.current
                        ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {item.name}
                  </a>
                );
              }
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-4 py-3 text-base font-medium rounded-lg mobile-touch-target transition-colors duration-200 ${
                    item.current
                      ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
            
            {/* Mobile-only settings section - now shows on both small and medium screens */}
            <div className="md:hidden pt-4 border-t border-gray-200/30 dark:border-gray-700/30 space-y-4">
              <div className="flex justify-center gap-6">
                <div className="flex flex-col items-center space-y-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('settings.language')}</span>
                  <LanguageToggle />
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('settings.currency')}</span>
                  <CurrencyToggle />
                </div>
              </div>
            </div>
            
            {!isAuthenticated && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <Link
                  to="/auth/login"
                  className="block w-full text-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 mobile-touch-target transition-colors duration-200"
                >
                  {t('nav.signIn')}
                </Link>
                <Link
                  to="/auth/register"
                  className="block w-full text-center px-4 py-3 bg-primary-600 text-white rounded-lg text-base font-medium hover:bg-primary-700 mobile-touch-target transition-colors duration-200"
                >
                  {t('nav.getStarted')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
