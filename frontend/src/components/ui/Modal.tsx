import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@/components/icons';
import clsx from 'clsx';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
type ModalPosition = 'center' | 'top' | 'bottom';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: ModalSize;
  position?: ModalPosition;
  /** When false, clicking the backdrop will not close the modal */
  closeOnBackdrop?: boolean;
  /** When false, pressing Escape will not close the modal */
  closeOnEscape?: boolean;
  /** Additional classes for the outer dialog container */
  containerClassName?: string;
  /** Additional classes for the inner content wrapper */
  contentClassName?: string;
  /** Additional classes applied to the overlay element */
  overlayClassName?: string;
  /** Show a default close button in the top-right corner */
  showCloseButton?: boolean;
  /** Accessible label for the close button */
  closeButtonLabel?: string;
  /** aria-labelledby id */
  labelledBy?: string;
  /** aria-label attribute */
  ariaLabel?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full',
};

const positionClasses: Record<ModalPosition, string> = {
  center: 'items-center justify-center',
  top: 'items-start justify-center pt-10 sm:pt-16',
  bottom: 'items-end justify-center pb-10 sm:pb-16',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  size = 'md',
  position = 'center',
  closeOnBackdrop = true,
  closeOnEscape = true,
  containerClassName,
  contentClassName,
  overlayClassName,
  showCloseButton = false,
  closeButtonLabel = 'Close dialog',
  labelledBy,
  ariaLabel,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const body = document.body;
    const originalOverflow = body.style.overflow;
    const originalPaddingRight = body.style.paddingRight;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0 && !originalPaddingRight) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    body.style.overflow = 'hidden';

    return () => {
      body.style.overflow = originalOverflow;
      body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !closeOnEscape) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  const dialog = (
    <div
      className={clsx(
        'fixed inset-0 z-[var(--z-modal,50)]',
        overlayClassName
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-label={ariaLabel}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleOverlayClick}
      />

      <div
        className={clsx(
          'relative min-h-full flex p-4 sm:p-6',
          positionClasses[position]
        )}
      >
        <div
          className={clsx(
            'relative w-full pointer-events-auto',
            sizeClasses[size]
          )}
        >
          <div
            className={clsx(
              'relative flex h-full max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl bg-white text-gray-900 shadow-2xl ring-1 ring-black/5',
              'dark:bg-gray-900 dark:text-gray-100 dark:ring-white/10',
              containerClassName
            )}
            onClick={(event) => event.stopPropagation()}
          >
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-gray-500 shadow transition hover:bg-white hover:text-gray-700 dark:bg-gray-800/70 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                aria-label={closeButtonLabel}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
            <div className={clsx('flex-1 overflow-y-auto', contentClassName)}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
};

export default Modal;
