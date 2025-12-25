import React from 'react';
import EyeRegular from '../../assets/icons/phosphor-icons/SVGs/regular/eye.svg?react';
import EyeFill from '../../assets/icons/phosphor-icons/SVGs/fill/eye-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const EyeIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? EyeFill : EyeRegular;
  return <Icon className={className} />;
};
