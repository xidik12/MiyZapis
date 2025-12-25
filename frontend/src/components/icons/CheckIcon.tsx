import React from 'react';
import CheckRegular from '../../assets/icons/phosphor-icons/SVGs/regular/check.svg?react';
import CheckFill from '../../assets/icons/phosphor-icons/SVGs/fill/check-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const CheckIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? CheckFill : CheckRegular;
  return <Icon className={className} />;
};
