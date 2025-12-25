import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/caret-right.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/caret-right-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const ChevronRightIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};
