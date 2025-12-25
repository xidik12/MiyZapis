import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/user-plus.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/user-plus-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const UserPlusIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};
