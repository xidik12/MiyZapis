import React from 'react';
import ChartBarRegular from '../../assets/icons/phosphor-icons/SVGs/regular/chart-bar.svg?react';
import ChartBarFill from '../../assets/icons/phosphor-icons/SVGs/fill/chart-bar-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const ChartBarIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? ChartBarFill : ChartBarRegular;
  return <Icon className={className} />;
};
