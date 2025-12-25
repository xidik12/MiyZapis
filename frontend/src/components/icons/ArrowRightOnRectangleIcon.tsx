import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/sign-out.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/sign-out-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const ArrowRightOnRectangleIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};
