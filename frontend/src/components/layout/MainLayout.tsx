import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { NotificationToasts } from '../common/NotificationToasts';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col w-full overflow-x-hidden">
      <Header />
      <main className="flex-1 w-full overflow-x-hidden">
        {children}
      </main>
      <Footer />
      <NotificationToasts />
    </div>
  );
};