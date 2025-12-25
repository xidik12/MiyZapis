import React from 'react';
import FlagRegular from '../../assets/icons/phosphor-icons/SVGs/regular/flag.svg?react';
import FlagFill from '../../assets/icons/phosphor-icons/SVGs/fill/flag-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const FlagIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? FlagFill : FlagRegular;
  return <Icon className={className} />;
};
