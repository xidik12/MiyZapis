import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'ukraine' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  glow?: boolean;
  float?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    rounded = 'lg',
    glow = false,
    float = false,
    children,
    disabled,
    ...props
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-primary hover:shadow-lg hover:-translate-y-0.5',
      secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-500 shadow-secondary hover:shadow-lg hover:-translate-y-0.5',
      outline: 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 focus:ring-primary-500',
      ghost: 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500',
      ukraine: 'ukraine-gradient text-white hover:scale-105 focus:ring-primary-500 shadow-lg hover:shadow-xl',
      gradient: 'bg-gradient-to-r from-primary-600 to-secondary-500 text-white hover:from-primary-700 hover:to-secondary-600 focus:ring-primary-500 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
      xl: 'px-8 py-4 text-lg'
    };

    const roundedClasses = {
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full'
    };

    const glowClass = glow ? (variant === 'ukraine' || variant === 'gradient' ? 'glow-primary' : '') : '';
    const floatClass = float ? 'float-animation' : '';

    return (
      <button
        ref={ref}
        className={clsx(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          roundedClasses[rounded],
          glowClass,
          floatClass,
          {
            'w-full': fullWidth,
            'opacity-50 cursor-not-allowed': disabled || isLoading,
            'hover:scale-105': variant === 'ukraine' || variant === 'gradient',
          },
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {leftIcon && !isLoading && leftIcon}
        {children}
        {rightIcon && !isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };