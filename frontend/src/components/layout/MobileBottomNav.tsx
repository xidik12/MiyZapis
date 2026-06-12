import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  HouseIcon as HomeIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  HeartIcon,
  StarIcon,
  ChatBubbleLeftEllipsisIcon,
  UsersIcon,
  WalletIcon,
  CreditCardIcon,
  GiftIcon,
  ShareIcon,
  BellIcon,
  Cog6ToothIcon,
  ListIcon as Bars3Icon,
} from '@/components/icons';

interface NavItem {
  nameKey: string;
  fallback: string;
  href: string;
  icon: React.ComponentType<{ className?: string; active?: boolean }>;
}

// Bottom bar: 4 primary destinations + a "More" button that opens a sheet
// listing every secondary customer destination.
const items: NavItem[] = [
  { nameKey: 'customer.nav.dashboard', fallback: 'Home', href: '/customer/dashboard', icon: HomeIcon },
  { nameKey: 'customer.nav.searchServices', fallback: 'Search', href: '/search', icon: MagnifyingGlassIcon },
  { nameKey: 'customer.nav.bookings', fallback: 'Bookings', href: '/customer/bookings', icon: CalendarIcon },
  { nameKey: 'customer.nav.favorites', fallback: 'Favorites', href: '/customer/favorites', icon: HeartIcon },
];

// Items revealed by tapping "More".
const moreItems: NavItem[] = [
  { nameKey: 'customer.nav.reviews', fallback: 'Reviews', href: '/customer/reviews', icon: StarIcon },
  { nameKey: 'customer.nav.messages', fallback: 'Messages', href: '/customer/messages', icon: ChatBubbleLeftEllipsisIcon },
  { nameKey: 'customer.nav.community', fallback: 'Community', href: '/community', icon: UsersIcon },
  { nameKey: 'customer.nav.wallet', fallback: 'Wallet', href: '/customer/wallet', icon: WalletIcon },
  { nameKey: 'customer.nav.payments', fallback: 'Payments', href: '/customer/payments', icon: CreditCardIcon },
  { nameKey: 'customer.nav.loyalty', fallback: 'Loyalty Points', href: '/customer/loyalty', icon: GiftIcon },
  { nameKey: 'customer.nav.referrals', fallback: 'Referrals', href: '/customer/referrals', icon: ShareIcon },
  { nameKey: 'customer.nav.notifications', fallback: 'Alerts', href: '/customer/notifications', icon: BellIcon },
  { nameKey: 'customer.nav.settings', fallback: 'Settings', href: '/customer/settings', icon: Cog6ToothIcon },
];

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
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
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-500 dark:text-gray-400 transition-colors"
          >
            <Bars3Icon className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-medium leading-tight">{t('customer.nav.more') || 'More'}</span>
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 inset-x-0 bg-white dark:bg-gray-800 rounded-t-2xl pt-3 pb-6 max-h-[80vh] overflow-y-auto safe-area-bottom"
          >
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-2" />
            <div className="grid grid-cols-3 gap-2 px-4">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.href || location.pathname.startsWith(item.href + '/');
                const label = t(item.nameKey) || item.fallback;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <Icon className="w-6 h-6" active={isActive} />
                    <span className="text-xs font-medium text-center leading-tight">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileBottomNav;
