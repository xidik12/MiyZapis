import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  className?: string;
  overlayClassName?: string;
  preventClose?: boolean;
  position?: 'center' | 'bottom' | 'top';
}

export const MobileModal: React.FC<MobileModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  className,
  overlayClassName,
  preventClose = false,
  position = 'center'
}) => {
  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';

      // Add safe area padding to prevent content from being hidden behind notches
      document.body.style.paddingTop = 'env(safe-area-inset-top)';
      document.body.style.paddingBottom = 'env(safe-area-inset-bottom)';

      return () => {
        document.body.style.overflow = originalStyle;
        document.body.style.paddingTop = '';
        document.body.style.paddingBottom = '';
      };
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !preventClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose, preventClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full'
  };

  const positionClasses = {
    center: 'items-center justify-center',
    bottom: 'items-end justify-center',
    top: 'items-start justify-center pt-16 sm:pt-20'
  };

  const modalContent = (
    <div
      className={clsx(
        'fixed inset-0 z-50 overflow-y-auto',
        overlayClassName
      )}
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-modal="true"
      role="dialog"
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={!preventClose ? onClose : undefined}
      />

      {/* Modal container */}
      <div className={clsx(
        'relative min-h-full flex p-4 sm:p-6',
        positionClasses[position]
      )}>
        {/* Modal content */}
        <div
          className={clsx(
            'relative w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl',
            'transform transition-all duration-300 ease-out',
            'max-h-[90vh] overflow-hidden flex flex-col',
            sizeClasses[size],

            // Mobile-specific positioning
            position === 'bottom' && 'sm:mb-8 rounded-b-none sm:rounded-b-2xl',
            position === 'center' && 'mobile-modal-content',

            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              {title && (
                <h2
                  id="modal-title"
                  className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 pr-8"
                >
                  {title}
                </h2>
              )}

              {showCloseButton && (
                <button
                  onClick={onClose}
                  disabled={preventClose}
                  className={clsx(
                    'mobile-touch-target absolute top-4 right-4 p-2 rounded-lg',
                    'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500',
                    'transition-colors duration-200',
                    preventClose && 'opacity-50 cursor-not-allowed'
                  )}
                  aria-label="Close modal"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto mobile-scroll">
            <div className="p-4 sm:p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

// Hook for easier modal management
export const useMobileModal = (initialState = false) => {
  const [isOpen, setIsOpen] = React.useState(initialState);

  const openModal = React.useCallback(() => setIsOpen(true), []);
  const closeModal = React.useCallback(() => setIsOpen(false), []);
  const toggleModal = React.useCallback(() => setIsOpen(prev => !prev), []);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal
  };
};

export default MobileModal;