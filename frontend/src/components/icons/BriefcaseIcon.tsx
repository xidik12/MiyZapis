import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/briefcase.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/briefcase-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const BriefcaseIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};
