import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/arrow-square-out.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/arrow-square-out-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const ArrowTopRightOnSquareIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};
