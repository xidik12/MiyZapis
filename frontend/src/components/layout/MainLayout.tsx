import React from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { NotificationToasts } from '../common/NotificationToasts';
import { useAppSelector } from '@/hooks/redux';
import { selectDensity } from '@/store/slices/uiSlice';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * Public / marketing layout — top horizontal header, full-width content.
 * (Authenticated customer/specialist dashboards use their own sidebar layouts.)
 */
export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const density = useAppSelector(selectDensity);

  return (
    <div className={`min-h-screen bg-white dark:bg-gray-950 flex flex-col w-full overflow-x-clip prevent-overflow ${density === 'compact' ? 'density-compact' : 'density-comfortable'}`}>
      <a href="#main-content" className="skip-link">Skip to content</a>

      {/* Top navigation — responsive (Header has its own mobile menu) */}
      <Header />

      {/* Main Content */}
      <main id="main-content" className="flex-1 w-full overflow-x-clip prevent-overflow mobile-safe-area">
        <div className="w-full prevent-overflow">
          <div key={location.pathname} className="page-enter">
            {children}
          </div>
        </div>
      </main>

      <Footer />

      <NotificationToasts />
    </div>
  );
};
