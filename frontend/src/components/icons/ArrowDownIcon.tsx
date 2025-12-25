import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/arrow-down.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/arrow-down-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const ArrowDownIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};
