import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/lifebuoy.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/lifebuoy-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const LifebuoyIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};
