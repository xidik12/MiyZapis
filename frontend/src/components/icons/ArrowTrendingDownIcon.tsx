import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/trend-down.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/trend-down-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const ArrowTrendingDownIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};
