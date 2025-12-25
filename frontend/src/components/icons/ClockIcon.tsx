import React from 'react';
import ClockRegular from '../../assets/icons/phosphor-icons/SVGs/regular/clock.svg?react';
import ClockFill from '../../assets/icons/phosphor-icons/SVGs/fill/clock-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const ClockIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? ClockFill : ClockRegular;
  return <Icon className={className} />;
};
