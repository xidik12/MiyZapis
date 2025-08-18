import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { NotificationToasts } from '../common/NotificationToasts';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <NotificationToasts />
    </div>
  );
};