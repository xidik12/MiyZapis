import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  className?: string;
  hover?: boolean;
  glass?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  className,
  hover = true,
  glass = true,
  children,
  onClick
}) => (
  <div
    onClick={onClick}
    className={clsx(
      'relative overflow-hidden transition-all duration-300 group',
      glass ? [
        // Glass-morphism effect
        'backdrop-blur-xl bg-white/60 dark:bg-white/5',
        'border border-white/20 dark:border-white/10',
        'shadow-lg shadow-black/5 dark:shadow-black/20',
        // Glass gradient border overlay
        'before:absolute before:inset-0 before:rounded-[inherit] before:p-[1px]',
        'before:bg-gradient-to-br before:from-white/40 before:via-transparent before:to-transparent',
        'before:opacity-50 before:pointer-events-none',
        // Shine effect on top
        'after:absolute after:top-0 after:left-0 after:right-0 after:h-[40%]',
        'after:bg-gradient-to-b after:from-white/30 after:to-transparent',
        'after:opacity-0 after:transition-opacity after:duration-300',
        'after:pointer-events-none',
        hover && [
          'hover:after:opacity-100',
          'hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30',
          'hover:-translate-y-1 hover:scale-[1.01]',
          'cursor-pointer'
        ]
      ] : [
        // Standard card (non-glass)
        'bg-white dark:bg-secondary-900/20',
        'border border-secondary-200 dark:border-secondary-700',
        'shadow-md',
        hover && [
          'hover:shadow-lg',
          'hover:-translate-y-0.5',
          'cursor-pointer'
        ]
      ],
      'rounded-2xl p-6',
      'active:scale-[0.99]',
      className
    )}
  >
    {/* Animated gradient orb on hover */}
    {glass && hover && (
      <div className="absolute -inset-[100%] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-accent-500/10 to-primary-500/10 blur-3xl animate-pulse" />
      </div>
    )}

    {/* Content */}
    <div className="relative z-10">
      {children}
    </div>
  </div>
);

export default Card;
