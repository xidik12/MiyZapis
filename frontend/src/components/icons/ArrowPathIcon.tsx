import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/arrow-clockwise.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/arrow-clockwise-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const ArrowPathIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};
