import React from 'react';
import { Link } from 'react-router-dom';
import { ListIcon as Bars3Icon } from '@/components/icons';
import { environment } from '@/config/environment';

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
          className="flex items-center space-x-2 group"
        >
          <img 
            src="/miyzapis_logo.png" 
            alt="МійЗапис Logo" 
            className="w-8 h-8 group-hover:scale-110 transition-all duration-300"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              const currentSrc = img.src;
              
              if (currentSrc.includes('miyzapis_logo.png')) {
                console.log('🖼️ Mobile primary logo failed, trying SVG fallback');
                img.src = '/logo.svg';
              } else if (currentSrc.includes('logo.svg')) {
                console.log('🖼️ Mobile SVG logo failed, trying favicon fallback');
                img.src = '/favicon.svg';
              } else {
                console.log('🖼️ Mobile all logos failed, replacing with app name');
                img.style.display = 'none';
                // Add app name as fallback
                const parent = img.parentElement;
                if (parent && !parent.querySelector('.logo-fallback')) {
                  const fallback = document.createElement('div');
                  fallback.className = 'logo-fallback w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center text-xs font-bold';
                  fallback.textContent = 'МЗ';
                  parent.insertBefore(fallback, img);
                }
              }
            }}
            onLoad={() => console.log('✅ Mobile logo loaded successfully')}
          />
          <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
            {environment.APP_NAME}
          </span>
        </Link>

        {/* Mobile menu button */}
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 mobile-touch-target"
          aria-label="Open navigation menu"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
};