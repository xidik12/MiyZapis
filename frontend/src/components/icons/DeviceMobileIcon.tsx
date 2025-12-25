import React from 'react';
import DeviceMobileRegular from '../../assets/icons/phosphor-icons/SVGs/regular/device-mobile.svg?react';
import DeviceMobileFill from '../../assets/icons/phosphor-icons/SVGs/fill/device-mobile-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const DeviceMobileIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? DeviceMobileFill : DeviceMobileRegular;
  return <Icon className={className} />;
};
