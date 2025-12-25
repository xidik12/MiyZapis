import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/caret-up.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/caret-up-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const ChevronUpIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};
