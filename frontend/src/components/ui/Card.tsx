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
      'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl',
      hover && 'hover-lift hover:border-gray-300 dark:hover:border-gray-700',
      className
    )}
  >
    {children}
  </div>
);

export default Card;
