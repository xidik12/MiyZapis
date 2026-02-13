import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  className?: string;
  hover?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ className, hover = true, children }) => (
  <div
    className={clsx(
      'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-glass',
      hover && 'transition-all duration-200 hover:shadow-xl',
      className
    )}
  >
    {children}
  </div>
);

export default Card;
