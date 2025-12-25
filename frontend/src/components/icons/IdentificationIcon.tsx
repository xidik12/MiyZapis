import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/identification-card.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/identification-card-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const IdentificationIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};
