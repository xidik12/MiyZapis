import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/crown.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/crown-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const CrownIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};
