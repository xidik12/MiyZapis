import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTelegram } from '@/components/telegram/TelegramProvider';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  height?: 'auto' | 'half' | 'full';
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  height = 'auto'
}) => {
  const { hapticFeedback } = useTelegram();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    hapticFeedback.impactLight();
    onClose();
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  const heightClasses = {
    auto: 'max-h-[80vh]',
    half: 'h-1/2',
    full: 'h-full rounded-t-none'
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <div className="sheet-overlay animate-fade-in" onClick={handleBackdropClick} />
      <div className={`sheet-content animate-slide-up ${heightClasses[height]}`}>
        {/* Handle */}
        <div className="sheet-handle" />

        {/* Title */}
        {title && (
          <div className="px-4 pb-3">
            <h2 className="text-lg font-semibold text-primary">{title}</h2>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {children}
        </div>
      </div>
    </>,
    document.body
  );
};