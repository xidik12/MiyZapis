import React, { forwardRef } from 'react';
import { useTelegram } from '@/components/telegram/TelegramProvider';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  icon,
  rightElement,
  className = '',
  onFocus,
  onBlur,
  ...props
}, ref) => {
  const { hapticFeedback } = useTelegram();

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    hapticFeedback.selectionChanged();
    onFocus?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    onBlur?.(event);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-primary mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary">
            {icon}
          </div>
        )}
        
        <input
          {...props}
          ref={ref}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`
            input-telegram
            ${icon ? 'pl-10' : ''}
            ${rightElement ? 'pr-10' : ''}
            ${error ? 'border-destructive focus:border-destructive' : ''}
            ${className}
          `}
        />
        
        {rightElement && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';