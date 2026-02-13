import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';
import { useTelegram } from '@/components/telegram/TelegramProvider';

export const MainLayout: React.FC = () => {
  const { viewportHeight } = useTelegram();
  const location = useLocation();

  return (
    <div
      className="flex flex-col bg-bg-primary min-h-screen text-text-primary"
      style={{ minHeight: `${viewportHeight}px` }}
    >
      <main className="flex-1 relative overflow-hidden pb-16">
        <div key={location.pathname} className="page-enter">
          <Outlet />
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};
