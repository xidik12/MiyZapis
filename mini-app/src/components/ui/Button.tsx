import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { useTelegram } from '@/components/telegram/TelegramProvider';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  onClick,
  children,
  className = '',
  ...props
}) => {
  const { hapticFeedback } = useTelegram();

  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 touch-manipulation focus:outline-none';
  
  const variantClasses = {
    primary: 'btn-telegram',
    secondary: 'btn-telegram-secondary',
    destructive: 'btn-telegram-destructive',
    ghost: 'bg-transparent text-accent hover:bg-secondary active:bg-secondary/80'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm rounded-lg min-h-[36px]',
    md: 'px-4 py-3 text-base rounded-xl min-h-[44px]',
    lg: 'px-6 py-4 text-lg rounded-xl min-h-[52px]'
  };

  const widthClass = fullWidth ? 'w-full' : '';
  
  const isDisabled = disabled || loading;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!isDisabled && onClick) {
      hapticFeedback.impactLight();
      onClick(event);
    }
  };

  return (
    <button
      {...props}
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClass}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {loading && <LoadingSpinner size="sm" className="mr-2" />}
      {children}
    </button>
  );
};