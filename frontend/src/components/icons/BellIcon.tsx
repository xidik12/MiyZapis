import React from 'react';
import BellRegular from '../../assets/icons/phosphor-icons/SVGs/regular/bell.svg?react';
import BellFill from '../../assets/icons/phosphor-icons/SVGs/fill/bell-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const BellIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? BellFill : BellRegular;
  return <Icon className={className} />;
};
