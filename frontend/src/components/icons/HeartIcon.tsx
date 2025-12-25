import React from 'react';
import HeartRegular from '../../assets/icons/phosphor-icons/SVGs/regular/heart.svg?react';
import HeartFill from '../../assets/icons/phosphor-icons/SVGs/fill/heart-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const HeartIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? HeartFill : HeartRegular;
  return <Icon className={className} />;
};
