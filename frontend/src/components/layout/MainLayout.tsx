import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { SideNavigation } from './SideNavigation';
import { MobileSideNavigation } from './MobileSideNavigation';
import { MobileHeader } from './MobileHeader';
import { NotificationToasts } from '../common/NotificationToasts';
import { useNavigation } from '@/hooks/useNavigation';
import { useAppSelector } from '@/hooks/redux';
import { selectDensity } from '@/store/slices/uiSlice';
import { useLanguage } from '@/contexts/LanguageContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const {
    isSidebarCollapsed,
    isMobileMenuOpen,
    isMobile,
    isTablet,
    isDesktop,
    toggleSidebar,
    toggleMobileMenu,
    closeMobileMenu,
  } = useNavigation();
  const density = useAppSelector(selectDensity);
  const { t } = useLanguage();

  return (
    <div className={`relative min-h-screen flex w-full overflow-x-hidden prevent-overflow text-[rgb(45,37,32)] dark:text-[rgb(242,241,244)] ${density === 'compact' ? 'density-compact' : 'density-comfortable'}`}>
      <a href="#main-content" className="skip-link">{t('layout.skipToContent')}</a>
      {/* Desktop/Tablet Side Navigation */}
      {(isDesktop || isTablet) && (
        <SideNavigation
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />
      )}

      {/* Mobile Side Navigation */}
      <MobileSideNavigation
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
      />

      {/* Main Content Area */}
      <div 
        className={`
          flex flex-col flex-1 min-h-screen transition-all duration-300 ease-in-out
          ${(isDesktop || isTablet) ? (isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64') : ''}
        `}
      >
        {/* Mobile Header - Only show on mobile */}
        {isMobile && (
          <MobileHeader onMenuToggle={toggleMobileMenu} />
        )}

        {/* Desktop Header - Hidden for now, can be used for breadcrumbs or page actions */}
        {(isDesktop || isTablet) && (
          <div className="hidden">
            <Header />
          </div>
        )}

        {/* Main Content */}
        <main
          id="main-content"
          className="flex-1 w-full overflow-x-hidden prevent-overflow mobile-safe-area bg-white/70 dark:bg-white/10 border border-white/30 dark:border-white/10 backdrop-blur-2xl shadow-[0_35px_80px_-45px_rgba(4,0,151,0.4)] transition-all duration-300 rounded-tl-3xl rounded-tr-3xl"
        >
          <div className="w-full prevent-overflow">
            {children}
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Notification Toasts */}
      <NotificationToasts />
    </div>
  );
};
