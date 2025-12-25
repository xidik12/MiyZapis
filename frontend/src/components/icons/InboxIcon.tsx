import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/tray.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/tray-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const InboxIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};
