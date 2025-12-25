import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/buildings.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/buildings-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const BuildingOfficeIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};
