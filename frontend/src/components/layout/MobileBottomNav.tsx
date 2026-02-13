import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  HouseIcon as HomeIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  BellIcon,
  UserIcon,
} from '@/components/icons';

interface NavItem {
  nameKey: string;
  fallback: string;
  href: string;
  icon: React.ComponentType<{ className?: string; active?: boolean }>;
}

const items: NavItem[] = [
  { nameKey: 'customer.nav.dashboard', fallback: 'Home', href: '/customer/dashboard', icon: HomeIcon },
  { nameKey: 'customer.nav.searchServices', fallback: 'Search', href: '/search', icon: MagnifyingGlassIcon },
  { nameKey: 'customer.nav.bookings', fallback: 'Bookings', href: '/customer/bookings', icon: CalendarIcon },
  { nameKey: 'customer.nav.notifications', fallback: 'Alerts', href: '/customer/notifications', icon: BellIcon },
  { nameKey: 'customer.nav.profile', fallback: 'Profile', href: '/customer/profile', icon: UserIcon },
];

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {items.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          const label = t(item.nameKey) || item.fallback;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" active={isActive} />
              <span className="text-[10px] mt-0.5 font-medium leading-tight">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
