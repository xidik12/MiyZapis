import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/gear.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/gear-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const CogIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};
