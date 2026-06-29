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
          <img
            src="/miyzapis-logo-full.png"
            alt={environment.APP_NAME}
            className="h-12 w-auto"
          />
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
          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition duration-200 active:scale-[0.96]"
        >
          ← {/* Back to home */}
          <span className="ml-1">Back to home</span>
        </Link>
      </div>
    </div>
  );
};