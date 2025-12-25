import React from 'react';
import SealCheckRegular from '../../assets/icons/phosphor-icons/SVGs/regular/seal-check.svg?react';
import SealCheckFill from '../../assets/icons/phosphor-icons/SVGs/fill/seal-check-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const SealCheckIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? SealCheckFill : SealCheckRegular;
  return <Icon className={className} />;
};
