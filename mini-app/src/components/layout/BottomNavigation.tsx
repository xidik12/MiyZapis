import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Home, Search, Calendar, MessageCircle, User, type LucideProps } from 'lucide-react';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { RootState } from '@/store';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<LucideProps>;
}

const customerItems: NavItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Search', href: '/search', icon: Search },
  { label: 'Bookings', href: '/bookings', icon: Calendar },
  { label: 'Messages', href: '/messaging', icon: MessageCircle },
  { label: 'Profile', href: '/profile', icon: User },
];

const specialistItems: NavItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Bookings', href: '/specialist/bookings', icon: Calendar },
  { label: 'Messages', href: '/messaging', icon: MessageCircle },
  { label: 'Profile', href: '/specialist/settings', icon: User },
];

export const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hapticFeedback } = useTelegram();

  const userRole = useSelector((state: RootState) => state.auth?.user?.role);
  const items = userRole === 'specialist' ? specialistItems : customerItems;

  const handleNavigate = (href: string) => {
    hapticFeedback.selectionChanged();
    navigate(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-secondary/80 backdrop-blur-xl border-t border-white/5 flex justify-around items-center h-14 z-50 safe-bottom">
      {items.map((item) => {
        const isActive = location.pathname === item.href ||
          (item.href !== '/' && location.pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <button
            key={item.href}
            onClick={() => handleNavigate(item.href)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
              isActive
                ? 'text-accent-primary'
                : 'text-text-muted hover:text-text-secondary'
            }`}
            type="button"
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2.5 : 2}
              className={isActive ? 'scale-110' : ''}
            />
            <span className="text-[10px] mt-0.5 font-medium leading-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
