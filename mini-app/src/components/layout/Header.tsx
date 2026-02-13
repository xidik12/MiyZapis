import React from 'react';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { useTelegram } from '@/components/telegram/TelegramProvider';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  showMenuButton?: boolean;
  onBack?: () => void;
  onMenu?: () => void;
  rightContent?: React.ReactNode;
  leftContent?: React.ReactNode;
  transparent?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  showMenuButton = false,
  onBack,
  onMenu,
  rightContent,
  leftContent,
  transparent = false,
}) => {
  const { hapticFeedback } = useTelegram();

  const handleBack = () => {
    hapticFeedback.impactLight();
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  const handleMenu = () => {
    hapticFeedback.impactLight();
    onMenu?.();
  };

  return (
    <header
      className={`
        flex items-center justify-between px-4 py-3 safe-top
        ${transparent ? 'bg-transparent' : 'bg-bg-secondary/90 backdrop-blur-lg border-b border-white/5'}
      `}
    >
      {/* Left side */}
      <div className="flex items-center gap-3 flex-1">
        {showBackButton && (
          <button
            onClick={handleBack}
            className="p-2 -ml-2 touch-manipulation rounded-lg hover:bg-bg-hover transition-colors"
            type="button"
          >
            <ArrowLeft size={20} className="text-text-primary" />
          </button>
        )}

        {leftContent && (
          <div className="flex items-center">
            {leftContent}
          </div>
        )}

        {(title || subtitle) && (
          <div className="flex flex-col min-w-0 flex-1">
            {title && (
              <h1 className="text-lg font-semibold text-text-primary truncate">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xs text-text-secondary truncate">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {rightContent}

        {showMenuButton && (
          <button
            onClick={handleMenu}
            className="p-2 touch-manipulation rounded-lg hover:bg-bg-hover transition-colors"
            type="button"
          >
            <MoreVertical size={20} className="text-text-secondary" />
          </button>
        )}
      </div>
    </header>
  );
};
