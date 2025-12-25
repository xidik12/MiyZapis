import React from 'react';
import UserCircleRegular from '../../assets/icons/phosphor-icons/SVGs/regular/user-circle.svg?react';
import UserCircleFill from '../../assets/icons/phosphor-icons/SVGs/fill/user-circle-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const UserCircleIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? UserCircleFill : UserCircleRegular;
  return <Icon className={className} />;
};
