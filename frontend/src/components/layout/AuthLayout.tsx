import React from 'react';
import { Link } from 'react-router-dom';
import { environment } from '@/config/environment';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
      {/* Theme toggle in top-right corner */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Logo section - responsive sizing */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 sm:w-8 sm:h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-base sm:text-sm">M</span>
            </div>
            <span className="text-2xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {environment.APP_NAME}
            </span>
          </div>
        </Link>
      </div>

      {/* Main form container - improved mobile responsiveness */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md w-full">
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
          ← {/* Back to home */}
          <span className="ml-1">Back to home</span>
        </Link>
      </div>
    </div>
  );
};