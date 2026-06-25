import React from 'react';
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
  TrophyIcon,
} from '@/components/icons';
import { MobileTabBar, TabItem, TabSection } from './MobileTabBar';

const primary: TabItem[] = [
  { nameKey: 'customer.nav.dashboard', fallback: 'Home', href: '/customer/dashboard', icon: HomeIcon },
  { nameKey: 'customer.nav.searchServices', fallback: 'Search', href: '/search', icon: MagnifyingGlassIcon },
  { nameKey: 'customer.nav.bookings', fallback: 'Bookings', href: '/customer/bookings', icon: CalendarIcon },
  { nameKey: 'customer.nav.favorites', fallback: 'Favorites', href: '/customer/favorites', icon: HeartIcon },
];

const sections: TabSection[] = [
  { title: 'nav.section.activity', items: [
    { nameKey: 'customer.nav.reviews', fallback: 'Reviews', href: '/customer/reviews', icon: StarIcon },
    { nameKey: 'customer.nav.messages', fallback: 'Messages', href: '/customer/messages', icon: ChatBubbleLeftEllipsisIcon },
    { nameKey: 'customer.nav.community', fallback: 'Community', href: '/community', icon: UsersIcon },
  ]},
  { title: 'nav.section.wallet', items: [
    { nameKey: 'customer.nav.wallet', fallback: 'Wallet', href: '/customer/wallet', icon: WalletIcon },
    { nameKey: 'customer.nav.payments', fallback: 'Payments', href: '/customer/payments', icon: CreditCardIcon },
    { nameKey: 'customer.nav.loyalty', fallback: 'Loyalty Points', href: '/customer/loyalty', icon: GiftIcon },
    { nameKey: 'customer.nav.badges', fallback: 'Badges', href: '/customer/badges', icon: TrophyIcon },
    { nameKey: 'customer.nav.referrals', fallback: 'Referrals', href: '/customer/referrals', icon: ShareIcon },
  ]},
  { title: 'nav.section.account', items: [
    { nameKey: 'customer.nav.notifications', fallback: 'Alerts', href: '/customer/notifications', icon: BellIcon },
    { nameKey: 'customer.nav.settings', fallback: 'Settings', href: '/customer/settings', icon: Cog6ToothIcon },
  ]},
];

export const MobileBottomNav: React.FC = () => <MobileTabBar primary={primary} sections={sections} />;

export default MobileBottomNav;
