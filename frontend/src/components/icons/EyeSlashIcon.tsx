import React from 'react';
import EyeSlashRegular from '../../assets/icons/phosphor-icons/SVGs/regular/eye-slash.svg?react';
import EyeSlashFill from '../../assets/icons/phosphor-icons/SVGs/fill/eye-slash-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const EyeSlashIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? EyeSlashFill : EyeSlashRegular;
  return <Icon className={className} />;
};
