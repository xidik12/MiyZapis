import React from 'react';
import MoonRegular from '../../assets/icons/phosphor-icons/SVGs/regular/moon.svg?react';
import MoonFill from '../../assets/icons/phosphor-icons/SVGs/fill/moon-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const MoonIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? MoonFill : MoonRegular;
  return <Icon className={className} />;
};
