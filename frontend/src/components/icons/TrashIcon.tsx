import React from 'react';
import TrashRegular from '../../assets/icons/phosphor-icons/SVGs/regular/trash.svg?react';
import TrashFill from '../../assets/icons/phosphor-icons/SVGs/fill/trash-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const TrashIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? TrashFill : TrashRegular;
  return <Icon className={className} />;
};
