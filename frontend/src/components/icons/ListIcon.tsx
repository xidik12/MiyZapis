import React from 'react';
import ListRegular from '../../assets/icons/phosphor-icons/SVGs/regular/list.svg?react';
import ListFill from '../../assets/icons/phosphor-icons/SVGs/fill/list-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const ListIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? ListFill : ListRegular;
  return <Icon className={className} />;
};
