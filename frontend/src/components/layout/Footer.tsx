import React from 'react';
import { Link } from 'react-router-dom';
import { environment } from '@/config/environment';
import { useLanguage } from '@/contexts/LanguageContext';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  const footerLinks = {
    specialists: [
      { name: t('footer.joinAsSpecialist'), href: '/auth/register?type=specialist' },
    ],
  };

  return (
    <footer className="bg-gray-900 text-white w-full prevent-overflow">
      <div className="max-w-7xl mx-auto mobile-container py-6 xs:py-8 sm:py-12 prevent-overflow">
        <div className="text-center mb-6 xs:mb-8">
          {/* For Specialists */}
          <div className="inline-block">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3 sm:mb-4">
              {t('footer.forSpecialists')}
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.specialists.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="block text-gray-400 hover:text-white text-sm sm:text-base transition-all duration-200 px-4 py-2 rounded-xl hover:bg-gray-800/50"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Legal & Contact links */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-6 xs:mb-8">
          <Link
            to="/terms"
            className="text-gray-400 hover:text-white text-sm sm:text-base transition-all duration-200 px-3 py-1.5 rounded-xl hover:bg-gray-800/50"
          >
            {t('footer.termsOfService')}
          </Link>
          <Link
            to="/privacy"
            className="text-gray-400 hover:text-white text-sm sm:text-base transition-all duration-200 px-3 py-1.5 rounded-xl hover:bg-gray-800/50"
          >
            {t('footer.privacyPolicy')}
          </Link>
          <Link
            to="/contact"
            className="text-gray-400 hover:text-white text-sm sm:text-base transition-all duration-200 px-3 py-1.5 rounded-xl hover:bg-gray-800/50"
          >
            {t('footer.contactUs')}
          </Link>
        </div>

        {/* Brand and social */}
        <div className="mt-6 xs:mt-8 sm:mt-12 pt-4 xs:pt-6 sm:pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 xs:w-8 xs:h-8 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                <span className="text-white font-bold text-xs xs:text-sm">М</span>
              </div>
              <span className="text-lg xs:text-xl font-bold">{environment.APP_NAME}</span>
            </div>

            {/* Social links - add URLs when social accounts are created */}
          </div>

          <div className="mt-4 xs:mt-6 sm:mt-8 text-center md:text-left">
            <p className="text-gray-400 text-xs sm:text-sm">
              © {currentYear} {environment.APP_NAME}. {t('footer.allRightsReserved')} 
              <span className="hidden sm:inline"> • Version {environment.APP_VERSION}</span>
            </p>
            <p className="text-gray-500 text-xs mt-1 sm:mt-2">
              {t('footer.tagline')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};