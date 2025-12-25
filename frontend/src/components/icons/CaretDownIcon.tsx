import React from 'react';
import CaretDownRegular from '../../assets/icons/phosphor-icons/SVGs/regular/caret-down.svg?react';
import CaretDownFill from '../../assets/icons/phosphor-icons/SVGs/fill/caret-down-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const CaretDownIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? CaretDownFill : CaretDownRegular;
  return <Icon className={className} />;
};

// Alias for compatibility with Heroicons naming
export const ChevronDownIcon = CaretDownIcon;
