import React from 'react';
import PlusRegular from '../../assets/icons/phosphor-icons/SVGs/regular/plus.svg?react';
import PlusFill from '../../assets/icons/phosphor-icons/SVGs/fill/plus-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const PlusIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? PlusFill : PlusRegular;
  return <Icon className={className} />;
};
