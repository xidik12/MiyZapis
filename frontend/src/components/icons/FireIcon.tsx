import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/fire.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/fire-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const FireIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};
