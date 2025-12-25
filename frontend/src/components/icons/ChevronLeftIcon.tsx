import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/caret-left.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/caret-left-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const ChevronLeftIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};
