import React from 'react';
import MagnifyingGlassRegular from '../../assets/icons/phosphor-icons/SVGs/regular/magnifying-glass.svg?react';
import MagnifyingGlassFill from '../../assets/icons/phosphor-icons/SVGs/fill/magnifying-glass-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const MagnifyingGlassIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? MagnifyingGlassFill : MagnifyingGlassRegular;
  return <Icon className={className} />;
};
