import React from 'react';
import ShieldCheckRegular from '../../assets/icons/phosphor-icons/SVGs/regular/shield-check.svg?react';
import ShieldCheckFill from '../../assets/icons/phosphor-icons/SVGs/fill/shield-check-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const ShieldCheckIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? ShieldCheckFill : ShieldCheckRegular;
  return <Icon className={className} />;
};
