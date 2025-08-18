import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTelegram } from '@/components/telegram/TelegramProvider';

export const AuthLayout: React.FC = () => {
  const { viewportHeight } = useTelegram();

  return (
    <div 
      className="flex flex-col bg-primary min-h-screen"
      style={{ minHeight: `${viewportHeight}px` }}
    >
      {/* Main content area without navigation */}
      <main className="flex-1 relative overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};