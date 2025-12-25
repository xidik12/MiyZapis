import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/prohibit.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/prohibit-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const NoSymbolIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};
