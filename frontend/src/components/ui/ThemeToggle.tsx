import React from 'react';
import { SunIcon, MoonIcon } from '@/components/icons';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '', 
  size = 'md' 
}) => {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'h-8 w-8 p-1.5',
    md: 'h-10 w-10 p-2',
    lg: 'h-12 w-12 p-2.5'
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center justify-center
        transition-all duration-300
        hover:scale-110 active:scale-95
        group
        ${sizeClasses[size]}
        ${className}
      `}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative">
        {/* Sun Icon */}
        <SunIcon 
          className={`
            ${iconSizeClasses[size]}
            text-yellow-500 dark:text-yellow-400 transition-all duration-300
            hover:text-yellow-600 dark:hover:text-yellow-300
            ${theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'}
            absolute inset-0
          `}
        />
        
        {/* Moon Icon */}
        <MoonIcon 
          className={`
            ${iconSizeClasses[size]}
            text-blue-500 dark:text-blue-400 transition-all duration-300
            hover:text-blue-600 dark:hover:text-blue-300
            ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}
            absolute inset-0
          `}
        />
      </div>
    </button>
  );
};