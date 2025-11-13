import React from 'react';
import { Link } from 'react-router-dom';
import { environment } from '@/config/environment';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Logo } from '../common/Logo';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const brandName = environment.APP_NAME;
  const brandInitial = brandName.trim().charAt(0).toUpperCase() || 'H';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
      {/* Theme toggle in top-right corner */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Logo section - responsive sizing */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Logo size="lg" showText showTagline />
        </div>
      </div>

      {/* Main form container - improved mobile responsiveness */}
      <div className="sm:mx-auto sm:w-full sm:max-w-3xl w-full">
        <div className="bg-white dark:bg-gray-800 py-6 px-4 shadow-lg sm:rounded-xl sm:px-10 sm:py-8">
          {children}
        </div>
      </div>

      {/* Back to home link - better mobile spacing */}
      <div className="mt-4 sm:mt-6 text-center">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors duration-200"
        >
          <span aria-hidden="true">←</span>
          <span className="ml-1">Back to home</span>
        </Link>
      </div>
    </div>
  );
};
