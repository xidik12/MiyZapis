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
      'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm',
      hover && 'transition-shadow transition-transform hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[.99]',
      className
    )}
  >
    {children}
  </div>
);

export default Card;
