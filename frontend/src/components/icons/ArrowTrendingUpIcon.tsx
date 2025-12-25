import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/trend-up.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/trend-up-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const ArrowTrendingUpIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};
