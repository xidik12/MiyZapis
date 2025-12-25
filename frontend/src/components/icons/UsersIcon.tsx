import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/users.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/users-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const UsersIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};
