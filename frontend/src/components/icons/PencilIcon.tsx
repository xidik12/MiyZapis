import React from 'react';
import PencilRegular from '../../assets/icons/phosphor-icons/SVGs/regular/pencil.svg?react';
import PencilFill from '../../assets/icons/phosphor-icons/SVGs/fill/pencil-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const PencilIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? PencilFill : PencilRegular;
  return <Icon className={className} />;
};
