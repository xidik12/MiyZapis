import React from 'react';
import MapPinRegular from '../../assets/icons/phosphor-icons/SVGs/regular/map-pin.svg?react';
import MapPinFill from '../../assets/icons/phosphor-icons/SVGs/fill/map-pin-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const MapPinIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? MapPinFill : MapPinRegular;
  return <Icon className={className} />;
};
