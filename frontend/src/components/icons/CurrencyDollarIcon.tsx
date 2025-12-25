import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/currency-dollar.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/currency-dollar-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const CurrencyDollarIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};
