import React from 'react';
import StarRegular from '../../assets/icons/phosphor-icons/SVGs/regular/star.svg?react';
import StarFill from '../../assets/icons/phosphor-icons/SVGs/fill/star-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const StarIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? StarFill : StarRegular;
  return <Icon className={className} />;
};
