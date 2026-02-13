import React, { useState } from 'react';
import { clsx } from 'clsx';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
};

const fallbackTextSize = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
};

export const Logo: React.FC<LogoProps> = ({ size = 'md', className }) => {
  const [fallbackLevel, setFallbackLevel] = useState(0);

  if (fallbackLevel >= 3) {
    return (
      <div
        className={clsx(
          sizeClasses[size],
          'bg-primary-600 text-white rounded-lg flex items-center justify-center font-bold',
          fallbackTextSize[size],
          className
        )}
      >
        МЗ
      </div>
    );
  }

  const sources = ['/miyzapis_logo.png', '/logo.svg', '/favicon.svg'];

  return (
    <img
      src={sources[fallbackLevel]}
      alt="МійЗапис Logo"
      className={clsx(sizeClasses[size], className)}
      onError={() => setFallbackLevel(prev => prev + 1)}
    />
  );
};

export default Logo;
