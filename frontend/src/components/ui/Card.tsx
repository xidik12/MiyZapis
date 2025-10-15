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
        'border-2 border-transparent',
        'shadow-lg shadow-black/5 dark:shadow-black/20',
        // Gold gradient border overlay
        'before:absolute before:inset-0 before:rounded-[inherit] before:p-[2px]',
        'before:bg-gradient-to-br before:from-amber-400/60 before:via-yellow-300/40 before:to-amber-500/60',
        'before:opacity-70 before:pointer-events-none before:-z-10',
        'before:dark:from-amber-400/40 before:dark:via-yellow-400/30 before:dark:to-amber-500/40',
        // Shine effect on top
        'after:absolute after:top-0 after:left-0 after:right-0 after:h-[40%]',
        'after:bg-gradient-to-b after:from-amber-200/40 after:to-transparent',
        'after:opacity-0 after:transition-opacity after:duration-300',
        'after:pointer-events-none',
        hover && [
          'hover:after:opacity-100',
          'hover:shadow-xl hover:shadow-amber-500/20 dark:hover:shadow-amber-500/30',
          'hover:-translate-y-1 hover:scale-[1.01]',
          'cursor-pointer',
          'hover:before:opacity-100'
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
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 via-yellow-300/10 to-amber-500/10 blur-3xl animate-pulse" />
      </div>
    )}

    {/* Content */}
    <div className="relative z-10">
      {children}
    </div>
  </div>
);

export default Card;
