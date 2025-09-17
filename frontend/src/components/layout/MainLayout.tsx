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

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 flex w-full overflow-x-hidden prevent-overflow ${density === 'compact' ? 'density-compact' : 'density-comfortable'}`}>
      <a href="#main-content" className="skip-link">Skip to content</a>
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
        <main id="main-content" className="flex-1 w-full overflow-x-hidden prevent-overflow mobile-safe-area">
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
