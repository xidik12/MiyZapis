import React from 'react';
import { clsx } from 'clsx';

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
    'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 disabled:bg-gray-400 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:scale-105',
  secondary:
    'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 backdrop-blur-sm hover:scale-105',
  ghost:
    'bg-transparent text-gray-700 hover:bg-gray-100/80 dark:text-gray-300 dark:hover:bg-gray-800/80 hover:scale-105',
  destructive:
    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 hover:scale-105',
  subtle:
    'bg-primary-50/80 text-primary-700 hover:bg-primary-100/80 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/40 backdrop-blur-sm hover:scale-105',
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
        'btn inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100',
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
        <span className="mr-2 inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
      {rightIcon && <span className="ml-2 -mr-1">{rightIcon}</span>}
    </button>
  );
};

export default Button;
