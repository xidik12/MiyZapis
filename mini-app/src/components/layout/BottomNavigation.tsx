import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Calendar, 
  User, 
  Heart,
  MessageCircle,
  BarChart3
} from 'lucide-react';
import { useTelegram } from '@/components/telegram/TelegramProvider';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  requiresAuth?: boolean;
}

const navItems: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: <Home size={20} />,
    path: '/'
  },
  {
    id: 'search',
    label: 'Search',
    icon: <Search size={20} />,
    path: '/search'
  },
  {
    id: 'bookings',
    label: 'Bookings',
    icon: <Calendar size={20} />,
    path: '/bookings',
    requiresAuth: true
  },
  {
    id: 'messages',
    label: 'Messages',
    icon: <MessageCircle size={20} />,
    path: '/messages',
    requiresAuth: true
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: <User size={20} />,
    path: '/profile',
    requiresAuth: true
  }
];

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, hapticFeedback } = useTelegram();

  const handleNavigation = (item: NavItem) => {
    if (item.requiresAuth && !isAuthenticated) {
      // Handle unauthenticated access
      navigate('/auth');
      return;
    }

    hapticFeedback.selectionChanged();
    navigate(item.path);
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Filter nav items based on authentication
  const visibleNavItems = navItems.filter(item => {
    if (item.requiresAuth && !isAuthenticated) {
      return false;
    }
    return true;
  });

  return (
    <nav className="bg-header border-t border-gray-200 safe-bottom">
      <div className="flex justify-around items-center py-2">
        {visibleNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item)}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            type="button"
          >
            <div className="flex flex-col items-center gap-1">
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </div>
          </button>
        ))}
      </div>
    </nav>
  );
};