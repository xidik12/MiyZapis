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
  sm: 'text-sm rounded-md',
  md: 'text-sm rounded-lg',
  lg: 'text-base rounded-lg',
};

const variants: Record<Variant, string> = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 disabled:bg-gray-400',
  secondary:
    'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700',
  ghost:
    'bg-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
  destructive:
    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  subtle:
    'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-primary-900/20 dark:text-primary-300',
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
        'btn inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed',
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
