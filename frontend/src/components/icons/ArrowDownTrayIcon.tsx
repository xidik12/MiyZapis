import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/download.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/download-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const ArrowDownTrayIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};
