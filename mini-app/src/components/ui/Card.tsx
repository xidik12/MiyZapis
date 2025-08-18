import React from 'react';
import { useTelegram } from '@/components/telegram/TelegramProvider';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  hover = false,
  padding = 'md',
  className = '',
  onClick,
  ...props
}) => {
  const { hapticFeedback } = useTelegram();

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      hapticFeedback.impactLight();
      onClick(event);
    }
  };

  return (
    <div
      {...props}
      onClick={handleClick}
      className={`
        ${hover ? 'card-telegram-hover' : 'card-telegram'}
        ${paddingClasses[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
};