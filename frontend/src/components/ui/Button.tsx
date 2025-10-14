import React from 'react';
import { clsx } from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'accent' | 'glass' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const sizes: Record<Size, string> = {
  sm: 'text-sm rounded-lg px-4 py-2 min-h-[40px]',
  md: 'text-base rounded-xl px-6 py-3 min-h-[48px]',
  lg: 'text-lg rounded-2xl px-8 py-4 min-h-[56px]',
  xl: 'text-xl rounded-2xl px-10 py-5 min-h-[64px]',
};

const variants: Record<Variant, string> = {
  // Hot Pink Primary - Bold Gen-Z
  primary: clsx(
    'relative overflow-hidden text-white font-semibold bg-primary-gradient shadow-lg shadow-primary-500/25',
    'hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-1 hover:scale-[1.02]',
    'active:scale-95 transition-all duration-200',
    'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
    'before:absolute before:inset-0 before:bg-gradient-to-t before:from-white/0 before:to-white/20',
    'before:opacity-0 before:transition-opacity before:duration-200 hover:before:opacity-100'
  ),

  // Cyan Accent - Tech-forward
  accent: clsx(
    'relative overflow-hidden text-secondary-900 dark:text-secondary-900 font-semibold bg-accent-gradient shadow-lg shadow-accent-500/25',
    'hover:shadow-xl hover:shadow-accent-500/40 hover:-translate-y-1 hover:scale-[1.02]',
    'active:scale-95 transition-all duration-200',
    'focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2',
    'before:absolute before:inset-0 before:bg-gradient-to-t before:from-white/0 before:to-white/20',
    'before:opacity-0 before:transition-opacity before:duration-200 hover:before:opacity-100'
  ),

  // Glass-morphism - Modern & Clean
  glass: clsx(
    'relative overflow-hidden backdrop-blur-xl bg-white/10 dark:bg-white/5',
    'border border-white/20 dark:border-white/10',
    'text-secondary-900 dark:text-white font-semibold shadow-lg',
    'hover:bg-white/20 dark:hover:bg-white/10 hover:-translate-y-1 hover:scale-[1.02]',
    'active:scale-95 transition-all duration-200',
    'focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2',
    'before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/30 before:to-transparent',
    'before:opacity-0 before:transition-opacity before:duration-200 hover:before:opacity-100'
  ),

  // Outline - Minimal
  outline: clsx(
    'relative overflow-hidden bg-transparent border-2 border-primary-500',
    'text-primary-500 font-semibold',
    'hover:bg-primary-500/10 hover:-translate-y-0.5',
    'active:scale-95 transition-all duration-200',
    'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2'
  ),

  // Secondary - Subtle
  secondary: clsx(
    'relative overflow-hidden backdrop-blur-lg bg-secondary-50 dark:bg-secondary-900/20',
    'border border-secondary-200 dark:border-secondary-700',
    'text-secondary-900 dark:text-secondary-100 font-semibold',
    'hover:bg-secondary-100 dark:hover:bg-secondary-900/30 hover:-translate-y-0.5',
    'active:scale-95 transition-all duration-200',
    'focus-visible:ring-2 focus-visible:ring-secondary-400 focus-visible:ring-offset-2'
  ),

  // Ghost - Minimal interaction
  ghost: clsx(
    'relative overflow-hidden bg-transparent text-secondary-600 dark:text-secondary-300',
    'hover:bg-secondary-100/50 dark:hover:bg-white/5',
    'active:scale-95 transition-all duration-150',
    'focus-visible:ring-2 focus-visible:ring-secondary-400/50 focus-visible:ring-offset-2'
  ),

  // Destructive - Soft Red
  destructive: clsx(
    'relative overflow-hidden text-white font-semibold bg-gradient-to-r from-error-500 to-error-600',
    'shadow-lg shadow-error-500/25',
    'hover:shadow-xl hover:shadow-error-500/40 hover:-translate-y-1 hover:scale-[1.02]',
    'active:scale-95 transition-all duration-200',
    'focus-visible:ring-2 focus-visible:ring-error-500 focus-visible:ring-offset-2',
    'before:absolute before:inset-0 before:bg-gradient-to-t before:from-white/0 before:to-white/20',
    'before:opacity-0 before:transition-opacity before:duration-200 hover:before:opacity-100'
  ),
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  ...props
}) => {
  return (
    <button
      className={clsx(
        'relative inline-flex items-center justify-center gap-2',
        'focus:outline-none touch-action-manipulation select-none',
        '-webkit-tap-highlight-color-transparent',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:transform-none',
        sizes[size],
        variants[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {/* Animated shimmer effect on hover */}
      <span className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none">
        <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </span>

      {leftIcon && <span className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">{leftIcon}</span>}

      {loading ? (
        <span className="flex-shrink-0 inline-block h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : null}

      <span className="flex-1 relative z-10">{children}</span>

      {rightIcon && <span className="flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5">{rightIcon}</span>}
    </button>
  );
};

export default Button;
