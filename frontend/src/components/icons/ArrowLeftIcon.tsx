import React from 'react';
import ArrowLeftRegular from '../../assets/icons/phosphor-icons/SVGs/regular/arrow-left.svg?react';
import ArrowLeftFill from '../../assets/icons/phosphor-icons/SVGs/fill/arrow-left-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const ArrowLeftIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? ArrowLeftFill : ArrowLeftRegular;
  return <Icon className={className} />;
};
