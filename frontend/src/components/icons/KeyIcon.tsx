import React from 'react';
import IconRegular from '../../assets/icons/phosphor-icons/SVGs/regular/key.svg?react';
import IconFill from '../../assets/icons/phosphor-icons/SVGs/fill/key-fill.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const KeyIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? IconFill : IconRegular;
  return <Icon className={className} />;
};
