import React from 'react';
import HouseRegular from '../../assets/icons/phosphor-icons/SVGs/regular/house.svg?react';
import HouseFill from '../../assets/icons/phosphor-icons/SVGs/fill/house-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const HouseIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? HouseFill : HouseRegular;
  return <Icon className={className} />;
};
