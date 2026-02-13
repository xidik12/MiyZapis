import React from 'react';
import { Link } from 'react-router-dom';
import { ListIcon as Bars3Icon } from '@/components/icons';
import { environment } from '@/config/environment';
import { LanguageToggle } from '../ui/LanguageToggle';
import { Logo } from '@/components/ui/Logo';

interface MobileHeaderProps {
  onMenuToggle: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuToggle }) => {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/20 dark:border-gray-700/20">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center space-x-2 group flex-shrink-0"
        >
          <Logo size="md" />
          <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
            {environment.APP_NAME}
          </span>
        </Link>

        {/* Right side: Language toggle + Menu button */}
        <div className="flex items-center space-x-2">
          <LanguageToggle />
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200 mobile-touch-target"
            aria-label="Open navigation menu"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
};