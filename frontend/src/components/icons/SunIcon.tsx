import React from 'react';
import SunRegular from '../../assets/icons/phosphor-icons/SVGs/regular/sun.svg?react';
import SunFill from '../../assets/icons/phosphor-icons/SVGs/fill/sun-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const SunIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? SunFill : SunRegular;
  return <Icon className={className} />;
};
