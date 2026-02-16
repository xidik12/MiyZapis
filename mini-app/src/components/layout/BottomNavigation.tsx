import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Home,
  Search,
  Calendar,
  User,
  MessageCircle,
  LayoutDashboard,
} from 'lucide-react';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { RootState } from '@/store';
import { useLocale, t } from '@/hooks/useLocale';
import { navStrings } from '@/utils/translations';

interface NavItem {
  id: string;
  labelKey: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  path: string;
  requiresAuth?: boolean;
  badgeKey?: 'messages' | 'notifications';
}

const customerNavItems: NavItem[] = [
  {
    id: 'home',
    labelKey: 'home',
    icon: <Home size={20} strokeWidth={1.5} />,
    activeIcon: <Home size={22} strokeWidth={2} />,
    path: '/',
  },
  {
    id: 'search',
    labelKey: 'search',
    icon: <Search size={20} strokeWidth={1.5} />,
    activeIcon: <Search size={22} strokeWidth={2} />,
    path: '/search',
  },
  {
    id: 'bookings',
    labelKey: 'bookings',
    icon: <Calendar size={20} strokeWidth={1.5} />,
    activeIcon: <Calendar size={22} strokeWidth={2} />,
    path: '/bookings',
    requiresAuth: true,
  },
  {
    id: 'messages',
    labelKey: 'messages',
    icon: <MessageCircle size={20} strokeWidth={1.5} />,
    activeIcon: <MessageCircle size={22} strokeWidth={2} />,
    path: '/messages',
    requiresAuth: true,
    badgeKey: 'messages',
  },
  {
    id: 'profile',
    labelKey: 'profile',
    icon: <User size={20} strokeWidth={1.5} />,
    activeIcon: <User size={22} strokeWidth={2} />,
    path: '/profile',
    requiresAuth: true,
  },
];

const specialistNavItems: NavItem[] = [
  {
    id: 'home',
    labelKey: 'home',
    icon: <Home size={20} strokeWidth={1.5} />,
    activeIcon: <Home size={22} strokeWidth={2} />,
    path: '/',
  },
  {
    id: 'dashboard',
    labelKey: 'dashboard',
    icon: <LayoutDashboard size={20} strokeWidth={1.5} />,
    activeIcon: <LayoutDashboard size={22} strokeWidth={2} />,
    path: '/specialist-dashboard',
    requiresAuth: true,
  },
  {
    id: 'bookings',
    labelKey: 'bookings',
    icon: <Calendar size={20} strokeWidth={1.5} />,
    activeIcon: <Calendar size={22} strokeWidth={2} />,
    path: '/specialist-bookings',
    requiresAuth: true,
  },
  {
    id: 'messages',
    labelKey: 'messages',
    icon: <MessageCircle size={20} strokeWidth={1.5} />,
    activeIcon: <MessageCircle size={22} strokeWidth={2} />,
    path: '/messages',
    requiresAuth: true,
    badgeKey: 'messages',
  },
  {
    id: 'profile',
    labelKey: 'profile',
    icon: <User size={20} strokeWidth={1.5} />,
    activeIcon: <User size={22} strokeWidth={2} />,
    path: '/profile',
    requiresAuth: true,
  },
];

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated: tgAuth, hapticFeedback } = useTelegram();
  const locale = useLocale();

  const authState = useSelector((state: RootState) => state.auth?.isAuthenticated);
  const userRole = useSelector((state: RootState) => state.auth?.user?.role);
  const messageUnread = useSelector((state: RootState) => state.messages?.unreadCount ?? 0);
  const notifUnread = useSelector((state: RootState) => state.notifications?.unreadCount ?? 0);

  const isAuthenticated = tgAuth || authState;
  const navItems = userRole === 'specialist' ? specialistNavItems : customerNavItems;

  const getBadgeCount = (key?: 'messages' | 'notifications') => {
    if (key === 'messages') return messageUnread;
    if (key === 'notifications') return notifUnread;
    return 0;
  };

  const handleNavigation = (item: NavItem) => {
    if (item.requiresAuth && !isAuthenticated) {
      navigate('/auth');
      return;
    }
    hapticFeedback.selectionChanged();
    navigate(item.path);
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-secondary/80 backdrop-blur-xl border-t border-white/5 flex justify-around items-center h-14 z-50 safe-bottom">
      {navItems.map((item) => {
        const active = isActive(item.path);
        const badge = getBadgeCount(item.badgeKey);
        const label = t(navStrings, item.labelKey, locale);
        return (
          <button
            key={item.id}
            onClick={() => handleNavigation(item)}
            className={`relative flex flex-col items-center gap-0.5 px-4 py-2 transition-all duration-200 ${
              active
                ? 'text-accent-primary'
                : 'text-text-muted hover:text-text-secondary active:scale-90'
            }`}
            type="button"
          >
            <div className={`relative transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
              {active ? item.activeIcon : item.icon}
              {badge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-accent-red text-white text-[8px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </div>
            <span className="text-[9px] font-medium">{label}</span>
          </button>
        );
      })}
    </nav>
  );
};
