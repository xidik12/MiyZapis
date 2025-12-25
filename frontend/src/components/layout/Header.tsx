import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { selectUser, selectIsAuthenticated, logout } from '@/store/slices/authSlice';
import { selectNotifications } from '@/store/slices/notificationSlice';
import { environment } from '@/config/environment';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAbsoluteImageUrl } from '@/utils/imageUrl';
import {
  ListIcon as Bars3Icon,
  XIcon as XMarkIcon,
  BellIcon,
  UserCircleIcon,
  ChevronDownIcon,
  HouseIcon as HomeIcon,
} from '@/components/icons';
import { NotificationDropdown } from '../common/NotificationDropdown';
import { UserDropdown } from '../common/UserDropdown';
import { ThemeToggle } from '../ui/ThemeToggle';
import { LanguageToggle } from '../ui/LanguageToggle';
import { CurrencyToggle } from '../ui/CurrencyToggle';

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

  return (
    <header className="glass-effect sticky top-0 z-50 transition-all duration-300 w-full"
      style={{
        backgroundColor: 'rgb(var(--bg-primary) / 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgb(var(--border-primary) / 0.2)',
      }}
    >
      <div className="w-full max-w-7xl mx-auto mobile-container prevent-overflow">
        <div className="flex justify-between items-center h-14 xs:h-16 sm:h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex items-center space-x-2 group hover:opacity-90 transition-all duration-300"
              onClick={() => {
                // Force navigate to home page and scroll to top
                window.scrollTo(0, 0);
              }}
            >
              <img 
                src="/miyzapis_logo.png" 
                alt="МійЗапис Logo" 
                className="w-8 h-8 xs:w-10 xs:h-10 group-hover:scale-110 transition-all duration-300"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  const currentSrc = img.src;
                  
                  if (currentSrc.includes('miyzapis_logo.png')) {
                    console.log('🖼️ Primary logo failed, trying SVG fallback');
                    img.src = '/logo.svg';
                  } else if (currentSrc.includes('logo.svg')) {
                    console.log('🖼️ SVG logo failed, trying favicon fallback');
                    img.src = '/favicon.svg';
                  } else {
                    console.log('🖼️ All logos failed, replacing with app name');
                    img.style.display = 'none';
                    // Add app name as fallback
                    const parent = img.parentElement;
                    if (parent && !parent.querySelector('.logo-fallback')) {
                      const fallback = document.createElement('div');
                      fallback.className = 'logo-fallback w-8 h-8 xs:w-10 xs:h-10 bg-blue-600 text-white rounded flex items-center justify-center text-xs font-bold';
                      fallback.textContent = 'МЗ';
                      parent.insertBefore(fallback, img);
                    }
                  }
                }}
                onLoad={() => console.log('✅ Logo loaded successfully')}
              />
              <div className="flex items-center space-x-2">
                <span className="text-lg xs:text-xl font-bold text-primary-600 dark:text-primary-400 hidden xs:block group-hover:text-primary-500 transition-colors duration-300">
                  {environment.APP_NAME}
                </span>
                {/* <UkrainianFlag className="hidden sm:block" animated /> */}
              </div>
            </Link>
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
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 hover:scale-105 ${
                      item.current
                        ? 'text-primary-600 glass-card shadow-lg'
                        : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 hover:glass-effect'
                    } cursor-pointer`}
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
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 hover:scale-105 ${
                    item.current
                      ? 'text-primary-600 glass-card shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 hover:glass-effect'
                  }`}
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
            <div className="hidden lg:flex items-center space-x-2">
              <CurrencyToggle />
              <LanguageToggle />
            </div>
            
            {/* Theme toggle - larger on mobile for better touch targets */}
            <ThemeToggle size="lg" className="sm:!h-10 sm:!w-10" />

            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="p-2 sm:p-2 text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-200 relative transition-all duration-300 mobile-touch-target"
                  >
                    <BellIcon
                      active={unreadNotifications > 0}
                      className={`w-7 h-7 sm:w-6 sm:h-6 ${unreadNotifications > 0 ? 'text-primary-600' : ''}`}
                    />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
                    className="flex items-center space-x-2 p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 mobile-touch-target"
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
                    <span className="hidden sm:block text-sm font-medium">
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
                  className="hidden sm:flex text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 px-3 py-2 rounded-lg transition-all duration-300 hover:glass-effect"
                >
                  {t('nav.signIn')}
                </Link>
                <Link
                  to="/auth/register"
                  className="bg-primary-500 text-white px-3 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-primary whitespace-nowrap"
                >
                  {t('nav.getStarted')}
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden mobile-touch-target p-2 text-gray-400 hover:text-primary-500 transition-all duration-300 rounded-lg hover:glass-effect mobile-touch"
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
        <div className="sm:hidden glass-card border-t border-gray-200/20 dark:border-gray-700/20 w-full"
          style={{
            backgroundColor: 'rgb(var(--bg-primary) / 0.9)',
            backdropFilter: 'blur(16px)',
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