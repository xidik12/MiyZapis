import React from 'react';
import { clsx } from 'clsx';
import { InlineLoader } from './InlineLoader';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'subtle';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const sizes: Record<Size, string> = {
  sm: 'text-sm rounded-xl',
  md: 'text-sm rounded-xl',
  lg: 'text-base rounded-xl',
};

const variants: Record<Variant, string> = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 disabled:bg-gray-400',
  secondary:
    'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-800 hover:border-gray-300 hover:bg-gray-50 dark:hover:border-gray-700 dark:hover:bg-gray-800',
  ghost:
    'bg-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
  destructive:
    'bg-error-600 text-white hover:bg-error-700 active:bg-error-800',
  subtle:
    'bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  className,
  children,
  ...props
}) => {
  return (
    <button
      className={clsx(
        'btn inline-flex items-center justify-center font-semibold transition-colors duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        sizes[size],
        variants[variant],
        className
      )}
      style={{
        height: `var(--control-h-${size})`,
        padding: 'var(--control-py) var(--control-px)'
      }}
      {...props}
    >
      {leftIcon && <span className="mr-2 -ml-1">{leftIcon}</span>}
      {loading && (
        <InlineLoader size="sm" color="current" className="mr-2" />
      )}
      {children}
      {rightIcon && <span className="ml-2 -mr-1">{rightIcon}</span>}
    </button>
  );
};

export default Button;
