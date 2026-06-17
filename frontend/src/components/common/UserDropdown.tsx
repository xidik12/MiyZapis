import React from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '@/hooks/redux';
import { selectUser } from '@/store/slices/authSlice';
import { UserCircleIcon, CalendarIcon, CogIcon, HeartIcon, QuestionMarkCircleIcon, ArrowRightOnRectangleIcon, ChartBarIcon, WrenchScrewdriverIcon, BuildingStorefrontIcon } from '@/components/icons';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const UserDropdown: React.FC<UserDropdownProps> = ({
  isOpen,
  onClose,
  onLogout,
}) => {
  const user = useAppSelector(selectUser);
  const { t } = useLanguage();

  if (!isOpen || !user) return null;

  const handleLinkClick = () => {
    onClose();
  };

  const customerMenuItems = [
    { icon: CalendarIcon, label: t('userMenu.bookings'), href: '/bookings' },
    { icon: UserCircleIcon, label: t('userMenu.profile'), href: '/profile' },
    { icon: HeartIcon, label: t('userMenu.favorites'), href: '/favorites' },
    { icon: CogIcon, label: t('userMenu.settings'), href: '/settings' },
    { icon: QuestionMarkCircleIcon, label: t('userMenu.help'), href: '/help' },
  ];

  const specialistMenuItems = [
    { icon: ChartBarIcon, label: t('userMenu.dashboard'), href: '/specialist/dashboard' },
    { icon: CalendarIcon, label: t('userMenu.bookings'), href: '/specialist/bookings' },
    { icon: WrenchScrewdriverIcon, label: t('userMenu.specialistDashboard'), href: '/specialist/services' },
    { icon: BuildingStorefrontIcon, label: t('userMenu.profile'), href: '/specialist/profile' },
    { icon: ChartBarIcon, label: t('userMenu.dashboard'), href: '/specialist/analytics' },
    { icon: CogIcon, label: t('userMenu.settings'), href: '/specialist/settings' },
    { icon: QuestionMarkCircleIcon, label: t('userMenu.help'), href: '/help' },
  ];

  const menuItems = user.userType === 'specialist' ? specialistMenuItems : customerMenuItems;

  return (
    <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1rem)] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-[60] overflow-hidden">
      {/* User info */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
        <div className="flex items-center space-x-3">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={`${user.firstName} ${user.lastName}`}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <UserCircleIcon className="w-10 h-10 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            {user.userType === 'customer' && (user.loyaltyPoints || 0) > 0 && (
              <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                {user.loyaltyPoints} points
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="py-1.5">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            onClick={handleLinkClick}
            className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <item.icon className="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Logout */}
      <div className="border-t border-gray-100 dark:border-gray-800 py-1.5">
        <button
          onClick={() => {
            onLogout();
            onClose();
          }}
          className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3 flex-shrink-0" />
          {t('userMenu.signOut')}
        </button>
      </div>
    </div>
  );
};