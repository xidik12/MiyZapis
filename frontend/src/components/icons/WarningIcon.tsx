import React from 'react';
import WarningRegular from '../../assets/icons/phosphor-icons/SVGs/regular/warning.svg?react';
import WarningFill from '../../assets/icons/phosphor-icons/SVGs/fill/warning-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const WarningIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? WarningFill : WarningRegular;
  return <Icon className={className} />;
};
