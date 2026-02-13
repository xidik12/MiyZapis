import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Search,
  Calendar,
  User,
  MessageCircle,
} from 'lucide-react';
import { useTelegram } from '@/components/telegram/TelegramProvider';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  path: string;
  requiresAuth?: boolean;
}

const navItems: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: <Home size={20} strokeWidth={1.5} />,
    activeIcon: <Home size={22} strokeWidth={2} />,
    path: '/',
  },
  {
    id: 'search',
    label: 'Search',
    icon: <Search size={20} strokeWidth={1.5} />,
    activeIcon: <Search size={22} strokeWidth={2} />,
    path: '/search',
  },
  {
    id: 'bookings',
    label: 'Bookings',
    icon: <Calendar size={20} strokeWidth={1.5} />,
    activeIcon: <Calendar size={22} strokeWidth={2} />,
    path: '/bookings',
    requiresAuth: true,
  },
  {
    id: 'messages',
    label: 'Messages',
    icon: <MessageCircle size={20} strokeWidth={1.5} />,
    activeIcon: <MessageCircle size={22} strokeWidth={2} />,
    path: '/messages',
    requiresAuth: true,
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: <User size={20} strokeWidth={1.5} />,
    activeIcon: <User size={22} strokeWidth={2} />,
    path: '/profile',
    requiresAuth: true,
  },
];

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, hapticFeedback } = useTelegram();

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

  const visibleNavItems = navItems.filter(item => {
    if (item.requiresAuth && !isAuthenticated) return false;
    return true;
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-secondary/80 backdrop-blur-xl border-t border-white/5 flex justify-around items-center h-14 z-50 safe-bottom">
      {visibleNavItems.map((item) => {
        const active = isActive(item.path);
        return (
          <button
            key={item.id}
            onClick={() => handleNavigation(item)}
            className={`flex flex-col items-center gap-0.5 px-4 py-2 transition-all duration-200 ${
              active
                ? 'text-accent-primary'
                : 'text-text-muted hover:text-text-secondary active:scale-90'
            }`}
            type="button"
          >
            <div className={`transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
              {active ? item.activeIcon : item.icon}
            </div>
            <span className="text-[9px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
