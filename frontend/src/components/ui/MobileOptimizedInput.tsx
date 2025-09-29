import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

interface MobileOptimizedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'floating';
}

export const MobileOptimizedInput = forwardRef<HTMLInputElement, MobileOptimizedInputProps>(
  ({
    label,
    error,
    helper,
    leftIcon,
    rightIcon,
    variant = 'default',
    className,
    type = 'text',
    ...props
  }, ref) => {
    const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={clsx('w-full', className)}>
        {/* Standard Label */}
        {label && variant === 'default' && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-gray-400">
                {leftIcon}
              </div>
            </div>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={clsx(
              // Base styles
              'w-full border border-gray-300 dark:border-gray-600 rounded-lg',
              'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
              'placeholder:text-gray-500 dark:placeholder:text-gray-400',

              // Mobile-optimized sizing
              'text-base', // Prevents zoom on iOS (must be 16px+)
              'px-4 py-3', // Comfortable touch targets (min 44px height)
              'min-h-[48px]', // Ensure minimum touch target size

              // Focus states
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'focus-visible:ring-2 focus-visible:ring-primary-500',

              // Disabled states
              'disabled:bg-gray-50 dark:disabled:bg-gray-900',
              'disabled:text-gray-500 dark:disabled:text-gray-400',
              'disabled:cursor-not-allowed',

              // Error states
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500',

              // Icon padding adjustments
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',

              // Floating label variant
              variant === 'floating' && 'placeholder-transparent peer'
            )}
            {...props}
          />

          {/* Floating Label */}
          {label && variant === 'floating' && (
            <label
              htmlFor={inputId}
              className={clsx(
                'absolute left-4 transition-all duration-200 pointer-events-none',
                'peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500',
                'peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary-600',
                'peer-valid:top-2 peer-valid:text-xs peer-valid:text-gray-600',
                props.value && 'top-2 text-xs text-gray-600 dark:text-gray-400',
                leftIcon && 'peer-placeholder-shown:left-10 peer-focus:left-4 peer-valid:left-4'
              )}
            >
              {label}
            </label>
          )}

          {/* Right Icon */}
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-gray-400">
                {rightIcon}
              </div>
            </div>
          )}
        </div>

        {/* Helper Text */}
        {helper && !error && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {helper}
          </p>
        )}

        {/* Error Message */}
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

MobileOptimizedInput.displayName = 'MobileOptimizedInput';

export default MobileOptimizedInput;