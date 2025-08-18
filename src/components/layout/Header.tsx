import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { selectUser, selectIsAuthenticated, logout } from '@/store/slices/authSlice';
import { selectNotifications, updateNotificationMessages } from '@/store/slices/notificationSlice';
import { environment } from '@/config/environment';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Bars3Icon, 
  XMarkIcon, 
  BellIcon, 
  UserCircleIcon,
  ChevronDownIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';
import { NotificationDropdown } from '../common/NotificationDropdown';
import { UserDropdown } from '../common/UserDropdown';
import { ThemeToggle } from '../ui/ThemeToggle';
import { LanguageToggle } from '../ui/LanguageToggle';
import { CurrencyToggle } from '../ui/CurrencyToggle';
// import { UkrainianFlag } from '../ui/UkrainianElements';

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
  useEffect(() => {
    dispatch(updateNotificationMessages({ t }));
  }, [language, t, dispatch]);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
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
    <header className="glass-effect sticky top-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: 'rgb(var(--bg-primary) / 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgb(var(--border-primary) / 0.2)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
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
              <div className="w-10 h-10 ukraine-gradient rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300 morph-shape">
                <span className="text-white font-bold text-lg">М</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold ukraine-text-gradient hidden sm:block group-hover:text-primary-500 transition-colors duration-300">
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
          <div className="flex items-center space-x-3">
            {/* Currency toggle */}
            <CurrencyToggle />
            {/* Language toggle */}
            <LanguageToggle />
            {/* Theme toggle */}
            <ThemeToggle size="md" />

            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="p-2 text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-200 relative transition-all duration-300"
                  >
                    {unreadNotifications > 0 ? (
                      <BellIconSolid className="w-6 h-6 text-primary-600" />
                    ) : (
                      <BellIcon className="w-6 h-6" />
                    )}
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
                    className="flex items-center space-x-2 p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="w-8 h-8" />
                    )}
                    <span className="hidden sm:block text-sm font-medium">
                      {user?.firstName}
                    </span>
                    <ChevronDownIcon className="w-4 h-4" />
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
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 px-3 py-2 rounded-lg transition-all duration-300 hover:glass-effect"
                >
                  {t('nav.signIn')}
                </Link>
                <Link
                  to="/auth/register"
                  className="ukraine-gradient text-white px-6 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-primary"
                >
                  {t('nav.getStarted')}
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden p-2 text-gray-400 hover:text-primary-500 transition-all duration-300 rounded-lg hover:glass-effect"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>


      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden glass-card border-t border-gray-200/20 dark:border-gray-700/20"
          style={{
            backgroundColor: 'rgb(var(--bg-primary) / 0.9)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="px-4 py-3 space-y-3">
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
                    className={`block px-3 py-2 text-base font-medium rounded-md cursor-pointer ${
                      item.current
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
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
                  className={`block px-3 py-2 text-base font-medium rounded-md ${
                    item.current
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
            
            {!isAuthenticated && (
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <Link
                  to="/auth/login"
                  className="block w-full text-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {t('nav.signIn')}
                </Link>
                <Link
                  to="/auth/register"
                  className="block w-full text-center px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
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