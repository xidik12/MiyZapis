import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/cursor.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/cursor-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const CursorArrowRaysIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};
