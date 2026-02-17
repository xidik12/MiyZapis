import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChevronLeft, Home, ChevronRight } from 'lucide-react';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { RootState } from '@/store';

export const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();

  const userRole = useSelector((state: RootState) => state.auth?.user?.role);

  const homePath = '/';

  const handleBack = () => {
    hapticFeedback.selectionChanged();
    navigate(-1);
  };

  const handleHome = () => {
    hapticFeedback.selectionChanged();
    navigate(homePath);
  };

  const handleForward = () => {
    hapticFeedback.selectionChanged();
    navigate(1);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-secondary/80 backdrop-blur-xl border-t border-white/5 flex justify-around items-center h-14 z-50 safe-bottom">
      <button
        onClick={handleBack}
        className="flex items-center justify-center w-16 h-full text-text-muted hover:text-text-secondary active:scale-90 transition-all"
        type="button"
      >
        <ChevronLeft size={24} strokeWidth={2} />
      </button>

      <button
        onClick={handleHome}
        className="flex items-center justify-center w-16 h-full text-accent-primary active:scale-90 transition-all"
        type="button"
      >
        <Home size={24} strokeWidth={2} />
      </button>

      <button
        onClick={handleForward}
        className="flex items-center justify-center w-16 h-full text-text-muted hover:text-text-secondary active:scale-90 transition-all"
        type="button"
      >
        <ChevronRight size={24} strokeWidth={2} />
      </button>
    </nav>
  );
};
