import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/arrow-up.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/arrow-up-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const ArrowUpIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};
