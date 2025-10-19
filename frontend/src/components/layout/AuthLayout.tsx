import React from 'react';
import { Link } from 'react-router-dom';
import { environment } from '@/config/environment';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

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
        <Link to="/" className="flex justify-center mb-6 group">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-panhaha-gradient shadow-lg shadow-primary-500/25 flex items-center justify-center text-white font-bold text-2xl font-display group-hover:shadow-xl group-hover:shadow-primary-500/40 group-hover:-translate-y-1 group-hover:rotate-3 transition-all duration-300">
              <span>{brandInitial}</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-2xl font-display font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent group-hover:scale-[1.02] transition-transform duration-300">
                {brandName}
              </span>
              <span className="text-xs font-medium text-secondary-500 dark:text-secondary-400 tracking-wide">
                Connect & Book
              </span>
            </div>
          </div>
        </Link>
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
