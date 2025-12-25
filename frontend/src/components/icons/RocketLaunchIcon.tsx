import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/rocket-launch.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/rocket-launch-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const RocketLaunchIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};
