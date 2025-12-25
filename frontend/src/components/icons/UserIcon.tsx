import React from 'react';
import UserRegular from '../../assets/icons/phosphor-icons/SVGs/regular/user.svg?react';
import UserFill from '../../assets/icons/phosphor-icons/SVGs/fill/user-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const UserIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? UserFill : UserRegular;
  return <Icon className={className} />;
};
