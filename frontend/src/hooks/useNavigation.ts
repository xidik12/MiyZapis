import { useState, useEffect } from 'react';

export interface NavigationState {
  isSidebarCollapsed: boolean;
  isMobileMenuOpen: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export const useNavigation = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [screenSize, setScreenSize] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
  });

  // Update screen size on window resize
  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      setScreenSize({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
      });
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  // Persist sidebar collapsed state
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // Auto-collapse sidebar on tablet
  useEffect(() => {
    if (screenSize.isTablet && !isSidebarCollapsed) {
      setIsSidebarCollapsed(true);
    }
  }, [screenSize.isTablet, isSidebarCollapsed]);

  // Close mobile menu on route change or screen size change
  useEffect(() => {
    if (!screenSize.isMobile && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [screenSize.isMobile, isMobileMenuOpen]);

  const toggleSidebar = () => {
    if (!screenSize.isMobile) {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return {
    isSidebarCollapsed,
    isMobileMenuOpen,
    ...screenSize,
    toggleSidebar,
    toggleMobileMenu,
    closeMobileMenu,
    setSidebarCollapsed: setIsSidebarCollapsed,
  };
};