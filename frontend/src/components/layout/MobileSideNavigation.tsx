import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { selectUser, selectIsAuthenticated, logout } from '@/store/slices/authSlice';
import { selectNotifications } from '@/store/slices/notificationSlice';
import { environment } from '@/config/environment';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  HomeIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  UserCircleIcon,
  CogIcon,
  BellIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  UserPlusIcon,
  IdentificationIcon,
} from '@/components/icons';
import { BellIcon } from '@/components/icons';
import { ThemeToggle } from '../ui/ThemeToggle';
import { LanguageToggle } from '../ui/LanguageToggle';
import { CurrencyToggle } from '../ui/CurrencyToggle';
import { NotificationDropdown } from '../common/NotificationDropdown';

interface MobileSideNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSideNavigation: React.FC<MobileSideNavigationProps> = ({
  isOpen,
  onClose,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [translateX, setTranslateX] = useState(0);
  const swiping = useRef(false);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const notifications = useAppSelector(selectNotifications);
  
  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  // Close mobile menu when route changes
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      previouslyFocused.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
      // Restore focus to the previously focused element when closing
      if (!isOpen && previouslyFocused.current) {
        setTimeout(() => previouslyFocused.current?.focus(), 0);
      }
    };
  }, [isOpen]);

  // Close on Esc
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;
    const panel = panelRef.current;
    if (!panel) return;
    const getFocusable = () => Array.from(panel.querySelectorAll<HTMLElement>('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])')).filter(el => !el.hasAttribute('disabled'));
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = getFocusable();
      if (items.length === 0) return;
      const first = items[0]; const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    panel.addEventListener('keydown', handleKey as any);
    setTimeout(() => (getFocusable()[0] || panel).focus(), 0);
    return () => panel.removeEventListener('keydown', handleKey as any);
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      navigate('/');
      onClose();
    } catch (error) {
      // Silently handle any logout errors - client-side logout always succeeds
      // Navigate anyway since tokens are cleared regardless
      navigate('/');
      onClose();
    }
  };

  const handleHashNavigation = (href: string) => {
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
    onClose();
  };

  const navigationSections = [
    {
      id: 'main',
      title: t('nav.main'),
      items: [
        { 
          name: t('nav.home'), 
          href: '/', 
          icon: HomeIcon, 
          current: location.pathname === '/' 
        },
        { 
          name: t('nav.services'), 
          href: '/search', 
          icon: MagnifyingGlassIcon, 
          current: location.pathname === '/search' 
        },
        {
          name: t('nav.howItWorks'),
          href: '#how-it-works',
          icon: CalendarDaysIcon,
          current: false,
          isHashLink: true,
        },
        {
          name: t('nav.forSpecialists'),
          href: '#for-specialists',
          icon: IdentificationIcon,
          current: false,
          isHashLink: true,
        },
      ],
    },
  ];

  const navButtonBase =
    'flex items-center gap-3 px-3 py-3 rounded-2xl mobile-touch-target transition-all duration-300 group border border-transparent transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-secondary-400 hover:-translate-y-0.5';
  const navButtonActive =
    'bg-white/70 dark:bg-[rgba(35,28,52,0.85)] border-[rgba(223,214,207,0.45)] dark:border-[rgba(90,70,110,0.55)] text-[rgb(45,37,32)] dark:text-white shadow-primary';
  const navButtonIdle =
    'text-[rgb(92,83,77)] dark:text-[rgb(206,199,216)] hover:text-[rgb(45,37,32)] dark:hover:text-white hover:bg-white/60 dark:hover:bg-[rgba(147,197,253,0.12)]';

  const userNavigationItems = isAuthenticated ? [
    { name: t('nav.profile'), href: '/profile', icon: UserCircleIcon },
    { name: t('nav.bookings'), href: '/bookings', icon: CalendarDaysIcon },
    { name: t('nav.settings'), href: '/settings', icon: CogIcon },
  ] : [];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Side panel */}
      <div
        className={`
          fixed right-0 top-0 h-full w-80 max-w-[85vw] z-50 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        style={{
          backgroundColor: 'rgb(var(--bg-primary) / 0.98)',
          backdropFilter: 'blur(24px)',
          borderLeft: '1px solid rgb(var(--border-primary) / 0.2)',
          transform: `translateX(${translateX}px)`
        }}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        onTouchStart={(e) => {
          const t = e.touches[0];
          touchStartX.current = t.clientX;
          touchStartY.current = t.clientY;
          swiping.current = true;
        }}
        onTouchMove={(e) => {
          if (!swiping.current) return;
          const t = e.touches[0];
          const dx = t.clientX - (touchStartX.current || 0);
          const dy = t.clientY - (touchStartY.current || 0);
          if (Math.abs(dx) > Math.abs(dy) && dx > 0) {
            setTranslateX(dx);
          }
        }}
        onTouchEnd={() => {
          if (!swiping.current) return;
          swiping.current = false;
          if (translateX > 80) { onClose(); setTranslateX(0); } else { setTranslateX(0); }
        }}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/20 dark:border-gray-700/20">
          <Link 
            to="/" 
            className="flex items-center space-x-3 group"
            onClick={() => {
              window.scrollTo(0, 0);
              onClose();
            }}
          >
            <div className="w-10 h-10 bg-panhaha-gradient text-white rounded-xl flex items-center justify-center text-base font-bold shadow-primary group-hover:scale-110 transition-all duration-300">
              H
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent group-hover:scale-[1.02] transition-transform duration-300">
              {environment.APP_NAME}
            </span>
          </Link>
          
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-white/60 dark:bg-[rgba(35,28,52,0.85)] border border-[rgba(223,214,207,0.45)] dark:border-[rgba(90,70,110,0.55)] text-[rgb(92,83,77)] dark:text-[rgb(206,199,216)] hover:-translate-y-0.5 hover:shadow-primary transition-all duration-300 mobile-touch-target"
            aria-label="Close menu"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto mobile-scroll">
          <nav className="px-4 py-6 space-y-6">
            {/* Main Navigation */}
            {navigationSections.map((section) => (
              <div key={section.id} className="space-y-3">
                <h3 className="px-3 text-xs font-semibold uppercase tracking-[0.28em] text-[rgba(92,83,77,0.75)] dark:text-[rgba(206,199,216,0.7)]">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = item.current;
                    
                    if (item.isHashLink) {
                      return (
                        <button
                          key={item.name}
                          onClick={() => handleHashNavigation(item.href)}
                          className={clsx('w-full', navButtonBase, isActive ? navButtonActive : navButtonIdle)}
                        >
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          <span className="font-medium text-base">{item.name}</span>
                        </button>
                      );
                    }

                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={clsx(navButtonBase, isActive ? navButtonActive : navButtonIdle)}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium text-base">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* User Navigation - Only show if authenticated */}
            {isAuthenticated && userNavigationItems.length > 0 && (
              <div className="border-t border-gray-200/30 dark:border-gray-700/30 pt-6 space-y-3">
                <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('nav.account')}
                </h3>
                <div className="space-y-1">
                  {userNavigationItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`
                          flex items-center gap-3 px-3 py-3 rounded-xl
                          mobile-touch-target transition-all duration-300 group
                          ${isActive
                            ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400'
                            : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }
                        `}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium text-base">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notifications - Only show if authenticated */}
            {isAuthenticated && (
              <div className="border-t border-gray-200/30 dark:border-gray-700/30 pt-6">
                <div className="relative">
                  <button
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 mobile-touch-target transition-all duration-300"
                  >
                    <div className="relative">
                      {unreadNotifications > 0 ? (
                        <BellIcon className="w-5 h-5 text-primary-600" />
                      ) : (
                        <BellIcon className="w-5 h-5" />
                      )}
                      {unreadNotifications > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          {unreadNotifications > 9 ? '9+' : unreadNotifications}
                        </span>
                      )}
                    </div>
                    <span className="font-medium text-base">{t('nav.notifications')}</span>
                  </button>
                  <NotificationDropdown 
                    isOpen={isNotificationOpen}
                    onClose={() => setIsNotificationOpen(false)}
                  />
                </div>
              </div>
            )}
          </nav>
        </div>

        {/* Settings Section */}
        <div className="border-t border-gray-200/30 dark:border-gray-700/30 p-4 space-y-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {t('settings.title')}
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center space-y-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {t('settings.language')}
              </span>
              <LanguageToggle />
            </div>
            
            <div className="flex flex-col items-center space-y-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {t('settings.currency')}
              </span>
              <CurrencyToggle />
            </div>
          </div>
          
          <div className="flex justify-center">
            <ThemeToggle size="md" />
          </div>
        </div>

        {/* User Profile / Auth Section */}
        <div className="border-t border-gray-200/30 dark:border-gray-700/30 p-4">
          {isAuthenticated ? (
            <div className="space-y-4">
              {/* User Profile Info */}
              <div className="flex items-center gap-3 px-3 py-2">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <UserCircleIcon className="w-12 h-12 text-gray-400 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-gray-900 dark:text-white truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 mobile-touch-target transition-all duration-300"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-base">{t('nav.signOut')}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <Link
                to="/auth/login"
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 mobile-touch-target transition-all duration-300"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-base">{t('nav.signIn')}</span>
              </Link>
              
              <Link
                to="/auth/register"
                className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl bg-panhaha-gradient text-white mobile-touch-target transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg shadow-primary"
              >
                <UserPlusIcon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-base">{t('nav.getStarted')}</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
