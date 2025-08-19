import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="mx-auto max-w-md">
          {/* 404 Illustration */}
          <div className="mb-8">
            <div className="text-9xl font-bold text-primary-600">404</div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for. 
            It might have been moved or doesn't exist.
          </p>

          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors"
            >
              <HomeIcon className="w-5 h-5 mr-2" />
              Go Home
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Go Back
            </button>
          </div>

          <div className="mt-12">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Looking for something specific?
            </h2>
            <div className="grid grid-cols-1 gap-4 text-sm">
              <Link to="/search" className="text-primary-600 hover:text-primary-700">
                Browse Services
              </Link>
              <Link to="/auth/register" className="text-primary-600 hover:text-primary-700">
                Sign Up
              </Link>
              <Link to="/help" className="text-primary-600 hover:text-primary-700">
                Help Center
              </Link>
              <Link to="/contact" className="text-primary-600 hover:text-primary-700">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;