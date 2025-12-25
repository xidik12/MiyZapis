import React from 'react';
import SlidersRegular from '../../assets/icons/phosphor-icons/SVGs/regular/sliders.svg?react';
import SlidersFill from '../../assets/icons/phosphor-icons/SVGs/fill/sliders-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const SlidersIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? SlidersFill : SlidersRegular;
  return <Icon className={className} />;
};
