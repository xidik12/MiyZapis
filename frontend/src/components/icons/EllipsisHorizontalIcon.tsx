import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/dots-three.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/dots-three-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const EllipsisHorizontalIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};
