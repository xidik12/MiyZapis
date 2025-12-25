import React from 'react';
import ImageRegular from '../../assets/icons/phosphor-icons/SVGs/regular/image.svg?react';
import ImageFill from '../../assets/icons/phosphor-icons/SVGs/fill/image-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const ImageIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? ImageFill : ImageRegular;
  return <Icon className={className} />;
};
