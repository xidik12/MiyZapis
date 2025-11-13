import React from 'react';
import { Link } from 'react-router-dom';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/LanguageContext';
import { Logo } from '../common/Logo';

interface MobileHeaderProps {
  onMenuToggle: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuToggle }) => {
  const { t } = useLanguage();

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-40 border-b border-[rgba(223,214,207,0.35)] dark:border-[rgba(90,70,110,0.55)] backdrop-blur-lg"
      style={{
        background: 'rgba(var(--bg-primary), 0.82)',
      }}
    >
      <div className="flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <Logo size="sm" showText />

        {/* Mobile menu button */}
        <button
          onClick={onMenuToggle}
          className="p-2.5 rounded-2xl bg-white/60 dark:bg-[rgba(35,28,52,0.8)] border border-[rgba(223,214,207,0.45)] dark:border-[rgba(90,70,110,0.55)] text-[rgb(92,83,77)] dark:text-[rgb(206,199,216)] hover:-translate-y-0.5 hover:shadow-primary transition-all duration-300 mobile-touch-target"
          aria-label="Open navigation menu"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
};
