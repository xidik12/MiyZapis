import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/file-text.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/file-text-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const DocumentCheckIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};
