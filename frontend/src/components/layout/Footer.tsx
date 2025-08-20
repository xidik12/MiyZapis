import React from 'react';
import { Link } from 'react-router-dom';
import { environment } from '@/config/environment';
import { useLanguage } from '@/contexts/LanguageContext';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  const footerLinks = {
    company: [
      { name: t('footer.aboutUs'), href: '/about' },
      { name: t('footer.careers'), href: '/careers' },
      { name: t('footer.contact'), href: '/contact' },
      { name: t('footer.blog'), href: '/blog' },
    ],
    support: [
      { name: t('footer.helpCenter'), href: '/help' },
      { name: t('footer.safety'), href: '/safety' },
      { name: t('footer.communityGuidelines'), href: '/guidelines' },
      { name: t('footer.termsOfService'), href: '/terms' },
    ],
    legal: [
      { name: t('footer.privacyPolicy'), href: '/privacy' },
      { name: t('footer.cookiePolicy'), href: '/cookies' },
      { name: t('footer.accessibility'), href: '/accessibility' },
      { name: t('footer.disputeResolution'), href: '/disputes' },
    ],
    specialists: [
      { name: t('footer.joinAsSpecialist'), href: '/auth/register?type=specialist' },
      { name: t('footer.specialistResources'), href: '/specialist-resources' },
      { name: t('footer.successStories'), href: '/success-stories' },
      { name: t('footer.community'), href: '/community' },
    ],
  };

  return (
    <footer className="bg-gray-900 text-white w-full prevent-overflow">
      <div className="max-w-7xl mx-auto mobile-container py-6 xs:py-8 sm:py-12 prevent-overflow">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 xs:gap-6 sm:gap-8">
          {/* Company */}
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3 sm:mb-4">
              {t('footer.company')}
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-white text-xs sm:text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3 sm:mb-4">
              {t('footer.support')}
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-white text-xs sm:text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3 sm:mb-4">
              {t('footer.legal')}
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-white text-xs sm:text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Specialists */}
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3 sm:mb-4">
              {t('footer.forSpecialists')}
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.specialists.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-white text-xs sm:text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Brand and social */}
        <div className="mt-6 xs:mt-8 sm:mt-12 pt-4 xs:pt-6 sm:pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 xs:w-8 xs:h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs xs:text-sm">М</span>
              </div>
              <span className="text-lg xs:text-xl font-bold">{environment.APP_NAME}</span>
            </div>

            {/* Social links */}
            <div className="flex space-x-3 xs:space-x-4 sm:space-x-6">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987c6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.73-3.016-1.801L4.16 17.07l1.773-1.772c1.048.95 2.438 1.526 3.959 1.526c3.176 0 5.754-2.578 5.754-5.754S12.068 5.316 8.892 5.316c-1.297 0-2.448.73-3.016 1.801l-1.273-1.883 1.773 1.772c-1.048-.95-2.438-1.526-3.959-1.526-3.176 0-5.754 2.578-5.754 5.754s2.578 5.754 5.754 5.754z"/>
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
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