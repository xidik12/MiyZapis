import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/presentation-chart.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/presentation-chart-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const PresentationChartLineIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};
