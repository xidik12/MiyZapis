import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';
import { useTelegram } from '@/components/telegram/TelegramProvider';

export const MainLayout: React.FC = () => {
  const { viewportHeight } = useTelegram();

  return (
    <div 
      className="flex flex-col bg-primary min-h-screen"
      style={{ minHeight: `${viewportHeight}px` }}
    >
      {/* Main content area */}
      <main className="flex-1 relative overflow-hidden">
        <Outlet />
      </main>

      {/* Bottom navigation - only show for authenticated users */}
      <BottomNavigation />
    </div>
  );
};