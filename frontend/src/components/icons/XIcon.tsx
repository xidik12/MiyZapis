import React from 'react';
import XRegular from '../../assets/icons/phosphor-icons/SVGs/regular/x.svg?react';
import XFill from '../../assets/icons/phosphor-icons/SVGs/fill/x-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const XIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? XFill : XRegular;
  return <Icon className={className} />;
};
